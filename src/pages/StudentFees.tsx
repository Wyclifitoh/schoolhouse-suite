import { useState, useMemo } from "react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  students, feeTemplates, feeDiscounts, recentPayments, carryForwards, studentFeeCollection,
} from "@/data/mockData";
import {
  Search, Wallet, Receipt, ArrowUpRight, ArrowDownRight, Download,
  Eye, Banknote, CreditCard, CheckCircle, Clock, AlertCircle,
  Percent, FileText, Users, UserCheck, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

// Mock student fee details - per fee breakdown
const studentFeeDetails: Record<string, Array<{
  id: string; fee_name: string; ledger_type: string; amount_due: number;
  discount: number; fine: number; amount_paid: number; balance: number;
  status: string; due_date: string; brought_forward: number; bf_type: string;
  payments: Array<{ id: string; amount: number; method: string; ref: string; date: string; }>;
}>> = {
  s1: [
    { id: "sf1", fee_name: "Tuition Fee", ledger_type: "fees", amount_due: 25000, discount: 0, fine: 1250, amount_paid: 15000, balance: 11250, status: "partial", due_date: "2024-01-31", brought_forward: 5000, bf_type: "arrears",
      payments: [{ id: "sp1", amount: 10000, method: "M-Pesa", ref: "SHQ2K4LM9X", date: "2024-01-20" }, { id: "sp2", amount: 5000, method: "Cash", ref: "CASH-0291", date: "2024-02-10" }] },
    { id: "sf2", fee_name: "Exam Fee", ledger_type: "fees", amount_due: 3500, discount: 0, fine: 500, amount_paid: 3500, balance: 500, status: "partial", due_date: "2024-02-15", brought_forward: 0, bf_type: "",
      payments: [{ id: "sp3", amount: 3500, method: "M-Pesa", ref: "SHQ2K4LP3Y", date: "2024-02-12" }] },
    { id: "sf3", fee_name: "Activity Fee", ledger_type: "fees", amount_due: 2000, discount: 0, fine: 0, amount_paid: 2000, balance: 0, status: "paid", due_date: "2024-03-01", brought_forward: 0, bf_type: "",
      payments: [{ id: "sp4", amount: 2000, method: "Bank", ref: "BNK-11023", date: "2024-02-28" }] },
    { id: "sf4", fee_name: "Library Fee", ledger_type: "fees", amount_due: 500, discount: 0, fine: 25, amount_paid: 0, balance: 525, status: "pending", due_date: "2024-01-31", brought_forward: 0, bf_type: "",
      payments: [] },
  ],
  s5: [
    { id: "sf5", fee_name: "Tuition Fee", ledger_type: "fees", amount_due: 25000, discount: 0, fine: 2500, amount_paid: 5000, balance: 22500, status: "overdue", due_date: "2024-01-31", brought_forward: 12000, bf_type: "arrears",
      payments: [{ id: "sp5", amount: 5000, method: "Cheque", ref: "CHQ-11029", date: "2024-03-12" }] },
    { id: "sf6", fee_name: "Exam Fee", ledger_type: "fees", amount_due: 3500, discount: 0, fine: 0, amount_paid: 3500, balance: 0, status: "paid", due_date: "2024-02-15", brought_forward: 0, bf_type: "",
      payments: [{ id: "sp6", amount: 3500, method: "M-Pesa", ref: "SHQ8X2NP", date: "2024-02-14" }] },
    { id: "sf7", fee_name: "Transport Fee", ledger_type: "transport", amount_due: 8000, discount: 0, fine: 0, amount_paid: 2000, balance: 6000, status: "partial", due_date: "2024-01-31", brought_forward: 0, bf_type: "",
      payments: [{ id: "sp7", amount: 2000, method: "Cash", ref: "CASH-0398", date: "2024-03-01" }] },
  ],
};

// Fill in defaults for other students
students.forEach(s => {
  if (!studentFeeDetails[s.id]) {
    studentFeeDetails[s.id] = [
      { id: `sf_${s.id}_1`, fee_name: "Tuition Fee", ledger_type: "fees", amount_due: 25000, discount: 0, fine: 0, amount_paid: 25000, balance: 0, status: "paid", due_date: "2024-01-31", brought_forward: 0, bf_type: "", payments: [{ id: `sp_${s.id}_1`, amount: 25000, method: "M-Pesa", ref: `MP-${s.id}`, date: "2024-01-18" }] },
      { id: `sf_${s.id}_2`, fee_name: "Exam Fee", ledger_type: "fees", amount_due: 3500, discount: 0, fine: 0, amount_paid: 3500, balance: 0, status: "paid", due_date: "2024-02-15", brought_forward: 0, bf_type: "", payments: [{ id: `sp_${s.id}_2`, amount: 3500, method: "Cash", ref: `CASH-${s.id}`, date: "2024-02-10" }] },
    ];
  }
});

const StudentFees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<typeof students[0] | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentFee, setPaymentFee] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountFee, setDiscountFee] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const allGrades = [...new Set(students.map(s => s.grade))].sort();

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (gradeFilter !== "all" && s.grade !== gradeFilter) return false;
      if (statusFilter !== "all") {
        const collection = studentFeeCollection.find(c => c.student_id === s.id);
        if (statusFilter === "owing" && (!collection || collection.balance <= 0)) return false;
        if (statusFilter === "paid" && (!collection || collection.balance !== 0)) return false;
        if (statusFilter === "advance" && (!collection || collection.balance >= 0)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return s.full_name.toLowerCase().includes(q) || s.admission_no.toLowerCase().includes(q);
      }
      return true;
    });
  }, [gradeFilter, statusFilter, searchQuery]);

  const getStudentSummary = (sid: string) => {
    const fees = studentFeeDetails[sid] || [];
    const totalDue = fees.reduce((a, f) => a + f.amount_due + f.fine + f.brought_forward, 0);
    const totalDiscount = fees.reduce((a, f) => a + f.discount, 0);
    const totalPaid = fees.reduce((a, f) => a + f.amount_paid, 0);
    const totalBalance = fees.reduce((a, f) => a + f.balance, 0) + fees.reduce((a, f) => a + f.brought_forward, 0) - fees.filter(f => f.status === "paid").reduce((a, f) => a + f.brought_forward, 0);
    return { totalDue, totalDiscount, totalPaid, totalBalance: fees.reduce((a, f) => a + f.balance, 0), feeCount: fees.length };
  };

  const handleRecordPayment = () => {
    if (!paymentAmount || !paymentMethod) {
      toast.error("Please fill in amount and payment method");
      return;
    }
    toast.success(`Payment of ${formatKES(Number(paymentAmount))} recorded successfully`);
    setShowPaymentDialog(false);
    setPaymentAmount("");
    setPaymentMethod("");
    setPaymentRef("");
    setPaymentNote("");
  };

  const handleApplyDiscount = () => {
    if (!discountValue) {
      toast.error("Please enter discount value");
      return;
    }
    toast.success(`Discount applied successfully`);
    setShowDiscountDialog(false);
    setDiscountValue("");
    setDiscountReason("");
  };

  const studentFees = selectedStudent ? studentFeeDetails[selectedStudent.id] || [] : [];
  const summary = selectedStudent ? getStudentSummary(selectedStudent.id) : null;
  const studentCF = selectedStudent ? carryForwards.filter(cf => cf.student_name === selectedStudent.full_name) : [];

  return (
    <DashboardLayout title="Student Fees & Payments" subtitle="View fees, collect payments, apply discounts, and manage student balances">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Student List */}
        <div className={`${selectedStudent ? "lg:col-span-4" : "lg:col-span-12"} space-y-4`}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Students</CardTitle>
                <Badge variant="secondary">{filteredStudents.length} students</Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8 h-8 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Grade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {allGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-24 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="owing">Owing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="advance">Advance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
              {filteredStudents.map(s => {
                const sum = getStudentSummary(s.id);
                const isActive = selectedStudent?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 transition-all duration-150 flex items-center gap-3 ${
                      isActive ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                      {s.full_name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{s.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.admission_no} · {s.grade} {s.stream}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${sum.totalBalance > 0 ? "text-destructive" : sum.totalBalance < 0 ? "text-success" : "text-muted-foreground"}`}>
                        {sum.totalBalance === 0 ? "Cleared" : sum.totalBalance > 0 ? formatKES(sum.totalBalance) : `+${formatKES(Math.abs(sum.totalBalance))}`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: Student Fee Detail */}
        {selectedStudent && summary && (
          <div className="lg:col-span-8 space-y-5">
            {/* Student Header */}
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-lg shadow-lg">
                      {selectedStudent.full_name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-foreground">{selectedStudent.full_name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedStudent.admission_no} · {selectedStudent.grade} {selectedStudent.stream}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Parent: {selectedStudent.parent_name} · {selectedStudent.parent_phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />Statement</Button>
                    <Button size="sm" onClick={() => { setPaymentFee(""); setShowPaymentDialog(true); }}>
                      <Wallet className="h-3.5 w-3.5 mr-1" />Receive Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Fees</p>
                <p className="text-xl font-bold text-foreground">{formatKES(summary.totalDue)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                <p className="text-xl font-bold text-success">{formatKES(summary.totalPaid)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Discount</p>
                <p className="text-xl font-bold text-primary">{formatKES(summary.totalDiscount)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <p className={`text-xl font-bold ${summary.totalBalance > 0 ? "text-destructive" : summary.totalBalance < 0 ? "text-success" : "text-muted-foreground"}`}>
                  {summary.totalBalance === 0 ? "Cleared" : formatKES(summary.totalBalance)}
                </p>
              </CardContent></Card>
            </div>

            {/* Brought Forward Section */}
            {studentCF.length > 0 && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-warning" />
                    Brought Forward from Previous Term
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow className="bg-warning/5">
                      <TableHead className="font-semibold text-xs">From Term</TableHead>
                      <TableHead className="font-semibold text-xs">To Term</TableHead>
                      <TableHead className="font-semibold text-xs">Type</TableHead>
                      <TableHead className="font-semibold text-xs">Amount</TableHead>
                      <TableHead className="font-semibold text-xs">Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>{studentCF.map(cf => (
                      <TableRow key={cf.id}>
                        <TableCell className="text-sm">{cf.from_term}</TableCell>
                        <TableCell className="text-sm">{cf.to_term}</TableCell>
                        <TableCell><Badge className={cf.type === "arrears" ? "bg-destructive/10 text-destructive border-0" : "bg-success/10 text-success border-0"} >{cf.type.replace("_", " ")}</Badge></TableCell>
                        <TableCell className={`font-semibold ${cf.type === "arrears" ? "text-destructive" : "text-success"}`}>{formatKES(cf.amount)}</TableCell>
                        <TableCell><Badge className="bg-success/10 text-success border-0">{cf.status}</Badge></TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Fee Breakdown Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Assigned Fees</CardTitle>
                  <span className="text-sm text-muted-foreground">{summary.feeCount} fee items</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Fee</TableHead>
                    <TableHead className="font-semibold">Ledger</TableHead>
                    <TableHead className="font-semibold">Due</TableHead>
                    <TableHead className="font-semibold">B/F</TableHead>
                    <TableHead className="font-semibold">Discount</TableHead>
                    <TableHead className="font-semibold">Fine</TableHead>
                    <TableHead className="font-semibold">Paid</TableHead>
                    <TableHead className="font-semibold">Balance</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-24" />
                  </TableRow></TableHeader>
                  <TableBody>{studentFees.map(f => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div><p className="font-medium text-foreground">{f.fee_name}</p>
                        <p className="text-[10px] text-muted-foreground">Due: {f.due_date}</p></div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{f.ledger_type}</Badge></TableCell>
                      <TableCell className="font-semibold">{formatKES(f.amount_due)}</TableCell>
                      <TableCell>
                        {f.brought_forward > 0 ? (
                          <span className={`font-semibold text-sm ${f.bf_type === "arrears" ? "text-destructive" : "text-success"}`}>
                            {formatKES(f.brought_forward)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-success">{f.discount > 0 ? formatKES(f.discount) : "—"}</TableCell>
                      <TableCell className="text-warning">{f.fine > 0 ? formatKES(f.fine) : "—"}</TableCell>
                      <TableCell className="font-semibold text-success">{formatKES(f.amount_paid)}</TableCell>
                      <TableCell className={`font-bold ${f.balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {f.balance === 0 ? "—" : formatKES(f.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          f.status === "paid" ? "bg-success/10 text-success border-0" :
                          f.status === "partial" ? "bg-warning/10 text-warning border-0" :
                          f.status === "overdue" ? "bg-destructive/10 text-destructive border-0" :
                          "bg-muted text-muted-foreground border-0"
                        }>{f.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {f.balance > 0 && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                              setPaymentFee(f.id);
                              setPaymentAmount(f.balance.toString());
                              setShowPaymentDialog(true);
                            }}>
                              <Wallet className="h-3 w-3 mr-1" />Pay
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                            setDiscountFee(f.id);
                            setShowDiscountDialog(true);
                          }}>
                            <Percent className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payment History for this Student */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Fee</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Method</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {studentFees.flatMap(f => f.payments.map(p => ({ ...p, fee_name: f.fee_name }))).sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground text-sm">{p.date}</TableCell>
                        <TableCell className="font-medium text-sm">{p.fee_name}</TableCell>
                        <TableCell className="font-semibold text-success">{formatKES(p.amount)}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{p.method}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.ref}</TableCell>
                      </TableRow>
                    ))}
                    {studentFees.flatMap(f => f.payments).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No payments recorded</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!selectedStudent && (
          <div className="lg:col-span-8 flex items-center justify-center">
            <div className="text-center py-20">
              <div className="flex h-20 w-20 mx-auto mb-4 items-center justify-center rounded-2xl bg-muted/50">
                <UserCheck className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Select a Student</h3>
              <p className="text-sm text-muted-foreground">Choose a student from the list to view their fee details, payments, and balances</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Record Payment {selectedStudent && `- ${selectedStudent.full_name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedStudent && summary && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Outstanding Balance</span>
                  <span className="font-bold text-destructive">{formatKES(summary.totalBalance)}</span></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <Input type="number" placeholder="Enter amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference / Receipt No.</Label>
              <Input placeholder="Transaction reference" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Allocate to Fee (Optional)</Label>
              <Select value={paymentFee} onValueChange={setPaymentFee}>
                <SelectTrigger><SelectValue placeholder="Auto-allocate (FIFO)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-allocate (FIFO)</SelectItem>
                  {studentFees.filter(f => f.balance > 0).map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.fee_name} - Bal: {formatKES(f.balance)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Textarea placeholder="Payment note" rows={2} value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment}><CheckCircle className="h-4 w-4 mr-1.5" />Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-success" />
              Apply Discount
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Discount Category</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select or custom" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Discount</SelectItem>
                  {feeDiscounts.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.type === "percentage" ? `${d.value}%` : formatKES(d.value)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (KES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input type="number" placeholder={discountType === "percentage" ? "e.g. 15" : "e.g. 3000"} value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea placeholder="Reason for discount" rows={2} value={discountReason} onChange={e => setDiscountReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>Cancel</Button>
            <Button onClick={handleApplyDiscount} className="bg-success hover:bg-success/90"><Percent className="h-4 w-4 mr-1.5" />Apply Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentFees;
