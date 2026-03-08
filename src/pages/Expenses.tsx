import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { expenses, expenseCategories } from "@/data/mockData";
import {
  Receipt, Plus, Download, Search, TrendingDown, Wallet, PieChart,
} from "lucide-react";

const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

const Expenses = () => {
  const [search, setSearch] = useState("");
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = expenseCategories.reduce((s, c) => s + c.budget, 0);

  const filtered = expenses.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="School Expenses" subtitle="Track and manage all school expenditures">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><TrendingDown className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold text-foreground">{formatKES(totalExpenses)}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Total Budget</p><p className="text-2xl font-bold text-foreground">{formatKES(totalBudget)}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><PieChart className="h-5 w-5 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Budget Used</p><p className="text-2xl font-bold text-foreground">{Math.round((totalExpenses / totalBudget) * 100)}%</p></div>
          </CardContent></Card>
        </div>

        {/* Budget by Category */}
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-base font-semibold">Budget Utilization by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {expenseCategories.map(c => (
                <div key={c.id} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground text-sm">{c.name}</h4>
                    <span className="text-xs text-muted-foreground">{Math.round((c.spent / c.budget) * 100)}%</span>
                  </div>
                  <Progress value={(c.spent / c.budget) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Spent: {formatKES(c.spent)}</span>
                    <span>Budget: {formatKES(c.budget)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Records */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold">Expense Records</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search expenses..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Expense</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Expense Title</Label><Input placeholder="e.g. Electricity Bill - March" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Category</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{expenseCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" placeholder="28500" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Date</Label><Input type="date" /></div>
                        <div className="space-y-2"><Label>Payment Method</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mpesa">M-Pesa</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="cheque">Cheque</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Reference</Label><Input placeholder="Receipt/Invoice number" /></div>
                      <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Additional details" rows={2} /></div>
                      <Button className="w-full mt-2">Record Expense</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Title</TableHead><TableHead className="font-semibold">Category</TableHead><TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Method</TableHead><TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                <TableCell className="font-semibold text-destructive">{formatKES(e.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{e.date}</TableCell>
                <TableCell className="text-muted-foreground">{e.payment_method}</TableCell>
                <TableCell><Badge className={
                  e.status === "paid" ? "bg-success/10 text-success border-0" :
                  e.status === "approved" ? "bg-info/10 text-info border-0" :
                  "bg-warning/10 text-warning border-0"
                }>{e.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
