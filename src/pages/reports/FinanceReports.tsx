import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { students, recentPayments, expenses, feeAllotments, dashboardStats, expenseCategories } from "@/data/mockData";
import { Download, Banknote, TrendingDown, TrendingUp, Smartphone } from "lucide-react";

const formatKES = (a: number) => `KES ${Math.abs(a).toLocaleString()}`;

// Derive income data from payments
const incomeByCategory = [
  { category: "Tuition Fee", amount: 2800000, percentage: 65.9 },
  { category: "Exam Fee", amount: 490000, percentage: 11.5 },
  { category: "Transport Fee", amount: 380000, percentage: 8.9 },
  { category: "Activity Fee", amount: 250000, percentage: 5.9 },
  { category: "Lunch Program", amount: 210000, percentage: 4.9 },
  { category: "Library Fee", amount: 120000, percentage: 2.8 },
];

const mpesaPayments = [
  { id: "mp1", date: "2024-03-15 14:23", student: "Amina Wanjiku", phone: "0712***678", receipt: "SHQ2K4LM9X", amount: 15000, status: "completed" },
  { id: "mp2", date: "2024-03-14 16:45", student: "Hassan Mohamed", phone: "0789***345", receipt: "SHQ2K4LP3Y", amount: 10000, status: "completed" },
  { id: "mp3", date: "2024-03-13 11:12", student: "Francis Mutua", phone: "0767***123", receipt: "SHQ2K4LQ7Z", amount: 20000, status: "processing" },
  { id: "mp4", date: "2024-03-12 09:30", student: "Kevin Otieno", phone: "0790***456", receipt: "SHQ2K4LR2A", amount: 12000, status: "completed" },
  { id: "mp5", date: "2024-03-11 14:00", student: "Joy Wanjiku", phone: "0712***678", receipt: "SHQ2K4LS5B", amount: 8000, status: "completed" },
  { id: "mp6", date: "2024-03-10 10:15", student: "David Kipchoge", phone: "0745***901", receipt: "SHQ2K4LT8C", amount: 25000, status: "completed" },
];

const FinanceReports = () => (
  <DashboardLayout title="Finance Reports" subtitle="Balance fees, collections, income & expense reports">
    <Tabs defaultValue="balance" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
        <TabsTrigger value="balance">Balance Fees</TabsTrigger>
        <TabsTrigger value="collection">Fees Collection</TabsTrigger>
        <TabsTrigger value="income">Income Report</TabsTrigger>
        <TabsTrigger value="expense">Expense Report</TabsTrigger>
        <TabsTrigger value="mpesa">M-Pesa Payments</TabsTrigger>
      </TabsList>

      {/* BALANCE FEES */}
      <TabsContent value="balance" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Balance Fees Report</CardTitle>
              <div className="flex items-center gap-2">
                <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Class-Section</TableHead><TableHead className="font-semibold">Students</TableHead><TableHead className="font-semibold">Total Fees</TableHead>
              <TableHead className="font-semibold">Paid</TableHead><TableHead className="font-semibold">Balance</TableHead>
            </TableRow></TableHeader>
            <TableBody>{feeAllotments.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.class} {a.section}</TableCell>
                <TableCell>{a.students}</TableCell>
                <TableCell className="font-semibold">{formatKES(a.total_amount)}</TableCell>
                <TableCell className="font-semibold text-success">{formatKES(a.collected)}</TableCell>
                <TableCell className="font-semibold text-destructive">{formatKES(a.total_amount - a.collected)}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* FEES COLLECTION */}
      <TabsContent value="collection" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Fees Collection Report</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" className="h-9 w-36" defaultValue="2024-03-01" />
                <span className="text-sm text-muted-foreground">to</span>
                <Input type="date" className="h-9 w-36" defaultValue="2024-03-15" />
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Total Collections</p>
                <p className="text-xl font-bold text-success">{formatKES(recentPayments.reduce((s, p) => s + p.amount, 0))}</p></div>
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold text-primary">{recentPayments.length}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Avg Payment</p>
                <p className="text-xl font-bold">{formatKES(Math.round(recentPayments.reduce((s, p) => s + p.amount, 0) / recentPayments.length))}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Amount</TableHead><TableHead className="font-semibold">Method</TableHead><TableHead className="font-semibold">Reference</TableHead>
            </TableRow></TableHeader>
            <TableBody>{recentPayments.map(p => (
              <TableRow key={p.id}>
                <TableCell className="text-muted-foreground">{p.date}</TableCell>
                <TableCell className="font-medium">{p.student_name}</TableCell>
                <TableCell className="font-semibold text-success">{formatKES(p.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{p.method}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.reference}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* INCOME REPORT */}
      <TabsContent value="income" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Income Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Total Income</p><p className="text-xl font-bold text-success">{formatKES(dashboardStats.totalCollected)}</p></div>
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Fee Collections</p><p className="text-xl font-bold text-primary">{formatKES(dashboardStats.totalCollected)}</p></div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Total Expenses</p><p className="text-xl font-bold text-destructive">{formatKES(dashboardStats.totalExpenses)}</p></div>
              <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Net Income</p><p className="text-xl font-bold text-info">{formatKES(dashboardStats.netIncome)}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Income Category</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold text-right">% of Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {incomeByCategory.map(ic => (
                <TableRow key={ic.category}>
                  <TableCell className="font-medium">{ic.category}</TableCell>
                  <TableCell className="text-right font-semibold text-success">{formatKES(ic.amount)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{ic.percentage}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right text-success">{formatKES(incomeByCategory.reduce((s, i) => s + i.amount, 0))}</TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* EXPENSE REPORT */}
      <TabsContent value="expense" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Expense Report</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" className="h-9 w-36" defaultValue="2024-03-01" />
                <span className="text-sm text-muted-foreground">to</span>
                <Input type="date" className="h-9 w-36" defaultValue="2024-03-31" />
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Total Expenses</p><p className="text-xl font-bold text-destructive">{formatKES(expenses.reduce((s, e) => s + e.amount, 0))}</p></div>
              <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold text-warning">{formatKES(expenses.filter(e => e.status !== "paid").reduce((s, e) => s + e.amount, 0))}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Categories</p><p className="text-xl font-bold">{expenseCategories.length}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Method</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{expenses.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-muted-foreground">{e.date}</TableCell>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                <TableCell className="font-semibold text-destructive">{formatKES(e.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{e.payment_method}</TableCell>
                <TableCell><Badge className={e.status === "paid" ? "bg-success/10 text-success border-0" : e.status === "approved" ? "bg-info/10 text-info border-0" : "bg-warning/10 text-warning border-0"}>{e.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* MPESA PAYMENTS */}
      <TabsContent value="mpesa" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4 text-success" />M-Pesa Payments Report</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" className="h-9 w-36" defaultValue="2024-03-01" />
                <span className="text-sm text-muted-foreground">to</span>
                <Input type="date" className="h-9 w-36" defaultValue="2024-03-15" />
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Total M-Pesa</p><p className="text-xl font-bold text-success">{formatKES(mpesaPayments.reduce((s, p) => s + p.amount, 0))}</p></div>
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Transactions</p><p className="text-xl font-bold text-primary">{mpesaPayments.length}</p></div>
              <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Processing</p><p className="text-xl font-bold text-warning">{mpesaPayments.filter(p => p.status === "processing").length}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Receipt</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{mpesaPayments.map(p => (
              <TableRow key={p.id}>
                <TableCell className="text-muted-foreground">{p.date}</TableCell>
                <TableCell className="font-medium">{p.student}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{p.phone}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.receipt}</TableCell>
                <TableCell className="font-semibold text-success">{formatKES(p.amount)}</TableCell>
                <TableCell><Badge className={p.status === "completed" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>{p.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default FinanceReports;
