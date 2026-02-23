import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboardStats, recentPayments } from "@/data/mockData";
import {
  Users,
  Banknote,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  GraduationCap,
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
} from "recharts";

const CHART_COLORS = [
  "hsl(217, 71%, 45%)",
  "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(199, 89%, 48%)",
];

const formatKES = (amount: number) =>
  `KES ${amount.toLocaleString()}`;

const statCards = [
  {
    title: "Total Students",
    value: dashboardStats.totalStudents,
    change: "+12",
    trend: "up" as const,
    icon: GraduationCap,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Collections (Term)",
    value: formatKES(dashboardStats.totalCollected),
    change: "+8.2%",
    trend: "up" as const,
    icon: Banknote,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    title: "Outstanding Fees",
    value: formatKES(dashboardStats.totalOutstanding),
    change: "-3.1%",
    trend: "down" as const,
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    title: "Collection Rate",
    value: `${dashboardStats.collectionRate}%`,
    change: "+2.4%",
    trend: "up" as const,
    icon: TrendingUp,
    color: "text-info",
    bg: "bg-info/10",
  },
];

const Dashboard = () => {
  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome back, Jane. Here's your school overview.">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-success" />
                    )}
                    <span className="text-xs text-success font-medium">{stat.change}</span>
                    <span className="text-xs text-muted-foreground">vs last term</span>
                  </div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Collections Chart */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats.monthlyCollections}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatKES(value), "Collected"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(214, 20%, 90%)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(217, 71%, 45%)" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Pie */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardStats.paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="amount"
                    nameKey="method"
                  >
                    {dashboardStats.paymentMethods.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatKES(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {dashboardStats.paymentMethods.map((pm, i) => (
                <div key={pm.method} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                  <span className="text-xs text-muted-foreground">{pm.method}</span>
                  <span className="text-xs font-medium ml-auto">{pm.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7 mt-6">
        {/* Recent Payments */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentPayments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                    <CreditCard className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.student_name}</p>
                    <p className="text-xs text-muted-foreground">{p.method} · {p.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatKES(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">{p.date.split(" ")[1]}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {dashboardStats.recentActivity.map((a, i) => (
                <div key={i} className="flex gap-3 px-6 py-3.5">
                  <div className="mt-0.5">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        a.type === "payment"
                          ? "bg-success"
                          : a.type === "alert"
                            ? "bg-warning"
                            : "bg-primary"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
