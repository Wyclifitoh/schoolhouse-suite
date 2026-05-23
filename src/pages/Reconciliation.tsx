import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useReconciliation } from "@/hooks/useFinance";
import { Scale, CheckCircle2, AlertTriangle } from "lucide-react";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;
const todayISO = () => new Date().toISOString().slice(0, 10);

const Reconciliation = () => {
  const [date, setDate] = useState(todayISO());
  const { data, isLoading } = useReconciliation(date);
  const totals = data?.totals || {};

  const stat = (label: string, value: any, accent?: string) => (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${accent || ""}`}>{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Daily Reconciliation">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> M-Pesa ↔ Payments ↔ Allocations
            </CardTitle>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="max-w-[180px]"
            />
          </CardHeader>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stat("M-Pesa Txns", totals.mpesa_count ?? "—")}
          {stat("M-Pesa Amount", formatKES(totals.mpesa_amount || 0))}
          {stat("Matched", totals.mpesa_matched ?? "—", "text-success")}
          {stat("Unmatched", totals.mpesa_unmatched ?? "—", totals.mpesa_unmatched > 0 ? "text-destructive" : "text-success")}
          {stat("Manual Payments", totals.manual_count ?? "—")}
          {stat("Manual Amount", formatKES(totals.manual_amount || 0))}
          {stat("Fully Allocated", totals.fully_allocated ?? "—", "text-success")}
          {stat("Unallocated", totals.unallocated ?? "—", totals.unallocated > 0 ? "text-destructive" : "text-success")}
        </div>

        <Tabs defaultValue="mpesa">
          <TabsList>
            <TabsTrigger value="mpesa">M-Pesa Transactions</TabsTrigger>
            <TabsTrigger value="manual">Manual Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="mpesa" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead>Allocated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.mpesa || []).map((r: any) => {
                        const matched = !!r.payment_id;
                        const amt = Number(r.confirmed_amount || r.amount || 0);
                        const alloc = Number(r.allocated || 0);
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{r.mpesa_receipt_number || r.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-xs">{r.phone_number}</TableCell>
                            <TableCell className="text-xs">{r.account_reference}</TableCell>
                            <TableCell className="text-xs">{formatKES(amt)}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{r.status}</Badge></TableCell>
                            <TableCell>
                              {matched ? (
                                <span className="flex items-center gap-1 text-success text-xs">
                                  <CheckCircle2 className="h-3 w-3" /> {r.receipt_number || "matched"}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-destructive text-xs">
                                  <AlertTriangle className="h-3 w-3" /> Unmatched
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">{matched ? formatKES(alloc) : "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                      {(!data?.mpesa || data.mpesa.length === 0) && (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No M-Pesa transactions on this date</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Allocated</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.manual || []).map((p: any) => {
                        const amt = Number(p.amount || 0);
                        const alloc = Number(p.allocated || 0);
                        const ok = alloc >= amt;
                        const partial = alloc > 0 && alloc < amt;
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-xs">{p.receipt_number || p.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-xs">
                              {p.student_name || "—"}
                              <div className="text-muted-foreground">{p.admission_number}</div>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{p.payment_method}</TableCell>
                            <TableCell className="text-xs">{formatKES(amt)}</TableCell>
                            <TableCell className="text-xs">{formatKES(alloc)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${ok ? "bg-success/10 text-success" : partial ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}
                              >
                                {ok ? "Allocated" : partial ? "Partial" : "Unallocated"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!data?.manual || data.manual.length === 0) && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No manual payments on this date</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reconciliation;
