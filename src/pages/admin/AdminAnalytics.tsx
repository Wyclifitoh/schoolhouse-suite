import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, PieChart as PieIcon } from "lucide-react";
import {
  useAnalyticsMrr, useAnalyticsCohorts, useAnalyticsTrialConversion,
  useAnalyticsChurn, useAnalyticsPlanDistribution,
} from "@/hooks/usePlatform";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend, PieChart, Pie, Cell,
} from "recharts";

const fmt = (n: number | undefined | null) => (n == null ? "—" : Number(n).toLocaleString());
const money = (n: number | undefined | null) =>
  n == null ? "—" : `KES ${Number(n).toLocaleString()}`;

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#ec4899"];

export default function AdminAnalytics() {
  const mrr = useAnalyticsMrr();
  const cohorts = useAnalyticsCohorts();
  const trial = useAnalyticsTrialConversion();
  const churn = useAnalyticsChurn();
  const plans = useAnalyticsPlanDistribution();

  const conversionPct = useMemo(() => {
    const t = trial.data;
    if (!t || !t.total) return 0;
    return Math.round((t.active / t.total) * 100);
  }, [trial.data]);

  const churnPct = useMemo(() => {
    const t = trial.data;
    if (!t || !t.total) return 0;
    return Math.round((t.cancelled / t.total) * 100);
  }, [trial.data]);

  const latestMrr = mrr.data?.[mrr.data.length - 1]?.mrr || 0;
  const prevMrr = mrr.data?.[mrr.data.length - 2]?.mrr || 0;
  const mrrDelta = prevMrr ? Math.round(((latestMrr - prevMrr) / prevMrr) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" /> Platform Analytics
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Growth & Revenue</h1>
        <p className="text-sm text-muted-foreground">
          Recurring revenue, cohorts, trial conversion, churn and plan mix across every tenant.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="This month MRR" value={money(latestMrr)} icon={<DollarSign className="h-4 w-4" />} delta={mrrDelta} />
        <KpiCard label="Active subscriptions" value={fmt(trial.data?.active)} icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Trial → paid" value={`${conversionPct}%`} icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} />
        <KpiCard label="Churn rate" value={`${churnPct}%`} icon={<TrendingDown className="h-4 w-4 text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly recurring revenue (12 months)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={mrr.data || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(v: any) => `KES ${Number(v).toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="mrr" name="Paid" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="arr_pending" name="Pending" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Signup cohorts</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={cohorts.data || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="cohort" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new_schools" name="New" fill="#3b82f6" />
                  <Bar dataKey="still_active" name="Still active" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Churn (last 12 months)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={churn.data || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" />
                  <Bar dataKey="locked" name="Locked" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieIcon className="h-4 w-4" />Plan distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={(plans.data || []).filter((p) => p.schools > 0)}
                       dataKey="schools" nameKey="name" outerRadius={90} label>
                    {(plans.data || []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Subscription funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <FunnelStep label="Total signed up" value={trial.data?.total || 0} tone="slate" />
            <FunnelStep label="On trial" value={trial.data?.trials || 0} tone="blue" />
            <FunnelStep label="Active (paid)" value={trial.data?.active || 0} tone="emerald" />
            <FunnelStep label="Locked" value={trial.data?.locked || 0} tone="amber" />
            <FunnelStep label="Cancelled" value={trial.data?.cancelled || 0} tone="red" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon, delta }: { label: string; value: string; icon: React.ReactNode; delta?: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>{icon}
        </div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        {delta != null && delta !== 0 && (
          <div className={`text-xs mt-1 ${delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}% vs previous month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelStep({ label, value, tone }: { label: string; value: number; tone: string }) {
  const bg: Record<string, string> = {
    slate: "bg-slate-500/10 text-slate-700 border-slate-500/30",
    blue: "bg-blue-500/10 text-blue-700 border-blue-500/30",
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    red: "bg-red-500/10 text-red-700 border-red-500/30",
  };
  return (
    <div className={`rounded-lg border p-4 ${bg[tone]}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value.toLocaleString()}</div>
    </div>
  );
}