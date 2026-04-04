import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const actionColor: Record<string, string> = {
  CREATE: "bg-success/10 text-success border-0",
  UPDATE: "bg-info/10 text-info border-0",
  DELETE: "bg-destructive/10 text-destructive border-0",
};
const LoadingSkeleton = () => <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
const EmptyState = ({ message }: { message: string }) => <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>;

const AuditTrail = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["reports", "audit-trail"],
    queryFn: () => api.get<any[]>("/reports/audit-trail").catch(() => []),
  });

  const auditData = logs || [];

  return (
    <DashboardLayout title="Audit Trail" subtitle="System audit log for accountability">
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
    </DashboardLayout>
  );
};

export default AuditTrail;
