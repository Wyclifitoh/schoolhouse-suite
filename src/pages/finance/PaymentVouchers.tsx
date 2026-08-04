import { useMemo, useState } from "react";
import {
  usePaymentVouchers,
  usePaymentVoucherMutations,
  useVoucherAllocations,
  useVoucherApproval,
} from "@/hooks/usePaymentVouchers";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useSupplierInvoices } from "@/hooks/useProcurement";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useVoteHeads } from "@/hooks/useVoteHeads";
import { api } from "@/lib/api";
import { FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  approved: "default",
  paid: "default",
  cancelled: "destructive",
};

export default function PaymentVouchers() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [approving, setApproving] = useState<any | null>(null);
  const { data: vouchers = [], isLoading } = usePaymentVouchers({
    status: statusFilter,
  });
  const { setStatus } = usePaymentVoucherMutations();

  const act = (id: string, status: string, msg: string) =>
    setStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(msg),
        onError: (e: any) => toast.error(e?.message || "Failed"),
      },
    );

  return (
    <EnterpriseGate>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payment Vouchers</h1>
            <p className="text-sm text-muted-foreground">
              Authorise supplier payments — approval posts to the ledger.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) =>
                setStatusFilter(v === "all" ? undefined : v)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setOpen(true)}>New Voucher</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : vouchers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No vouchers yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  vouchers.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono">
                        {v.voucher_no}
                      </TableCell>
                      <TableCell>{v.payment_date?.slice(0, 10)}</TableCell>
                      <TableCell>{v.supplier_name || "—"}</TableCell>
                      <TableCell>{v.invoice_no || "—"}</TableCell>
                      <TableCell>{v.bank_account_name || "Cash"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(v.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[v.status] || "secondary"}>
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          title="Voucher PDF"
                          onClick={() =>
                            api.openFile(`/payment-vouchers/${v.id}/voucher.pdf`)
                          }
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Acknowledgement letter"
                          onClick={() =>
                            api.openFile(
                              `/payment-vouchers/${v.id}/acknowledgement.pdf`,
                            )
                          }
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        {v.status === "draft" && (
                          <Button size="sm" onClick={() => setApproving(v)}>
                            Approve
                          </Button>
                        )}
                        {v.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => act(v.id, "paid", "Marked as paid")}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {v.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              act(v.id, "cancelled", "Cancelled & reversed")
                            }
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <NewVoucherDialog open={open} onOpenChange={setOpen} />
        <ApproveVoucherDialog
          voucher={approving}
          onOpenChange={(o) => !o && setApproving(null)}
        />
      </div>
    </EnterpriseGate>
  );
}

function ApproveVoucherDialog({
  voucher,
  onOpenChange,
}: {
  voucher: any | null;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: voteHeads = [] } = useVoteHeads();
  const { data: existing = [] } = useVoucherAllocations(voucher?.id);
  const approve = useVoucherApproval();
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [lines, setLines] = useState<{ vote_head_id: string; amount: string }[]>(
    [{ vote_head_id: "", amount: "" }],
  );

  const amount = Number(voucher?.amount || 0);
  const allocated = useMemo(
    () => lines.reduce((s, l) => s + Number(l.amount || 0), 0),
    [lines],
  );
  const balanced = Math.abs(allocated - amount) < 0.01;

  const submit = () => {
    if (mode === "manual") {
      const clean = lines
        .filter((l) => l.vote_head_id && Number(l.amount) > 0)
        .map((l) => ({ vote_head_id: l.vote_head_id, amount: Number(l.amount) }));
      if (!clean.length) return toast.error("Add at least one vote head line");
      if (!balanced)
        return toast.error("Allocated amount must equal the voucher amount");
      approve.mutate(
        { id: voucher.id, allocation_mode: "manual", allocations: clean },
        {
          onSuccess: () => {
            toast.success("Approved & posted");
            onOpenChange(false);
          },
          onError: (e: any) => toast.error(e?.message || "Failed"),
        },
      );
      return;
    }
    approve.mutate(
      { id: voucher.id, allocation_mode: "auto" },
      {
        onSuccess: () => {
          toast.success("Approved & posted using TIFO allocation rules");
          onOpenChange(false);
        },
        onError: (e: any) => toast.error(e?.message || "Failed"),
      },
    );
  };

  return (
    <Dialog open={!!voucher} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Approve {voucher?.voucher_no} — {amount.toLocaleString()}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Vote head assignment</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  Auto — split by TIFO allocation rules
                </SelectItem>
                <SelectItem value="manual">Manual — assign vote heads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "manual" ? (
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <div className="col-span-7">
                    <Select
                      value={l.vote_head_id}
                      onValueChange={(v) =>
                        setLines(
                          lines.map((x, j) =>
                            j === i ? { ...x, vote_head_id: v } : x,
                          ),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vote head" />
                      </SelectTrigger>
                      <SelectContent>
                        {voteHeads.map((vh: any) => (
                          <SelectItem key={vh.id} value={vh.id}>
                            {vh.code ? `${vh.code} — ` : ""}
                            {vh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    className="col-span-4"
                    type="number"
                    min={0}
                    placeholder="Amount"
                    value={l.amount}
                    onChange={(e) =>
                      setLines(
                        lines.map((x, j) =>
                          j === i ? { ...x, amount: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Button
                    className="col-span-1"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLines(lines.filter((_, j) => j !== i))}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLines([...lines, { vote_head_id: "", amount: "" }])
                  }
                >
                  Add line
                </Button>
                <span
                  className={
                    balanced ? "text-sm" : "text-sm text-destructive font-medium"
                  }
                >
                  Allocated {allocated.toLocaleString()} of{" "}
                  {amount.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              The voucher amount will be split across vote heads using the
              school's active allocation (TIFO) percentages. Configure them under
              Finance → Setup.
            </p>
          )}

          {existing.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Existing allocation:{" "}
              {existing
                .map(
                  (a) =>
                    `${a.vote_head_name || a.vote_head_id}: ${Number(
                      a.amount,
                    ).toLocaleString()}`,
                )
                .join(", ")}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={approve.isPending}>
            {approve.isPending ? "Approving…" : "Approve & Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewVoucherDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: suppliers = [] } = useSuppliers();
  const { data: banks = [] } = useBankAccounts();
  const { create } = usePaymentVoucherMutations();

  const [supplierId, setSupplierId] = useState<string>("");
  const [invoiceId, setInvoiceId] = useState<string>("");
  const [bankId, setBankId] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");

  const { data: supplierInvoices = [] } = useSupplierInvoices({
    supplier_id: supplierId,
  });
  const outstandingInvoices = useMemo(
    () =>
      supplierInvoices.filter(
        (i: any) =>
          i.status !== "paid" &&
          Number(i.total_amount) > Number(i.amount_paid || 0),
      ),
    [supplierInvoices],
  );

  const reset = () => {
    setSupplierId("");
    setInvoiceId("");
    setBankId("");
    setDate(new Date().toISOString().slice(0, 10));
    setMethod("bank_transfer");
    setReference("");
    setAmount("");
    setNarration("");
  };

  const submit = () => {
    if (!supplierId) return toast.error("Supplier required");
    if (!(Number(amount) > 0)) return toast.error("Amount must be > 0");
    create.mutate(
      {
        supplier_id: supplierId,
        supplier_invoice_id: invoiceId || null,
        bank_account_id: bankId || null,
        payment_date: date,
        payment_method: method,
        reference: reference || null,
        amount: Number(amount),
        narration: narration || null,
      },
      {
        onSuccess: () => {
          toast.success("Voucher created");
          reset();
          onOpenChange(false);
        },
        onError: (e: any) => toast.error(e?.message || "Failed"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Payment Voucher</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Against Invoice (optional)</Label>
            <Select
              value={invoiceId || "none"}
              onValueChange={(v) => setInvoiceId(v === "none" ? "" : v)}
              disabled={!supplierId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Direct payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Direct payment (no invoice)</SelectItem>
                {outstandingInvoices.map((i: any) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.invoice_no} — outstanding{" "}
                    {(
                      Number(i.total_amount) - Number(i.amount_paid || 0)
                    ).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Bank Account</Label>
            <Select
              value={bankId || "cash"}
              onValueChange={(v) => setBankId(v === "cash" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash on Hand</SelectItem>
                {banks.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Cheque # / Txn ref"
            />
          </div>
          <div>
            <Label>Amount (KES)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              step="0.01"
            />
          </div>
          <div className="col-span-2">
            <Label>Narration</Label>
            <Textarea
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create Voucher"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}