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
import { students, recentPayments, expenses, feeAllotments } from "@/data/mockData";
import { Download, Banknote, TrendingDown, TrendingUp } from "lucide-react";

const formatKES = (a: number) => `KES ${Math.abs(a).toLocaleString()}`;

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

      <TabsContent value="income"><Card><CardContent className="py-12 text-center text-muted-foreground"><TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Income Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="expense"><Card><CardContent className="py-12 text-center text-muted-foreground"><TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Expense Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="mpesa"><Card><CardContent className="py-12 text-center text-muted-foreground"><Banknote className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>M-Pesa Payments Report - Coming Soon</p></CardContent></Card></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default FinanceReports;
