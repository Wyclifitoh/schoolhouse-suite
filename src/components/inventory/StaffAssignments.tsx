import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Package, Users, Undo2, Trash2, Plus, Search } from "lucide-react";
import { useInventoryItems } from "@/hooks/useInventoryStore";
import { useStaff } from "@/hooks/useClasses";
import {
  useInventoryIssues, useInventoryIssueSummary, useAssignItem,
  useReturnIssue, useDeleteIssue,
} from "@/hooks/useInventoryIssues";

const STATUS_LABEL: Record<string, string> = {
  issued: "Issued",
  partially_returned: "Partially returned",
  returned: "Returned",
};

export function StaffAssignments() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("outstanding");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ item_id: "", staff_id: "", quantity: "1", due_date: "", notes: "" });

  const { data: issues = [], isLoading } = useInventoryIssues({ status, search });
  const { data: summary } = useInventoryIssueSummary();
  const { data: items = [] } = useInventoryItems();
  const { data: staff = [] } = useStaff();
  const assign = useAssignItem();
  const doReturn = useReturnIssue();
  const remove = useDeleteIssue();

  const selectedItem = useMemo(
    () => items.find((i) => i.id === form.item_id),
    [items, form.item_id],
  );

  const submit = () => {
    assign.mutate(
      {
        item_id: form.item_id,
        staff_id: form.staff_id,
        quantity: Number(form.quantity) || 1,
        due_date: form.due_date || null,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ item_id: "", staff_id: "", quantity: "1", due_date: "", notes: "" });
        },
      },
    );
  };

  const valid = form.item_id && form.staff_id && Number(form.quantity) > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Items currently out</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <Package className="h-5 w-5 text-primary" />{summary?.items_out ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Staff holding items</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <Users className="h-5 w-5 text-primary" />{summary?.staff_holding ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total assignments</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{summary?.total_assignments ?? 0}</CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search item or staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="outstanding">Outstanding</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="partially_returned">Partially returned</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Assign item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Assign item to staff</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Item</Label>
                <Select value={form.item_id} onValueChange={(v) => setForm({ ...form, item_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} ({i.quantity_in_stock} {i.unit || "pcs"} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Staff member</Label>
                <Select value={form.staff_id} onValueChange={(v) => setForm({ ...form, staff_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                        {s.employee_number ? ` — ${s.employee_number}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min={1} max={selectedItem?.quantity_in_stock ?? undefined}
                    value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Return by (optional)</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. For Form 2 East classroom" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!valid || assign.isPending}>
                {assign.isPending ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Staff member</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : issues.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No assignments yet.</TableCell></TableRow>
              ) : (
                issues.map((r) => {
                  const outstanding = Number(r.quantity) - Number(r.quantity_returned);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.item_name}</div>
                        {r.sku && <div className="text-xs text-muted-foreground">{r.sku}</div>}
                      </TableCell>
                      <TableCell>
                        <div>{r.staff_name || "—"}</div>
                        {r.employee_number && <div className="text-xs text-muted-foreground">{r.employee_number}</div>}
                      </TableCell>
                      <TableCell className="text-right">{r.quantity}</TableCell>
                      <TableCell className="text-right">{outstanding}</TableCell>
                      <TableCell>{r.issued_at ? new Date(r.issued_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "returned" ? "secondary" : r.status === "partially_returned" ? "outline" : "default"}>
                          {STATUS_LABEL[r.status] || r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {outstanding > 0 && (
                          <Button size="sm" variant="outline" className="mr-2"
                            onClick={() => doReturn.mutate({ id: r.id })} disabled={doReturn.isPending}>
                            <Undo2 className="mr-1 h-3.5 w-3.5" />Return
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)} disabled={remove.isPending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default StaffAssignments;
