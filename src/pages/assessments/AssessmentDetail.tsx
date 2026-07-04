import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/PermissionGate";
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
  useAssessment,
  useAssessmentTasks,
  usePublishAssessment,
  useSetAssessmentStatus,
  useSubmitTask,
  useResyncAssessmentSubjects,
} from "@/hooks/useAssessments";
import {
  ClipboardCheck,
  PlayCircle,
  Lock,
  LockOpen,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  PencilLine,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AssessmentDetail() {
  const { id } = useParams();
  const { data: a, isLoading } = useAssessment(id);
  // Fetch with a high limit so the class/stream filter dropdowns and
  // pagination see every task (backend defaults to 25 per page).
  const { data: tasks = [] } = useAssessmentTasks({
    assessment_id: id,
    limit: "1000",
  });
  const publish = usePublishAssessment();
  const setStatus = useSetAssessmentStatus();
  const submit = useSubmitTask();
  const resync = useResyncAssessmentSubjects();
  const { primaryRole } = useAuth();
  const isTeacher = primaryRole === "teacher";

  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [streamFilter, setStreamFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const gradeOptions = useMemo(() => {
    const m = new Map<string, string>();
    tasks.forEach((t) => m.set(t.grade_id, t.grade_name));
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [tasks]);

  const streamOptions = useMemo(() => {
    const m = new Map<string, string>();
    tasks
      .filter((t) => gradeFilter === "all" || t.grade_id === gradeFilter)
      .forEach((t) => {
        if (t.stream_id) m.set(t.stream_id, t.stream_name || "—");
      });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [tasks, gradeFilter]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (gradeFilter !== "all" && t.grade_id !== gradeFilter) return false;
        if (streamFilter !== "all") {
          if (streamFilter === "none" && t.stream_id) return false;
          if (streamFilter !== "none" && t.stream_id !== streamFilter)
            return false;
        }
        return true;
      }),
    [tasks, gradeFilter, streamFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [gradeFilter, streamFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTasks = useMemo(
    () =>
      filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredTasks, currentPage],
  );

  if (isLoading || !a) {
    return (
      <DashboardLayout>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-40 w-full" />
      </DashboardLayout>
    );
  }

  const taskCount = filteredTasks.length;
  const doneCount = filteredTasks.filter(
    (t) => t.marked_count >= t.student_count && t.student_count > 0,
  ).length;
  const pct = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Link
              to="/assessments"
              className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All assessments
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2 mt-1">
              <ClipboardCheck className="h-7 w-7 text-primary" />
              {a.name}
            </h1>
            <p className="text-muted-foreground">{a.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{a.status.replace("_", " ")}</Badge>
              {a.type_name && (
                <Badge variant="outline">
                  {a.type_name} · {a.type_weight}%
                </Badge>
              )}
              {a.start_date && (
                <Badge variant="outline">
                  {a.start_date} → {a.end_date}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!isTeacher && (
              <PermissionGate permission={["exams:update", "exams:publish"]}>
                {a.status !== "archived" && a.status !== "locked" && (
                  <Button
                    variant="outline"
                    onClick={() => resync.mutate(a.id)}
                    disabled={resync.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Sync subjects
                  </Button>
                )}
              {a.status === "draft" && (
                <Button onClick={() => publish.mutate(a.id)}>
                  <PlayCircle className="h-4 w-4 mr-1" /> Publish & generate
                  tasks
                </Button>
              )}
              {(a.status === "published" || a.status === "in_progress") && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setStatus.mutate({ id: a.id, status: "locked" })
                  }
                >
                  <Lock className="h-4 w-4 mr-1" /> Lock
                </Button>
              )}
              {a.status === "locked" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setStatus.mutate({ id: a.id, status: "published" })
                    }
                  >
                    <LockOpen className="h-4 w-4 mr-1" /> Unlock
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setStatus.mutate({ id: a.id, status: "archived" })
                    }
                  >
                    <Archive className="h-4 w-4 mr-1" /> Archive
                  </Button>
                </>
              )}
                {a.status === "archived" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setStatus.mutate({ id: a.id, status: "draft" })
                    }
                  >
                    <ArchiveRestore className="h-4 w-4 mr-1" /> Unarchive
                  </Button>
                )}
              </PermissionGate>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs uppercase text-muted-foreground">
                Classes
              </div>
              <div className="text-2xl font-bold">{a.classes?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs uppercase text-muted-foreground">
                Subjects
              </div>
              <div className="text-2xl font-bold">
                {a.subjects?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs uppercase text-muted-foreground">
                Tasks completed
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {doneCount}/{taskCount}
                </div>
                <Progress value={pct} className="h-2 flex-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <CardTitle>Teacher tasks</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Select
                  value={gradeFilter}
                  onValueChange={(v) => {
                    setGradeFilter(v);
                    setStreamFilter("all");
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={streamFilter} onValueChange={setStreamFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All streams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All streams</SelectItem>
                    <SelectItem value="none">No stream</SelectItem>
                    {streamOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedTasks.map((t) => {
                    const p = t.student_count
                      ? Math.round((t.marked_count / t.student_count) * 100)
                      : 0;
                    return (
                      <TableRow key={t.id}>
                        <TableCell>{t.grade_name}</TableCell>
                        <TableCell>{t.stream_name || "—"}</TableCell>
                        <TableCell>{t.subject_name}</TableCell>
                        <TableCell>
                          {t.teacher_name || (
                            <span className="text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[160px]">
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
                        <TableCell className="text-right space-x-1">
                          <PermissionGate permission="exams:update">
                            <Link to={`/assessments/marks/${t.id}`}>
                              <Button size="sm" variant="outline">
                                <PencilLine className="h-3.5 w-3.5 mr-1" />{" "}
                                Enter marks
                              </Button>
                            </Link>
                            {t.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => submit.mutate(t.id)}
                              >
                                Submit
                              </Button>
                            )}
                          </PermissionGate>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filteredTasks.length && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-6"
                      >
                        {a.status === "draft"
                          ? "Publish this assessment to auto-generate teacher tasks."
                          : tasks.length
                            ? "No tasks match the selected class/stream."
                            : "No tasks yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredTasks.length > pageSize && (
              <div className="flex items-center justify-between gap-3 pt-4 flex-wrap">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredTasks.length)} of{" "}
                  {filteredTasks.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
