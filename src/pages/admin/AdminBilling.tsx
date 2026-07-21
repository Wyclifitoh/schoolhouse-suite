import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllInvoices, useAllSubscriptions, useRevenueMonthly, useConfirmInvoice, useVoidInvoice } from "@/hooks/usePlatform";
import { toast } from "@/hooks/use-toast";

const fmt = (n: number) => `KSh ${Number(n || 0).toLocaleString()}`;

export default function AdminBilling() {
  const [tab, setTab] = useState<"invoices" | "subscriptions" | "revenue">("invoices");
  const [status, setStatus] = useState("");
  const invoices = useAllInvoices(status);
  const subs = useAllSubscriptions(status);
  const rev = useRevenueMonthly();
  const confirmInv = useConfirmInvoice();
  const voidInv = useVoidInvoice();

  const totals = useMemo(() => {
    const list = invoices.data || [];
    return {
      paid: list.filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount), 0),
      pending: list.filter((i) => i.status === "pending").reduce((a, i) => a + Number(i.amount), 0),
    };
  }, [invoices.data]);

  const exportCsv = () => {
    const rows = [["Date","School","Amount","Status","Period start","Period end","Reference"]];
    (invoices.data || []).forEach((i) => rows.push([new Date(i.created_at).toISOString(), i.school_name || "", String(i.amount), i.status, i.period_start || "", i.period_end || "", i.mpesa_reference || ""]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `chuo-invoices-${Date.now()}.csv`; a.click();
  };

  const guard = async (label: string, fn: () => Promise<unknown>) => {
    try { await fn(); toast({ title: label }); } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Billing & Revenue</h1>
          <p className="text-muted-foreground">All invoices, subscriptions and revenue across CHUO.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export invoices</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs uppercase font-semibold text-muted-foreground">Collected (filter)</div><div className="text-2xl font-black">{fmt(totals.paid)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase font-semibold text-muted-foreground">Pending (filter)</div><div className="text-2xl font-black">{fmt(totals.pending)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase font-semibold text-muted-foreground">Invoices</div><div className="text-2xl font-black">{(invoices.data || []).length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase font-semibold text-muted-foreground">Subscriptions</div><div className="text-2xl font-black">{(subs.data || []).length}</div></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-lg border p-1 bg-muted/40">
          {(["invoices","subscriptions","revenue"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${tab === t ? "bg-background shadow" : "text-muted-foreground"}`}>{t}</button>
          ))}
        </div>
        {tab !== "revenue" && (
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {tab === "invoices" ? ["pending","paid","void","failed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)
                                  : ["trial","active","past_due","locked","cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {tab === "invoices" && (
            invoices.isLoading ? <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-muted/30">
                <tr><th className="p-3">Date</th><th className="p-3">School</th><th className="p-3 text-right">Amount</th><th className="p-3">Period</th><th className="p-3">Status</th><th className="p-3">Reference</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {(invoices.data || []).map((i) => (
                  <tr key={i.id} className="border-b">
                    <td className="p-3">{new Date(i.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{i.school_name}</td>
                    <td className="p-3 text-right font-semibold">{fmt(i.amount)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{i.period_start || "—"} → {i.period_end || "—"}</td>
                    <td className="p-3"><Badge variant={i.status === "paid" ? "default" : i.status === "pending" ? "secondary" : "destructive"}>{i.status}</Badge></td>
                    <td className="p-3 text-xs">{i.mpesa_reference || "—"}</td>
                    <td className="p-3 text-right space-x-1">
                      {i.status === "pending" && (<>
                        <Button size="sm" variant="outline" onClick={() => { const ref = prompt("M-Pesa reference (optional)") || undefined; guard("Invoice confirmed", () => confirmInv.mutateAsync({ invoiceId: i.id, mpesa_reference: ref })); }}><Check className="h-3 w-3 mr-1" />Confirm</Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Void invoice?")) guard("Voided", () => voidInv.mutateAsync(i.id)); }}>Void</Button>
                      </>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "subscriptions" && (
            subs.isLoading ? <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-muted/30">
                <tr><th className="p-3">School</th><th className="p-3">Plan</th><th className="p-3">Status</th><th className="p-3">Cycle</th><th className="p-3">Trial ends</th><th className="p-3">Period ends</th></tr>
              </thead>
              <tbody>
                {(subs.data || []).map((s: any) => (
                  <tr key={s.id} className="border-b">
                    <td className="p-3 font-medium">{s.school_name}</td>
                    <td className="p-3 text-sm">{s.plan_name || "—"}</td>
                    <td className="p-3"><Badge variant="outline">{s.status}</Badge></td>
                    <td className="p-3 text-xs">{s.billing_mode} · {s.cycle}</td>
                    <td className="p-3 text-xs">{s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString() : "—"}</td>
                    <td className="p-3 text-xs">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "revenue" && (
            rev.isLoading ? <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-muted/30">
                <tr><th className="p-3">Month</th><th className="p-3 text-right">Paid</th><th className="p-3 text-right">Pending</th><th className="p-3 text-right">Invoices</th></tr>
              </thead>
              <tbody>
                {(rev.data || []).map((r) => (
                  <tr key={r.month} className="border-b">
                    <td className="p-3 font-medium">{r.month}</td>
                    <td className="p-3 text-right font-semibold">{fmt(r.paid)}</td>
                    <td className="p-3 text-right">{fmt(r.pending)}</td>
                    <td className="p-3 text-right">{r.invoices}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}