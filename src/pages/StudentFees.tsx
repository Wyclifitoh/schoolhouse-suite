import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { students, feeDiscounts, carryForwards } from "@/data/mockData";
import {
  ArrowLeft, Wallet, Download, Percent, Phone, Receipt, AlertTriangle, ArrowUpRight, Scale,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { RecordPaymentDialog } from "@/components/finance/RecordPaymentDialog";
import { FeeAdjustmentDialog } from "@/components/finance/FeeAdjustmentDialog";

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

// Mock fee data per student
const studentFeeDetails: Record<string, Array<{
  id: string;
  fee_group: string;
  fee_code: string;
  fee_name: string;
  due_date: string;
  status: string;
  amount: number;
  discount: number;
  fine: number;
  paid: number;
  balance: number;
  brought_forward: number;
  bf_type: string;
  payments: Array<{ id: string; amount: number; method: string; date: string }>;
}>> = {
  s1: [
    { id: "sf1", fee_group: "Class 8 Fees", fee_code: "TF", fee_name: "Tuition Fee", due_date: "2024-01-31", status: "Partial", amount: 25000, discount: 0, fine: 1250, paid: 15000, balance: 11250, brought_forward: 5000, bf_type: "Arrears",
      payments: [{ id: "PAY-001", amount: 10000, method: "M-Pesa", date: "2024-01-20" }, { id: "PAY-002", amount: 5000, method: "Cash", date: "2024-02-10" }] },
    { id: "sf2", fee_group: "Class 8 Fees", fee_code: "EF", fee_name: "Exam Fee", due_date: "2024-02-15", status: "Partial", amount: 3500, discount: 0, fine: 500, paid: 3500, balance: 500, brought_forward: 0, bf_type: "",
      payments: [{ id: "PAY-003", amount: 3500, method: "M-Pesa", date: "2024-02-12" }] },
    { id: "sf3", fee_group: "Class 8 Fees", fee_code: "AF", fee_name: "Activity Fee", due_date: "2024-03-01", status: "Paid", amount: 2000, discount: 0, fine: 0, paid: 2000, balance: 0, brought_forward: 0, bf_type: "",
      payments: [{ id: "PAY-004", amount: 2000, method: "Bank", date: "2024-02-28" }] },
    { id: "sf4", fee_group: "Class 8 Fees", fee_code: "LBF", fee_name: "Library Fee", due_date: "2024-01-31", status: "Unpaid", amount: 500, discount: 0, fine: 25, paid: 0, balance: 525, brought_forward: 0, bf_type: "",
      payments: [] },
  ],
  s5: [
    { id: "sf5", fee_group: "Class 7 Fees", fee_code: "TF", fee_name: "Tuition Fee", due_date: "2024-01-31", status: "Overdue", amount: 25000, discount: 0, fine: 2500, paid: 5000, balance: 22500, brought_forward: 12000, bf_type: "Arrears",
      payments: [{ id: "PAY-005", amount: 5000, method: "Cheque", date: "2024-03-12" }] },
    { id: "sf6", fee_group: "Class 7 Fees", fee_code: "EF", fee_name: "Exam Fee", due_date: "2024-02-15", status: "Paid", amount: 3500, discount: 0, fine: 0, paid: 3500, balance: 0, brought_forward: 0, bf_type: "",
      payments: [{ id: "PAY-006", amount: 3500, method: "M-Pesa", date: "2024-02-14" }] },
    { id: "sf7", fee_group: "Transport Package", fee_code: "TRF", fee_name: "Transport Fee", due_date: "2024-01-31", status: "Partial", amount: 8000, discount: 0, fine: 0, paid: 2000, balance: 6000, brought_forward: 0, bf_type: "",
      payments: [{ id: "PAY-007", amount: 2000, method: "Cash", date: "2024-03-01" }] },
  ],
};

// Fill defaults for other students
students.forEach(s => {
  if (!studentFeeDetails[s.id]) {
    studentFeeDetails[s.id] = [
      { id: `sf_${s.id}_1`, fee_group: `${s.grade} Fees`, fee_code: "TF", fee_name: "Tuition Fee", due_date: "2024-01-31", status: "Paid", amount: 25000, discount: 0, fine: 0, paid: 25000, balance: 0, brought_forward: 0, bf_type: "",
        payments: [{ id: `PAY-${s.id}-1`, amount: 25000, method: "M-Pesa", date: "2024-01-18" }] },
      { id: `sf_${s.id}_2`, fee_group: `${s.grade} Fees`, fee_code: "EF", fee_name: "Exam Fee", due_date: "2024-02-15", status: "Paid", amount: 3500, discount: 0, fine: 0, paid: 3500, balance: 0, brought_forward: 0, bf_type: "",
        payments: [{ id: `PAY-${s.id}-2`, amount: 3500, method: "Cash", date: "2024-02-10" }] },
    ];
  }
});

const StudentFees = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const student = students.find(s => s.id === studentId);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentFeeId, setPaymentFeeId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | undefined>();

  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentFee, setAdjustmentFee] = useState<{
    id: string; name: string; currentAmount: number; amountPaid: number;
  } | null>(null);

  const fees = student ? (studentFeeDetails[student.id] || []) : [];
  const studentCF = student ? carryForwards.filter(cf => cf.student_name === student.full_name) : [];

  const totals = useMemo(() => {
    const totalAmount = fees.reduce((a, f) => a + f.amount, 0);
    const totalBF = fees.reduce((a, f) => a + f.brought_forward, 0);
    const totalDiscount = fees.reduce((a, f) => a + f.discount, 0);
    const totalFine = fees.reduce((a, f) => a + f.fine, 0);
    const totalPaid = fees.reduce((a, f) => a + f.paid, 0);
    const totalBalance = fees.reduce((a, f) => a + f.balance, 0);
    return { totalAmount, totalBF, totalDiscount, totalFine, totalPaid, totalBalance };
  }, [fees]);

  if (!student) {
    return (
      <DashboardLayout title="Student Not Found" subtitle="">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-warning" />
          <p className="text-muted-foreground">Student not found.</p>
          <Button variant="outline" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleRecordPayment = (data: any) => {
    toast.success(`Payment of ${formatKES(data.amount)} recorded for ${student.full_name}`);
    setShowPaymentDialog(false);
  };

  const handleAdjustment = (data: any) => {
    toast.success(`Fee adjustment applied: ${data.adjustmentType} of ${formatKES(data.amount)}`);
    setShowAdjustmentDialog(false);
    setAdjustmentFee(null);
  };

  const statusColor = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === "paid") return "bg-success/10 text-success border-0";
    if (lower === "partial") return "bg-warning/10 text-warning border-0";
    if (lower === "overdue") return "bg-destructive/10 text-destructive border-0";
    return "bg-muted text-muted-foreground border-0";
  };

  const feeItems = fees.filter(f => f.balance > 0).map(f => ({
    id: f.id, name: f.fee_name, dueAmount: f.amount, balance: f.balance,
  }));

  return (
    <DashboardLayout title={`${student.full_name} — Fees & Payments`} subtitle={`${student.admission_no} · ${student.grade} ${student.stream}`}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />Back to Students
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />Fee Statement</Button>
            <Button size="sm" onClick={() => { setPaymentFeeId(""); setPaymentAmount(undefined); setShowPaymentDialog(true); }}>
              <Wallet className="h-3.5 w-3.5 mr-1" />Receive Payment
            </Button>
          </div>
        </div>

        {/* Student Info Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-lg shadow-lg">
                {student.full_name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">{student.full_name}</h2>
                <p className="text-sm text-muted-foreground">{student.admission_no} · {student.grade} {student.stream}</p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.parent_phone}</span>
                  <span className="flex items-center gap-1">Parent: {student.parent_name}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Overall Balance</p>
                <p className={`text-2xl font-bold ${totals.totalBalance > 0 ? "text-destructive" : totals.totalBalance < 0 ? "text-success" : "text-muted-foreground"}`}>
                  {totals.totalBalance === 0 ? "Cleared" : formatKES(totals.totalBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Fees", value: formatKES(totals.totalAmount), color: "text-foreground" },
            { label: "B/F Amount", value: formatKES(totals.totalBF), color: "text-warning" },
            { label: "Discount", value: formatKES(totals.totalDiscount), color: "text-primary" },
            { label: "Paid", value: formatKES(totals.totalPaid), color: "text-success" },
            { label: "Balance", value: totals.totalBalance === 0 ? "Cleared" : formatKES(totals.totalBalance), color: totals.totalBalance > 0 ? "text-destructive" : "text-success" },
          ].map(s => (
            <Card key={s.label}><CardContent className="p-3 text-center">
              <p className="text-[11px] text-muted-foreground mb-0.5">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </CardContent></Card>
          ))}
        </div>

        {/* Brought Forward */}
        {studentCF.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-warning" />Brought Forward from Previous Term
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-warning/5">
                  <TableHead className="font-semibold text-xs">From Term</TableHead>
                  <TableHead className="font-semibold text-xs">To Term</TableHead>
                  <TableHead className="font-semibold text-xs">Type</TableHead>
                  <TableHead className="font-semibold text-xs">Amount (KES)</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{studentCF.map(cf => (
                  <TableRow key={cf.id}>
                    <TableCell className="text-sm">{cf.from_term}</TableCell>
                    <TableCell className="text-sm">{cf.to_term}</TableCell>
                    <TableCell><Badge className={cf.type === "arrears" ? "bg-destructive/10 text-destructive border-0" : "bg-success/10 text-success border-0"}>{cf.type === "arrears" ? "Arrears" : "Advance Credit"}</Badge></TableCell>
                    <TableCell className={`font-semibold ${cf.type === "arrears" ? "text-destructive" : "text-success"}`}>{formatKES(cf.amount)}</TableCell>
                    <TableCell><Badge className="bg-success/10 text-success border-0">{cf.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Main Fee Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />Fees & Payments
              </CardTitle>
              <Badge variant="secondary">{fees.length} fee items</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs">Fees Group</TableHead>
                    <TableHead className="font-semibold text-xs">Fees Code</TableHead>
                    <TableHead className="font-semibold text-xs">Due Date</TableHead>
                    <TableHead className="font-semibold text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Amount (KES)</TableHead>
                    <TableHead className="font-semibold text-xs">Payment ID</TableHead>
                    <TableHead className="font-semibold text-xs">Mode</TableHead>
                    <TableHead className="font-semibold text-xs">Date</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Discount (KES)</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Fine (KES)</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Paid (KES)</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Balance (KES)</TableHead>
                    <TableHead className="font-semibold text-xs w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map(f => {
                    const lastPayment = f.payments.length > 0 ? f.payments[f.payments.length - 1] : null;
                    return (
                      <TableRow key={f.id} className="group">
                        <TableCell className="font-medium text-sm">{f.fee_group}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-mono text-[10px]">{f.fee_code}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.due_date}</TableCell>
                        <TableCell><Badge className={statusColor(f.status)}>{f.status}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">{f.amount.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{lastPayment?.id || "—"}</TableCell>
                        <TableCell className="text-sm">{lastPayment?.method || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{lastPayment?.date || "—"}</TableCell>
                        <TableCell className="text-right text-success">{f.discount > 0 ? f.discount.toLocaleString() : "0.00"}</TableCell>
                        <TableCell className="text-right text-warning">{f.fine > 0 ? f.fine.toLocaleString() : "0.00"}</TableCell>
                        <TableCell className="text-right font-semibold text-success">{f.paid.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-bold ${f.balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {f.balance > 0 ? f.balance.toLocaleString() : "0.00"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {f.balance > 0 && (
                              <Button size="sm" variant="outline" className="h-7 text-[11px] px-2" onClick={() => {
                                setPaymentFeeId(f.id);
                                setPaymentAmount(f.balance);
                                setShowPaymentDialog(true);
                              }}>
                                <Wallet className="h-3 w-3 mr-0.5" />Pay
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Adjust fee" onClick={() => {
                              setAdjustmentFee({
                                id: f.id,
                                name: f.fee_name,
                                currentAmount: f.amount,
                                amountPaid: f.paid,
                              });
                              setShowAdjustmentDialog(true);
                            }}>
                              <Scale className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/70 font-bold">
                    <TableCell colSpan={4} className="text-sm">Grand Total</TableCell>
                    <TableCell className="text-right text-sm">{totals.totalAmount.toLocaleString()}</TableCell>
                    <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                      {totals.totalBF > 0 && `+ B/F ${formatKES(totals.totalBF)}`}
                    </TableCell>
                    <TableCell className="text-right text-sm text-success">{totals.totalDiscount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm text-warning">{totals.totalFine.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm text-success">{totals.totalPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm text-destructive">{totals.totalBalance.toLocaleString()}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />All Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs">Payment ID</TableHead>
                <TableHead className="font-semibold text-xs">Date</TableHead>
                <TableHead className="font-semibold text-xs">Fee</TableHead>
                <TableHead className="font-semibold text-xs">Mode</TableHead>
                <TableHead className="font-semibold text-xs text-right">Amount (KES)</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {fees.flatMap(f => f.payments.map(p => ({ ...p, fee_name: f.fee_name, fee_code: f.fee_code }))).sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.date}</TableCell>
                    <TableCell className="text-sm font-medium">{p.fee_name} <Badge variant="secondary" className="ml-1 text-[9px]">{p.fee_code}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{p.method}</Badge></TableCell>
                    <TableCell className="text-right font-semibold text-success">{p.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {fees.flatMap(f => f.payments).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments recorded yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Multi-step Record Payment Dialog */}
      <RecordPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        preselectedStudentId={student.id}
        preselectedFeeId={paymentFeeId || undefined}
        preselectedAmount={paymentAmount}
        studentFees={feeItems}
        onSubmit={handleRecordPayment}
      />

      {/* Fee Adjustment Dialog */}
      <FeeAdjustmentDialog
        open={showAdjustmentDialog}
        onOpenChange={setShowAdjustmentDialog}
        fee={adjustmentFee}
        studentName={student.full_name}
        onSubmit={handleAdjustment}
      />
    </DashboardLayout>
  );
};

export default StudentFees;
