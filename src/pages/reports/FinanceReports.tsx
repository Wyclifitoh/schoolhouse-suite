import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Banknote, TrendingDown, TrendingUp, Smartphone, FileText, Receipt, AlertTriangle } from "lucide-react";
import { useFinanceReportData, usePaymentsReportData } from "@/hooks/useReports";
import { useClasses } from "@/hooks/useClasses";

const formatKES = (a: number) => `KES ${Math.abs(a || 0).toLocaleString()}`;

const LoadingSkeleton = () => (
  <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>
);

const FinanceReports = () => {
  const [classFilter, setClassFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: report, isLoading } = useFinanceReportData({ classId: classFilter, startDate, endDate });
  const { data: paymentsReport, isLoading: paymentsLoading } = usePaymentsReportData({ startDate, endDate });
  const { data: classesData } = useClasses();

  const balanceFees = report?.balanceFees || [];
  const feeStatements = report?.feeStatements || [];
  const dailyCollections = report?.dailyCollections || [];
  const incomeByCategory = report?.incomeByCategory || [];
  const expenseReport = report?.expenses || [];
  const payrollSummary = report?.payrollSummary || [];
  const mpesaPayments = paymentsReport?.mpesaPayments || [];
  const allPayments = paymentsReport?.payments || [];
  const classes = Array.isArray(classesData) ? classesData : [];

  const totalCollected = dailyCollections.reduce((s: number, d: any) => s + (d.total || 0), 0);
  const totalTransactions = dailyCollections.reduce((s: number, d: any) => s + (d.transactions || 0), 0);

  return (
    <DashboardLayout title="Finance Reports" subtitle="Comprehensive finance, fees & payment reports">
      <Tabs defaultValue="balance" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="balance">Balance Fees</TabsTrigger>
          <TabsTrigger value="fees-statement">Fees Statement</TabsTrigger>
          <TabsTrigger value="daily-collection">Daily Collection</TabsTrigger>
          <TabsTrigger value="collection">Fees Collection</TabsTrigger>
          <TabsTrigger value="income">Income Report</TabsTrigger>
          <TabsTrigger value="expense">Expense Report</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Report</TabsTrigger>
          <TabsTrigger value="mpesa">M-Pesa Payments</TabsTrigger>
        </TabsList>

        {/* BALANCE FEES */}
        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold">Balance Fees Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {Array.isArray(classes) && classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : balanceFees.length === 0 ? <EmptyState message="No balance fee data found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Adm No.</TableHead>
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Total Fees</TableHead>
                  <TableHead className="font-semibold">Paid</TableHead>
                  <TableHead className="font-semibold">Balance</TableHead>
                </TableRow></TableHeader>
                <TableBody>{balanceFees.map((s: any) => (
                  <TableRow key={s.id || s.student_id}>
                    <TableCell className="font-medium">{s.student_name || s.full_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                    <TableCell>{s.class_name || s.grade}</TableCell>
                    <TableCell className="font-semibold">{formatKES(s.total_fees)}</TableCell>
                    <TableCell className="font-semibold text-success">{formatKES(s.paid)}</TableCell>
                    <TableCell className="font-semibold text-destructive">{formatKES(s.balance)}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEES STATEMENT */}
        <TabsContent value="fees-statement" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Fees Statement</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : feeStatements.length === 0 ? <EmptyState message="No fee statement data available" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead>
                  <TableHead className="font-semibold">Total Fee</TableHead><TableHead className="font-semibold">Paid</TableHead>
                  <TableHead className="font-semibold">Balance</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{feeStatements.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.student_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                    <TableCell>{formatKES(s.total_fee)}</TableCell>
                    <TableCell className="text-success font-semibold">{formatKES(s.paid)}</TableCell>
                    <TableCell className={s.balance > 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>{formatKES(s.balance)}</TableCell>
                    <TableCell><Badge className={s.status === "paid" ? "bg-success/10 text-success border-0" : s.status === "overdue" ? "bg-destructive/10 text-destructive border-0" : "bg-warning/10 text-warning border-0"}>{s.status || "partial"}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DAILY COLLECTION */}
        <TabsContent value="daily-collection" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" />Daily Collection Report</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input type="date" className="h-9 w-36" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input type="date" className="h-9 w-36" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <LoadingSkeleton /> : dailyCollections.length === 0 ? <EmptyState message="No collection data for the selected period" /> : (
                <>
                  <div className="grid gap-4 sm:grid-cols-4 mb-6">
                    <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Total Collected</p><p className="text-xl font-bold text-success">{formatKES(totalCollected)}</p></div>
                    <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Transactions</p><p className="text-xl font-bold text-primary">{totalTransactions}</p></div>
                    <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Avg/Day</p><p className="text-xl font-bold text-info">{formatKES(dailyCollections.length ? Math.round(totalCollected / dailyCollections.length) : 0)}</p></div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Days</p><p className="text-xl font-bold">{dailyCollections.length}</p></div>
                  </div>
                  <Table><TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold text-right">Cash</TableHead><TableHead className="font-semibold text-right">M-Pesa</TableHead>
                    <TableHead className="font-semibold text-right">Bank</TableHead><TableHead className="font-semibold text-right">Total</TableHead><TableHead className="font-semibold text-center">Txns</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{dailyCollections.map((d: any) => (
                    <TableRow key={d.date}>
                      <TableCell className="font-medium">{d.date}</TableCell>
                      <TableCell className="text-right">{formatKES(d.cash || 0)}</TableCell>
                      <TableCell className="text-right">{formatKES(d.mpesa || 0)}</TableCell>
                      <TableCell className="text-right">{formatKES(d.bank || 0)}</TableCell>
                      <TableCell className="text-right font-bold text-success">{formatKES(d.total || 0)}</TableCell>
                      <TableCell className="text-center">{d.transactions || 0}</TableCell>
                    </TableRow>
                  ))}</TableBody></Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEES COLLECTION */}
        <TabsContent value="collection" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold">Fees Collection Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? <LoadingSkeleton /> : allPayments.length === 0 ? <EmptyState message="No payment records found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Method</TableHead><TableHead className="font-semibold">Reference</TableHead>
                  <TableHead className="font-semibold text-right">Amount</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{allPayments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">{p.received_at ? new Date(p.received_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="font-medium">{p.student_name || "—"}</TableCell>
                    <TableCell>{p.payment_method}</TableCell>
                    <TableCell className="font-mono text-xs">{p.reference_number || p.mpesa_receipt || "—"}</TableCell>
                    <TableCell className="text-right font-bold text-success">{formatKES(p.amount)}</TableCell>
                    <TableCell><Badge className={p.status === "completed" || p.status === "confirmed" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>{p.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INCOME REPORT */}
        <TabsContent value="income" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Income by Category</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : incomeByCategory.length === 0 ? <EmptyState message="No income data available" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Category</TableHead><TableHead className="font-semibold text-right">Amount</TableHead><TableHead className="font-semibold text-right">Percentage</TableHead>
                </TableRow></TableHeader>
                <TableBody>{incomeByCategory.map((c: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.category}</TableCell>
                    <TableCell className="text-right font-bold text-success">{formatKES(c.amount)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{c.percentage?.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPENSE REPORT */}
        <TabsContent value="expense" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Expense Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : expenseReport.length === 0 ? <EmptyState message="No expense records found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Category</TableHead><TableHead className="font-semibold text-right">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{expenseReport.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{e.expense_date ? new Date(e.expense_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell>{e.category_name || "—"}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">{formatKES(e.amount)}</TableCell>
                    <TableCell><Badge className={e.status === "approved" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>{e.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYROLL REPORT */}
        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Banknote className="h-4 w-4 text-primary" />Payroll Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : payrollSummary.length === 0 ? <EmptyState message="No payroll data available" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Month</TableHead><TableHead className="font-semibold text-right">Basic</TableHead>
                  <TableHead className="font-semibold text-right">Allowances</TableHead><TableHead className="font-semibold text-right">Deductions</TableHead>
                  <TableHead className="font-semibold text-right">Net</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{payrollSummary.map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.month}</TableCell>
                    <TableCell className="text-right">{formatKES(p.basic)}</TableCell>
                    <TableCell className="text-right text-success">{formatKES(p.allowances)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatKES(p.deductions)}</TableCell>
                    <TableCell className="text-right font-bold">{formatKES(p.net)}</TableCell>
                    <TableCell><Badge className="bg-success/10 text-success border-0">{p.status || "paid"}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* M-PESA PAYMENTS */}
        <TabsContent value="mpesa" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4 text-success" />M-Pesa Payments</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? <LoadingSkeleton /> : mpesaPayments.length === 0 ? <EmptyState message="No M-Pesa payment records found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead><TableHead className="font-semibold">Receipt</TableHead>
                  <TableHead className="font-semibold text-right">Amount</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{mpesaPayments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">{p.transaction_date ? new Date(p.transaction_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="font-medium">{p.student_name || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{p.phone_number}</TableCell>
                    <TableCell className="font-mono text-xs">{p.mpesa_receipt_number || "—"}</TableCell>
                    <TableCell className="text-right font-bold text-success">{formatKES(p.amount)}</TableCell>
                    <TableCell><Badge className={p.status === "completed" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>{p.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default FinanceReports;
