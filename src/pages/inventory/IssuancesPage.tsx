/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryNav } from "@/components/inventory/InventoryNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HandHelping, Plus, Search, Trash2, Undo2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCan } from "@/hooks/usePermission";
import { useInventoryItems } from "@/hooks/useInventoryStore";
import {
  Issuance,
  useCreateIssuance,
  useIssuances,
  useProcessReturn,
} from "@/hooks/useInventoryOps";

const STATUS_STYLES: Record<string, string> = {
  issued: "bg-info/10 text-info border-0",
  partially_returned: "bg-warning/10 text-warning border-0",
  returned: "bg-success/10 text-success border-0",
};

const STATUS_LABELS: Record<string, string> = {
  issued: "With staff",
  partially_returned: "Partly returned",
  returned: "Returned",
};

interface DraftLine {
  item_id: string;
  quantity: string;
  condition_out: string;
}

/** Items handed to a staff member for school work — never a sale. */
function IssueDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: staff = [] } = useQuery({
    queryKey: ["staff-list-issuance"],
    queryFn: () => api.get<any[]>("/staff"),
  });
  const { data: items = [] } = useInventoryItems();
  const createIssuance = useCreateIssuance();

  const [staffId, setStaffId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([
    { item_id: "", quantity: "1", condition_out: "good" },
  ]);

  const reset = () => {
    setStaffId("");
    setPurpose("");
    setNotes("");
    setLines([{ item_id: "", quantity: "1", condition_out: "good" }]);
  };

  const setLine = (idx: number, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const valid =
    !!staffId && lines.some((l) => l.item_id && Number(l.quantity) > 0);

  const submit = () => {
    createIssuance.mutate(
      {
        staff_id: staffId,
        purpose: purpose || undefined,
        notes: notes || undefined,
        items: lines
          .filter((l) => l.item_id && Number(l.quantity) > 0)
          .map((l) => ({
            item_id: l.item_id,
            quantity: Number(l.quantity),
            condition_out: l.condition_out,
          })),
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Issue items to staff</DialogTitle>
          <DialogDescription>
            An issuance is not a sale. No money changes hands and trackable items
            remain school property until they are returned.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Staff member</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {[s.first_name, s.last_name].filter(Boolean).join(" ")}
                      {s.employee_number ? ` — ${s.employee_number}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Classroom teaching aids"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Items</Label>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Select
                    value={line.item_id}
                    onValueChange={(v) => setLine(idx, { item_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((it: any) => (
                        <SelectItem key={it.id} value={it.id}>
                          {it.name} ({it.quantity_in_stock} in stock)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => setLine(idx, { quantity: e.target.value })}
                  />
                </div>
                <div className="col-span-3">
                  <Select
                    value={line.condition_out}
                    onValueChange={(v) => setLine(idx, { condition_out: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={lines.length === 1}
                    onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setLines((p) => [...p, { item_id: "", quantity: "1", condition_out: "good" }])
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Add item
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid || createIssuance.isPending} onClick={submit}>
            {createIssuance.isPending ? "Issuing…" : "Issue items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Returns are recorded against the original issuance — never by deleting it. */
function ReturnDialog({
  issuance,
  onClose,
}: {
  issuance: Issuance | null;
  onClose: () => void;
}) {
  const processReturn = useProcessReturn();
  const [qty, setQty] = useState<Record<string, string>>({});
  const [cond, setCond] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const outstanding = (line: any) =>
    Number(line.quantity) - Number(line.quantity_returned || 0);

  const submit = () => {
    if (!issuance) return;
    const items = (issuance.items || [])
      .filter((l: any) => Number(qty[l.id] || 0) > 0)
      .map((l: any) => ({
        id: l.id,
        quantity: Number(qty[l.id]),
        condition_in: cond[l.id] || "good",
      }));
    if (!items.length) return;
    processReturn.mutate(
      { id: issuance.id, notes: notes || undefined, items },
      {
        onSuccess: () => {
          setQty({});
          setCond({});
          setNotes("");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={!!issuance} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record return — {issuance?.staff_name}</DialogTitle>
          <DialogDescription>
            Good returns go back into stock. Damaged or missing items are written
            off through the stock ledger so the loss is explained.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {(issuance?.items || []).map((line: any) => (
            <div key={line.id} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-6">
                <p className="font-medium text-sm">{line.item_name}</p>
                <p className="text-xs text-muted-foreground">
                  {outstanding(line)} of {line.quantity} still out
                </p>
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min="0"
                  max={outstanding(line)}
                  placeholder="Qty"
                  disabled={outstanding(line) <= 0}
                  value={qty[line.id] || ""}
                  onChange={(e) => setQty((p) => ({ ...p, [line.id]: e.target.value }))}
                />
              </div>
              <div className="col-span-3">
                <Select
                  value={cond[line.id] || "good"}
                  onValueChange={(v) => setCond((p) => ({ ...p, [line.id]: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="missing">Missing / lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <Label>Return notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={processReturn.isPending}>
            {processReturn.isPending ? "Saving…" : "Record return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryIssuances() {
  const canIssue = useCan("inventory:issue");
  const canReturn = useCan("inventory:return", "inventory:issue");

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [returning, setReturning] = useState<Issuance | null>(null);

  const { data: issuances = [], isLoading } = useIssuances({ status, search });

  const outstandingUnits = useMemo(
    () =>
      issuances.reduce(
        (sum, iss) =>
          sum +
          (iss.items || []).reduce(
            (s: number, l: any) =>
              s + (Number(l.quantity) - Number(l.quantity_returned || 0)),
            0,
          ),
        0,
      ),
    [issuances],
  );

  return (
    <DashboardLayout
      title="Staff Issuance"
      subtitle="Items issued to staff for school use — tracked until returned"
    >
      <InventoryNav />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search staff name or number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All issuances</SelectItem>
            <SelectItem value="issued">With staff</SelectItem>
            <SelectItem value="partially_returned">Partly returned</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
        {canIssue && (
          <Button onClick={() => setIssueOpen(true)}>
            <HandHelping className="h-4 w-4 mr-2" /> Issue items
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Issuance register</CardTitle>
          <Badge variant="secondary">{outstandingUnits} units outstanding</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Loading issuances…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && issuances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No issuances recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {issuances.map((iss) => (
                <TableRow key={iss.id}>
                  <TableCell>
                    <p className="font-medium">{iss.staff_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {iss.department_name || iss.employee_number || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <div className="space-y-1">
                      {(iss.items || []).map((l: any) => (
                        <p key={l.id} className="text-sm">
                          {l.item_name}{" "}
                          <span className="text-muted-foreground">
                            ×{l.quantity}
                            {Number(l.quantity_returned || 0) > 0
                              ? ` (${l.quantity_returned} returned)`
                              : ""}
                          </span>
                        </p>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {iss.purpose || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {iss.issue_date ? String(iss.issue_date).slice(0, 10) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[iss.status] || ""}>
                      {STATUS_LABELS[iss.status] || iss.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canReturn && iss.status !== "returned" && (
                      <Button variant="outline" size="sm" onClick={() => setReturning(iss)}>
                        <Undo2 className="h-4 w-4 mr-1" /> Return
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <IssueDialog open={issueOpen} onOpenChange={setIssueOpen} />
      <ReturnDialog issuance={returning} onClose={() => setReturning(null)} />
    </DashboardLayout>
  );
}
