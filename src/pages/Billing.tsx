import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Sparkles, AlertTriangle } from "lucide-react";
import { useEntitlements, usePlans, useInvoices, useCheckout, useConfirmPayment } from "@/hooks/useBilling";
import { toast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/useSeo";

export default function Billing() {
  useSeo("Billing & subscription — CHUO", "Manage your CHUO plan, invoices and renewals.");
  const { data: ent, isLoading: l1 } = useEntitlements();
  const { data: plans = [], isLoading: l2 } = usePlans();
  const { data: invoices = [] } = useInvoices();
  const checkout = useCheckout();
  const confirm = useConfirmPayment();
  const [cycle, setCycle] = useState<"monthly" | "termly" | "yearly">("monthly");
  const [mode, setMode] = useState<"per_student" | "module">("per_student");

  if (l1 || l2) {
    return <DashboardLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  const handleSubscribe = async (planCode: string) => {
    try {
      const out = await checkout.mutateAsync({ plan_code: planCode });
      toast({
        title: "Invoice created",
        description: `KSh ${Number(out.invoice.amount).toLocaleString()} pending. Pay via M-Pesa to activate.`,
      });
    } catch (e: any) { toast({ title: "Checkout failed", description: e.message, variant: "destructive" }); }
  };

  const handleConfirm = async (invoiceId: string) => {
    const ref = prompt("Enter M-Pesa transaction reference (or leave blank for manual confirmation)") || undefined;
    try {
      await confirm.mutateAsync({ invoiceId, reference: ref });
      toast({ title: "Subscription activated" });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const visiblePlans = plans.filter((p) => p.billing_mode === mode && (mode === "module" || p.cycle === cycle));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-black">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-1">Manage your plan, renew, and view invoices.</p>
        </div>

        {/* Status card */}
        <Card className={ent?.status === "locked" ? "border-destructive" : ""}>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase font-bold text-muted-foreground">Current status</p>
              <div className="flex items-center gap-2">
                <Badge variant={ent?.active ? "default" : "destructive"} className="text-sm">{ent?.status?.toUpperCase()}</Badge>
                {ent?.status === "trial" && (
                  <span className="text-sm text-muted-foreground">{ent.trialDaysLeft} day(s) left</span>
                )}
                {ent?.current_period_end && ent.status === "active" && (
                  <span className="text-sm text-muted-foreground">renews {new Date(ent.current_period_end).toLocaleDateString()}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Unlocked modules: {ent?.modules?.length ? ent.modules.join(", ") : "Students only (free tier)"}
              </p>
            </div>
            {ent?.status !== "active" && (
              <div className="flex items-center gap-2 text-warning text-sm">
                <AlertTriangle className="h-4 w-4" /> Choose a plan below to keep all features unlocked.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan selector */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="inline-flex rounded-lg border p-1 bg-muted/40">
              <button onClick={() => setMode("per_student")} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${mode === "per_student" ? "bg-background shadow" : "text-muted-foreground"}`}>Per student</button>
              <button onClick={() => setMode("module")} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${mode === "module" ? "bg-background shadow" : "text-muted-foreground"}`}>By module</button>
            </div>
            {mode === "per_student" && (
              <div className="inline-flex rounded-lg border p-1 bg-muted/40">
                {(["monthly","termly","yearly"] as const).map((c) => (
                  <button key={c} onClick={() => setCycle(c)} className={`px-3 py-1.5 text-xs font-semibold rounded-md uppercase ${cycle === c ? "bg-background shadow" : "text-muted-foreground"}`}>{c}</button>
                ))}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visiblePlans.map((p) => (
              <Card key={p.id} className="border-border/60 hover:border-primary/40 transition">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  </div>
                  <div>
                    {p.billing_mode === "per_student" ? (
                      <>
                        <span className="text-3xl font-black">KSh {Number(p.price_per_student).toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground"> / student / {p.cycle}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-black">KSh {Number(p.base_price).toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground"> / month</span>
                      </>
                    )}
                  </div>
                  <Button className="w-full" onClick={() => handleSubscribe(p.code)} disabled={checkout.isPending}>
                    {checkout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Sparkles className="mr-2 h-4 w-4" /> Subscribe</>)}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Invoices */}
        <div>
          <h2 className="text-xl font-bold mb-3">Invoices</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                  <tr><th className="p-3">Date</th><th className="p-3">Amount</th><th className="p-3">Period</th><th className="p-3">Status</th><th className="p-3">Reference</th><th className="p-3"></th></tr>
                </thead>
                <tbody>
                  {invoices.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No invoices yet.</td></tr>
                  )}
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b">
                      <td className="p-3">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold">KSh {Number(inv.amount).toLocaleString()}</td>
                      <td className="p-3 text-xs text-muted-foreground">{inv.period_start} → {inv.period_end}</td>
                      <td className="p-3">
                        <Badge variant={inv.status === "paid" ? "default" : inv.status === "pending" ? "secondary" : "destructive"}>{inv.status}</Badge>
                      </td>
                      <td className="p-3 text-xs">{inv.mpesa_reference || "—"}</td>
                      <td className="p-3 text-right">
                        {inv.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => handleConfirm(inv.id)}>
                            <Check className="h-3 w-3 mr-1" /> Confirm payment
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
