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
import {
  usePayments,
  usePaymentStats,
  useRecordPayment,
} from "@/hooks/useFinance";
import { useTerm } from "@/contexts/TermContext";
import { PermissionGate } from "@/components/PermissionGate";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RecordPaymentDialog } from "@/components/finance/RecordPaymentDialog";
import { BulkPaymentImportDialog } from "@/components/payments/BulkPaymentImportDialog";
import { openReceiptPdf } from "@/hooks/useReceipt";
import { VoidPaymentDialog } from "@/components/finance/VoidPaymentDialog";
import { format } from "date-fns";
import { Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

const Payments = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [method, setMethod] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showVoidPayment, setShowVoidPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status, method]);

  const { data: pageData, isLoading } = usePayments({
    search,
    status,
    method,
    page,
    limit,
  });
  const { data: statsData } = usePaymentStats({ search, status, method });
  const payments = pageData?.rows || [];
  const total = pageData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const { selectedTerm } = useTerm();
  const recordPayment = useRecordPayment();

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

  const handleVoidPayment = (_paymentId: string, _reason: string) => {
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
                <p className="text-2xl font-bold">
                  {formatKES(statsData?.total_collected || 0)}
                </p>
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
                <p className="text-2xl font-bold">
                  {formatKES(statsData?.mpesa_total || 0)}
                </p>
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
                <p className="text-2xl font-bold">
                  {statsData?.total_count ?? total}
                </p>
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
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, admission, reference..."
                  className="pl-9 h-9 w-64"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="mpesa_c2b">M-Pesa C2B</SelectItem>
                  <SelectItem value="mpesa_stk">M-Pesa STK</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
              <PermissionGate permission="reports:export">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
              </PermissionGate>
              <PermissionGate permission="payments:import">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkImport(true)}
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Bulk Import
                </Button>
              </PermissionGate>
              <PermissionGate permission="payments:create">
                <Button size="sm" onClick={() => setShowRecordPayment(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Record Payment
                </Button>
              </PermissionGate>
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
                          <PermissionGate permission="payments:receipt">
                            <DropdownMenuItem
                              onClick={() =>
                                openReceiptPdf(p.id).catch((e) =>
                                  toast.error(e.message),
                                )
                              }
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print Receipt
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="payments:reverse">
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
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 border-t">
          <p className="text-xs text-muted-foreground">
            Showing {payments.length === 0 ? 0 : (page - 1) * limit + 1}–
            {(page - 1) * limit + payments.length} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      <RecordPaymentDialog
        open={showRecordPayment}
        onOpenChange={setShowRecordPayment}
        onSubmit={handleRecordPayment}
        isSubmitting={recordPayment.isPending}
      />
      <BulkPaymentImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
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
