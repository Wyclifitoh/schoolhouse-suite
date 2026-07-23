import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { useSupplierProfile } from "@/hooks/useSuppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Phone, Mail, MapPin, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(
    Number(n || 0),
  );

function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "warning" | "danger" }) {
  const toneCls =
    tone === "positive" ? "text-emerald-600"
    : tone === "warning" ? "text-amber-600"
    : tone === "danger" ? "text-destructive"
    : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${toneCls}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function SupplierProfile() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useSupplierProfile(id);

  return (
    <DashboardLayout title="Supplier Profile" subtitle="360° view of activity, purchases and balances">
      <EnterpriseGate>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inventory/suppliers"><ArrowLeft className="h-4 w-4 mr-2" /> Back to suppliers</Link>
            </Button>
          </div>

          {isLoading || !data ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {data.supplier.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.supplier.tax_pin ? `PIN: ${data.supplier.tax_pin}` : "No tax PIN on file"}
                    </p>
                  </div>
                  <Badge variant={data.supplier.is_active ? "default" : "secondary"}>
                    {data.supplier.is_active ? "Active" : "Inactive"}
                  </Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {data.supplier.phone || "—"}</div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {data.supplier.email || "—"}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {data.supplier.location || "—"}</div>
                  <div className="flex items-center gap-2 md:col-span-3"><FileText className="h-4 w-4 text-muted-foreground" /> Payment terms: {data.supplier.payment_terms_days || 0} days</div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Opening balance" value={fmt(data.summary.opening_balance)} />
                <StatCard label="POs received" value={fmt(data.summary.po_received)} tone="positive" />
                <StatCard label="Paid to date" value={fmt(data.summary.expenses_paid)} />
                <StatCard label="Outstanding" value={fmt(data.summary.outstanding)} tone={data.summary.outstanding > 0 ? "warning" : "positive"} />
              </div>

              <Card>
                <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Expected</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.purchase_orders.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No purchase orders</TableCell></TableRow>
                      ) : data.purchase_orders.map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono text-xs">{po.po_number}</TableCell>
                          <TableCell>{po.order_date?.slice(0, 10)}</TableCell>
                          <TableCell>{po.expected_date?.slice(0, 10) || "—"}</TableCell>
                          <TableCell><Badge variant="outline">{po.status}</Badge></TableCell>
                          <TableCell className="text-right">{fmt(po.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Expenses & Payments</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Ref</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.expenses.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">No expenses recorded</TableCell></TableRow>
                      ) : data.expenses.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.expense_date?.slice(0, 10)}</TableCell>
                          <TableCell>{e.title}</TableCell>
                          <TableCell className="font-mono text-xs">{e.reference || "—"}</TableCell>
                          <TableCell>{e.payment_method}</TableCell>
                          <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                          <TableCell className="text-right">{fmt(e.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </EnterpriseGate>
    </DashboardLayout>
  );
}