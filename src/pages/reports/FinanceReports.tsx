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
const students: any[] = []; const recentPayments: any[] = []; const expenses: any[] = [];
const feeAllotments: any[] = []; const dashboardStats = { totalRevenue: 0, totalExpenses: 0, netIncome: 0, collectionRate: 0, totalStudents: 0, outstandingFees: 0, totalCollected: 0 };
const expenseCategories: any[] = []; const studentFeeCollection: any[] = [];
import { Download, Banknote, TrendingDown, TrendingUp, Smartphone, DollarSign, FileText, Receipt } from "lucide-react";

const formatKES = (a: number) => `KES ${Math.abs(a).toLocaleString()}`;

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

const dailyCollections = [
  { date: "2024-03-15", cash: 45000, mpesa: 37000, bank: 20000, cheque: 0, total: 102000, transactions: 8 },
  { date: "2024-03-14", cash: 32000, mpesa: 22000, bank: 15000, cheque: 10000, total: 79000, transactions: 6 },
  { date: "2024-03-13", cash: 55000, mpesa: 40000, bank: 0, cheque: 0, total: 95000, transactions: 7 },
  { date: "2024-03-12", cash: 28000, mpesa: 32000, bank: 25000, cheque: 0, total: 85000, transactions: 5 },
  { date: "2024-03-11", cash: 60000, mpesa: 45000, bank: 18000, cheque: 15000, total: 138000, transactions: 10 },
];

const payrollSummary = [
  { month: "March 2024", staff: 10, basic: 580000, allowances: 108000, deductions: 79200, net: 608800, status: "paid" },
  { month: "February 2024", staff: 10, basic: 580000, allowances: 108000, deductions: 79200, net: 608800, status: "paid" },
  { month: "January 2024", staff: 10, basic: 575000, allowances: 105000, deductions: 78000, net: 602000, status: "paid" },
];

const onlineFees = [
  { id: "of1", date: "2024-03-15", student: "Amina Wanjiku", class: "Grade 8 East", method: "M-Pesa", ref: "SHQ2K4LM9X", amount: 15000, status: "confirmed" },
  { id: "of2", date: "2024-03-14", student: "Hassan Mohamed", class: "Grade 7 West", method: "M-Pesa", ref: "SHQ2K4LP3Y", amount: 10000, status: "confirmed" },
  { id: "of3", date: "2024-03-13", student: "David Kipchoge", class: "Grade 6 North", method: "Bank Transfer", ref: "BNK-2024-045", amount: 25000, status: "pending" },
  { id: "of4", date: "2024-03-12", student: "Kevin Otieno", class: "Grade 8 West", method: "M-Pesa", ref: "SHQ2K4LR2A", amount: 12000, status: "confirmed" },
];

const FinanceReports = () => (
  <DashboardLayout title="Finance Reports" subtitle="Comprehensive finance, fees & payment reports">
    <Tabs defaultValue="balance" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
        <TabsTrigger value="balance">Balance Fees</TabsTrigger>
        <TabsTrigger value="balance-remark">Balance w/ Remark</TabsTrigger>
        <TabsTrigger value="fees-statement">Fees Statement</TabsTrigger>
        <TabsTrigger value="daily-collection">Daily Collection</TabsTrigger>
        <TabsTrigger value="collection">Fees Collection</TabsTrigger>
        <TabsTrigger value="online-collection">Online Collection</TabsTrigger>
        <TabsTrigger value="income">Income Report</TabsTrigger>
        <TabsTrigger value="income-group">Income Group</TabsTrigger>
        <TabsTrigger value="expense">Expense Report</TabsTrigger>
        <TabsTrigger value="expense-group">Expense Group</TabsTrigger>
        <TabsTrigger value="payroll">Payroll Report</TabsTrigger>
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

      {/* BALANCE FEES WITH REMARK */}
      <TabsContent value="balance-remark" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Balance Fees Report With Remark</CardTitle>
              <div className="flex items-center gap-2">
                <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold">Total Fee</TableHead><TableHead className="font-semibold">Discount</TableHead><TableHead className="font-semibold">Paid</TableHead>
              <TableHead className="font-semibold">Balance</TableHead><TableHead className="font-semibold">Remark</TableHead>
            </TableRow></TableHeader>
            <TableBody>{studentFeeCollection.filter(s => s.balance > 0).map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.student_name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                <TableCell>{s.class}</TableCell>
                <TableCell>{formatKES(s.total_fee)}</TableCell>
                <TableCell>{s.discount > 0 ? formatKES(s.discount) : "—"}</TableCell>
                <TableCell className="text-success">{formatKES(s.paid)}</TableCell>
                <TableCell className="text-destructive font-semibold">{formatKES(s.balance)}</TableCell>
                <TableCell>
                  <Badge className={s.status === "overdue" ? "bg-destructive/10 text-destructive border-0" : "bg-warning/10 text-warning border-0"}>
                    {s.status === "overdue" ? "Overdue - Send Reminder" : "Partial - Follow Up"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* FEES STATEMENT */}
      <TabsContent value="fees-statement" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Fees Statement</CardTitle>
              <div className="flex items-center gap-2">
                <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold">Total Fee</TableHead><TableHead className="font-semibold">Discount</TableHead><TableHead className="font-semibold">Fine</TableHead>
              <TableHead className="font-semibold">Paid</TableHead><TableHead className="font-semibold">Balance</TableHead><TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{studentFeeCollection.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.student_name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                <TableCell>{s.class}</TableCell>
                <TableCell>{formatKES(s.total_fee)}</TableCell>
                <TableCell>{s.discount > 0 ? formatKES(s.discount) : "—"}</TableCell>
                <TableCell className="text-destructive">{s.fine > 0 ? formatKES(s.fine) : "—"}</TableCell>
                <TableCell className="text-success font-semibold">{formatKES(s.paid)}</TableCell>
                <TableCell className={s.balance > 0 ? "text-destructive font-semibold" : s.balance < 0 ? "text-primary font-semibold" : "text-success font-semibold"}>
                  {s.balance < 0 ? `(${formatKES(Math.abs(s.balance))})` : formatKES(s.balance)}
                </TableCell>
                <TableCell><Badge className={
                  s.status === "paid" ? "bg-success/10 text-success border-0" :
                  s.status === "advance" ? "bg-primary/10 text-primary border-0" :
                  s.status === "overdue" ? "bg-destructive/10 text-destructive border-0" :
                  "bg-warning/10 text-warning border-0"
                }>{s.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* DAILY COLLECTION */}
      <TabsContent value="daily-collection" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" />Daily Collection Report</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" className="h-9 w-36" defaultValue="2024-03-11" />
                <span className="text-sm text-muted-foreground">to</span>
                <Input type="date" className="h-9 w-36" defaultValue="2024-03-15" />
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Total Collected</p><p className="text-xl font-bold text-success">{formatKES(dailyCollections.reduce((s, d) => s + d.total, 0))}</p></div>
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Transactions</p><p className="text-xl font-bold text-primary">{dailyCollections.reduce((s, d) => s + d.transactions, 0)}</p></div>
              <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Avg/Day</p><p className="text-xl font-bold text-info">{formatKES(Math.round(dailyCollections.reduce((s, d) => s + d.total, 0) / dailyCollections.length))}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Days</p><p className="text-xl font-bold">{dailyCollections.length}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold text-right">Cash</TableHead><TableHead className="font-semibold text-right">M-Pesa</TableHead>
              <TableHead className="font-semibold text-right">Bank</TableHead><TableHead className="font-semibold text-right">Cheque</TableHead>
              <TableHead className="font-semibold text-right">Total</TableHead><TableHead className="font-semibold text-center">Txns</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {dailyCollections.map(d => (
                <TableRow key={d.date}>
                  <TableCell className="font-medium">{d.date}</TableCell>
                  <TableCell className="text-right">{formatKES(d.cash)}</TableCell>
                  <TableCell className="text-right">{formatKES(d.mpesa)}</TableCell>
                  <TableCell className="text-right">{formatKES(d.bank)}</TableCell>
                  <TableCell className="text-right">{d.cheque > 0 ? formatKES(d.cheque) : "—"}</TableCell>
                  <TableCell className="text-right font-bold text-success">{formatKES(d.total)}</TableCell>
                  <TableCell className="text-center">{d.transactions}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{formatKES(dailyCollections.reduce((s, d) => s + d.cash, 0))}</TableCell>
                <TableCell className="text-right">{formatKES(dailyCollections.reduce((s, d) => s + d.mpesa, 0))}</TableCell>
                <TableCell className="text-right">{formatKES(dailyCollections.reduce((s, d) => s + d.bank, 0))}</TableCell>
                <TableCell className="text-right">{formatKES(dailyCollections.reduce((s, d) => s + d.cheque, 0))}</TableCell>
                <TableCell className="text-right text-success">{formatKES(dailyCollections.reduce((s, d) => s + d.total, 0))}</TableCell>
                <TableCell className="text-center">{dailyCollections.reduce((s, d) => s + d.transactions, 0)}</TableCell>
              </TableRow>
            </TableBody></Table>
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

      {/* ONLINE FEES COLLECTION */}
      <TabsContent value="online-collection" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4 text-primary" />Online Fees Collection Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Total Online</p><p className="text-xl font-bold text-success">{formatKES(onlineFees.reduce((s, f) => s + f.amount, 0))}</p></div>
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Confirmed</p><p className="text-xl font-bold text-primary">{onlineFees.filter(f => f.status === "confirmed").length}</p></div>
              <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold text-warning">{onlineFees.filter(f => f.status === "pending").length}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold">Method</TableHead><TableHead className="font-semibold">Reference</TableHead><TableHead className="font-semibold">Amount</TableHead><TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{onlineFees.map(f => (
              <TableRow key={f.id}>
                <TableCell className="text-muted-foreground">{f.date}</TableCell>
                <TableCell className="font-medium">{f.student}</TableCell>
                <TableCell>{f.class}</TableCell>
                <TableCell>{f.method}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{f.ref}</TableCell>
                <TableCell className="font-semibold text-success">{formatKES(f.amount)}</TableCell>
                <TableCell><Badge className={f.status === "confirmed" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>{f.status}</Badge></TableCell>
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

      {/* INCOME GROUP REPORT */}
      <TabsContent value="income-group" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Income Group Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Group</TableHead><TableHead className="font-semibold">Categories</TableHead>
              <TableHead className="font-semibold text-right">Budget</TableHead><TableHead className="font-semibold text-right">Collected</TableHead><TableHead className="font-semibold text-right">Variance</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {[
                { group: "Tuition & Academic", categories: "Tuition, Exam, Lab, Library", budget: 3530000, collected: 3410000 },
                { group: "Co-Curricular", categories: "Activity Fee, Sports", budget: 250000, collected: 250000 },
                { group: "Transport", categories: "Transport Fee", budget: 400000, collected: 380000 },
                { group: "Boarding & Meals", categories: "Boarding, Lunch Program", budget: 500000, collected: 420000 },
              ].map(g => (
                <TableRow key={g.group}>
                  <TableCell className="font-medium">{g.group}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{g.categories}</TableCell>
                  <TableCell className="text-right">{formatKES(g.budget)}</TableCell>
                  <TableCell className="text-right text-success font-semibold">{formatKES(g.collected)}</TableCell>
                  <TableCell className={`text-right font-semibold ${g.collected >= g.budget ? "text-success" : "text-destructive"}`}>{formatKES(g.collected - g.budget)}</TableCell>
                </TableRow>
              ))}
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
              <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Title</TableHead><TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Amount</TableHead><TableHead className="font-semibold">Method</TableHead><TableHead className="font-semibold">Status</TableHead>
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

      {/* EXPENSE GROUP REPORT */}
      <TabsContent value="expense-group" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Expense Group Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Category</TableHead><TableHead className="font-semibold text-right">Budget</TableHead>
              <TableHead className="font-semibold text-right">Spent</TableHead><TableHead className="font-semibold text-right">Remaining</TableHead><TableHead className="font-semibold text-right">Utilization</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {expenseCategories.map(c => {
                const spent = expenses.filter(e => e.category === c.name).reduce((s, e) => s + e.amount, 0);
                const pct = c.budget > 0 ? Math.round((spent / c.budget) * 100) : 0;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">{formatKES(c.budget)}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">{formatKES(spent)}</TableCell>
                    <TableCell className="text-right text-success">{formatKES(c.budget - spent)}</TableCell>
                    <TableCell className="text-right"><Badge className={pct >= 90 ? "bg-destructive/10 text-destructive border-0" : pct >= 70 ? "bg-warning/10 text-warning border-0" : "bg-success/10 text-success border-0"}>{pct}%</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* PAYROLL REPORT */}
      <TabsContent value="payroll" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Payroll Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Basic</p><p className="text-xl font-bold text-primary">{formatKES(payrollSummary[0].basic)}</p></div>
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Allowances</p><p className="text-xl font-bold text-success">{formatKES(payrollSummary[0].allowances)}</p></div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Deductions</p><p className="text-xl font-bold text-destructive">{formatKES(payrollSummary[0].deductions)}</p></div>
              <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Net Pay</p><p className="text-xl font-bold text-info">{formatKES(payrollSummary[0].net)}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Month</TableHead><TableHead className="font-semibold text-center">Staff</TableHead>
              <TableHead className="font-semibold text-right">Basic</TableHead><TableHead className="font-semibold text-right">Allowances</TableHead>
              <TableHead className="font-semibold text-right">Deductions</TableHead><TableHead className="font-semibold text-right">Net Pay</TableHead><TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{payrollSummary.map(p => (
              <TableRow key={p.month}>
                <TableCell className="font-medium">{p.month}</TableCell>
                <TableCell className="text-center">{p.staff}</TableCell>
                <TableCell className="text-right">{formatKES(p.basic)}</TableCell>
                <TableCell className="text-right text-success">{formatKES(p.allowances)}</TableCell>
                <TableCell className="text-right text-destructive">{formatKES(p.deductions)}</TableCell>
                <TableCell className="text-right font-bold">{formatKES(p.net)}</TableCell>
                <TableCell><Badge className="bg-success/10 text-success border-0">{p.status}</Badge></TableCell>
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
              <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Receipt</TableHead><TableHead className="font-semibold">Amount</TableHead><TableHead className="font-semibold">Status</TableHead>
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
