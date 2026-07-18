import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Save, Star } from "lucide-react";

const unwrap = <T,>(d: any): T => (d?.data ?? d) as T;

interface Rule {
  id?: string;
  name: string;
  compulsory_subject_codes: string[];
  best_n: number;
  total_n: number;
  is_default: boolean;
  is_active?: boolean;
}

const BLANK: Rule = {
  name: "KCSE Aggregate",
  compulsory_subject_codes: ["MAT"],
  best_n: 6,
  total_n: 7,
  is_default: true,
  is_active: true,
};

export function KcseAggregateTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Rule | null>(null);
  const [codesInput, setCodesInput] = useState("");

  const { data: rules, isLoading } = useQuery({
    queryKey: ["kcse-aggregate-rules"],
    queryFn: async () =>
      unwrap<Rule[]>(await api.get<any>("/assessments/kcse-aggregate-rules")) ||
      [],
  });

  const save = useMutation({
    mutationFn: (r: Rule) =>
      r.id
        ? api.put(`/assessments/kcse-aggregate-rules/${r.id}`, r)
        : api.post("/assessments/kcse-aggregate-rules", r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kcse-aggregate-rules"] });
      toast.success("Aggregate rule saved");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/assessments/kcse-aggregate-rules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kcse-aggregate-rules"] });
      toast.success("Deleted");
    },
  });

  const openNew = () => {
    setEditing({ ...BLANK });
    setCodesInput(BLANK.compulsory_subject_codes.join(", "));
  };
  const openEdit = (r: Rule) => {
    setEditing({ ...r });
    setCodesInput((r.compulsory_subject_codes || []).join(", "));
  };

  const commit = () => {
    if (!editing) return;
    const codes = codesInput
      .split(/[,\s]+/)
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    save.mutate({ ...editing, compulsory_subject_codes: codes });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">KCSE Aggregate Rules (8-4-4)</h3>
          <p className="text-xs text-muted-foreground">
            Compulsory subjects + best-of formula. Default: Math + best 6 = best
            7.
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New rule
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Compulsory</TableHead>
                <TableHead className="text-center">Best N</TableHead>
                <TableHead className="text-center">Total N</TableHead>
                <TableHead />
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rules || []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.name}
                    {r.is_default ? (
                      <Star className="inline h-3 w-3 ml-1 text-amber-500 fill-amber-500" />
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs">
                    {(r.compulsory_subject_codes || []).map((c) => (
                      <Badge key={c} variant="outline" className="mr-1">
                        {c}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.best_n}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.total_n}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => r.id && remove.mutate(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!rules?.length && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-xs text-muted-foreground py-6"
                  >
                    No rules — the system default (Math + best 6 = 7) will be used.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Rule name</Label>
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Compulsory subject codes (comma separated)</Label>
              <Input
                value={codesInput}
                onChange={(e) => setCodesInput(e.target.value)}
                placeholder="MAT, ENG"
              />
            </div>
            <div>
              <Label>Best N (from remaining subjects)</Label>
              <Input
                type="number"
                value={editing.best_n}
                onChange={(e) =>
                  setEditing({ ...editing, best_n: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Total N (subjects counted overall)</Label>
              <Input
                type="number"
                value={editing.total_n}
                onChange={(e) =>
                  setEditing({ ...editing, total_n: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={editing.is_default}
                onChange={(e) =>
                  setEditing({ ...editing, is_default: e.target.checked })
                }
              />
              Set as default
            </label>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={commit} disabled={save.isPending}>
                <Save className="h-3.5 w-3.5 mr-1" /> Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}