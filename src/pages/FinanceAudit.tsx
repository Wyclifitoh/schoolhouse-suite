import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useFinanceAuditLogs } from "@/hooks/useFinance";
import { History, Filter } from "lucide-react";

const FinanceAudit = () => {
  const [action, setAction] = useState("");
  const { data: logs = [], isLoading } = useFinanceAuditLogs({
    action: action || undefined,
    limit: 200,
  });

  return (
    <DashboardLayout title="Finance Audit Log">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by action (e.g. FEES_BULK_ASSIGNED)"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="max-w-md"
              />
            </div>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No audit entries found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(l.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {l.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{l.entity_type}</TableCell>
                      <TableCell className="text-xs">{l.student_name || "—"}</TableCell>
                      <TableCell className="text-xs">{l.performed_by}</TableCell>
                      <TableCell className="text-xs max-w-md truncate">
                        {l.metadata ? (typeof l.metadata === "string" ? l.metadata : JSON.stringify(l.metadata)) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FinanceAudit;
