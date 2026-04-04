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
  login: "bg-success/10 text-success border-0",
  logout: "bg-muted text-muted-foreground border-0",
  record_payment: "bg-primary/10 text-primary border-0",
  approve_expense: "bg-info/10 text-info border-0",
  mark_attendance: "bg-warning/10 text-warning border-0",
};
const LoadingSkeleton = () => <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
const EmptyState = ({ message }: { message: string }) => <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>;

const UserLogs = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["reports", "user-logs"],
    queryFn: () => api.get<any[]>("/reports/user-logs").catch(() => []),
  });

  const userLogs = logs || [];

  return (
    <DashboardLayout title="User Logs" subtitle="User activity and session logs">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />User Activity Logs</CardTitle>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <LoadingSkeleton /> : userLogs.length === 0 ? <EmptyState message="No user activity logs found" /> : (
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Timestamp</TableHead><TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Role</TableHead><TableHead className="font-semibold">Action</TableHead>
              <TableHead className="font-semibold">IP Address</TableHead>
            </TableRow></TableHeader>
            <TableBody>{userLogs.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{l.created_at ? new Date(l.created_at).toLocaleString() : l.timestamp}</TableCell>
                <TableCell className="font-medium">{l.user_name || l.user || "—"}</TableCell>
                <TableCell>{l.role || "—"}</TableCell>
                <TableCell><Badge className={actionColor[l.action] || "bg-muted text-muted-foreground border-0"}>{l.action}</Badge></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{l.ip_address || l.ip || "—"}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default UserLogs;
