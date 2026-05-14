import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { useStudentWithFees } from "@/hooks/useStudents";
import { useFeeDiscounts, useRecordPayment } from "@/hooks/useFinance";
import { useTerm } from "@/contexts/TermContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Wallet,
  Download,
  Phone,
  Receipt,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { RecordPaymentDialog } from "@/components/finance/RecordPaymentDialog";
import { FeeAdjustmentDialog } from "@/components/finance/FeeAdjustmentDialog";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const StudentFees = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudentWithFees(studentId);

  const { data: studentFees = [] } = useQuery({
    queryKey: ["student-fee-items", studentId],
    queryFn: async () => {
      try {
        const data = await api.get<any>(`/finance/student-fees/${studentId}`);
        return (data?.data || data || []) as any[];
      } catch {
        return [];
      }
    },
    enabled: !!studentId,
  });

  const { data: paymentHistory = [] } = useQuery({
    queryKey: ["student-payments", studentId],
    queryFn: async () => {
      try {
        const data = await api.get<any>(`/payments?student_id=${studentId}`);
        return (data?.data || data || []) as any[];
      } catch {
        return [];
      }
    },
    enabled: !!studentId,
  });

  const { data: allocationHistory = [] } = useQuery({
    queryKey: ["payment-allocations", studentId],
    queryFn: async () => {
      try {
        const data = await api.get<any>(
          `/payments/allocations?student_id=${studentId}`,
        );
        return (data?.data || data || []) as any[];
      } catch {
        return [];
      }
    },
    enabled: !!studentId,
  });

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentFeeId, setPaymentFeeId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | undefined>();
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentFee, setAdjustmentFee] = useState<any>(null);
  const { selectedTerm } = useTerm();
  const recordPayment = useRecordPayment();

  const totals = useMemo(() => {
    const totalAmount = studentFees.reduce(
      (a: number, f: any) => a + Number(f.amount || 0),
      0,
    );
    const totalDiscount = studentFees.reduce(
      (a: number, f: any) => a + Number(f.discount || 0),
      0,
    );
    const totalPaid = studentFees.reduce(
      (a: number, f: any) => a + Number(f.paid || 0),
      0,
    );
    const totalBalance = studentFees.reduce(
      (a: number, f: any) => a + Number(f.balance || 0),
      0,
    );
    return { totalAmount, totalDiscount, totalPaid, totalBalance };
  }, [studentFees]);

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Not Found" subtitle="">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-orange-500" />
          <p className="text-muted-foreground">Student not found.</p>
          <Button variant="outline" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const displayName =
    student.full_name || `${student.first_name} ${student.last_name}`;

  const handleRecordPayment = async (data: any) => {
    try {
      await recordPayment.mutateAsync({
        student_id: data.studentId,
        amount: data.amount,
        payment_method: data.method,
        reference_number: data.reference,
        fee_ids: data.feeIds || [],
        notes: data.notes,
        term_id: selectedTerm?.id || null,
        idempotency_key: data.idempotencyKey,
      });
      setShowPaymentDialog(false);
    } catch {
      /* toast handled in hook */
    }
  };

  const handleAdjustment = (data: any) => {
    toast.success(`Fee adjustment applied`);
    setShowAdjustmentDialog(false);
    setAdjustmentFee(null);
  };

  const statusColor = (s: string) => {
    const lower = (s || "").toLowerCase();
    if (lower === "paid") return "bg-green-500/10 text-green-600 border-0";
    if (lower === "partial") return "bg-orange-500/10 text-orange-500 border-0";
    if (lower === "overdue") return "bg-red-500/10 text-red-500 border-0";
    return "bg-muted text-muted-foreground border-0";
  };

  const feeItems = studentFees
    .filter((f: any) => (f.balance || 0) > 0)
    .map((f: any) => ({
      id: f.id,
      name: f.fee_name || f.name,
      dueAmount: f.amount,
      balance: f.balance,
    }));

  return (
    <DashboardLayout
      title={`${displayName} — Fees & Payments`}
      subtitle={`${student.admission_number} · ${student.grade || ""} ${student.stream || ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/students")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5 mr-1" />
              Statement
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setPaymentFeeId("");
                setPaymentAmount(undefined);
                setShowPaymentDialog(true);
              }}
            >
              <Wallet className="h-3.5 w-3.5 mr-1" />
              Receive Payment
            </Button>
          </div>
        </div>

        {/* Student Info */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg">
                {displayName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">
                  {displayName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {student.admission_number} · {student.grade} {student.stream}
                </p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  {student.parent_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {student.parent_phone}
                    </span>
                  )}
                  {student.parent_name && (
                    <span>Guardian: {student.parent_name}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p
                  className={`text-2xl font-bold ${student.balance > 0 ? "text-red-500" : student.balance < 0 ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {student.balance === 0
                    ? "Cleared"
                    : formatKES(student.balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Fees",
              value: formatKES(totals.totalAmount),
              color: "text-foreground",
            },
            {
              label: "Discount",
              value: formatKES(totals.totalDiscount),
              color: "text-primary",
            },
            {
              label: "Paid",
              value: formatKES(totals.totalPaid),
              color: "text-green-600",
            },
            {
              label: "Balance",
              value:
                totals.totalBalance === 0
                  ? "Cleared"
                  : formatKES(totals.totalBalance),
              color:
                totals.totalBalance > 0 ? "text-red-500" : "text-green-600",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground mb-0.5">
                  {s.label}
                </p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fee Items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Fee Items
              </CardTitle>
              <Badge variant="secondary">{studentFees.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs">
                      Fee Name
                    </TableHead>
                    <TableHead className="font-semibold text-xs">
                      Term
                    </TableHead>
                    <TableHead className="font-semibold text-xs">
                      Due Date
                    </TableHead>
                    <TableHead className="font-semibold text-xs">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-right">
                      Amount
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-right">
                      Paid
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-right">
                      Balance
                    </TableHead>
                    <TableHead className="font-semibold text-xs w-20">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFees.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No fee items assigned yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    studentFees.map((f: any) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium text-sm">
                          {f.fee_name || f.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.term_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.due_date || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColor(f.status)}>
                            {f.status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(f.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {Number(f.paid || 0).toLocaleString()}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${(f.balance || 0) > 0 ? "text-red-500" : "text-muted-foreground"}`}
                        >
                          {Number(f.balance || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {(f.balance || 0) > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] px-2"
                              onClick={() => {
                                setPaymentFeeId(f.id);
                                setPaymentAmount(f.balance);
                                setShowPaymentDialog(true);
                              }}
                            >
                              <Wallet className="h-3 w-3 mr-0.5" />
                              Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {studentFees.length > 0 && (
                  <TableFooter>
                    <TableRow className="bg-muted/70 font-bold">
                      <TableCell colSpan={4}>Total</TableCell>
                      <TableCell className="text-right">
                        {totals.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {totals.totalPaid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {totals.totalBalance.toLocaleString()}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-xs">Date</TableHead>
                  <TableHead className="font-semibold text-xs">
                    Reference
                  </TableHead>
                  <TableHead className="font-semibold text-xs">
                    Method
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-right">
                    Amount (KES)
                  </TableHead>
                  <TableHead className="font-semibold text-xs">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No payments recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentHistory.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.received_at || p.created_at || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.reference_number || p.mpesa_receipt || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {p.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {Number(p.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/10 text-green-600 border-0">
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Payment Allocation History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-xs">Date</TableHead>
                  <TableHead className="font-semibold text-xs">Fee</TableHead>
                  <TableHead className="font-semibold text-xs">Term</TableHead>
                  <TableHead className="font-semibold text-xs">
                    Reference
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-right">
                    Allocated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocationHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No allocations recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  allocationHistory.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.received_at || a.allocated_at || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {a.fee_name || "Fee item"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.term_name || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {a.reference_number || "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {Number(a.amount || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <RecordPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        preselectedStudentId={student.id}
        preselectedFeeId={paymentFeeId || undefined}
        preselectedAmount={paymentAmount}
        studentFees={feeItems}
        onSubmit={handleRecordPayment}
      />
      <FeeAdjustmentDialog
        open={showAdjustmentDialog}
        onOpenChange={setShowAdjustmentDialog}
        fee={adjustmentFee}
        studentName={displayName}
        onSubmit={handleAdjustment}
      />
    </DashboardLayout>
  );
};

export default StudentFees;
