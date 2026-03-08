import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AllocationPreviewItem {
  feeName: string;
  dueAmount: number;
  allocatedAmount: number;
}

interface PaymentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  allocationPreview: AllocationPreviewItem[];
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

export function PaymentConfirmDialog({
  open,
  onOpenChange,
  studentName,
  amount,
  paymentMethod,
  referenceNumber,
  allocationPreview,
  onConfirm,
  isSubmitting,
}: PaymentConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmAmount, setConfirmAmount] = useState("");

  const handleClose = (v: boolean) => {
    if (!v) {
      setStep(1);
      setConfirmAmount("");
    }
    onOpenChange(v);
  };

  const totalAllocated = allocationPreview.reduce((s, a) => s + a.allocatedAmount, 0);
  const overpayment = amount - totalAllocated;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Review Allocation" : "Confirm Payment"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Review how this payment will be allocated to outstanding fees."
              : "This action cannot be undone. Re-type the amount to confirm."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Student</p>
                <p className="font-semibold text-foreground">{studentName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold text-foreground">{formatKES(amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Method</p>
                <p className="font-semibold text-foreground capitalize">{paymentMethod}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reference</p>
                <p className="font-semibold font-mono text-foreground">{referenceNumber}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Fee</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Due</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Allocated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocationPreview.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{item.feeName}</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">{formatKES(item.dueAmount)}</TableCell>
                    <TableCell className="text-sm text-right font-semibold text-success">{formatKES(item.allocatedAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {overpayment > 0 && (
              <Alert>
                <AlertTitle className="text-sm">Overpayment: {formatKES(overpayment)}</AlertTitle>
                <AlertDescription className="text-xs">
                  This excess will be recorded as an advance credit for the student.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={() => setStep(2)}>Proceed to Confirm</Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Alert variant="destructive" className="border-warning bg-warning/5 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Verify Payment Details</AlertTitle>
              <AlertDescription>
                This action cannot be undone. Please verify all details carefully.
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-sm">
                Type the amount to confirm: <span className="font-bold">{formatKES(amount)}</span>
              </Label>
              <Input
                value={confirmAmount}
                onChange={e => setConfirmAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1.5"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                disabled={confirmAmount !== amount.toString() || isSubmitting}
                onClick={onConfirm}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Confirm Payment"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
