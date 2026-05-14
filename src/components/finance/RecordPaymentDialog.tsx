import { useState, useMemo } from "react";
import {
  Loader2,
  Search,
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStudents } from "@/hooks/useStudents";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

type Step = 1 | 2 | 3 | 4;

interface FeeItem {
  id: string;
  name: string;
  dueAmount: number;
  balance: number;
}

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedStudentId?: string;
  preselectedFeeId?: string;
  preselectedAmount?: number;
  studentFees?: FeeItem[];
  onSubmit?: (data: {
    studentId: string;
    amount: number;
    method: string;
    reference: string;
    feeIds: string[];
    notes: string;
    idempotencyKey: string;
  }) => void;
  isSubmitting?: boolean;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  preselectedStudentId,
  preselectedFeeId,
  preselectedAmount,
  studentFees,
  onSubmit,
  isSubmitting,
}: RecordPaymentDialogProps) {
  const [step, setStep] = useState<Step>(preselectedStudentId ? 2 : 1);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(
    preselectedStudentId || "",
  );
  const [amount, setAmount] = useState(preselectedAmount?.toString() || "");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>(
    preselectedFeeId ? [preselectedFeeId] : [],
  );
  const [allocateMode, setAllocateMode] = useState<"fifo" | "manual">(
    preselectedFeeId ? "manual" : "fifo",
  );
  const [confirmAmount, setConfirmAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `idem-${Date.now()}`,
  );

  const handleClose = (v: boolean) => {
    if (!v) {
      setStep(preselectedStudentId ? 2 : 1);
      setStudentSearch("");
      setSelectedStudentId(preselectedStudentId || "");
      setAmount(preselectedAmount?.toString() || "");
      setMethod("");
      setReference("");
      setNotes("");
      setSelectedFeeIds(preselectedFeeId ? [preselectedFeeId] : []);
      setAllocateMode(preselectedFeeId ? "manual" : "fifo");
      setConfirmAmount("");
      setIdempotencyKey(
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `idem-${Date.now()}`,
      );
    }
    onOpenChange(v);
  };

  const { data: studentsData = [] } = useStudents({
    search: studentSearch || undefined,
  });
  const allStudents = (studentsData as any[]).map((s: any) => ({
    id: s.id,
    full_name: s.full_name || `${s.first_name} ${s.last_name}`,
    admission_no: s.admission_number,
    grade: s.grade || "",
    stream: s.stream || "",
    balance: 0,
  }));

  const selectedStudent = allStudents.find((s) => s.id === selectedStudentId);
  const filteredStudents = allStudents.slice(0, 8);

  // Mock fees for non-preselected student
  const fees: FeeItem[] = studentFees || [
    { id: "f1", name: "Tuition Fee", dueAmount: 25000, balance: 11250 },
    { id: "f2", name: "Exam Fee", dueAmount: 3500, balance: 500 },
    { id: "f3", name: "Library Fee", dueAmount: 500, balance: 525 },
  ];

  const parsedAmount = Number(amount) || 0;

  // Allocation preview — manual mode honours selected order
  const allocationPreview = useMemo(() => {
    let remaining = parsedAmount;
    const targetFees =
      allocateMode === "manual"
        ? (selectedFeeIds
            .map((id) => fees.find((f) => f.id === id))
            .filter(Boolean) as FeeItem[])
        : fees.filter((f) => f.balance > 0);

    return targetFees
      .map((fee) => {
        if (remaining <= 0) return { ...fee, allocated: 0 };
        const allocated = Math.min(fee.balance, remaining);
        remaining -= allocated;
        return { ...fee, allocated };
      })
      .filter((f) => f.allocated > 0);
  }, [parsedAmount, allocateMode, selectedFeeIds, fees]);

  const totalAllocated = allocationPreview.reduce((s, a) => s + a.allocated, 0);
  const overpayment = parsedAmount - totalAllocated;

  const toggleFee = (id: string) => {
    setSelectedFeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };
  const moveFee = (id: string, dir: -1 | 1) => {
    setSelectedFeeIds((prev) => {
      const idx = prev.indexOf(id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const canProceedStep2 = !!selectedStudentId;
  const canProceedStep3 = parsedAmount > 0 && !!method;
  const canConfirm = confirmAmount === parsedAmount.toString();

  const handleSubmit = () => {
    onSubmit?.({
      studentId: selectedStudentId,
      amount: parsedAmount,
      method,
      reference,
      feeIds: allocateMode === "manual" ? selectedFeeIds : [],
      notes,
      idempotencyKey,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Select the student to receive payment for."}
            {step === 2 &&
              "Enter payment details and select allocation method."}
            {step === 3 &&
              "Review how this payment will be allocated to outstanding fees."}
            {step === 4 &&
              "This action cannot be undone. Re-type the amount to confirm."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step > s
                    ? "bg-success text-success-foreground"
                    : step === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle className="h-3.5 w-3.5" /> : s}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {s === 1
                  ? "Student"
                  : s === 2
                    ? "Details"
                    : s === 3
                      ? "Preview"
                      : "Confirm"}
              </span>
              {s < 4 && (
                <div
                  className={`h-px w-6 ${step > s ? "bg-success" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Student */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission number..."
                className="pl-9"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setStep(2);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedStudentId === s.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {s.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.admission_no} · {s.grade} {s.stream}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${s.balance < 0 ? "text-destructive" : "text-success"}`}
                      >
                        {s.balance === 0
                          ? "Cleared"
                          : formatKES(Math.abs(s.balance))}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {s.balance < 0
                          ? "Outstanding"
                          : s.balance > 0
                            ? "Credit"
                            : ""}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button disabled={!canProceedStep2} onClick={() => setStep(2)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {step === 2 && (
          <div className="space-y-4">
            {selectedStudent && (
              <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {selectedStudent.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedStudent.admission_no} · {selectedStudent.grade}{" "}
                    {selectedStudent.stream}
                  </p>
                </div>
                {!preselectedStudentId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="text-xs"
                  >
                    Change
                  </Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (KES) *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference / Receipt No.</Label>
              <Input
                placeholder="Transaction reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {/* Allocation mode */}
            <div className="space-y-3">
              <Label>Fee Allocation</Label>
              <div className="flex gap-2">
                <Button
                  variant={allocateMode === "fifo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setAllocateMode("fifo");
                    setSelectedFeeIds([]);
                  }}
                >
                  Auto (FIFO)
                </Button>
                <Button
                  variant={allocateMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAllocateMode("manual")}
                >
                  Manual Selection
                </Button>
              </div>

              {allocateMode === "manual" &&
                (() => {
                  const outstanding = fees.filter((f) => f.balance > 0);
                  const ordered = [
                    ...(selectedFeeIds
                      .map((id) => outstanding.find((f) => f.id === id))
                      .filter(Boolean) as FeeItem[]),
                    ...outstanding.filter(
                      (f) => !selectedFeeIds.includes(f.id),
                    ),
                  ];
                  return (
                    <div className="space-y-1.5 border rounded-lg p-3">
                      <p className="text-[11px] text-muted-foreground mb-1">
                        Tick fees to allocate to. Use arrows to set priority
                        order.
                      </p>
                      {ordered.map((f, i) => {
                        const checked = selectedFeeIds.includes(f.id);
                        const order = checked
                          ? selectedFeeIds.indexOf(f.id) + 1
                          : null;
                        return (
                          <div
                            key={f.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleFee(f.id)}
                              />
                              {order !== null && (
                                <Badge
                                  variant="secondary"
                                  className="h-5 px-1.5 text-[10px] font-bold"
                                >
                                  {order}
                                </Badge>
                              )}
                              <span className="text-sm font-medium text-foreground">
                                {f.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {formatKES(f.balance)}
                              </span>
                              {checked && (
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    className="h-4 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30"
                                    disabled={
                                      selectedFeeIds.indexOf(f.id) === 0
                                    }
                                    onClick={() => moveFee(f.id, -1)}
                                    aria-label="Move up"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    className="h-4 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30"
                                    disabled={
                                      selectedFeeIds.indexOf(f.id) ===
                                      selectedFeeIds.length - 1
                                    }
                                    onClick={() => moveFee(f.id, 1)}
                                    aria-label="Move down"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {outstanding.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          No outstanding fees.
                        </p>
                      )}
                    </div>
                  );
                })()}
            </div>

            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Textarea
                placeholder="Payment note"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              {!preselectedStudentId && (
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button disabled={!canProceedStep3} onClick={() => setStep(3)}>
                Preview Allocation <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Allocation Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Student</p>
                <p className="font-semibold text-foreground">
                  {selectedStudent?.full_name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold text-foreground">
                  {formatKES(parsedAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Method</p>
                <p className="font-semibold text-foreground capitalize">
                  {method}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Reference</p>
                <p className="font-semibold font-mono text-foreground">
                  {reference || "—"}
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Fee</TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Balance
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Allocated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocationPreview.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{item.name}</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">
                      {formatKES(item.balance)}
                    </TableCell>
                    <TableCell className="text-sm text-right font-semibold text-success">
                      {formatKES(item.allocated)}
                    </TableCell>
                  </TableRow>
                ))}
                {allocationPreview.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-4 text-muted-foreground text-sm"
                    >
                      No outstanding fees to allocate to
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {overpayment > 0 && (
              <Alert>
                <AlertTitle className="text-sm">
                  Overpayment: {formatKES(overpayment)}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  This excess will be recorded as an advance credit for the
                  student.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => {
                  setConfirmAmount("");
                  setStep(4);
                }}
              >
                Proceed to Confirm
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <Alert
              variant="destructive"
              className="border-warning bg-warning/5 text-warning"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Verify Payment Details</AlertTitle>
              <AlertDescription>
                This action cannot be undone. Please verify all details
                carefully.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student</span>
                <span className="font-semibold text-foreground">
                  {selectedStudent?.full_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-foreground">
                  {formatKES(parsedAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize text-foreground">{method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fees Applied</span>
                <span className="text-foreground">
                  {allocationPreview.length} items
                </span>
              </div>
            </div>

            <div>
              <Label className="text-sm">
                Type the amount to confirm:{" "}
                <span className="font-bold">{formatKES(parsedAmount)}</span>
              </Label>
              <Input
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1.5"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                disabled={!canConfirm || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Confirm Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
