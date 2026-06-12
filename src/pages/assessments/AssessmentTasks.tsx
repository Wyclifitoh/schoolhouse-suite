import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAssessmentTasksPaged,
  useAssessmentTypes,
} from "@/hooks/useAssessments";
import { useClasses, useStreams } from "@/hooks/useClasses";
import { FileText, PencilLine, Search } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";

export default function AssessmentTasks() {
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: classes = [] } = useClasses();
  const { data: streams = [] } = useStreams(gradeId || undefined);
  const { data: types = [] } = useAssessmentTypes();

  const filters = useMemo(
    () => ({
      status: status || undefined,
      search: search || undefined,
      grade_id: gradeId || undefined,
      stream_id: streamId || undefined,
      assessment_type_id: typeId || undefined,
      page,
      limit,
    }),
    [status, search, gradeId, streamId, typeId, page],
  );

  const { data, isLoading } = useAssessmentTasksPaged(filters);
  const tasks = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const resetPage = (fn: () => void) => {
    setPage(1);
    fn();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" /> Assessment Tasks
            </h1>
            <p className="text-muted-foreground">
              All teacher marking tasks across published assessments.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 grid gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search assessment, subject or class"
                className="pl-8 h-9"
                value={search}
                onChange={(e) => resetPage(() => setSearch(e.target.value))}
              />
            </div>
            <Select
              value={gradeId || "all"}
              onValueChange={(v) =>
                resetPage(() => {
                  setGradeId(v === "all" ? "" : v);
                  setStreamId("");
                })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {(classes as any[]).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={streamId || "all"}
              onValueChange={(v) =>
                resetPage(() => setStreamId(v === "all" ? "" : v))
              }
              disabled={!gradeId}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All streams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All streams</SelectItem>
                {(streams as any[]).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeId || "all"}
              onValueChange={(v) =>
                resetPage(() => setTypeId(v === "all" ? "" : v))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(types as any[]).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status || "all"}
              onValueChange={(v) =>
                resetPage(() => setStatus(v === "all" ? "" : v))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t) => {
                    const p = t.student_count
                      ? Math.round((t.marked_count / t.student_count) * 100)
                      : 0;
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Link
                            to={`/assessments/${t.assessment_id}`}
                            className="hover:underline"
                          >
                            {t.assessment_name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {t.grade_name}
                          {t.stream_name ? ` · ${t.stream_name}` : ""}
                        </TableCell>
                        <TableCell>{t.subject_name}</TableCell>
                        <TableCell>
                          {t.teacher_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <Progress value={p} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {t.marked_count}/{t.student_count}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <PermissionGate permission="exams:update">
                            <Link to={`/assessments/marks/${t.id}`}>
                              <Button size="sm" variant="outline">
                                <PencilLine className="h-3.5 w-3.5 mr-1" /> Enter
                              </Button>
                            </Link>
                          </PermissionGate>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!isLoading && !tasks.length && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No tasks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {total > limit && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} · {total} tasks
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
