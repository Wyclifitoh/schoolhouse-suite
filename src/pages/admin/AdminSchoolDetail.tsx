import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, ArrowLeft, ShieldX, ShieldCheck, Calendar, Receipt,
  Check, CreditCard, AlertTriangle, Clock, RefreshCw, DollarSign,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useSchoolDetail, useExtendTrial, useTerminateTrial, useSetSubStatus, useSetSchoolActive,
  useActivateSubscription, useCreateInvoice, useConfirmInvoice, useVoidInvoice, usePlatformPlans,
  useAssessmentBilling, useBillingStatus, useMarkAssessmentPaid,
} from "@/hooks/usePlatform";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default", pending: "secondary", waived: "outline",
};

export default function AdminSchoolDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { data, isLoading } = useSchoolDetail(id);
  const { data: plans = [] } = usePlatformPlans();
  const { data: assessmentBilling = [] } = useAssessmentBilling(id);
  const { data: billingStatus } = useBillingStatus(id);

  const extend = useExtendTrial();
  const terminate = useTerminateTrial();
  const setStatus = useSetSubStatus();
  const setActive = useSetSchoolActive();
  const activate = useActivateSubscription();
  const createInv = useCreateInvoice();
  const confirmInv = useConfirmInvoice();
  const voidInv = useVoidInvoice();
  const markPaid = useMarkAssessmentPaid();

  const [extendDays, setExtendDays] = useState("7");
  const [activatePlan, setActivatePlan] = useState("");
  const [invDialog, setInvDialog] = useState(false);
  const [inv, setInv] = useState({ amount: "", period_start: "", period_end: "", mark_paid: false, mpesa_reference: "" });

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return <div className="p-6">School not found</div>;

  const { school, subscription, invoices, users, counts } = data;

  const guard = async (label: string, fn: () => Promise<unknown>) => {
    try { await fn(); toast({ title: label }); }
    catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000)
    : null;
  const trialActive = trialDaysLeft !== null && trialDaysLeft > 0;

  const pendingBilling = assessmentBilling.filter(b => b.status === "pending");
  const outstandingBalance = pendingBilling.reduce((a, b) => a + Number(b.total_amount || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => nav("/admin/schools")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to schools
        </Button>
        <div className="flex items-start justify-between mt-2 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black">{school.name}</h1>
            <p className="text-muted-foreground">{school.email || "—"} · {school.phone || "—"} · {school.curriculum_type}</p>
          </div>
          <div className="flex gap-2">
            {school.is_active ? (
              <Button size="sm" variant="destructive" onClick={() => guard("School suspended", () => setActive.mutateAsync({ id, active: false }))}>
                <ShieldX className="h-3 w-3 mr-1" /> Suspend
              </Button>
            ) : (
              <Button size="sm" variant="default" onClick={() => guard("School reactivated", () => setActive.mutateAsync({ id, active: true }))}>
                <ShieldCheck className="h-3 w-3 mr-1" /> Reactivate
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Billing status alert */}
      {billingStatus && !billingStatus.gate?.allowed && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-destructive">Assessment creation is BLOCKED</p>
              <p className="text-sm text-muted-foreground mt-1">{billingStatus.gate?.reason}</p>
              <p className="text-sm font-semibold mt-2">
                Outstanding balance: KSh {Number(billingStatus.balance?.balance || 0).toLocaleString()} ({billingStatus.balance?.pending_count || 0} assessments unpaid)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active students", v: counts.active_students },
          { label: "Total students", v: counts.total_students },
          { label: "Staff", v: counts.staff_count },
          { label: "Parents", v: counts.parent_count },
        ].map((k) => (
          <Card key={k.label}><CardContent className="p-4">
            <div className="text-[11px] uppercase font-semibold text-muted-foreground">{k.label}</div>
            <div className="text-2xl font-black">{Number(k.v).toLocaleString()}</div>
          </CardContent></Card>
        ))}
      </div>

      {/* Subscription */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> Subscription & Trial</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {subscription?.plan_name || "No plan"} ·{" "}
                <Badge variant="outline">{subscription?.status || "no sub"}</Badge>
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                {subscription?.trial_ends_at && (
                  <span className={trialDaysLeft !== null && trialDaysLeft <= 7 ? "text-amber-600 font-semibold" : ""}>
                    Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString()}
                    {trialDaysLeft !== null && ` (${trialDaysLeft > 0 ? `${trialDaysLeft}d remaining` : "EXPIRED"})`}
                  </span>
                )}
                {subscription?.current_period_end && <> · Period ends {new Date(subscription.current_period_end).toLocaleDateString()}</>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => guard("Marked past due", () => setStatus.mutateAsync({ id, status: "past_due" }))}>Past due</Button>
              <Button size="sm" variant="outline" onClick={() => guard("Marked active", () => setStatus.mutateAsync({ id, status: "active" }))}>Mark active</Button>
              <Button size="sm" variant="outline" onClick={() => guard("Cancelled", () => setStatus.mutateAsync({ id, status: "cancelled" }))}>Cancel</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Extend / terminate trial */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Trial controls</h4>
              <div className="flex gap-2">
                <Select value={extendDays} onValueChange={setExtendDays}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[7, 14, 30, 60, 90].map((d) => <SelectItem key={d} value={String(d)}>+{d} days</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => guard("Trial extended", () => extend.mutateAsync({ id, days: Number(extendDays) }))}>Extend trial</Button>
                <Button size="sm" variant="destructive" onClick={() => {
                  if (confirm("Terminate trial now? School will be locked.")) guard("Trial terminated", () => terminate.mutateAsync(id));
                }}>Terminate</Button>
              </div>
            </div>

            {/* Activate subscription */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2"><Receipt className="h-4 w-4" /> Activate subscription</h4>
              <div className="flex gap-2">
                <Select value={activatePlan} onValueChange={setActivatePlan}>
                  <SelectTrigger><SelectValue placeholder="Choose plan…" /></SelectTrigger>
                  <SelectContent>
                    {plans.filter((p) => p.is_active).map((p) => <SelectItem key={p.id} value={p.code}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!activatePlan} onClick={() => guard("Subscription activated", () => activate.mutateAsync({ id, plan_code: activatePlan }))}>
                  Activate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Period is computed from the plan cycle. Use Invoices for offline payments.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Assessment Billing ──────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Assessment Billing
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                KSh 10 per active student per assessment · Charged after 30-day trial
              </p>
            </div>
            <div className="flex items-center gap-3">
              {outstandingBalance > 0 && (
                <div className="text-right">
                  <p className="text-[11px] uppercase text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-black text-destructive">KSh {outstandingBalance.toLocaleString()}</p>
                </div>
              )}
              {pendingBilling.length > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    if (confirm(`Mark ALL ${pendingBilling.length} pending assessment(s) as paid? (KSh ${outstandingBalance.toLocaleString()})`)) {
                      guard("All assessments marked paid", () => markPaid.mutateAsync({ schoolId: id }));
                    }
                  }}
                  disabled={markPaid.isPending}
                >
                  {markPaid.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                  Mark all paid
                </Button>
              )}
            </div>
          </div>

          {assessmentBilling.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No assessment billing records yet.</p>
              <p className="text-xs mt-1">Records appear when assessments are created after the trial period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="p-2">Assessment</th>
                    <th className="p-2 text-right">Students</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Date</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentBilling.map((b: any) => (
                    <tr key={b.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium">{b.assessment_name || "—"}</td>
                      <td className="p-2 text-right">{Number(b.student_count).toLocaleString()}</td>
                      <td className="p-2 text-right">KSh {Number(b.price_per_student).toLocaleString()}</td>
                      <td className="p-2 text-right font-semibold">KSh {Number(b.total_amount).toLocaleString()}</td>
                      <td className="p-2">
                        <Badge variant={STATUS_COLORS[b.status] || "outline"}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-right">
                        {b.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => guard("Assessment marked paid", () => markPaid.mutateAsync({ schoolId: id, assessmentId: b.assessment_id }))}
                            disabled={markPaid.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" /> Paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-muted/20">
                  <tr>
                    <td colSpan={3} className="p-2 text-right text-xs text-muted-foreground font-semibold">Total outstanding</td>
                    <td className="p-2 text-right font-black">KSh {outstandingBalance.toLocaleString()}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2"><Receipt className="h-4 w-4" /> Subscription Invoices</h3>
            <Button size="sm" onClick={() => setInvDialog(true)}>+ New invoice</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                <tr><th className="p-2">Date</th><th className="p-2">Amount</th><th className="p-2">Period</th><th className="p-2">Status</th><th className="p-2">Reference</th><th className="p-2"></th></tr>
              </thead>
              <tbody>
                {invoices.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No invoices yet.</td></tr>}
                {invoices.map((i: any) => (
                  <tr key={i.id} className="border-b hover:bg-muted/30">
                    <td className="p-2">{new Date(i.created_at).toLocaleDateString()}</td>
                    <td className="p-2 font-semibold">KSh {Number(i.amount).toLocaleString()}</td>
                    <td className="p-2 text-xs text-muted-foreground">{i.period_start || "—"} → {i.period_end || "—"}</td>
                    <td className="p-2"><Badge variant={i.status === "paid" ? "default" : i.status === "pending" ? "secondary" : "destructive"}>{i.status}</Badge></td>
                    <td className="p-2 text-xs">{i.mpesa_reference || "—"}</td>
                    <td className="p-2 text-right space-x-2">
                      {i.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => {
                            const ref = prompt("M-Pesa reference (optional)") || undefined;
                            guard("Invoice confirmed", () => confirmInv.mutateAsync({ invoiceId: i.id, mpesa_reference: ref }));
                          }}><Check className="h-3 w-3 mr-1" /> Confirm</Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Void this invoice?")) guard("Invoice voided", () => voidInv.mutateAsync(i.id)); }}>Void</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* School users */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold mb-3">School users ({users.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                <tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Roles</th><th className="p-2">Last login</th></tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{u.full_name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2 text-xs">{u.roles || "—"}</td>
                    <td className="p-2 text-xs">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create invoice dialog */}
      <Dialog open={invDialog} onOpenChange={setInvDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create invoice for {school.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Amount (KSh)</Label><Input type="number" value={inv.amount} onChange={(e) => setInv({ ...inv, amount: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Period start</Label><Input type="date" value={inv.period_start} onChange={(e) => setInv({ ...inv, period_start: e.target.value })} /></div>
              <div><Label>Period end</Label><Input type="date" value={inv.period_end} onChange={(e) => setInv({ ...inv, period_end: e.target.value })} /></div>
            </div>
            <div><Label>M-Pesa reference (optional)</Label><Input value={inv.mpesa_reference} onChange={(e) => setInv({ ...inv, mpesa_reference: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={inv.mark_paid} onChange={(e) => setInv({ ...inv, mark_paid: e.target.checked })} />
              Mark as paid immediately (activates subscription)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                await createInv.mutateAsync({ id, amount: Number(inv.amount), period_start: inv.period_start, period_end: inv.period_end, mark_paid: inv.mark_paid, mpesa_reference: inv.mpesa_reference });
                toast({ title: "Invoice created" });
                setInvDialog(false);
                setInv({ amount: "", period_start: "", period_end: "", mark_paid: false, mpesa_reference: "" });
              } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
            }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}