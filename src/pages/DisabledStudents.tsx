import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useStudentsPaged,
  useUpdateStudent,
  useStudentsSummary,
} from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { formatDate } from "@/utils/date";
import {
  ArrowLeft,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const DisabledStudents = () => {
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();
  const canManage = usePermission("students:update");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data: paged, isLoading, refetch } = useStudentsPaged({
    search: search || undefined,
    status: "inactive",
    page,
    limit: pageSize,
  });
  const { refetch: refetchSummary } = useStudentsSummary();
  const update = useUpdateStudent();
  const items = paged?.data || [];
  const total = paged?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const reactivate = (id: string, name: string) => {
    if (!confirm(`Reactivate ${name}? They will reappear in the active student list.`))
      return;
    update.mutate(
      { id, data: { status: "active" as any } },
      {
        onSuccess: () => {
          refetch();
          refetchSummary();
        },
      },
    );
  };

  return (
    <DashboardLayout
      title="Disabled Students"
      subtitle="Reactivate deactivated student records"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Students
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Deactivated Records
              </CardTitle>
              <Badge variant="secondary">{total} disabled</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-xs mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search disabled students..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Adm. No.</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Deactivated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No disabled students 🎉
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <p className="font-medium">
                            {s.full_name || `${s.first_name} ${s.last_name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.gender || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {s.admission_number}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {s.grade || "—"}
                            {s.stream ? ` · ${s.stream}` : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{s.parent_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.parent_phone || ""}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(s.updated_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {canManage ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                reactivate(
                                  s.id,
                                  s.full_name || s.first_name || "student",
                                )
                              }
                              disabled={update.isPending}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                              Reactivate
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Admin only
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DisabledStudents;