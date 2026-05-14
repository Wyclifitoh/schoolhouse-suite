import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePayments, useRecordPayment } from "@/hooks/useFinance";
import { useTerm } from "@/contexts/TermContext";
import {
  Search,
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  Plus,
  MoreHorizontal,
  Eye,
  XCircle,
  Printer,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RecordPaymentDialog } from "@/components/finance/RecordPaymentDialog";
import { VoidPaymentDialog } from "@/components/finance/VoidPaymentDialog";
import { format } from "date-fns";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

const Payments = () => {
  const [search, setSearch] = useState("");
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showVoidPayment, setShowVoidPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data: payments = [], isLoading } = usePayments({ search });
  const { selectedTerm } = useTerm();
  const recordPayment = useRecordPayment();

  const total = payments.reduce(
    (s: number, p: any) => s + (p.status === "completed" ? p.amount : 0),
    0,
  );
  const mpesaTotal = payments
    .filter((p: any) => p.payment_method?.includes("mpesa"))
    .reduce((s: number, p: any) => s + p.amount, 0);

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
      setShowRecordPayment(false);
    } catch {
      /* toast handled in hook */
    }
  };

  const handleVoidPayment = (paymentId: string, reason: string) => {
    toast.success("Payment voided successfully");
    setShowVoidPayment(false);
    setSelectedPayment(null);
  };

  return (
    <DashboardLayout
      title="Payments"
      subtitle="Track and manage all payment transactions"
    >
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Banknote className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">{formatKES(total)}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Smartphone className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                M-Pesa Collections
              </p>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">{formatKES(mpesaTotal)}</p>
              )}
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
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{payments.length}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">
              All Payments
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 h-9 w-56"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Button size="sm" onClick={() => setShowRecordPayment(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Record Payment
              </Button>
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
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p: any) => (
                  <TableRow key={p.id} className="group">
                    <TableCell className="font-medium">
                      {p.student_name}
                    </TableCell>
                    <TableCell className="font-semibold text-success">
                      {formatKES(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {p.payment_method?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.reference_number || p.mpesa_receipt || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.received_at
                        ? format(new Date(p.received_at), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          p.status === "completed"
                            ? "bg-success/10 text-success border-0"
                            : p.status === "reversed"
                              ? "bg-destructive/10 text-destructive border-0"
                              : "bg-warning/10 text-warning border-0"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toast.success("Receipt printed")}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {p.status === "completed" && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedPayment(p);
                                setShowVoidPayment(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Void Payment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RecordPaymentDialog
        open={showRecordPayment}
        onOpenChange={setShowRecordPayment}
        onSubmit={handleRecordPayment}
        isSubmitting={recordPayment.isPending}
      />
      <VoidPaymentDialog
        open={showVoidPayment}
        onOpenChange={setShowVoidPayment}
        payment={
          selectedPayment
            ? {
                id: selectedPayment.id,
                studentName: selectedPayment.student_name,
                amount: selectedPayment.amount,
                method: selectedPayment.payment_method,
                reference: selectedPayment.reference_number || "",
                date: selectedPayment.received_at,
              }
            : null
        }
        onConfirm={handleVoidPayment}
      />
    </DashboardLayout>
  );
};

export default Payments;
