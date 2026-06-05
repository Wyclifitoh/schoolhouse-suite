import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardNoticeBanners } from "@/components/notifications/DashboardNoticeBanners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  Users,
  Banknote,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  GraduationCap,
  BookOpen,
  Package,
  CalendarCheck,
  Receipt,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)",
];
const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  bg,
  loading,
}: any) => (
  <Card className="stat-card">
    <CardContent className="p-5 relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-24 mt-1.5" />
          ) : (
            <p className="text-2xl font-extrabold mt-1.5 text-foreground tracking-tight">
              {value}
            </p>
          )}
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-success" />
              )}
              <span className="text-xs text-success font-semibold">
                {change}
              </span>
              <span className="text-xs text-muted-foreground">
                vs last term
              </span>
            </div>
          )}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}
        >
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ChartCard = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <Card className={`glass-card-hover ${className}`}>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-bold tracking-tight">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// ============== ADMIN ==============
const AdminDashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const netIncome = (stats?.totalRevenue || 0) - (stats?.totalExpenses || 0);

  // Revenue split pie
  const revenuePie = [
    { name: "Collected", value: stats?.totalRevenue || 0 },
    { name: "Outstanding", value: stats?.totalOutstanding || 0 },
    { name: "Expenses", value: stats?.totalExpenses || 0 },
  ].filter((d) => d.value > 0);

  // People composition
  const peoplePie = [
    { name: "Students", value: stats?.totalStudents || 0 },
    { name: "Parents", value: stats?.totalParents || 0 },
    { name: "Staff", value: stats?.totalStaff || 0 },
  ].filter((d) => d.value > 0);

  // Recent payments grouped by day for trend
  const paymentsByDay: Record<string, number> = {};
  (stats?.recentPayments || []).forEach((p) => {
    const k = format(new Date(p.received_at), "MMM d");
    paymentsByDay[k] = (paymentsByDay[k] || 0) + Number(p.amount || 0);
  });
  const paymentTrend = Object.entries(paymentsByDay)
    .reverse()
    .map(([day, amount]) => ({ day, amount }));

  // Payment method breakdown
  const methodTotals: Record<string, number> = {};
  (stats?.recentPayments || []).forEach((p) => {
    const m = (p.payment_method || "Other").toUpperCase();
    methodTotals[m] = (methodTotals[m] || 0) + Number(p.amount || 0);
  });
  const methodBars = Object.entries(methodTotals).map(([method, total]) => ({
    method,
    total,
  }));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          color="text-primary"
          bg="bg-primary/10"
          loading={isLoading}
        />
        <StatCard
          title="Collections (Term)"
          value={formatKES(stats?.totalRevenue || 0)}
          icon={Banknote}
          color="text-success"
          bg="bg-success/10"
          loading={isLoading}
        />
        <StatCard
          title="Outstanding Fees"
          value={formatKES(stats?.totalOutstanding || 0)}
          icon={AlertTriangle}
          color="text-warning"
          bg="bg-warning/10"
          loading={isLoading}
        />
        <StatCard
          title="Collection Rate"
          value={`${stats?.collectionRate || 0}%`}
          icon={TrendingUp}
          color="text-info"
          bg="bg-info/10"
          loading={isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <ChartCard title="Finance Composition">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={revenuePie}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {revenuePie.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatKES(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {revenuePie.map((d, i) => (
              <span
                key={d.name}
                className="text-[11px] flex items-center gap-1.5 text-muted-foreground"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {d.name}
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Payments by Method">
          {methodBars.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
              No recent payments
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={methodBars}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="method" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {methodBars.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="School Population">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={peoplePie}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label={(d) => d.name}
              >
                {peoplePie.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <ChartCard title="Collections Trend" className="lg:col-span-2">
          {paymentTrend.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
              No payments yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={paymentTrend}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS[0]}
                      stopOpacity={0.6}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS[0]}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={CHART_COLORS[0]}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Quick Stats">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Parents",
                value: stats?.totalParents || 0,
                color: "text-primary",
              },
              {
                label: "Staff",
                value: stats?.totalStaff || 0,
                color: "text-info",
              },
              {
                label: "Active Students",
                value: stats?.activeStudents || 0,
                color: "text-success",
              },
              {
                label: "Attendance",
                value: `${stats?.attendanceRate || 0}%`,
                color: "text-warning",
              },
              {
                label: "Expenses",
                value: formatKES(stats?.totalExpenses || 0),
                color: "text-destructive",
              },
              {
                label: "Net Income",
                value: formatKES(netIncome),
                color: netIncome >= 0 ? "text-success" : "text-destructive",
              },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg bg-muted/40">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  {s.label}
                </p>
                <p className={`text-base font-extrabold mt-0.5 ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-7 mb-6">
        <Card className="lg:col-span-7 glass-card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {(stats?.recentPayments || []).slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                      <CreditCard className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {p.student_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.payment_method} · {p.reference_number || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {formatKES(p.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(p.received_at), "MMM d")}
                      </p>
                    </div>
                  </div>
                ))}
                {(stats?.recentPayments || []).length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No recent payments
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// ============== ACCOUNTANT ==============
const AccountantDashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const netIncome = (stats?.totalRevenue || 0) - (stats?.totalExpenses || 0);

  const finPie = [
    { name: "Collected", value: stats?.totalRevenue || 0 },
    { name: "Outstanding", value: stats?.totalOutstanding || 0 },
    { name: "Expenses", value: stats?.totalExpenses || 0 },
  ].filter((d) => d.value > 0);

  const methodTotals: Record<string, number> = {};
  (stats?.recentPayments || []).forEach((p) => {
    const m = (p.payment_method || "Other").toUpperCase();
    methodTotals[m] = (methodTotals[m] || 0) + Number(p.amount || 0);
  });
  const methodBars = Object.entries(methodTotals).map(([method, total]) => ({
    method,
    total,
  }));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Collected"
          value={formatKES(stats?.totalRevenue || 0)}
          icon={Banknote}
          color="text-success"
          bg="bg-success/10"
          loading={isLoading}
        />
        <StatCard
          title="Outstanding"
          value={formatKES(stats?.totalOutstanding || 0)}
          icon={AlertTriangle}
          color="text-warning"
          bg="bg-warning/10"
          loading={isLoading}
        />
        <StatCard
          title="Total Expenses"
          value={formatKES(stats?.totalExpenses || 0)}
          icon={Receipt}
          color="text-destructive"
          bg="bg-destructive/10"
          loading={isLoading}
        />
        <StatCard
          title="Net Income"
          value={formatKES(netIncome)}
          icon={TrendingUp}
          color="text-primary"
          bg="bg-primary/10"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <ChartCard title="Finance Composition">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={finPie}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {finPie.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatKES(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Payments by Method">
          {methodBars.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
              No recent payments
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={methodBars}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="method" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Bar
                  dataKey="total"
                  radius={[6, 6, 0, 0]}
                  fill={CHART_COLORS[1]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </>
  );
};

// ============== TEACHER ==============
const TeacherDashboard = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
    <StatCard
      title="My Classes"
      value="—"
      icon={BookOpen}
      color="text-primary"
      bg="bg-primary/10"
    />
    <StatCard
      title="My Students"
      value="—"
      icon={Users}
      color="text-info"
      bg="bg-info/10"
    />
    <StatCard
      title="Today's Attendance"
      value="—"
      icon={CalendarCheck}
      color="text-success"
      bg="bg-success/10"
    />
    <StatCard
      title="Pending Marks"
      value="—"
      icon={AlertTriangle}
      color="text-warning"
      bg="bg-warning/10"
    />
  </div>
);

// ============== PARENT / STUDENT ==============
const PortalDashboard = ({ primaryRole }: { primaryRole: string }) => (
  <div className="text-center py-16">
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 mx-auto mb-6">
      <GraduationCap className="h-10 w-10 text-primary" />
    </div>
    <h2 className="text-2xl font-extrabold text-foreground mb-2">
      Welcome back!
    </h2>
    <p className="text-muted-foreground max-w-md mx-auto">
      Use the sidebar to navigate to your{" "}
      {primaryRole === "parent" ? "Parent Portal" : "Student Panel"} for
      detailed information.
    </p>
  </div>
);

// ============== MAIN ==============
const Dashboard = () => {
  const { primaryRole, hasAnyRole, getRoleLabel } = useAuth();
  const roleLabel = primaryRole ? getRoleLabel(primaryRole) : "User";

  const isAdmin = hasAnyRole(["super_admin", "admin", "manager"]);
  const isFinance = hasAnyRole(["accountant"]);
  const isTeacher = hasAnyRole(["teacher"]);

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome to your ${roleLabel} dashboard`}
    >
      <DashboardNoticeBanners />
      {isAdmin && <AdminDashboard />}
      {!isAdmin && isFinance && <AccountantDashboard />}
      {!isAdmin && !isFinance && isTeacher && <TeacherDashboard />}
      {primaryRole === "parent" || primaryRole === "student" ? (
        <PortalDashboard primaryRole={primaryRole || ""} />
      ) : null}
      {!isAdmin &&
        !isFinance &&
        !isTeacher &&
        primaryRole !== "parent" &&
        primaryRole !== "student" && <AdminDashboard />}
    </DashboardLayout>
  );
};

export default Dashboard;
