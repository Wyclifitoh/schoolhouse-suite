/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { useVoteHeads } from "@/hooks/useVoteHeads";

const KES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;
const r2 = (n: number) => Math.round(Number(n || 0) * 100) / 100;

interface Line { vote_head_id: string; amount: string }

export function ApproveInKindDialog({
  record,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  record: any | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (payload: { allocation_mode: "auto" | "manual"; allocations: any[] }) => void;
  isPending?: boolean;
}) {
  const { data: voteHeads = [] } = useVoteHeads({ activeOnly: true });
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [lines, setLines] = useState<Line[]>([{ vote_head_id: "", amount: "" }]);

  const total = Number(record?.assessed_value || 0);

  useEffect(() => {
    if (!open) return;
    setMode("auto");
    const items = (record?.items || []).filter((i: any) => i.vote_head_id);
    setLines(
      items.length
        ? items.map((i: any) => ({
            vote_head_id: i.vote_head_id,
            amount: String(i.total_value),
          }))
        : [{ vote_head_id: "", amount: String(total || "") }],
    );
  }, [open, record, total]);

  const allocated = useMemo(
    () => r2(lines.reduce((s, l) => s + Number(l.amount || 0), 0)),
    [lines],
  );
  const balanced = Math.abs(allocated - r2(total)) < 0.01;

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Approve payment in kind</DialogTitle>
          <DialogDescription>
            Assign the assessed value of the goods to vote heads. Approving posts the
            student ledger, accounting entries, payment voucher, fee receipt and
            acknowledgement letter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contributor</span>
              <span className="font-medium">
                {record?.student_name || record?.supplier_name || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Goods</span>
              <span className="max-w-[60%] truncate">{record?.goods_description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assessed value</span>
              <span className="font-semibold">{KES(total)}</span>
            </div>
          </div>

          <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="gap-3">
            <div className="flex items-start gap-3 rounded-md border p-3">
              <RadioGroupItem value="auto" id="ik-auto" className="mt-1" />
              <Label htmlFor="ik-auto" className="font-normal cursor-pointer">
                <span className="font-medium flex items-center gap-2">
                  <Wand2 className="h-4 w-4" /> Auto-TIFO assignment
                </span>
                <span className="block text-muted-foreground text-xs mt-1">
                  Distribute the value across vote heads using the school's configured
                  TIFO allocation rules. No manual intervention required.
                </span>
              </Label>
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <RadioGroupItem value="manual" id="ik-manual" className="mt-1" />
              <Label htmlFor="ik-manual" className="font-normal cursor-pointer">
                <span className="font-medium">Manual vote head assignment</span>
                <span className="block text-muted-foreground text-xs mt-1">
                  Choose the vote head(s) and confirm the amount posted to each.
                </span>
              </Label>
            </div>
          </RadioGroup>

          {mode === "manual" && (
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Vote head</Label>
                    <Select
                      value={l.vote_head_id}
                      onValueChange={(v) => setLine(i, { vote_head_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select vote head" /></SelectTrigger>
                      <SelectContent>
                        {voteHeads.map((vh) => (
                          <SelectItem key={vh.id} value={vh.id}>
                            {vh.code} · {vh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-36">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.amount}
                      onChange={(e) => setLine(i, { amount: e.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLines((ls) => [...ls, { vote_head_id: "", amount: "" }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add vote head
                </Button>
                <Badge variant={balanced ? "default" : "destructive"}>
                  Allocated {KES(allocated)} of {KES(total)}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={
              isPending ||
              (mode === "manual" &&
                (!balanced || lines.some((l) => !l.vote_head_id || !(Number(l.amount) > 0))))
            }
            onClick={() =>
              onConfirm({
                allocation_mode: mode,
                allocations:
                  mode === "manual"
                    ? lines.map((l) => ({
                        vote_head_id: l.vote_head_id,
                        amount: Number(l.amount),
                      }))
                    : [],
              })
            }
          >
            Approve &amp; post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
