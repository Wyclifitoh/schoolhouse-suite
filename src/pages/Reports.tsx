import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { students, recentPayments, expenses, feeAllotments } from "@/data/mockData";
import {
  BarChart3, Users, Banknote, FileText, Download, Calendar, ClipboardList,
} from "lucide-react";

const formatKES = (amount: number) => `KES ${Math.abs(amount).toLocaleString()}`;

const Reports = () => {
  return (
    <DashboardLayout title="Reports" subtitle="Student, fees, transaction & attendance reports">
      <Tabs defaultValue="student" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="student" className="gap-1.5"><Users className="h-3.5 w-3.5" />Student Report</TabsTrigger>
          <TabsTrigger value="fees-statement" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Fees Statement</TabsTrigger>
          <TabsTrigger value="balance" className="gap-1.5"><Banknote className="h-3.5 w-3.5" />Balance Fees</TabsTrigger>
          <TabsTrigger value="transaction" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Transaction</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />Attendance</TabsTrigger>
        </TabsList>

        {/* Student Report */}
        <TabsContent value="student" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Student Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>{["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select><SelectTrigger className="w-32 h-9"><SelectValue placeholder="Gender" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{students.length}</p></div>
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Male</p><p className="text-xl font-bold">{students.filter(s => s.gender === "Male").length}</p></div>
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Female</p><p className="text-xl font-bold">{students.filter(s => s.gender === "Female").length}</p></div>
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold">{students.filter(s => s.status === "active").length}</p></div>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Gender</TableHead><TableHead className="font-semibold">Category</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                    <TableCell>{s.grade} {s.stream}</TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{s.category}</Badge></TableCell>
                    <TableCell><Badge className={s.status === "active" ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Statement */}
        <TabsContent value="fees-statement" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Fees Statement Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select><SelectTrigger className="w-44 h-9"><SelectValue placeholder="Select Student" /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Print Statement</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Select a student to view their complete fees statement with all debits, credits, and running balance.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Fees */}
        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Balance Fees Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>{["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Class-Section</TableHead><TableHead className="font-semibold">Students</TableHead><TableHead className="font-semibold">Total Fees</TableHead>
                <TableHead className="font-semibold">Discount</TableHead><TableHead className="font-semibold">Paid</TableHead><TableHead className="font-semibold">Balance</TableHead>
              </TableRow></TableHeader>
              <TableBody>{feeAllotments.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.class} {a.section}</TableCell>
                  <TableCell>{a.students}</TableCell>
                  <TableCell className="font-semibold">{formatKES(a.total_amount)}</TableCell>
                  <TableCell className="text-success">—</TableCell>
                  <TableCell className="font-semibold text-success">{formatKES(a.collected)}</TableCell>
                  <TableCell className="font-semibold text-destructive">{formatKES(a.total_amount - a.collected)}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Report */}
        <TabsContent value="transaction" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Transaction Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Input type="date" className="h-9 w-36" defaultValue="2024-03-01" />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input type="date" className="h-9 w-36" defaultValue="2024-03-15" />
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Total Collections</p>
                  <p className="text-xl font-bold text-success">{formatKES(recentPayments.reduce((s, p) => s + p.amount, 0))}</p></div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold text-destructive">{formatKES(expenses.reduce((s, e) => s + e.amount, 0))}</p></div>
                <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Net</p>
                  <p className="text-xl font-bold text-primary">{formatKES(recentPayments.reduce((s, p) => s + p.amount, 0) - expenses.reduce((s, e) => s + e.amount, 0))}</p></div>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Description</TableHead><TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead><TableHead className="font-semibold">Method</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {recentPayments.map(p => (
                    <TableRow key={p.id}><TableCell className="text-muted-foreground">{p.date}</TableCell>
                      <TableCell className="font-medium">{p.student_name} - Payment</TableCell>
                      <TableCell><Badge className="bg-success/10 text-success border-0">Income</Badge></TableCell>
                      <TableCell className="font-semibold text-success">{formatKES(p.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.method}</TableCell>
                    </TableRow>
                  ))}
                  {expenses.slice(0, 4).map(e => (
                    <TableRow key={e.id}><TableCell className="text-muted-foreground">{e.date}</TableCell>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell><Badge className="bg-destructive/10 text-destructive border-0">Expense</Badge></TableCell>
                      <TableCell className="font-semibold text-destructive">{formatKES(e.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">{e.payment_method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody></Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Report */}
        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Attendance Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>{["Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select><SelectTrigger className="w-32 h-9"><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>{["January","February","March","April"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Present Days</p><p className="text-xl font-bold text-success">18</p></div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Absent Days</p><p className="text-xl font-bold text-destructive">2</p></div>
                <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Late Days</p><p className="text-xl font-bold text-warning">1</p></div>
                <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Attendance Rate</p><p className="text-xl font-bold text-primary">94.2%</p></div>
              </div>
              <p className="text-sm text-muted-foreground">Select a class and month to view detailed attendance data.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Reports;
