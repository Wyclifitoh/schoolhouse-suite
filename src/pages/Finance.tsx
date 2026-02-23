import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { feeTemplates, students, ledgerEntries, recentPayments } from "@/data/mockData";
import {
  Banknote,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText,
  CreditCard,
  Search,
  Download,
} from "lucide-react";

const formatKES = (amount: number) => `KES ${Math.abs(amount).toLocaleString()}`;

const Finance = () => {
  const [selectedStudent, setSelectedStudent] = useState(students[0]);

  return (
    <DashboardLayout title="Finance" subtitle="Fee management, payments, and student ledgers">
      <Tabs defaultValue="fees" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="fees" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Fee Templates
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Student Ledger
          </TabsTrigger>
        </TabsList>

        {/* Fee Templates Tab */}
        <TabsContent value="fees" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fee Templates</p>
                  <p className="text-2xl font-bold text-foreground">{feeTemplates.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Banknote className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Fees Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatKES(feeTemplates.reduce((s, f) => s + f.amount, 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Receipt className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recurring Fees</p>
                  <p className="text-2xl font-bold text-foreground">
                    {feeTemplates.filter((f) => f.is_recurring).length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Templates</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Fee Template</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Fee Name</Label>
                        <Input placeholder="e.g. Tuition Fee" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Amount (KES)</Label>
                          <Input type="number" placeholder="25000" />
                        </div>
                        <div className="space-y-2">
                          <Label>Ledger Type</Label>
                          <Select>
                            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fees">Fees</SelectItem>
                              <SelectItem value="transport">Transport</SelectItem>
                              <SelectItem value="pos">POS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button className="w-full mt-2">Create Template</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Fee Name</TableHead>
                    <TableHead className="font-semibold">Ledger</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Term</TableHead>
                    <TableHead className="font-semibold">Recurring</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeTemplates.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{f.ledger_type}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{formatKES(f.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">{f.term}</TableCell>
                      <TableCell>
                        {f.is_recurring ? (
                          <Badge className="bg-success/10 text-success border-0">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Banknote className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatKES(recentPayments.reduce((s, p) => s + p.amount, 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold text-foreground">{recentPayments.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <ArrowUpRight className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">M-Pesa Payments</p>
                  <p className="text-2xl font-bold text-foreground">
                    {recentPayments.filter((p) => p.method === "M-Pesa").length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Payment History</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1.5" />Export
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Student</Label>
                          <Select>
                            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                            <SelectContent>
                              {students.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Amount (KES)</Label>
                            <Input type="number" placeholder="15000" />
                          </div>
                          <div className="space-y-2">
                            <Label>Method</Label>
                            <Select>
                              <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mpesa">M-Pesa</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank">Bank</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Reference</Label>
                          <Input placeholder="Transaction reference" />
                        </div>
                        <Button className="w-full mt-2">Record Payment</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Student</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Method</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.student_name}</TableCell>
                      <TableCell className="font-semibold text-success">{formatKES(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.method}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.reference}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.date}</TableCell>
                      <TableCell>
                        <Badge className={
                          p.status === "completed"
                            ? "bg-success/10 text-success border-0"
                            : "bg-warning/10 text-warning border-0"
                        }>
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Ledger Tab */}
        <TabsContent value="ledger" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Student Ledger</CardTitle>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedStudent.id}
                    onValueChange={(v) => setSelectedStudent(students.find((s) => s.id === v) || students[0])}
                  >
                    <SelectTrigger className="w-56 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1.5" />
                    Statement
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Student Info Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {selectedStudent.full_name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedStudent.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.admission_no} · {selectedStudent.grade} {selectedStudent.stream}
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total Debits</p>
                    <p className="text-lg font-bold text-destructive">
                      {formatKES(ledgerEntries.filter((l) => l.type === "debit").reduce((s, l) => s + l.amount, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total Credits</p>
                    <p className="text-lg font-bold text-success">
                      {formatKES(ledgerEntries.filter((l) => l.type === "credit").reduce((s, l) => s + l.amount, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Net Balance</p>
                    <p className={`text-lg font-bold ${selectedStudent.balance < 0 ? "text-destructive" : "text-success"}`}>
                      {selectedStudent.balance < 0 ? "-" : ""}{formatKES(selectedStudent.balance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold text-right">Debit</TableHead>
                      <TableHead className="font-semibold text-right">Credit</TableHead>
                      <TableHead className="font-semibold text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-muted-foreground text-sm">{entry.date}</TableCell>
                        <TableCell className="font-medium">{entry.description}</TableCell>
                        <TableCell className="text-right">
                          {entry.type === "debit" ? (
                            <span className="text-destructive font-semibold flex items-center justify-end gap-1">
                              <ArrowUpRight className="h-3 w-3" />
                              {formatKES(entry.amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.type === "credit" ? (
                            <span className="text-success font-semibold flex items-center justify-end gap-1">
                              <ArrowDownRight className="h-3 w-3" />
                              {formatKES(entry.amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${entry.balance < 0 ? "text-destructive" : "text-success"}`}>
                            {entry.balance < 0 ? "-" : ""}{formatKES(entry.balance)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Finance;
