import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { recentPayments } from "@/data/mockData";
import { Search, Download, CreditCard, Banknote, Smartphone, Plus, MoreHorizontal, Eye, XCircle, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RecordPaymentDialog } from "@/components/finance/RecordPaymentDialog";
import { VoidPaymentDialog } from "@/components/finance/VoidPaymentDialog";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

const Payments = () => {
  const [search, setSearch] = useState("");
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showVoidPayment, setShowVoidPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    id: string; studentName: string; amount: number; method: string; reference: string; date: string;
  } | null>(null);

  const filtered = recentPayments.filter((p) =>
    p.student_name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  const total = recentPayments.reduce((s, p) => s + p.amount, 0);
  const mpesaTotal = recentPayments.filter((p) => p.method === "M-Pesa").reduce((s, p) => s + p.amount, 0);

  const handleRecordPayment = (data: any) => {
    toast.success(`Payment of ${formatKES(data.amount)} recorded successfully`);
    setShowRecordPayment(false);
  };

  const handleVoidPayment = (paymentId: string, reason: string) => {
    toast.success("Payment voided successfully");
    setShowVoidPayment(false);
    setSelectedPayment(null);
  };

  return (
    <DashboardLayout title="Payments" subtitle="Track and manage all payment transactions">
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Banknote className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-bold">{formatKES(total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Smartphone className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">M-Pesa Collections</p>
              <p className="text-2xl font-bold">{formatKES(mpesaTotal)}</p>
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
              <p className="text-2xl font-bold">{recentPayments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">All Payments</CardTitle>
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
                <Download className="h-4 w-4 mr-1.5" />Export
              </Button>
              <Button size="sm" onClick={() => setShowRecordPayment(true)}>
                <Plus className="h-4 w-4 mr-1.5" />Record Payment
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
              {filtered.map((p) => (
                <TableRow key={p.id} className="group">
                  <TableCell className="font-medium">{p.student_name}</TableCell>
                  <TableCell className="font-semibold text-success">{formatKES(p.amount)}</TableCell>
                  <TableCell><Badge variant="secondary">{p.method}</Badge></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.reference}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.date}</TableCell>
                  <TableCell>
                    <Badge className={
                      p.status === "completed"
                        ? "bg-success/10 text-success border-0"
                        : "bg-warning/10 text-warning border-0"
                    }>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("Payment details view coming soon")}>
                          <Eye className="h-4 w-4 mr-2" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Receipt printed")}>
                          <Printer className="h-4 w-4 mr-2" />Print Receipt
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {p.status === "completed" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedPayment({
                                id: p.id,
                                studentName: p.student_name,
                                amount: p.amount,
                                method: p.method,
                                reference: p.reference,
                                date: p.date,
                              });
                              setShowVoidPayment(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />Void Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={showRecordPayment}
        onOpenChange={setShowRecordPayment}
        onSubmit={handleRecordPayment}
      />

      {/* Void Payment Dialog */}
      <VoidPaymentDialog
        open={showVoidPayment}
        onOpenChange={setShowVoidPayment}
        payment={selectedPayment}
        onConfirm={handleVoidPayment}
      />
    </DashboardLayout>
  );
};

export default Payments;
