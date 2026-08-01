import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useVoteHeads } from "@/hooks/useVoteHeads";

interface Rule {
  vote_head_id: string;
  vote_head_name?: string;
  percentage: number;
  priority: number;
  is_active: boolean;
}

interface RulesResponse {
  rules: Rule[];
  total: number;
  strategy: string;
}

/**
 * TIFO split: what share of an automatically-allocated payment each vote head
 * receives. Must total 100% before it can be saved.
 */
export function AllocationRulesCard() {
  const qc = useQueryClient();
  const { data: voteHeads = [] } = useVoteHeads();
  const { data, isLoading } = useQuery({
    queryKey: ["allocation-rules"],
    queryFn: () => api.get<RulesResponse>("/finance/enterprise/allocation-rules"),
  });
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    if (!data) return;
    const byId = new Map(data.rules.map((r) => [r.vote_head_id, r]));
    setRules(
      voteHeads.map((vh, i) => ({
        vote_head_id: vh.id,
        vote_head_name: vh.name,
        percentage: Number(byId.get(vh.id)?.percentage ?? 0),
        priority: Number(byId.get(vh.id)?.priority ?? i + 1),
        is_active: byId.get(vh.id) ? !!byId.get(vh.id)!.is_active : false,
      })),
    );
  }, [data, voteHeads]);

  const total = rules
    .filter((r) => r.is_active)
    .reduce((s, r) => s + (Number(r.percentage) || 0), 0);

  const save = useMutation({
    mutationFn: () =>
      api.put("/finance/enterprise/allocation-rules", {
        rules: rules.filter((r) => r.is_active),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allocation-rules"] });
      toast({ title: "Allocation split saved" });
    },
    onError: (e: Error) =>
      toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const patch = (id: string, next: Partial<Rule>) =>
    setRules((rs) => rs.map((r) => (r.vote_head_id === id ? { ...r, ...next } : r)));

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Automatic Allocation Split (TIFO)</CardTitle>
          <CardDescription>
            When a payment is allocated automatically, it is distributed across these vote
            heads by percentage. Anything a vote head cannot absorb spills over to the
            oldest outstanding fees.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={Math.abs(total - 100) < 0.01 ? "secondary" : "destructive"}>
            Total {total.toFixed(2)}%
          </Badge>
          <Button
            size="sm"
            onClick={() => save.mutate()}
            disabled={save.isPending || Math.abs(total - 100) > 0.01}
          >
            Save split
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4">Loading…</div>
        ) : rules.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">
            Create vote heads first, then configure their split here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vote Head</TableHead>
                <TableHead className="w-32">Include</TableHead>
                <TableHead className="w-32">Priority</TableHead>
                <TableHead className="w-40 text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.vote_head_id}>
                  <TableCell>{r.vote_head_name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.is_active}
                      onCheckedChange={(v) => patch(r.vote_head_id, { is_active: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={r.priority}
                      disabled={!r.is_active}
                      onChange={(e) =>
                        patch(r.vote_head_id, { priority: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      className="text-right"
                      value={r.percentage}
                      disabled={!r.is_active}
                      onChange={(e) =>
                        patch(r.vote_head_id, { percentage: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
