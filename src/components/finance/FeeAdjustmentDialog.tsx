import { useState } from "react";
import { Loader2, AlertTriangle, Scale } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";


const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

interface FeeInfo {
  id: string;
  name: string;
  currentAmount: number;
  amountPaid: number;
}

interface FeeAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: FeeInfo | null;
  studentName: string;
  onSubmit?: (data: {
    feeId: string;
    adjustmentType: string;
    amount: number;
    reason: string;
  }) => void;
  isSubmitting?: boolean;
}

export function FeeAdjustmentDialog({
  open,
  onOpenChange,
  fee,
  studentName,
  onSubmit,
  isSubmitting,
}: FeeAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const handleClose = (v: boolean) => {
    if (!v) {
      setAdjustmentType("");
      setAmount("");
      setReason("");
      setStep(1);
    }
    onOpenChange(v);
  };

  if (!fee) return null;

  const parsedAmount = Number(amount) || 0;
  const newAmount =
    adjustmentType === "increase" ? fee.currentAmount + parsedAmount :
    adjustmentType === "decrease" ? Math.max(fee.currentAmount - parsedAmount, 0) :
    adjustmentType === "waive" ? 0 : fee.currentAmount;

  const canProceed = adjustmentType && (adjustmentType === "waive" || parsedAmount > 0) && reason.length >= 20;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Fee Adjustment
          </DialogTitle>
          <DialogDescription>
            Adjust fee amount for {studentName}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            {/* Current fee info */}
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-semibold text-foreground">{fee.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Amount</span>
                <span className="font-bold text-foreground">{formatKES(fee.currentAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Paid</span>
                <span className="text-success font-semibold">{formatKES(fee.amountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className="text-destructive font-semibold">{formatKES(fee.currentAmount - fee.amountPaid)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Type *</Label>
              <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase Amount</SelectItem>
                  <SelectItem value="decrease">Decrease Amount</SelectItem>
                  <SelectItem value="waive">Full Waiver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {adjustmentType && adjustmentType !== "waive" && (
              <div className="space-y-2">
                <Label>{adjustmentType === "increase" ? "Amount to Add" : "Amount to Reduce"} (KES) *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            )}

            {adjustmentType && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Amount</span>
                  <span className={`font-bold ${adjustmentType === "waive" ? "text-muted-foreground line-through" : adjustmentType === "increase" ? "text-destructive" : "text-success"}`}>
                    {formatKES(newAmount)}
                  </span>
                </div>
                {adjustmentType === "waive" && (
                  <Badge className="bg-warning/10 text-warning border-0 mt-2">Full waiver — fee will be marked as KES 0</Badge>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason (min 20 characters) *</Label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Provide a detailed reason for this adjustment..."
                rows={3}
              />
              {reason.length > 0 && reason.length < 20 && (
                <p className="text-xs text-destructive">{20 - reason.length} more characters required</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button disabled={!canProceed} onClick={() => setStep(2)}>
                Review Adjustment
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive" className="border-warning bg-warning/5 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Confirm Adjustment</AlertTitle>
              <AlertDescription>
                This will be logged in the audit trail and may require approval.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student</span>
                <span className="font-semibold text-foreground">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee</span>
                <span className="text-foreground">{fee.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary" className="capitalize">{adjustmentType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous</span>
                <span className="text-foreground">{formatKES(fee.currentAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Amount</span>
                <span className="font-bold text-foreground">{formatKES(newAmount)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Reason</span>
                <span className="text-foreground text-right max-w-[200px]">{reason}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                disabled={isSubmitting}
                onClick={() => onSubmit?.({
                  feeId: fee.id,
                  adjustmentType,
                  amount: adjustmentType === "waive" ? fee.currentAmount : parsedAmount,
                  reason,
                })}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Confirm Adjustment"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
