import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Building2,
  Users,
  GraduationCap,
  Banknote,
  Clock,
  ArrowRight,
  ArrowUpRight,
  MessageSquare,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useOverview, useRevenueMonthly } from "@/hooks/usePlatform";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const fmt = (n: number) => `KSh ${Number(n || 0).toLocaleString()}`;
const short = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "#10b981" },
  trial: { label: "Trial", color: "#6366f1" },
  past_due: { label: "Past due", color: "#f59e0b" },
  locked: { label: "Locked", color: "#ef4444" },
  cancelled: { label: "Cancelled", color: "#94a3b8" },
};

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  tone = "primary",
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  tone?: "primary" | "emerald" | "amber" | "rose";
  trend?: string;
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  } as const;
  return (
    <Card className="border shadow-sm hover:shadow transition">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div
            className={`h-10 w-10 rounded-xl ${toneMap[tone]} flex items-center justify-center`}
          >
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <ArrowUpRight className="h-3 w-3" /> {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
            {label}
          </div>
          <div className="text-2xl font-black mt-1 tracking-tight text-foreground">
            {value}
          </div>
          {sub && (
            <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOverview() {
  const { data, isLoading } = useOverview();
  const { data: monthly = [] } = useRevenueMonthly();

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!data) return <div className="p-6">No data</div>;

  const subs = data.subscriptions || {};
  const totalSubs =
    Object.values(subs).reduce((a, b) => a + (b as number), 0) || 0;
  const subPie = Object.entries(STATUS_META)
    .map(([k, meta]) => ({
      name: meta.label,
      value: subs[k] || 0,
      color: meta.color,
      key: k,
    }))
    .filter((s) => s.value > 0);

  const signups = data.signups30d.map((d) => ({
    d: new Date(d.d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    c: Number(d.c),
  }));
  const totalNew = data.signups30d.reduce((a, x) => a + Number(x.c), 0);

  const rev = (monthly || []).slice(-6).map((m) => ({
    month: new Date(m.month + "-01").toLocaleDateString(undefined, {
      month: "short",
    }),
    paid: Number(m.paid || 0),
    pending: Number(m.pending || 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary">
            Operations Center
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight mt-1">
            Platform overview
          </h1>
          <p className="text-muted-foreground mt-1">
            A live snapshot of every school running on CHUO Cloud.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/schools">
              All schools <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/billing">
              Billing & revenue <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Schools"
          value={data.totals.total_schools}
          sub={`${data.totals.active_schools} active`}
          icon={Building2}
          tone="primary"
        />
        <Kpi
          label="Students system-wide"
          value={data.totals.total_students.toLocaleString()}
          sub="Across every tenant"
          icon={GraduationCap}
          tone="emerald"
        />
        <Kpi
          label="Staff users"
          value={data.totals.total_users.toLocaleString()}
          sub="Teachers, admins, finance"
          icon={Users}
          tone="amber"
        />
        <Kpi
          label="Revenue collected"
          value={fmt(data.revenue.collected)}
          sub={`${fmt(data.revenue.pending)} pending`}
          icon={Banknote}
          tone="emerald"
        />
      </div>

      {/* Secondary KPIs incl. placeholders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="This month — paid"
          value={fmt(data.revenue.mtd_paid)}
          icon={TrendingUp}
          tone="primary"
        />
        <Kpi
          label="This month — pending"
          value={fmt(data.revenue.mtd_pending)}
          icon={Clock}
          tone="amber"
        />
        <Card className="border-dashed">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-[10px]"
              >
                Soon
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                SMS balance
              </div>
              <div className="text-2xl font-black mt-1 tracking-tight text-muted-foreground">
                —
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Platform-wide credits
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-[10px]"
              >
                Soon
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                Platform health
              </div>
              <div className="text-2xl font-black mt-1 tracking-tight text-muted-foreground">
                —
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Live signals wiring up
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg tracking-tight">
                  New schools
                </h3>
                <p className="text-xs text-muted-foreground">
                  {totalNew} sign-ups in the last 30 days
                </p>
              </div>
              <Badge variant="secondary">30d</Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signups}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="c"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#g1)"
                    name="Schools"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg tracking-tight">
                  Subscription mix
                </h3>
                <p className="text-xs text-muted-foreground">
                  {totalSubs} total
                </p>
              </div>
            </div>
            <div className="h-52">
              {subPie.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No subscriptions yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {subPie.map((s) => (
                        <Cell
                          key={s.key}
                          fill={s.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {subPie.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue + Trials */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg tracking-tight">
                  Revenue trend
                </h3>
                <p className="text-xs text-muted-foreground">
                  Paid vs pending — last 6 months
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/billing">
                  Details <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="h-64">
              {rev.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No revenue data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rev} barCategoryGap={24}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      tickFormatter={short}
                    />
                    <Tooltip
                      formatter={(v: number) => fmt(v)}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="paid"
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                      name="Paid"
                    />
                    <Bar
                      dataKey="pending"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                      name="Pending"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2 tracking-tight">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Trials ending
              </h3>
              <Badge variant="secondary">{data.trialsEndingSoon.length}</Badge>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {data.trialsEndingSoon.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  All trials are stable.
                </p>
              )}
              {data.trialsEndingSoon.map((t) => (
                <Link
                  key={t.id}
                  to={`/admin/schools/${t.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {t.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ends {new Date(t.trial_ends_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
