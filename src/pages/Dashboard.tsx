import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { dashboardStats, recentPayments, expenseCategories, attendanceRecords, students } from "@/data/mockData";
import {
  Users, Banknote, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight,
  CreditCard, GraduationCap, BookOpen, Package, CalendarCheck, Receipt,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";

const CHART_COLORS = ["hsl(217, 71%, 45%)", "hsl(152, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(199, 89%, 48%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)"];
const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

const attendanceTrend = [
  { week: "W1", rate: 96.1 }, { week: "W2", rate: 94.8 }, { week: "W3", rate: 95.2 },
  { week: "W4", rate: 93.5 }, { week: "W5", rate: 94.2 }, { week: "W6", rate: 95.8 },
  { week: "W7", rate: 92.1 }, { week: "W8", rate: 94.9 },
];

const genderDist = [
  { name: "Male", value: 178 }, { name: "Female", value: 164 },
];

// ============== ADMIN DASHBOARD ==============
const AdminDashboard = () => (
  <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {[
        { title: "Total Students", value: dashboardStats.totalStudents, change: "+12", trend: "up", icon: GraduationCap, color: "text-primary", bg: "bg-primary/10" },
        { title: "Collections (Term)", value: formatKES(dashboardStats.totalCollected), change: "+8.2%", trend: "up", icon: Banknote, color: "text-success", bg: "bg-success/10" },
        { title: "Outstanding Fees", value: formatKES(dashboardStats.totalOutstanding), change: "-3.1%", trend: "down", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
        { title: "Collection Rate", value: `${dashboardStats.collectionRate}%`, change: "+2.4%", trend: "up", icon: TrendingUp, color: "text-info", bg: "bg-info/10" },
      ].map(stat => (
        <Card key={stat.title}><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 mt-2">
                {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-success" />}
                <span className="text-xs text-success font-medium">{stat.change}</span>
                <span className="text-xs text-muted-foreground">vs last term</span>
              </div>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </CardContent></Card>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-7 mb-6">
      <Card className="lg:col-span-4">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Monthly Collections</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats.monthlyCollections}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => [formatKES(v), "Collected"]} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214,20%,90%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="amount" fill="hsl(217, 71%, 45%)" radius={[4,4,0,0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboardStats.expenseBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="amount" nameKey="category">
                  {dashboardStats.expenseBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatKES(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {dashboardStats.expenseBreakdown.map((e, i) => (
              <div key={e.category} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                <span className="text-xs text-muted-foreground truncate">{e.category}</span>
                <span className="text-xs font-medium ml-auto">{formatKES(e.amount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-6 lg:grid-cols-7 mb-6">
      <Card className="lg:col-span-4">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Attendance Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,20%,90%)" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis domain={[88, 100]} axisLine={false} tickLine={false} className="text-xs" tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Attendance"]} />
                <Area type="monotone" dataKey="rate" stroke="hsl(152, 60%, 40%)" fill="hsl(152, 60%, 40%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Student Demographics</CardTitle></CardHeader>
        <CardContent>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderDist} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                  <Cell fill="hsl(217, 71%, 45%)" /><Cell fill="hsl(280, 60%, 55%)" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(217,71%,45%)" }} /><span className="text-xs text-muted-foreground">Male (178)</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(280,60%,55%)" }} /><span className="text-xs text-muted-foreground">Female (164)</span></div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-6 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Recent Payments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentPayments.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10"><CreditCard className="h-4 w-4 text-success" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{p.student_name}</p><p className="text-xs text-muted-foreground">{p.method} · {p.reference}</p></div>
                <div className="text-right"><p className="text-sm font-semibold text-foreground">{formatKES(p.amount)}</p><p className="text-xs text-muted-foreground">{p.date.split(" ")[1]}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Recent Activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {dashboardStats.recentActivity.map((a, i) => (
              <div key={i} className="flex gap-3 px-6 py-3.5">
                <div className="mt-0.5"><div className={`h-2 w-2 rounded-full ${a.type === "payment" ? "bg-success" : a.type === "alert" ? "bg-warning" : "bg-primary"}`} /></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-foreground leading-snug">{a.message}</p><p className="text-xs text-muted-foreground mt-0.5">{a.time}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

// ============== ACCOUNTANT DASHBOARD ==============
const AccountantDashboard = () => (
  <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {[
        { title: "Total Collected", value: formatKES(dashboardStats.totalCollected), icon: Banknote, color: "text-success", bg: "bg-success/10" },
        { title: "Outstanding", value: formatKES(dashboardStats.totalOutstanding), icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
        { title: "Total Expenses", value: formatKES(dashboardStats.totalExpenses), icon: Receipt, color: "text-destructive", bg: "bg-destructive/10" },
        { title: "Net Income", value: formatKES(dashboardStats.netIncome), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
      ].map(s => (
        <Card key={s.title}><CardContent className="p-5 flex items-start justify-between">
          <div><p className="text-sm text-muted-foreground">{s.title}</p><p className="text-2xl font-bold mt-1 text-foreground">{s.value}</p></div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
        </CardContent></Card>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Collections vs Expenses</CardTitle></CardHeader>
        <CardContent><div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { month: "Sep", collected: 1200000, expenses: 42000 }, { month: "Oct", collected: 850000, expenses: 38000 },
              { month: "Nov", collected: 620000, expenses: 55000 }, { month: "Dec", collected: 180000, expenses: 28000 },
              { month: "Jan", collected: 980000, expenses: 62000 }, { month: "Feb", collected: 420000, expenses: 48000 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,20%,90%)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => formatKES(v)} />
              <Bar dataKey="collected" fill="hsl(152, 60%, 40%)" radius={[4,4,0,0]} barSize={20} name="Collected" />
              <Bar dataKey="expenses" fill="hsl(0, 72%, 51%)" radius={[4,4,0,0]} barSize={20} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Budget Utilization</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenseCategories.map(c => (
              <div key={c.id}>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{c.name}</span><span className="font-medium text-foreground">{Math.round(c.spent/c.budget*100)}%</span></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.min(c.spent/c.budget*100,100)}%` }} /></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

// ============== TEACHER DASHBOARD ==============
const TeacherDashboard = () => (
  <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {[
        { title: "My Classes", value: "3", icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
        { title: "My Students", value: "127", icon: Users, color: "text-info", bg: "bg-info/10" },
        { title: "Today's Attendance", value: "94%", icon: CalendarCheck, color: "text-success", bg: "bg-success/10" },
        { title: "Pending Marks", value: "2", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
      ].map(s => (
        <Card key={s.title}><CardContent className="p-5 flex items-start justify-between">
          <div><p className="text-sm text-muted-foreground">{s.title}</p><p className="text-2xl font-bold mt-1 text-foreground">{s.value}</p></div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
        </CardContent></Card>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">My Class Attendance</CardTitle></CardHeader>
        <CardContent><div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,20%,90%)" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis domain={[88,100]} axisLine={false} tickLine={false} className="text-xs" />
              <Tooltip formatter={(v: number) => [`${v}%`, "Rate"]} />
              <Line type="monotone" dataKey="rate" stroke="hsl(217, 71%, 45%)" strokeWidth={2} dot={{ fill: "hsl(217, 71%, 45%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Today's Schedule</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {[
              { time: "08:00-08:40", sub: "Mathematics", cls: "Grade 8 East", room: "Room 1" },
              { time: "09:20-10:00", sub: "Mathematics", cls: "Grade 7 West", room: "Room 3" },
              { time: "11:00-11:40", sub: "Mathematics", cls: "Grade 6 North", room: "Room 5" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10"><BookOpen className="h-4 w-4 text-primary" /></div>
                <div className="flex-1"><p className="text-sm font-medium text-foreground">{s.sub} — {s.cls}</p><p className="text-xs text-muted-foreground">{s.time} · {s.room}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

// ============== LIBRARIAN DASHBOARD ==============
const LibrarianDashboard = () => (
  <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {[
        { title: "Total Books", value: "2,450", icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
        { title: "Issued Books", value: "186", icon: Package, color: "text-info", bg: "bg-info/10" },
        { title: "Overdue Returns", value: "12", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
        { title: "New Arrivals", value: "34", icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
      ].map(s => (
        <Card key={s.title}><CardContent className="p-5 flex items-start justify-between">
          <div><p className="text-sm text-muted-foreground">{s.title}</p><p className="text-2xl font-bold mt-1 text-foreground">{s.value}</p></div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
        </CardContent></Card>
      ))}
    </div>
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Recent Book Activity</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {[
            { action: "Issued", book: "Mathematics Textbook", student: "Amina Wanjiku", date: "Mar 15", status: "active" },
            { action: "Returned", book: "English Literature", student: "Brian Ochieng", date: "Mar 14", status: "returned" },
            { action: "Overdue", book: "Science Encyclopedia", student: "Hassan Mohamed", date: "Mar 10", status: "overdue" },
            { action: "Issued", book: "History of Kenya", student: "Grace Njeri", date: "Mar 13", status: "active" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${b.status === "overdue" ? "bg-warning/10" : b.status === "returned" ? "bg-success/10" : "bg-primary/10"}`}>
                <BookOpen className={`h-4 w-4 ${b.status === "overdue" ? "text-warning" : b.status === "returned" ? "text-success" : "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{b.book}</p><p className="text-xs text-muted-foreground">{b.student} · {b.action}</p></div>
              <Badge variant="outline" className={b.status === "overdue" ? "border-warning/30 text-warning" : b.status === "returned" ? "border-success/30 text-success" : "border-primary/30 text-primary"}>{b.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </>
);

// ============== ROLE DASHBOARD MAP ==============
const ROLE_DASHBOARDS: Record<UserRole, { component: React.FC; subtitle: string }> = {
  admin: { component: AdminDashboard, subtitle: "Welcome back, Jane. Here's your school overview." },
  accountant: { component: AccountantDashboard, subtitle: "Financial overview for current term." },
  teacher: { component: TeacherDashboard, subtitle: "Your classes and schedule at a glance." },
  librarian: { component: LibrarianDashboard, subtitle: "Library overview and activity." },
  parent: { component: AdminDashboard, subtitle: "Your children overview." },
  student: { component: AdminDashboard, subtitle: "Your academic overview." },
};

const Dashboard = () => {
  const { role, user } = useAuth();
  const config = ROLE_DASHBOARDS[role];
  const DashContent = config.component;

  return (
    <DashboardLayout title="Dashboard" subtitle={config.subtitle}>
      <DashContent />
    </DashboardLayout>
  );
};

export default Dashboard;
