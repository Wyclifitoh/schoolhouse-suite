import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardNoticeBanners } from "@/components/notifications/DashboardNoticeBanners";
import { SetupChecklist } from "@/components/help/SetupChecklist";
import { OnboardingTourLauncher } from "@/components/help/OnboardingTour";
import { Widget, KpiCard } from "@/components/dashboard/Widget";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import { useCan } from "@/hooks/usePermission";
import {
  useAttention,
  useDashboardActivity,
  useDashboardSummary,
  useFinanceTrend,
} from "@/hooks/useDashboard";
import { ClockInOutCard } from "@/components/staff/ClockInOutCard";
import {
  Users,
  Banknote,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  CalendarCheck,
  Briefcase,
  Package,
  CalendarRange,
  ArrowRight,
  ClipboardList,
  Receipt,
  MessageSquare,
  BarChart3,
  UserPlus,
  ChevronRight,
  Activity as ActivityIcon,
  CalendarDays,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { format, isValid, parseISO } from "date-fns";

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(199, 89%, 48%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(215, 16%, 60%)",
];

const kes = (n: number) =>
  `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const compactKes = (n: number) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return `${v}`;
};
const safeDate = (v?: string | null) => {
  if (!v) return null;
  const d = parseISO(v);
  return isValid(d) ? d : null;
};
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};
const titleCase = (s: string) =>
  s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* ------------------------------------------------------------------ */
/* Quick actions — permission driven, never role driven               */
/* ------------------------------------------------------------------ */
function QuickActions() {
  const canAddStudent = useCan("students:create");
  const canPay = useCan("payments:create");
  const canAssess = useCan("exams:create");
  const canMessage = useCan("communication:create", "communication:send");
  const canReports = useCan("reports:read");
  const canUsers = useCan("users:create", "users:manage");

  const actions = [
    canAddStudent && { to: "/students", label: "Add Student", icon: UserPlus },
    canPay && { to: "/payments", label: "Record Payment", icon: Receipt },
    canAssess && {
      to: "/assessments",
      label: "Create Assessment",
      icon: ClipboardList,
    },
    canMessage && {
      to: "/communication",
      label: "Send Message",
      icon: MessageSquare,
    },
    canReports && { to: "/reports", label: "Reports", icon: BarChart3 },
    canUsers && { to: "/settings/users", label: "Manage Users", icon: Users },
  ].filter(Boolean) as { to: string; label: string; icon: React.ElementType }[];

  if (!actions.length) return null;

  return (
    <Widget title="Quick Actions" icon={ArrowRight} bodyClassName="p-3">
      <div className="flex flex-col">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted/60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <a.icon className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">
              {a.label}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Attention required                                                  */
/* ------------------------------------------------------------------ */
function AttentionWidget() {
  const { data, isLoading, isError, refetch } = useAttention();

  const items = useMemo(() => {
    if (!data) return [];
    const out: {
      label: string;
      count: number;
      to: string;
      tone: "warning" | "destructive" | "primary";
    }[] = [];
    if (data.finance) {
      if (data.finance.unpaidAccounts)
        out.push({
          label: "Students with outstanding fees",
          count: data.finance.unpaidAccounts,
          to: "/finance",
          tone: "warning",
        });
      if (data.finance.unallocatedPayments)
        out.push({
          label: "Unallocated payments",
          count: data.finance.unallocatedPayments,
          to: "/unallocated-payments",
          tone: "destructive",
        });
    }
    if (data.academics?.openTasks)
      out.push({
        label: "Assessment tasks awaiting mark entry",
        count: data.academics.openTasks,
        to: "/assessments",
        tone: "primary",
      });
    if (data.academics?.readyToPublish)
      out.push({
        label: "Completed assessments awaiting result publishing",
        count: data.academics.readyToPublish,
        to: "/assessments?status=completed",
        tone: "warning",
      });
    if (data.academics?.windowClosed)
      out.push({
        label: "Open assessments past their end date",
        count: data.academics.windowClosed,
        to: "/assessments?status=open",
        tone: "warning",
      });
    if (data.academics?.incompleteMarks)
      out.push({
        label: "Open assessments with incomplete marks",
        count: data.academics.incompleteMarks,
        to: "/assessments?status=open",
        tone: "primary",
      });

    if (data.attendance?.unmarkedToday)
      out.push({
        label: "Students without attendance today",
        count: data.attendance.unmarkedToday,
        to: "/attendance",
        tone: "warning",
      });
    if (data.hr?.pendingLeaves)
      out.push({
        label: "Leave requests pending approval",
        count: data.hr.pendingLeaves,
        to: "/leave-management",
        tone: "primary",
      });
    if (data.inventory?.lowStock)
      out.push({
        label: "Inventory items low on stock",
        count: data.inventory.lowStock,
        to: "/inventory",
        tone: "destructive",
      });
    return out;
  }, [data]);

  const anyDomain =
    !!data &&
    Object.values(data.domains || {}).some(Boolean);
  if (data && !anyDomain) return null;

  const toneClass = {
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
  };

  return (
    <Widget
      title="Needs your attention"
      subtitle="Actionable items scoped to your permissions"
      icon={AlertTriangle}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      isEmpty={!isLoading && !isError && items.length === 0}
      emptyMessage="Nothing needs your attention right now."
      bodyClassName="p-3"
    >
      <div className="flex flex-col">
        {items.map((i) => (
          <Link
            key={i.label}
            to={i.to}
            className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted/60"
          >
            <span
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-bold ${toneClass[i.tone]}`}
            >
              {i.count}
            </span>
            <span className="flex-1 text-sm text-foreground">{i.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Collection trend                                                    */
/* ------------------------------------------------------------------ */
function CollectionTrend() {
  const [range, setRange] = useState<"term" | "year" | "all">("term");
  const { data, isLoading, isError, refetch } = useFinanceTrend(range);
  const points = data?.points || [];

  return (
    <Widget
      title="Collection Trend"
      subtitle={
        range === "term"
          ? "Current academic session"
          : range === "year"
            ? "Last 12 months (historical)"
            : "Last 24 months (historical)"
      }
      icon={TrendingUp}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      isEmpty={!isLoading && !isError && points.length === 0}
      emptyMessage="No payments recorded for this period yet."
      action={
        <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="term">This Term</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">Extended Period</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => compactKes(v as number)}
            />
            <Tooltip
              formatter={(v) => kes(v as number)}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid hsl(214 32% 91%)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "hsl(221, 83%, 53%)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const { user } = useAuth();
  const { viewingYear, viewingTerm, isHistorical } = useAcademicContext();
  const summary = useDashboardSummary();
  const activity = useDashboardActivity();
  const canTrend = useCan("payments:read", "finance:fees:read", "reports:read");

  const d = summary.data;
  const domains = d?.domains;
  const loading = summary.isLoading;

  const firstName = (user?.full_name || user?.email || "there").split(" ")[0];

  /* ---------------- KPI cards (permission driven) ---------------- */
  const kpis: {
    label: string;
    value: string | number;
    hint?: string;
    icon: React.ElementType;
    tone?: "primary" | "success" | "warning" | "destructive" | "muted";
  }[] = [];

  if (loading || domains?.students) {
    kpis.push({
      label: "Total Students",
      value: d?.students ? d.students.active.toLocaleString() : "—",
      hint: d?.students
        ? `${d.students.total.toLocaleString()} on roll · ${d.students.newAdmissions} new (90d)`
        : undefined,
      icon: Users,
      tone: "primary",
    });
  }
  if (loading || domains?.finance) {
    kpis.push({
      label: "Collections",
      value: d?.finance ? kes(d.finance.collected) : "—",
      hint: viewingTerm ? `${viewingTerm.name} to date` : undefined,
      icon: Banknote,
      tone: "success",
    });
    kpis.push({
      label: "Outstanding Fees",
      value: d?.finance ? kes(d.finance.outstanding) : "—",
      hint: d?.finance ? `${d.finance.collectionRate}% collection rate` : undefined,
      icon: AlertTriangle,
      tone: "warning",
    });
  }
  if (loading || domains?.attendance) {
    kpis.push({
      label: "Attendance Rate",
      value: d?.attendance ? `${d.attendance.rate}%` : "—",
      hint: d?.attendance
        ? `${d.attendance.present.toLocaleString()} present · ${d.attendance.absent.toLocaleString()} absent`
        : undefined,
      icon: CalendarCheck,
      tone: "primary",
    });
  }
  if (domains?.academics) {
    kpis.push({
      label: "Assessments",
      value: d?.academics ? d.academics.assessments : "—",
      // Publication is a business event — never inferred from marks progress.
      hint: d?.academics ? d.academics.summaryLine : undefined,
      icon: GraduationCap,
      tone: "primary",
    });
  }
  if (domains?.hr) {
    kpis.push({
      label: "Staff",
      value: d?.hr ? d.hr.activeStaff : "—",
      hint: d?.hr
        ? `${d.hr.pendingLeaves} leave request${d.hr.pendingLeaves === 1 ? "" : "s"} pending`
        : undefined,
      icon: Briefcase,
      tone: "muted",
    });
  }
  if (domains?.inventory) {
    kpis.push({
      label: "Stock Value",
      value: d?.inventory ? kes(d.inventory.stockValue) : "—",
      hint: d?.inventory ? `${d.inventory.lowStock} item(s) low on stock` : undefined,
      icon: Package,
      tone: "muted",
    });
  }

  const financeCats = (d?.finance?.categories || []).filter((c) => c.value > 0);
  const catTotal = financeCats.reduce((s, c) => s + c.value, 0);
  const studentsByClass = (d?.students?.byClass || []).filter((c) => c.value > 0);
  const attendanceSplit = d?.attendance
    ? [
        { label: "Present", value: d.attendance.present },
        { label: "Late", value: d.attendance.late },
        { label: "Absent", value: d.attendance.absent },
        { label: "Excused", value: d.attendance.excused },
      ].filter((s) => s.value > 0)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {greeting()}, {firstName}. Here's what's happening in your school.
            </p>
          </div>
          {viewingTerm && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                isHistorical
                  ? "border-warning/40 bg-warning/10 text-warning"
                  : "border-primary/30 bg-primary/5 text-primary"
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              {viewingYear?.name || "—"} · {viewingTerm.name}
              <span className="opacity-70">
                {isHistorical ? "· Historical" : "· Current"}
              </span>
            </span>
          )}
        </div>

        <DashboardNoticeBanners />

        <SetupChecklist />

        <OnboardingTourLauncher />

        {summary.isError && (
          <Widget
            title="Dashboard"
            error
            onRetry={() => summary.refetch()}
          />
        )}

        {/* ROW 1 — KPIs */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => (
              <KpiCard key={k.label} {...k} loading={loading} />
            ))}
          </div>
        )}

        {/* ROW 2 — analytical widgets */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {(loading || domains?.finance) && (
            <Widget
              title="Finance Overview"
              subtitle={
                d?.finance ? `${kes(d.finance.allocated)} allocated to fees` : undefined
              }
              icon={Banknote}
              loading={loading}
              isEmpty={!loading && financeCats.length === 0}
              emptyMessage="No fee collections recorded for this session yet."
              className="lg:col-span-1"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financeCats}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {financeCats.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => kes(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Collected
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {kes(catTotal)}
                    </span>
                  </div>
                </div>
                <div className="w-full space-y-2">
                  {financeCats.map((c, i) => (
                    <div key={c.label} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="flex-1 truncate text-muted-foreground">
                        {c.label}
                      </span>
                      <span className="font-medium text-foreground">
                        {catTotal ? Math.round((100 * c.value) / catTotal) : 0}%
                      </span>
                      <span className="w-24 text-right text-xs text-muted-foreground">
                        {kes(c.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Widget>
          )}

          {canTrend && (
            <div className="lg:col-span-2">
              <CollectionTrend />
            </div>
          )}
        </div>

        {/* ROW 3 — operational insights */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {(loading || domains?.students) && (
            <Widget
              title="Students by Class"
              icon={Users}
              loading={loading}
              isEmpty={!loading && studentsByClass.length === 0}
              emptyMessage="No active students have been placed in a class yet."
            >
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentsByClass} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "hsl(215 16% 47%)" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Widget>
          )}

          {(loading || domains?.attendance) && (
            <Widget
              title="Attendance Overview"
              subtitle={viewingTerm ? `${viewingTerm.name} to date` : undefined}
              icon={CalendarCheck}
              loading={loading}
              isEmpty={!loading && attendanceSplit.length === 0}
              emptyMessage="No attendance data available for this period."
            >
              <div className="relative h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceSplit}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {attendanceSplit.map((s, i) => (
                        <Cell
                          key={s.label}
                          fill={
                            [
                              "hsl(142, 71%, 45%)",
                              "hsl(38, 92%, 50%)",
                              "hsl(0, 84%, 60%)",
                              "hsl(215, 16%, 60%)",
                            ][i]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-foreground">
                    {d?.attendance?.rate ?? 0}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">Attendance</span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {attendanceSplit.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: [
                          "hsl(142, 71%, 45%)",
                          "hsl(38, 92%, 50%)",
                          "hsl(0, 84%, 60%)",
                          "hsl(215, 16%, 60%)",
                        ][i],
                      }}
                    />
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="ml-auto font-medium text-foreground">
                      {s.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Widget>
          )}

          {domains?.academics && (
            <Widget
              title="Academic Performance"
              subtitle="CBE assessment progress"
              icon={GraduationCap}
              loading={loading}
              isEmpty={
                !loading &&
                !d?.academics?.assessments &&
                !(d?.academics?.topClasses || []).length
              }
              emptyMessage="No assessments created for this session yet."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Assessments</p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {d?.academics?.assessments ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Published</p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {d?.academics?.published ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Open for marks</p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {d?.academics?.open ?? 0}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      Awaiting publishing
                    </p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {d?.academics?.readyToPublish ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Locked</p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {d?.academics?.locked ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Marks entered</p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {d?.academics?.completionRate ?? 0}%
                    </p>
                  </div>
                </div>
                {(d?.academics?.topClasses || []).length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Top performing classes
                    </p>
                    {d!.academics!.topClasses.map((c) => (
                      <div key={c.label} className="flex items-center gap-3 text-sm">
                        <span className="w-20 truncate text-muted-foreground">
                          {c.label}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, c.value)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-medium text-foreground">
                          {c.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Performance breakdown becomes available once marks are
                    submitted.
                  </p>
                )}
              </div>
            </Widget>
          )}
        </div>

        {/* ROW 4 — attention, quick actions, events, activity */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4">
            <AttentionWidget />
            <QuickActions />
            <ClockInOutCard />
          </div>

          <div className="space-y-4 lg:col-span-2">
            {domains?.events && (
              <Widget
                title="Upcoming Events"
                icon={CalendarDays}
                loading={loading}
                isEmpty={!loading && !(d?.upcomingEvents || []).length}
                emptyMessage="No upcoming events on the school calendar."
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/events" className="text-xs">
                      View calendar
                    </Link>
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(d?.upcomingEvents || []).map((e) => {
                    const dt = safeDate(e.starts_at);
                    return (
                      <div
                        key={e.id}
                        className="flex gap-3 rounded-xl border border-border/70 p-3"
                      >
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/8 text-primary">
                          <span className="text-[10px] font-semibold uppercase">
                            {dt ? format(dt, "MMM") : "—"}
                          </span>
                          <span className="text-base font-bold leading-none">
                            {dt ? format(dt, "d") : "–"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {e.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {dt ? format(dt, "EEE, d MMM · HH:mm") : "Date TBC"}
                          </p>
                          {e.location && (
                            <p className="truncate text-xs text-muted-foreground">
                              {e.location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Widget>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {domains?.payments && (
                <Widget
                  title="Recent Payments"
                  icon={Receipt}
                  loading={loading}
                  isEmpty={!loading && !(d?.recentPayments || []).length}
                  emptyMessage="No payments recorded in this session yet."
                >
                  <div className="space-y-3">
                    {(d?.recentPayments || []).map((p) => {
                      const dt = safeDate(p.received_at);
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
                            <Banknote className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {p.student_name || "Unknown student"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {titleCase(p.payment_method)}
                              {dt ? ` · ${format(dt, "d MMM, HH:mm")}` : ""}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {kes(p.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Widget>
              )}

              <Widget
                title="Recent Activity"
                icon={ActivityIcon}
                loading={activity.isLoading}
                error={activity.isError}
                onRetry={() => activity.refetch()}
                isEmpty={
                  !activity.isLoading &&
                  !activity.isError &&
                  !(activity.data || []).length
                }
                emptyMessage="No recent activity you have access to."
              >
                <div className="space-y-3">
                  {(activity.data || []).slice(0, 8).map((a) => {
                    const dt = safeDate(a.created_at);
                    return (
                      <div key={a.id} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">
                            <span className="font-medium">
                              {titleCase(a.entity_type)}
                            </span>{" "}
                            {a.action?.toLowerCase()}
                            {a.actor ? ` by ${a.actor}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dt ? format(dt, "d MMM yyyy, HH:mm") : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Widget>
            </div>
          </div>
        </div>

        {!loading &&
          d &&
          !Object.values(d.domains || {}).some(Boolean) && (
            <Widget
              title="Your dashboard"
              icon={BarChart3}
              isEmpty
              emptyMessage="You do not yet have permissions for any dashboard area. Contact your administrator."
            />
          )}
      </div>
    </DashboardLayout>
  );
}
