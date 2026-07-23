import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBursarOverview, useBursarTrend, useTopVoteHeads, useRecentReceipts,
} from "@/hooks/useBursarDashboard";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar,
} from "recharts";

const fmt = (n: number | null | undefined) =>
  `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function Kpi({ label, value, hint, tone = "default" }: {
  label: string; value: string; hint?: string;
  tone?: "default" | "positive" | "warning" | "danger";
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-600" :
    tone === "warning"  ? "text-amber-600"   :
    tone === "danger"   ? "text-destructive" : "text-foreground";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`text-2xl ${toneClass}`}>{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-xs text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}

export default function BursarDashboardPage() {
  const overview = useBursarOverview();
  const trend    = useBursarTrend(30);
  const heads    = useTopVoteHeads();
  const receipts = useRecentReceipts();

  const k = overview.data?.kpis;
  const p = overview.data?.pending_approvals;
  const period = overview.data?.period;

  return (
    <DashboardLayout>
      <EnterpriseGate>
        <div className="space-y-6 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Bursar Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Live view of collections, spend and controls for the current term.
              </p>
            </div>
            {period ? (
              <Badge variant="outline">{period.year_label} • Term {period.term_number}</Badge>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {overview.isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : (
              <>
                <Kpi label="Collected (term)" value={fmt(k?.collected_term)} tone="positive" />
                <Kpi label="Collected today"  value={fmt(k?.collected_today)} />
                <Kpi label="Expenses (term)"  value={fmt(k?.expenses_term)} tone="warning" />
                <Kpi label="Surplus (term)"   value={fmt(k?.surplus_term)}
                     tone={(k?.surplus_term || 0) >= 0 ? "positive" : "danger"} />
                <Kpi label="Unallocated payments" value={fmt(k?.unallocated_payments)}
                     tone={(k?.unallocated_payments || 0) > 0 ? "warning" : "default"}
                     hint="Awaiting allocation to vote heads" />
                <Kpi label="Outstanding arrears" value={fmt(k?.outstanding_arrears)}
                     tone={(k?.outstanding_arrears || 0) > 0 ? "danger" : "default"} />
                <Kpi label="Bank balance (all accounts)" value={fmt(k?.bank_balance_total)} />
                <Kpi label="Pending approvals"
                     value={`${(p?.expenses || 0) + (p?.vouchers || 0) + (p?.purchase_orders || 0)}`}
                     hint={p ? `${p.expenses} expenses · ${p.vouchers} vouchers · ${p.purchase_orders} POs` : ""}
                     tone="warning" />
              </>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Collections vs Expenses (30 days)</CardTitle>
                <CardDescription>Daily cash movement, all channels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {trend.isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend.data || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Legend />
                        <Line type="monotone" dataKey="collections" stroke="#10b981" dot={false} />
                        <Line type="monotone" dataKey="expenses"    stroke="#ef4444" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top vote heads by spend</CardTitle>
                <CardDescription>Current period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {heads.isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heads.data || []} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="actual" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bank accounts</CardTitle>
                <CardDescription>Live GL balance per account</CardDescription>
              </CardHeader>
              <CardContent>
                {(overview.data?.bank_accounts || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No bank accounts configured.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.data!.bank_accounts.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell>{b.bank_name}</TableCell>
                          <TableCell className="text-right">{fmt(b.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent receipts</CardTitle>
                <CardDescription>Last 15 payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(receipts.data || []).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.receipt_number}</TableCell>
                        <TableCell>
                          <div className="text-sm">{r.student_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.admission_number}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{r.payment_method}</Badge></TableCell>
                        <TableCell className="text-right">{fmt(r.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </EnterpriseGate>
    </DashboardLayout>
  );
}