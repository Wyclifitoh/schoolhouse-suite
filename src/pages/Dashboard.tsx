import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { dashboardStats, recentPayments, expenseCategories, attendanceRecords, students } from "@/data/mockData";
import {
  Users, Banknote, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight,
  CreditCard, GraduationCap, BookOpen, Package, CalendarCheck, Receipt,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";

const CHART_COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(199, 89%, 48%)", "hsl(262, 83%, 58%)", "hsl(0, 84%, 60%)"];
const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

const attendanceTrend = [
  { week: "W1", rate: 96.1 }, { week: "W2", rate: 94.8 }, { week: "W3", rate: 95.2 },
  { week: "W4", rate: 93.5 }, { week: "W5", rate: 94.2 }, { week: "W6", rate: 95.8 },
  { week: "W7", rate: 92.1 }, { week: "W8", rate: 94.9 },
];

const genderDist = [{ name: "Male", value: 178 }, { name: "Female", value: 164 }];

const StatCard = ({ title, value, change, trend, icon: Icon, color, bg }: any) => (
  <Card className="stat-card">
    <CardContent className="p-5 relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-extrabold mt-1.5 text-foreground tracking-tight">{value}</p>
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
const AdminDashboard = () => (
  <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard title="Total Students" value={dashboardStats.totalStudents} change="+12" trend="up" icon={GraduationCap} color="text-primary" bg="bg-primary/10" />
      <StatCard title="Collections (Term)" value={formatKES(dashboardStats.totalCollected)} change="+8.2%" trend="up" icon={Banknote} color="text-success" bg="bg-success/10" />
      <StatCard title="Outstanding Fees" value={formatKES(dashboardStats.totalOutstanding)} change="-3.1%" trend="down" icon={AlertTriangle} color="text-warning" bg="bg-warning/10" />
      <StatCard title="Collection Rate" value={`${dashboardStats.collectionRate}%`} change="+2.4%" trend="up" icon={TrendingUp} color="text-info" bg="bg-info/10" />
    </div>

    <div className="grid gap-6 lg:grid-cols-7 mb-6">
      <ChartCard title="Monthly Collections" className="lg:col-span-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardStats.monthlyCollections}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => [formatKES(v), "Collected"]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(214,32%,91%)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", fontFamily: "Plus Jakarta Sans" }} />
              <Bar dataKey="amount" fill="hsl(221, 83%, 53%)" radius={[6,6,0,0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Expense Breakdown" className="lg:col-span-3">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={dashboardStats.expenseBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="amount" nameKey="category">
              {dashboardStats.expenseBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie><Tooltip formatter={(v: number) => formatKES(v)} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {dashboardStats.expenseBreakdown.map((e, i) => (
            <div key={e.category} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
              <span className="text-xs text-muted-foreground truncate">{e.category}</span>
              <span className="text-xs font-semibold ml-auto">{formatKES(e.amount)}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>

    <div className="grid gap-6 lg:grid-cols-7 mb-6">
      <ChartCard title="Attendance Trend" className="lg:col-span-4">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis domain={[88, 100]} axisLine={false} tickLine={false} className="text-xs" tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Attendance"]} />
              <Area type="monotone" dataKey="rate" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.08} strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Student Demographics" className="lg:col-span-3">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={genderDist} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
              <Cell fill="hsl(221, 83%, 53%)" /><Cell fill="hsl(262, 83%, 58%)" />
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(221,83%,53%)" }} /><span className="text-xs text-muted-foreground">Male (178)</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(262,83%,58%)" }} /><span className="text-xs text-muted-foreground">Female (164)</span></div>
        </div>
      </ChartCard>
    </div>

    <div className="grid gap-6 lg:grid-cols-7">
      <Card className="lg:col-span-4 glass-card-hover">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Recent Payments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {recentPayments.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10"><CreditCard className="h-4 w-4 text-success" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{p.student_name}</p><p className="text-xs text-muted-foreground">{p.method} · {p.reference}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-foreground">{formatKES(p.amount)}</p><p className="text-xs text-muted-foreground">{p.date.split(" ")[1]}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3 glass-card-hover">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Recent Activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {dashboardStats.recentActivity.map((a, i) => (
              <div key={i} className="flex gap-3 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="mt-1"><div className={`h-2.5 w-2.5 rounded-full ${a.type === "payment" ? "bg-success" : a.type === "alert" ? "bg-warning" : "bg-primary"}`} /></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-foreground leading-snug">{a.message}</p><p className="text-xs text-muted-foreground mt-0.5">{a.time}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

// ============== ACCOUNTANT ==============
const AccountantDashboard = () => (
  <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard title="Total Collected" value={formatKES(dashboardStats.totalCollected)} icon={Banknote} color="text-success" bg="bg-success/10" />
      <StatCard title="Outstanding" value={formatKES(dashboardStats.totalOutstanding)} icon={AlertTriangle} color="text-warning" bg="bg-warning/10" />
      <StatCard title="Total Expenses" value={formatKES(dashboardStats.totalExpenses)} icon={Receipt} color="text-destructive" bg="bg-destructive/10" />
      <StatCard title="Net Income" value={formatKES(dashboardStats.netIncome)} icon={TrendingUp} color="text-primary" bg="bg-primary/10" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Collections vs Expenses">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { month: "Sep", collected: 1200000, expenses: 42000 }, { month: "Oct", collected: 850000, expenses: 38000 },
              { month: "Nov", collected: 620000, expenses: 55000 }, { month: "Dec", collected: 180000, expenses: 28000 },
              { month: "Jan", collected: 980000, expenses: 62000 }, { month: "Feb", collected: 420000, expenses: 48000 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => formatKES(v)} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(214,32%,91%)" }} />
              <Bar dataKey="collected" fill="hsl(142, 71%, 45%)" radius={[6,6,0,0]} barSize={20} name="Collected" />
              <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[6,6,0,0]} barSize={20} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <ChartCard title="Budget Utilization">
        <div className="space-y-4">
          {expenseCategories.map(c => (
            <div key={c.id}>
              <div className="flex justify-between text-xs mb-1.5"><span className="text-muted-foreground font-medium">{c.name}</span><span className="font-bold text-foreground">{Math.round(c.spent/c.budget*100)}%</span></div>
              <div className="h-2.5 rounded-full bg-muted"><div className="h-2.5 rounded-full bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] transition-all" style={{ width: `${Math.min(c.spent/c.budget*100,100)}%` }} /></div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  </>
);

// ============== TEACHER ==============
const TeacherDashboard = () => (
  <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard title="My Classes" value="3" icon={BookOpen} color="text-primary" bg="bg-primary/10" />
      <StatCard title="My Students" value="127" icon={Users} color="text-info" bg="bg-info/10" />
      <StatCard title="Today's Attendance" value="94%" icon={CalendarCheck} color="text-success" bg="bg-success/10" />
      <StatCard title="Pending Marks" value="2" icon={AlertTriangle} color="text-warning" bg="bg-warning/10" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="My Class Attendance">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis domain={[88,100]} axisLine={false} tickLine={false} className="text-xs" />
              <Tooltip formatter={(v: number) => [`${v}%`, "Rate"]} />
              <Line type="monotone" dataKey="rate" stroke="hsl(221, 83%, 53%)" strokeWidth={2.5} dot={{ fill: "hsl(221, 83%, 53%)", r: 4, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <Card className="glass-card-hover">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Today's Schedule</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {[
              { time: "08:00-08:40", sub: "Mathematics", cls: "Grade 8 East", room: "Room 1" },
              { time: "09:20-10:00", sub: "Mathematics", cls: "Grade 7 West", room: "Room 3" },
              { time: "11:00-11:40", sub: "Mathematics", cls: "Grade 6 North", room: "Room 5" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><BookOpen className="h-4 w-4 text-primary" /></div>
                <div className="flex-1"><p className="text-sm font-semibold text-foreground">{s.sub} — {s.cls}</p><p className="text-xs text-muted-foreground">{s.time} · {s.room}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

// ============== LIBRARIAN ==============
const LibrarianDashboard = () => (
  <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard title="Total Books" value="2,450" icon={BookOpen} color="text-primary" bg="bg-primary/10" />
      <StatCard title="Issued" value="186" icon={Package} color="text-info" bg="bg-info/10" />
      <StatCard title="Overdue" value="12" icon={AlertTriangle} color="text-warning" bg="bg-warning/10" />
      <StatCard title="New Arrivals" value="34" icon={TrendingUp} color="text-success" bg="bg-success/10" />
    </div>
    <Card className="glass-card-hover">
      <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Recent Activity</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {[
            { action: "Issued", book: "Mathematics Textbook", student: "Amina Wanjiku", date: "Mar 15", status: "active" },
            { action: "Returned", book: "English Literature", student: "Brian Ochieng", date: "Mar 14", status: "returned" },
            { action: "Overdue", book: "Science Encyclopedia", student: "Hassan Mohamed", date: "Mar 10", status: "overdue" },
            { action: "Issued", book: "History of Kenya", student: "Grace Njeri", date: "Mar 13", status: "active" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${b.status === "overdue" ? "bg-warning/10" : b.status === "returned" ? "bg-success/10" : "bg-primary/10"}`}>
                <BookOpen className={`h-4 w-4 ${b.status === "overdue" ? "text-warning" : b.status === "returned" ? "text-success" : "text-primary"}`} />
              </div>
              <div className="flex-1"><p className="text-sm font-semibold text-foreground">{b.book}</p><p className="text-xs text-muted-foreground">{b.student} · {b.action} on {b.date}</p></div>
              <Badge className={
                b.status === "overdue" ? "bg-warning/10 text-warning border-0 rounded-lg" :
                b.status === "returned" ? "bg-success/10 text-success border-0 rounded-lg" :
                "bg-primary/10 text-primary border-0 rounded-lg"
              }>{b.action}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </>
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
