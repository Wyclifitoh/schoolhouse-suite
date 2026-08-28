import { useState, useMemo, useEffect, Fragment } from "react";
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
import { useStudentWithFees, useStudents } from "@/hooks/useStudents";
import {
  useFeeDiscounts,
  useRecordPayment,
  useCreateFeeAdjustment,
  useTransferPayment,
  useStudentFeeAdjustments,
  type FeeAdjustmentRow,
} from "@/hooks/useFinance";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTerm } from "@/contexts/TermContext";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentFeesSkeleton } from "@/components/students/StudentPageSkeletons";
import {
  ArrowLeft,
  Wallet,
  Download,
  Phone,
  Receipt,
  AlertTriangle,
  Scale,
  UserRoundCheck,
  PencilLine,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { HistoricalReadOnlyGate } from "@/components/HistoricalReadOnlyGate";
import { useIsHistoricalView } from "@/hooks/useAcademicContext";
import { RecordPaymentDialog } from "@/components/finance/RecordPaymentDialog";
import { FeeAdjustmentDialog } from "@/components/finance/FeeAdjustmentDialog";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Undo2 } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, FileSpreadsheet, Printer } from "lucide-react";
import { openReceiptPdf } from "@/hooks/useReceipt";
import { ExcessAppliedBadge } from "@/components/finance/ExcessAppliedBadge";
import {
  useStudentBalance,
  EMPTY_BALANCE,
} from "@/hooks/useStudentBalance";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const StudentFees = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { selectedTerm, selectedAcademicYear, terms, academicYears } =
    useTerm();
  const isHistorical = useIsHistoricalView();

  // ---------------------------------------------------------------------------
  // PAGE SESSION SCOPE
  // The page has its own Year / Term filter so finance staff can inspect an
  // earlier session WITHOUT changing the school-wide viewing context. It seeds
  // from the global context; "all" = lifetime (session-agnostic) view.
  // Every query below is keyed on this scope, so the KPI cards, fee items,
  // payments and allocations can never describe different periods.
  // ---------------------------------------------------------------------------
  const [scopeYearId, setScopeYearId] = useState<string>("");
  const [scopeTermId, setScopeTermId] = useState<string>("");
  useEffect(() => {
    setScopeYearId((p) => p || selectedAcademicYear?.id || "all");
    setScopeTermId((p) => p || selectedTerm?.id || "all");
  }, [selectedAcademicYear?.id, selectedTerm?.id]);

  const isLifetimeScope = scopeTermId === "all" && scopeYearId === "all";
  const scopeTerm = scopeTermId === "all" ? null : scopeTermId;
  const scopeYear = scopeYearId === "all" ? null : scopeYearId;
  const scopeTermName =
    terms.find((t) => t.id === scopeTerm)?.name ||
    (isLifetimeScope ? "All sessions" : "—");
  const scopeYearName =
    academicYears.find((y) => y.id === scopeYear)?.name ||
    (isLifetimeScope ? "" : "—");
  const scopedTermsForYear = scopeYear
    ? terms.filter((t) => t.academic_year_id === scopeYear)
    : terms;

  /** Shared query-string for every scoped finance call on this page. */
  const scopeParams = () => {
    const p = new URLSearchParams();
    p.set("term_id", scopeTerm || "all");
    p.set("academic_year_id", scopeYear || "all");
    return p;
  };

  const { data: student, isLoading } = useStudentWithFees(studentId, {
    termId: scopeTerm,
    academicYearId: scopeYear,
  });

  const { data: studentFees = [] } = useQuery({
    queryKey: ["student-fee-items", studentId, scopeTerm, scopeYear],
    queryFn: async () => {
      try {
        const data = await api.get<any>(
          `/finance/student-fees/${studentId}?${scopeParams()}`,
        );
        return (data?.data || data || []) as any[];
      } catch {
        return [];
      }
    },
    enabled: !!studentId,
  });

  const { data: paymentHistory = [] } = useQuery({
    queryKey: ["student-payments", studentId, scopeTerm, scopeYear],
    queryFn: async () => {
      try {
        const data = await api.get<any>(
          `/payments?student_id=${studentId}&${scopeParams()}`,
        );
        return (data?.data || data || []) as any[];
      } catch {
        return [];
      }
    },
    enabled: !!studentId,
  });

  const { data: allocationHistory = [] } = useQuery({
    queryKey: ["payment-allocations", studentId, scopeTerm, scopeYear],
    queryFn: async () => {
      try {
        const data = await api.get<any>(
          `/payments/allocations?student_id=${studentId}&${scopeParams()}`,
        );
        return (data?.data || data || []) as any[];
      } catch {
        return [];
      }
    },
    enabled: !!studentId,
  });


  const { data: excessCredits = [], refetch: refetchExcess } = useQuery({
    queryKey: ["student-excess-credits", studentId],
    queryFn: async () => {
      try {
        const data = await api.get<any>(
          `/finance/excess-credits?student_id=${studentId}&status=pending`,
        );
        return (data?.data || data || []) as any[];
      } catch {
        return [];
      }
    },
    enabled: !!studentId,
  });

  // Lifetime summary — deliberately session-agnostic. Always shows every-term
  // totals even when the page is viewing a specific term.
  const { data: lifetime } = useQuery({
    queryKey: ["student-fees-lifetime", studentId],
    queryFn: async () => {
      try {
        const data = await api.get<any>(
          `/finance/student-fees/${studentId}/lifetime`,
        );
        return (data?.data || data || null) as {
          totalBilled: number;
          totalDiscount: number;
          totalPaid: number;
          totalBalance: number;
          yearBreakdown: {
            year: string;
            billed: number;
            paid: number;
            balance: number;
          }[];
        } | null;
      } catch {
        return null;
      }
    },
    enabled: !!studentId,
  });

  const [showLifetime, setShowLifetime] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const [paymentFeeId, setPaymentFeeId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | undefined>();
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentFee, setAdjustmentFee] = useState<any>(null);
  const recordPayment = useRecordPayment();
  const createAdjustment = useCreateFeeAdjustment();

  // Adjustment trail — makes every change to a bill visible on the profile.
  // Scoped to the page's Year/Term filter so it can never describe a different
  // session than the fee items shown above it.
  const { data: allAdjustments = [] } = useStudentFeeAdjustments(studentId);
  const adjustments = useMemo(() => {
    if (isLifetimeScope) return allAdjustments;
    return allAdjustments.filter((a) => {
      if (scopeTerm && a.term_id && a.term_id !== scopeTerm) return false;
      if (scopeYear && a.academic_year_id && a.academic_year_id !== scopeYear)
        return false;
      return true;
    });
  }, [allAdjustments, isLifetimeScope, scopeTerm, scopeYear]);
  const adjustmentsByFee = useMemo(() => {
    const map: Record<string, FeeAdjustmentRow[]> = {};
    for (const a of adjustments) {
      if (!a.student_fee_id) continue;
      (map[a.student_fee_id] ||= []).push(a);
    }
    return map;
  }, [adjustments]);
  const adjustmentLabel = (t: string) =>
    ({
      increase: "Increased",
      decrease: "Reduced",
      waive: "Waived",
    })[t] || t;
  const transferPayment = useTransferPayment();
  const { data: transferStudents = [] } = useStudents({
    status: "active",
    enabled: true,
  });
  const qc = useQueryClient();
  const [showRebalanceConfirm, setShowRebalanceConfirm] = useState(false);
  const rebalanceMutation = useMutation({
    mutationFn: () =>
      api.post<any>(`/finance/students/${studentId}/rebalance`, {}),
    onSuccess: (res: any) => {
      const d = res?.data || res || {};
      const corrected = d.overpayments_corrected || 0;
      const moved = Number(d.total_excess_moved || 0);
      const applied = Number(d.excess_auto_applied || 0);
      const remaining = Number(d.remaining_excess || 0);
      if (corrected === 0 && d.status_normalised === 0) {
        toast.success("Already balanced — no inconsistencies found.");
      } else {
        toast.success(
          `Rebalanced: ${corrected} overpayment(s), KES ${moved.toLocaleString()} moved to excess` +
            (applied > 0
              ? `, KES ${applied.toLocaleString()} auto-applied`
              : "") +
            (remaining > 0
              ? `, KES ${remaining.toLocaleString()} remaining excess.`
              : "."),
        );
      }
      setShowRebalanceConfirm(false);
      qc.invalidateQueries({ queryKey: ["student-fee-items", studentId] });
      qc.invalidateQueries({ queryKey: ["student-payments", studentId] });
      qc.invalidateQueries({ queryKey: ["payment-allocations", studentId] });
      qc.invalidateQueries({ queryKey: ["student-excess-credits", studentId] });
    },
    onError: (e: Error) => toast.error(e.message || "Rebalance failed"),
  });

  const [revertTarget, setRevertTarget] = useState<any | null>(null);
  const [transferTarget, setTransferTarget] = useState<any | null>(null);
  const [transferStudentId, setTransferStudentId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [revertMode, setRevertMode] = useState<"excess" | "auto_apply">(
    "excess",
  );
  const [revertReason, setRevertReason] = useState("");
  const revertMutation = useMutation({
    mutationFn: ({
      id,
      mode,
      reason,
    }: {
      id: string;
      mode: string;
      reason: string;
    }) => api.post(`/payments/${id}/revert`, { mode, reason }),
    onSuccess: () => {
      toast.success("Payment reverted");
      setRevertTarget(null);
      setRevertReason("");
      qc.invalidateQueries({ queryKey: ["student-payments", studentId] });
      qc.invalidateQueries({ queryKey: ["student-fee-items", studentId] });
      qc.invalidateQueries({ queryKey: ["payment-allocations", studentId] });
      qc.invalidateQueries({ queryKey: ["student-excess-credits", studentId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleTransferPayment = async () => {
    if (!transferTarget) return;
    await transferPayment.mutateAsync({
      paymentId: transferTarget.id,
      toStudentId: transferStudentId,
      reason: transferReason,
    });
    setTransferTarget(null);
    setTransferStudentId("");
    setTransferReason("");
    qc.invalidateQueries({ queryKey: ["student-with-fees", studentId] });
  };

  // ---------------------------------------------------------------------------
  // SINGLE SOURCE OF TRUTH
  // All figures below come from the backend balance engine (derived from the
  // payment/allocation trail). Nothing on this screen recomputes a balance.
  // ---------------------------------------------------------------------------
  const { data: balanceData } = useStudentBalance(studentId, {
    termId: scopeTerm,
  });

  const current = balanceData?.current || EMPTY_BALANCE;

  const excessAvailable = current.excess_available;

  const totals = useMemo(
    () => ({
      totalAmount: current.charges,
      totalDiscount: current.discounts,
      totalPaid: current.paid,
      totalReceived: current.received,
      totalBalance: current.balance,
      totalAllocated: current.allocated,
      advanceCredit: current.excess_available,
    }),
    [current],
  );

  // Canonical status straight from the engine. "advance" kept as an alias of
  // the engine's "credit" so existing JSX branches keep working.
  const overallStatus = useMemo(
    () => (current.status === "credit" ? "advance" : current.status),
    [current.status],
  );


  const applyExcess = async (creditId: string) => {
    try {
      await api.post(`/finance/excess-credits/${creditId}/apply`, {});
      toast.success("Excess credit applied to outstanding fees");
      refetchExcess();
    } catch (e: any) {
      toast.error(e?.message || "Failed to apply excess");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading fees..." subtitle="">
        <StudentFeesSkeleton />
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
        term_id: data.termId || selectedTerm?.id || null,
        academic_year_id: data.academicYearId || null,
        idempotency_key: data.idempotencyKey,
      });
      setShowPaymentDialog(false);
    } catch {
      /* toast handled in hook */
    }
  };

  const handleAdjustment = async (data: {
    feeId: string;
    adjustmentType: string;
    amount: number;
    reason: string;
  }) => {
    try {
      await createAdjustment.mutateAsync({
        student_fee_id: data.feeId,
        adjustment_type: data.adjustmentType,
        amount: Number(data.amount) || 0,
        reason: data.reason,
      });
      setShowAdjustmentDialog(false);
      setAdjustmentFee(null);
    } catch {
      /* toast handled in hook */
    }
  };

  const downloadStatement = async (format: "pdf" | "excel") => {
    if (!studentId) return;
    try {
      const token = api.getToken();
      const schoolId = localStorage.getItem("chuo-school-id") || "";
      const base =
        (import.meta as any).env?.VITE_API_URL ||
        "https://api.chuoflow.co.ke/api/v1";
      const params = new URLSearchParams();
      params.set("format", format);
      // Statement must match exactly what this page shows.
      params.set("term_id", scopeTerm || "all");
      params.set("academic_year_id", scopeYear || "all");

      const res = await fetch(
        `${base}/finance/student-fees/${studentId}/statement?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-School-ID": schoolId,
          },
        },
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fee-statement-${student?.admission_number || studentId}.${
        format === "excel" ? "xlsx" : "pdf"
      }`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Statement downloaded`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to download statement");
    }
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
            <PermissionGate permission="reports:export">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Statement
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => downloadStatement("pdf")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadStatement("excel")}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionGate>
            <HistoricalReadOnlyGate>
              <PermissionGate permission="payments:create">
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
              </PermissionGate>
              <PermissionGate permission="finance:fees:waive">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRebalanceConfirm(true)}
                  title="Detect overpayments and move excess to credits"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Rebalance
                </Button>
              </PermissionGate>
            </HistoricalReadOnlyGate>
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
                <p className="text-xs text-muted-foreground">
                  {totals.totalBalance < 0 ? "Advance Credit" : "Balance"}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    totals.totalBalance > 0
                      ? "text-red-500"
                      : totals.totalBalance < 0
                        ? "text-green-600"
                        : totals.totalAmount > 0
                          ? "text-green-600"
                          : "text-muted-foreground"
                  }`}
                >
                  {overallStatus === "no_fees"
                    ? "No Fees"
                    : overallStatus === "paid"
                      ? "Cleared"
                      : formatKES(totals.totalBalance)}
                </p>
                <Badge
                  className={`mt-1 ${statusColor(overallStatus === "advance" ? "paid" : overallStatus)}`}
                >
                  {overallStatus === "no_fees"
                    ? "No fees assigned"
                    : overallStatus === "paid"
                      ? "Paid"
                      : overallStatus === "advance"
                        ? "Advance Credit"
                        : overallStatus === "partial"
                          ? "Partial"
                          : "Pending"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session scope — drives every figure on this page */}
        <div className="flex items-end justify-between gap-3 flex-wrap -mb-2">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Academic year
              </p>
              <Select
                value={scopeYearId}
                onValueChange={(v) => {
                  setScopeYearId(v);
                  setScopeTermId("all");
                }}
              >
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue placeholder="Academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years (lifetime)</SelectItem>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Term
              </p>
              <Select value={scopeTermId} onValueChange={setScopeTermId}>
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All terms</SelectItem>
                  {scopedTermsForYear.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-muted-foreground pb-1">
            Figures shown for:{" "}
            <span className="font-semibold text-foreground">
              {isLifetimeScope
                ? "All academic sessions"
                : `${scopeYearName} · ${scopeTermName}`}
            </span>
            {isHistorical && (
              <Badge
                variant="outline"
                className="ml-2 border-warning/40 text-warning"
              >
                Historical · Read-only
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              label: "Total Payable",
              value: formatKES(totals.totalAmount),
              color: "text-foreground",
            },
            {
              label: "Discount",
              value: formatKES(totals.totalDiscount),
              color: "text-primary",
            },
            {
              label: "Total Paid",
              value: formatKES(totals.totalPaid),
              color: "text-green-600",
            },
            {
              label: "Balance",
              value:
                overallStatus === "no_fees"
                  ? "—"
                  : totals.totalBalance === 0
                    ? "Cleared"
                    : formatKES(totals.totalBalance),
              color:
                totals.totalBalance > 0 ? "text-red-500" : "text-green-600",
            },
            {
              label: "Excess Available",
              value:
                totals.advanceCredit > 0
                  ? formatKES(totals.advanceCredit)
                  : "—",
              color:
                totals.advanceCredit > 0
                  ? "text-green-600"
                  : "text-muted-foreground",
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

        {totals.advanceCredit > 0 && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <Scale className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="flex-1 text-foreground">
                <strong>{formatKES(totals.advanceCredit)}</strong> in excess
                credit is available.{" "}
                {totals.totalBalance > 0
                  ? "Apply it to clear outstanding fees."
                  : "It will auto-apply when new fees are assigned."}
              </span>
              {totals.totalBalance > 0 && excessCredits.length > 0 && (
                <HistoricalReadOnlyGate>
                  <PermissionGate permission="finance:fees:waive">
                    <div className="flex flex-wrap gap-2">
                      {excessCredits.map((c: any) => (
                        <Button
                          key={c.id}
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => applyExcess(c.id)}
                        >
                          Apply {formatKES(Number(c.amount))}
                        </Button>
                      ))}
                    </div>
                  </PermissionGate>
                </HistoricalReadOnlyGate>
              )}
            </CardContent>
          </Card>
        )}

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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{f.fee_name || f.name}</span>
                            {(() => {
                              const list = adjustmentsByFee[f.id] || [];
                              const applied = list.filter(
                                (a) => a.approval_status === "approved",
                              );
                              const pending = list.filter(
                                (a) => a.approval_status === "pending",
                              );
                              if (!applied.length && !pending.length)
                                return null;
                              const latest = applied[0] || pending[0];
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className={
                                          applied.length
                                            ? "text-[10px] gap-1 border-warning bg-warning text-warning-foreground font-semibold"
                                            : "text-[10px] gap-1 border-info bg-info text-info-foreground font-semibold"
                                        }
                                      >
                                        <PencilLine className="h-3 w-3" />
                                        {applied.length
                                          ? `Adjusted${applied.length > 1 ? ` ×${applied.length}` : ""}`
                                          : "Adjustment pending"}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs space-y-1">
                                      <p className="font-semibold">
                                        {adjustmentLabel(
                                          latest.adjustment_type,
                                        )}{" "}
                                        {formatKES(
                                          Number(latest.previous_amount || 0),
                                        )}{" "}
                                        →{" "}
                                        {formatKES(
                                          Number(latest.new_amount || 0),
                                        )}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {latest.reason}
                                      </p>
                                      {pending.length > 0 && (
                                        <p className="text-muted-foreground">
                                          Awaiting approval
                                        </p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })()}
                            <ExcessAppliedBadge
                              amount={f.from_excess_amount}
                            />
                          </div>

                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {f.term_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.due_date ? formatDate(f.due_date) : "—"}
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
                          <HistoricalReadOnlyGate>
                            <div className="flex gap-1">
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
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[11px] px-2"
                                onClick={() => {
                                  setAdjustmentFee({
                                    id: f.id,
                                    name: f.fee_name || f.name || "Fee",
                                    currentAmount: Number(f.amount || 0),
                                    amountPaid: Number(f.paid || 0),
                                  });
                                  setShowAdjustmentDialog(true);
                                }}
                              >
                                Adjust
                              </Button>
                            </div>
                          </HistoricalReadOnlyGate>
                          {isHistorical && (
                            <span className="text-[11px] text-muted-foreground">
                              Read-only
                            </span>
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

        {/* Adjustment trail — an adjusted bill must never be silent. */}
        {adjustments.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PencilLine className="h-4 w-4 text-primary" />
                  Fee Adjustments
                </CardTitle>
                <Badge variant="secondary">{adjustments.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Every change made to this student's bill. Approved adjustments
                automatically release any money that was tied to the old amount,
                so balances above already reflect them.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-semibold">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Fee
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Term
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Change
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        From → To
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Reason
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(a.created_at)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {a.fee_name || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.term_name || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {adjustmentLabel(a.adjustment_type)}
                        </TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">
                          <span className="text-muted-foreground line-through">
                            {formatKES(Number(a.previous_amount || 0))}
                          </span>{" "}
                          <span className="font-semibold">
                            {formatKES(Number(a.new_amount || 0))}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs max-w-xs">
                          {a.reason}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              a.approval_status === "approved"
                                ? "default"
                                : a.approval_status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-[10px] capitalize"
                          >
                            {a.approval_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Lifetime summary — hidden by default. Mixing lifetime totals with
            the term figures above is exactly what made staff read the wrong
            balance, so it is an explicit, clearly-labelled opt-in. */}
        {lifetime && lifetime.totalBilled > 0 && !showLifetime && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-xs text-muted-foreground gap-2"
            onClick={() => setShowLifetime(true)}
          >
            <Scale className="h-3.5 w-3.5" />
            Show lifetime summary (all academic sessions)
          </Button>
        )}
        {lifetime && lifetime.totalBilled > 0 && showLifetime && (
          <Card className="border-dashed">

            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <Scale className="h-4 w-4" />
                Lifetime Summary (all academic sessions)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Total Billed
                  </p>
                  <p className="text-base font-semibold">
                    {formatKES(lifetime.totalBilled)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Discounts</p>
                  <p className="text-base font-semibold text-primary">
                    {formatKES(lifetime.totalDiscount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Total Paid
                  </p>
                  <p className="text-base font-semibold text-green-600">
                    {formatKES(lifetime.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Outstanding
                  </p>
                  <p
                    className={`text-base font-semibold ${
                      lifetime.totalBalance > 0
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {lifetime.totalBalance === 0
                      ? "Cleared"
                      : formatKES(lifetime.totalBalance)}
                  </p>
                </div>
              </div>
              {lifetime.yearBreakdown?.length > 1 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-[11px]">
                          Academic Year
                        </TableHead>
                        <TableHead className="text-[11px] text-right">
                          Billed
                        </TableHead>
                        <TableHead className="text-[11px] text-right">
                          Paid
                        </TableHead>
                        <TableHead className="text-[11px] text-right">
                          Balance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lifetime.yearBreakdown.map((y) => (
                        <TableRow key={y.year}>
                          <TableCell className="text-sm">{y.year}</TableCell>
                          <TableCell className="text-sm text-right">
                            {Number(y.billed).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-right text-green-600">
                            {Number(y.paid).toLocaleString()}
                          </TableCell>
                          <TableCell
                            className={`text-sm text-right ${
                              y.balance > 0
                                ? "text-red-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {Number(y.balance).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                  <TableHead className="font-semibold text-xs w-20 text-right">
                    Receipt
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No payments recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentHistory.map((p: any) => {
                    const allocs = (allocationHistory as any[]).filter(
                      (a) => a.payment_id === p.id,
                    );
                    const allocated = allocs.reduce(
                      (sum, a) => sum + Number(a.amount || 0),
                      0,
                    );
                    const unallocated = Math.max(
                      0,
                      Number(p.amount || 0) - allocated,
                    );
                    return (
                      <Fragment key={p.id}>
                        <TableRow key={p.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(p.received_at || p.created_at)}
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
                            <Badge
                              className={statusColor(
                                p.status === "completed" ||
                                  p.status === "succeeded"
                                  ? "paid"
                                  : p.status === "unallocated"
                                    ? "overdue"
                                    : p.status,
                              )}
                            >
                              {p.status || "completed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Print receipt"
                              onClick={() =>
                                openReceiptPdf(p.id).catch((e) =>
                                  toast.error(e.message),
                                )
                              }
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            {p.status !== "reversed" && (
                              <HistoricalReadOnlyGate>
                                <PermissionGate permission="payments:reverse">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive"
                                    title="Revert payment"
                                    onClick={() => {
                                      setRevertTarget(p);
                                      setRevertMode("excess");
                                      setRevertReason("");
                                    }}
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </Button>
                                </PermissionGate>
                              </HistoricalReadOnlyGate>
                            )}
                            {p.status !== "reversed" && (
                              <HistoricalReadOnlyGate>
                                <PermissionGate permission="payments:update">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-primary"
                                    title="Transfer payment to another student"
                                    onClick={() => {
                                      setTransferTarget(p);
                                      setTransferStudentId("");
                                      setTransferReason("");
                                    }}
                                  >
                                    <UserRoundCheck className="h-4 w-4" />
                                  </Button>
                                </PermissionGate>
                              </HistoricalReadOnlyGate>
                            )}
                          </TableCell>
                        </TableRow>
                        {(allocs.length > 0 || unallocated > 0) && (
                          <TableRow
                            key={`${p.id}-alloc`}
                            className="bg-muted/20"
                          >
                            <TableCell colSpan={6} className="py-2">
                              <div className="text-[11px] text-muted-foreground space-y-0.5 pl-4">
                                {allocs.map((a: any) => (
                                  <div
                                    key={a.id}
                                    className="flex justify-between"
                                  >
                                    <span>
                                      → {a.fee_name || "Fee"}
                                      {a.term_name ? ` (${a.term_name})` : ""}
                                    </span>
                                    <span className="font-mono text-green-600">
                                      {Number(a.amount).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                                {unallocated > 0 && (
                                  <div className="flex justify-between text-orange-500">
                                    <span>→ Unallocated (excess credit)</span>
                                    <span className="font-mono">
                                      {unallocated.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
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
                        {formatDateTime(a.received_at || a.allocated_at)}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {Number(a.amount || 0).toLocaleString()}
                          {a.from_excess ? (
                            <ExcessAppliedBadge amount={a.amount} />
                          ) : null}
                        </div>
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
        isSubmitting={createAdjustment.isPending}
      />
      <Dialog
        open={!!revertTarget}
        onOpenChange={(o) => !o && setRevertTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5 text-destructive" /> Revert Payment
            </DialogTitle>
            <DialogDescription>
              The payment record is preserved for audit. Its allocations will be
              removed from the fee(s) they touched.
            </DialogDescription>
          </DialogHeader>
          {revertTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-muted/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <strong>{formatKES(Number(revertTarget.amount || 0))}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">
                    {revertTarget.reference_number ||
                      revertTarget.mpesa_receipt ||
                      "—"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Where should the reverted amount go?
                </Label>
                <RadioGroup
                  value={revertMode}
                  onValueChange={(v: any) => setRevertMode(v)}
                >
                  <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value="excess" />
                    <div>
                      <div className="font-medium text-sm">
                        Move to Excess Payments
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Park the full amount as an unallocated credit on the
                        student's account.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value="auto_apply" />
                    <div>
                      <div className="font-medium text-sm">
                        Auto-apply to next unpaid fees
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Re-allocate to outstanding fees FIFO (oldest due first).
                        Any remainder becomes excess credit.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason (optional)</Label>
                <Textarea
                  rows={2}
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  placeholder="e.g. Wrong student / duplicate payment"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevertTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revertMutation.isPending}
              onClick={() =>
                revertTarget &&
                revertMutation.mutate({
                  id: revertTarget.id,
                  mode: revertMode,
                  reason: revertReason,
                })
              }
            >
              {revertMutation.isPending ? "Reverting…" : "Confirm Revert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!transferTarget}
        onOpenChange={(o) => !o && setTransferTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRoundCheck className="h-5 w-5 text-primary" /> Transfer
              Payment
            </DialogTitle>
            <DialogDescription>
              The current student's allocations and excess are reversed, then
              the same payment is reallocated to the selected student.
            </DialogDescription>
          </DialogHeader>
          {transferTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-muted/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <strong>
                    {formatKES(Number(transferTarget.amount || 0))}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">
                    {transferTarget.reference_number ||
                      transferTarget.mpesa_receipt ||
                      "—"}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Transfer to student *</Label>
                <Select
                  value={transferStudentId}
                  onValueChange={setTransferStudentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {(transferStudents as any[])
                      .filter((s) => s.id !== studentId)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name || `${s.first_name} ${s.last_name}`} ·{" "}
                          {s.admission_number}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reason (min 20 characters) *</Label>
                <Textarea
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Payment was allocated to the wrong student"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                !transferStudentId ||
                transferReason.trim().length < 20 ||
                transferPayment.isPending
              }
              onClick={handleTransferPayment}
            >
              {transferPayment.isPending ? "Transferring…" : "Transfer Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={showRebalanceConfirm}
        onOpenChange={setShowRebalanceConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Rebalance {displayName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This scans every fee for this student and rectifies any
              inconsistency:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>
                  Where a fee has been paid more than its due amount, the
                  overpayment is moved to Excess Payments as an advance credit.
                </li>
                <li>
                  The new credit is auto-applied to the next unpaid fees (oldest
                  first). Any remainder stays as excess.
                </li>
                <li>
                  Fee statuses (paid / partial / pending) are normalised to
                  match actual figures.
                </li>
              </ul>
              The action is fully logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rebalanceMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                rebalanceMutation.mutate();
              }}
              disabled={rebalanceMutation.isPending}
            >
              {rebalanceMutation.isPending
                ? "Rebalancing…"
                : "Confirm Rebalance"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default StudentFees;
