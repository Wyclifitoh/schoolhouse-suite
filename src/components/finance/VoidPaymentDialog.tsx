import { useState } from "react";
import { AlertTriangle, Loader2, ShieldAlert, Lock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

interface PaymentInfo {
  id: string;
  studentName: string;
  amount: number;
  method: string;
  reference: string;
  date: string;
}

interface VoidPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentInfo | null;
  onConfirm: (paymentId: string, reason: string) => void;
  isSubmitting?: boolean;
  hasPermission?: boolean;
}

export function VoidPaymentDialog({
  open,
  onOpenChange,
  payment,
  onConfirm,
  isSubmitting,
  hasPermission = true,
}: VoidPaymentDialogProps) {
  const [reason, setReason] = useState("");
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const handleClose = (v: boolean) => {
    if (!v) {
      setReason("");
      setReAuthPassword("");
      setStep(1);
    }
    onOpenChange(v);
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Void Payment
          </DialogTitle>
          <DialogDescription>
            This will reverse all allocations and update student balances.
          </DialogDescription>
        </DialogHeader>

        {!hasPermission ? (
          <div className="space-y-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Insufficient Permissions</AlertTitle>
              <AlertDescription>
                Contact a finance administrator to void this payment.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            {/* Payment summary */}
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student</span>
                <span className="font-semibold text-foreground">{payment.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-foreground">{formatKES(payment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <Badge variant="secondary" className="capitalize">{payment.method}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs text-foreground">{payment.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{payment.date}</span>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Irreversible Action</AlertTitle>
              <AlertDescription className="text-xs">
                Voiding this payment will:
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Reverse all fee allocations ({formatKES(payment.amount)})</li>
                  <li>Update the student's outstanding balance</li>
                  <li>Create a permanent audit trail entry</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Reason for voiding (min 20 characters) *</Label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Provide a detailed reason for this reversal..."
                rows={3}
              />
              {reason.length > 0 && reason.length < 20 && (
                <p className="text-xs text-destructive">{20 - reason.length} more characters required</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={reason.length < 20}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive" className="border-warning bg-warning/5 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Final Confirmation</AlertTitle>
              <AlertDescription>
                Enter your password to confirm the reversal of {formatKES(payment.amount)}.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Enter your password to confirm</Label>
              <Input
                type="password"
                value={reAuthPassword}
                onChange={e => setReAuthPassword(e.target.value)}
                placeholder="Your account password"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                variant="destructive"
                disabled={!reAuthPassword || isSubmitting}
                onClick={() => onConfirm(payment.id, reason)}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Voiding...
                  </span>
                ) : (
                  "Void Payment"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
