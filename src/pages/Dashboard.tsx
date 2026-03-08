import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  Users, Banknote, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight,
  CreditCard, GraduationCap, BookOpen, Package, CalendarCheck, Receipt,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import { format } from "date-fns";

const CHART_COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(199, 89%, 48%)", "hsl(262, 83%, 58%)", "hsl(0, 84%, 60%)"];
const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

const StatCard = ({ title, value, change, trend, icon: Icon, color, bg, loading }: any) => (
  <Card className="stat-card">
    <CardContent className="p-5 relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          {loading ? <Skeleton className="h-8 w-24 mt-1.5" /> : <p className="text-2xl font-extrabold mt-1.5 text-foreground tracking-tight">{value}</p>}
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5 text-success" /> : <ArrowDownRight className="h-3.5 w-3.5 text-success" />}
              <span className="text-xs text-success font-semibold">{change}</span>
              <span className="text-xs text-muted-foreground">vs last term</span>
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <Card className={`glass-card-hover ${className}`}>
    <CardHeader className="pb-2"><CardTitle className="text-sm font-bold tracking-tight">{title}</CardTitle></CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

// ============== ADMIN ==============
const AdminDashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const netIncome = (stats?.totalRevenue || 0) - (stats?.totalExpenses || 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={GraduationCap} color="text-primary" bg="bg-primary/10" loading={isLoading} />
        <StatCard title="Collections (Term)" value={formatKES(stats?.totalRevenue || 0)} icon={Banknote} color="text-success" bg="bg-success/10" loading={isLoading} />
        <StatCard title="Outstanding Fees" value={formatKES(stats?.totalOutstanding || 0)} icon={AlertTriangle} color="text-warning" bg="bg-warning/10" loading={isLoading} />
        <StatCard title="Collection Rate" value={`${stats?.collectionRate || 0}%`} icon={TrendingUp} color="text-info" bg="bg-info/10" loading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-7 mb-6">
        <Card className="lg:col-span-4 glass-card-hover">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Recent Payments</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="divide-y divide-border/50">
                {(stats?.recentPayments || []).slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10"><CreditCard className="h-4 w-4 text-success" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.student_name}</p>
                      <p className="text-xs text-muted-foreground">{p.payment_method} · {p.reference_number || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatKES(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(p.received_at), "MMM d")}</p>
                    </div>
                  </div>
                ))}
                {(stats?.recentPayments || []).length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">No recent payments</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 grid gap-4">
          <Card className="glass-card-hover">
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Parents</p>
                  {isLoading ? <Skeleton className="h-7 w-12 mx-auto mt-1" /> : <p className="text-xl font-bold text-foreground mt-1">{stats?.totalParents || 0}</p>}
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Staff</p>
                  {isLoading ? <Skeleton className="h-7 w-12 mx-auto mt-1" /> : <p className="text-xl font-bold text-foreground mt-1">{stats?.totalStaff || 0}</p>}
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  {isLoading ? <Skeleton className="h-7 w-16 mx-auto mt-1" /> : <p className="text-xl font-bold text-destructive mt-1">{formatKES(stats?.totalExpenses || 0)}</p>}
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Net Income</p>
                  {isLoading ? <Skeleton className="h-7 w-16 mx-auto mt-1" /> : <p className={`text-xl font-bold mt-1 ${netIncome >= 0 ? "text-success" : "text-destructive"}`}>{formatKES(netIncome)}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card-hover">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-2">Active Students</p>
              {isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold text-foreground">{stats?.activeStudents || 0} <span className="text-sm font-normal text-muted-foreground">/ {stats?.totalStudents || 0}</span></p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

// ============== ACCOUNTANT ==============
const AccountantDashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const netIncome = (stats?.totalRevenue || 0) - (stats?.totalExpenses || 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard title="Total Collected" value={formatKES(stats?.totalRevenue || 0)} icon={Banknote} color="text-success" bg="bg-success/10" loading={isLoading} />
      <StatCard title="Outstanding" value={formatKES(stats?.totalOutstanding || 0)} icon={AlertTriangle} color="text-warning" bg="bg-warning/10" loading={isLoading} />
      <StatCard title="Total Expenses" value={formatKES(stats?.totalExpenses || 0)} icon={Receipt} color="text-destructive" bg="bg-destructive/10" loading={isLoading} />
      <StatCard title="Net Income" value={formatKES(netIncome)} icon={TrendingUp} color="text-primary" bg="bg-primary/10" loading={isLoading} />
    </div>
  );
};

// ============== TEACHER ==============
const TeacherDashboard = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
    <StatCard title="My Classes" value="—" icon={BookOpen} color="text-primary" bg="bg-primary/10" />
    <StatCard title="My Students" value="—" icon={Users} color="text-info" bg="bg-info/10" />
    <StatCard title="Today's Attendance" value="—" icon={CalendarCheck} color="text-success" bg="bg-success/10" />
    <StatCard title="Pending Marks" value="—" icon={AlertTriangle} color="text-warning" bg="bg-warning/10" />
  </div>
);

// ============== PARENT / STUDENT ==============
const PortalDashboard = ({ primaryRole }: { primaryRole: string }) => (
  <div className="text-center py-16">
    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 mx-auto mb-6">
      <GraduationCap className="h-10 w-10 text-primary" />
    </div>
    <h2 className="text-2xl font-extrabold text-foreground mb-2">Welcome back!</h2>
    <p className="text-muted-foreground max-w-md mx-auto">
      Use the sidebar to navigate to your {primaryRole === "parent" ? "Parent Portal" : "Student Panel"} for detailed information.
    </p>
  </div>
);

// ============== MAIN ==============
const Dashboard = () => {
  const { primaryRole, hasAnyRole, getRoleLabel } = useAuth();
  const roleLabel = primaryRole ? getRoleLabel(primaryRole) : "User";

  const isAdmin = hasAnyRole(["super_admin", "school_admin", "deputy_admin"]);
  const isFinance = hasAnyRole(["finance_officer"]);
  const isTeacher = hasAnyRole(["teacher"]);

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome to your ${roleLabel} dashboard`}>
      {isAdmin && <AdminDashboard />}
      {!isAdmin && isFinance && <AccountantDashboard />}
      {!isAdmin && !isFinance && isTeacher && <TeacherDashboard />}
      {primaryRole === "parent" || primaryRole === "student" ? <PortalDashboard primaryRole={primaryRole || ""} /> : null}
      {!isAdmin && !isFinance && !isTeacher && primaryRole !== "parent" && primaryRole !== "student" && <AdminDashboard />}
    </DashboardLayout>
  );
};

export default Dashboard;
