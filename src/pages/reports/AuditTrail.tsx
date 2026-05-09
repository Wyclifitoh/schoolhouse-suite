import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const actionColor: Record<string, string> = {
  CREATE: "bg-success/10 text-success border-0",
  UPDATE: "bg-info/10 text-info border-0",
  DELETE: "bg-destructive/10 text-destructive border-0",
  PAYMENT_RECORDED: "bg-success/10 text-success border-0",
  FEES_BULK_ASSIGNED: "bg-info/10 text-info border-0",
  FEES_BULK_UNASSIGNED: "bg-warning/10 text-warning border-0",
};
const LoadingSkeleton = () => <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
const EmptyState = ({ message }: { message: string }) => <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>;

const AuditTrail = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["reports", "audit-trail"],
    queryFn: () => api.get<any[]>("/reports/audit-trail").catch(() => []),
  });
  const { data: financeLogs, isLoading: finLoading } = useQuery({
    queryKey: ["finance", "audit-logs"],
    queryFn: () => api.get<any[]>("/finance/audit-logs?limit=200").catch(() => []),
  });

  const auditData = logs || [];
  const financeData = financeLogs || [];

  return (
    <DashboardLayout title="Audit Trail" subtitle="System audit log for accountability">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="finance">Finance ({financeData.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Audit Log</CardTitle>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <LoadingSkeleton /> : auditData.length === 0 ? <EmptyState message="No audit log entries found" /> : (
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Timestamp</TableHead><TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Action</TableHead><TableHead className="font-semibold">Entity</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
            </TableRow></TableHeader>
            <TableBody>{auditData.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleString() : "—"}</TableCell>
                <TableCell className="font-medium">{a.user_name || a.user_id || "System"}</TableCell>
                <TableCell><Badge className={actionColor[a.action] || "bg-muted text-muted-foreground border-0"}>{a.action}</Badge></TableCell>
                <TableCell>{a.entity_type}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{a.description || JSON.stringify(a.new_values || "—")}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        <TabsContent value="finance">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Finance Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {finLoading ? <LoadingSkeleton /> : financeData.length === 0 ? <EmptyState message="No finance audit entries yet" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Timestamp</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold text-right">Amount</TableHead>
                  <TableHead className="font-semibold">Performed By</TableHead>
                  <TableHead className="font-semibold">Details</TableHead>
                </TableRow></TableHeader>
                <TableBody>{financeData.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleString() : "—"}</TableCell>
                    <TableCell><Badge className={actionColor[a.action] || "bg-muted text-muted-foreground border-0"}>{a.action}</Badge></TableCell>
                    <TableCell className="font-medium">{a.student_name || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{a.amount_affected ? `KES ${Number(a.amount_affected).toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.performed_by}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{typeof a.metadata === "string" ? a.metadata : JSON.stringify(a.metadata)}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AuditTrail;
