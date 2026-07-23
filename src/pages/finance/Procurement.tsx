import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useRequisitions, useRequisitionMutations,
  useGRNs, useSupplierInvoices, useSupplierInvoiceMutations,
} from "@/hooks/useProcurement";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(Number(n || 0));

function statusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  if (["approved", "posted", "paid", "received"].includes(s)) return "default";
  if (["submitted", "partially_paid", "draft"].includes(s)) return "secondary";
  if (["rejected", "cancelled"].includes(s)) return "destructive";
  return "outline";
}

function NewRequisitionDialog() {
  const [open, setOpen] = useState(false);
  const [justification, setJustification] = useState("");
  const [lines, setLines] = useState([{ description: "", quantity: 1, estimated_price: 0 }]);
  const { create } = useRequisitionMutations();

  const total = useMemo(
    () => lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.estimated_price || 0), 0),
    [lines],
  );

  const submit = async () => {
    const cleaned = lines.filter((l) => l.description && Number(l.quantity) > 0);
    if (!cleaned.length) return toast.error("Add at least one item");
    try {
      await create.mutateAsync({ justification, items: cleaned, status: "submitted" });
      toast.success("Requisition submitted");
      setOpen(false);
      setLines([{ description: "", quantity: 1, estimated_price: 0 }]);
      setJustification("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Requisition</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New Purchase Requisition</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Justification</Label>
            <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Items</Label>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Input className="col-span-6" placeholder="Description" value={l.description}
                  onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
                <Input className="col-span-2" type="number" min={0} placeholder="Qty" value={l.quantity}
                  onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value) } : x))} />
                <Input className="col-span-3" type="number" min={0} placeholder="Est. price" value={l.estimated_price}
                  onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, estimated_price: Number(e.target.value) } : x))} />
                <Button variant="ghost" size="sm" className="col-span-1"
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm"
              onClick={() => setLines([...lines, { description: "", quantity: 1, estimated_price: 0 }])}>
              <Plus className="h-4 w-4 mr-1" /> Add line
            </Button>
          </div>
          <div className="text-right text-sm font-medium">Total estimate: {fmt(total)}</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequisitionsTab() {
  const { data: reqs = [], isLoading } = useRequisitions();
  const { setStatus } = useRequisitionMutations();

  const act = async (id: string, status: string) => {
    try {
      await setStatus.mutateAsync({ id, status });
      toast.success(`Requisition ${status}`);
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Requisitions</CardTitle>
        <NewRequisitionDialog />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Req #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Justification</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Estimate</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : reqs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No requisitions yet</TableCell></TableRow>
            ) : reqs.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.requisition_no}</TableCell>
                <TableCell>{r.requested_at?.slice(0, 10)}</TableCell>
                <TableCell className="max-w-xs truncate">{r.justification || "—"}</TableCell>
                <TableCell><Badge variant={statusVariant(r.status)}>{r.status}</Badge></TableCell>
                <TableCell className="text-right">{fmt(r.total_estimate)}</TableCell>
                <TableCell className="text-right space-x-1">
                  {r.status === "submitted" && (<>
                    <Button size="sm" variant="outline" onClick={() => act(r.id, "approved")}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => act(r.id, "rejected")}>Reject</Button>
                  </>)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function GRNsTab() {
  const { data: grns = [], isLoading } = useGRNs();
  return (
    <Card>
      <CardHeader><CardTitle>Goods Received Notes</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>GRN #</TableHead>
            <TableHead>PO</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : grns.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No GRNs recorded. Create one from an approved PO on the supplier profile.
              </TableCell></TableRow>
            ) : grns.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-mono text-xs">{g.grn_no}</TableCell>
                <TableCell className="font-mono text-xs">{g.po_number || "—"}</TableCell>
                <TableCell>{g.supplier_name || "—"}</TableCell>
                <TableCell>{g.received_date?.slice(0, 10)}</TableCell>
                <TableCell><Badge variant={statusVariant(g.status)}>{g.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function InvoicesTab() {
  const { data: invs = [], isLoading } = useSupplierInvoices();
  const { setStatus } = useSupplierInvoiceMutations();
  const act = async (id: string, status: string) => {
    try { await setStatus.mutateAsync({ id, status }); toast.success(`Invoice ${status}`); }
    catch (e: any) { toast.error(e?.message || "Failed"); }
  };
  return (
    <Card>
      <CardHeader><CardTitle>Supplier Invoices</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>PO</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : invs.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                No invoices recorded. Invoices require a receiving note (GRN) against a PO.
              </TableCell></TableRow>
            ) : invs.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.invoice_no}</TableCell>
                <TableCell>{i.supplier_name || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{i.po_number || "—"}</TableCell>
                <TableCell>{i.invoice_date?.slice(0, 10)}</TableCell>
                <TableCell>{i.due_date?.slice(0, 10) || "—"}</TableCell>
                <TableCell><Badge variant={statusVariant(i.status)}>{i.status}</Badge></TableCell>
                <TableCell className="text-right">{fmt(i.total_amount)}</TableCell>
                <TableCell className="text-right space-x-1">
                  {i.status === "submitted" && (
                    <Button size="sm" variant="outline" onClick={() => act(i.id, "approved")}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function Procurement() {
  return (
    <DashboardLayout title="Procurement" subtitle="Requisitions, Goods Received Notes & Supplier Invoices">
      <EnterpriseGate>
        <Tabs defaultValue="requisitions">
          <TabsList>
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
            <TabsTrigger value="grns">GRNs</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          <TabsContent value="requisitions" className="mt-4"><RequisitionsTab /></TabsContent>
          <TabsContent value="grns" className="mt-4"><GRNsTab /></TabsContent>
          <TabsContent value="invoices" className="mt-4"><InvoicesTab /></TabsContent>
        </Tabs>
      </EnterpriseGate>
    </DashboardLayout>
  );
}