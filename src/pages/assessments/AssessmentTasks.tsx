import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAssessmentTasksPaged,
  useAssessmentTypes,
  useReassignTask,
  useTeacherAllocations,
} from "@/hooks/useAssessments";
import { useClasses, useStreams } from "@/hooks/useClasses";
import { FileText, PencilLine, Search, UserRoundPen } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import { useAuth } from "@/contexts/AuthContext";

type ReassignTarget = {
  id: string;
  grade_id: string;
  subject_id: string;
  current_teacher: string | null;
};

export default function AssessmentTasks() {
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  const { hasAnyRole } = useAuth();
  const canReassign = hasAnyRole(["super_admin", "admin", "school_admin"]);

  // Reassign dialog state
  const [reassigning, setReassigning] = useState<ReassignTarget | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

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

  const reassign = useReassignTask();

  // Fetch teachers eligible for the task being reassigned
  const { data: eligibleTeachers = [], isLoading: teachersLoading } =
    useTeacherAllocations(
      reassigning
        ? { grade_id: reassigning.grade_id, subject_id: reassigning.subject_id }
        : {},
    );

  const resetPage = (fn: () => void) => {
    setPage(1);
    fn();
  };

  const openReassign = (t: any) => {
    setReassigning({
      id: t.id,
      grade_id: t.grade_id,
      subject_id: t.subject_id,
      current_teacher: t.teacher_name || null,
    });
    setSelectedTeacherId("");
  };

  const closeReassign = () => {
    setReassigning(null);
    setSelectedTeacherId("");
  };

  const confirmReassign = () => {
    if (!reassigning || !selectedTeacherId) return;
    reassign.mutate(
      { id: reassigning.id, teacher_id: selectedTeacherId },
      { onSuccess: closeReassign },
    );
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
                    <TableHead className="text-right">Actions</TableHead>
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
                            <span className="text-muted-foreground text-xs italic">
                              Unassigned
                            </span>
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
                          <div className="flex items-center justify-end gap-1">
                            {canReassign && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => openReassign(t)}
                              >
                                <UserRoundPen className="h-3.5 w-3.5 mr-1" />
                                Reassign
                              </Button>
                            )}
                            <PermissionGate permission="exams:update">
                              <Link to={`/assessments/marks/${t.id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                >
                                  <PencilLine className="h-3.5 w-3.5 mr-1" />{" "}
                                 {" "}
                                Enter
                                </Button>
                              </Link>
                            </PermissionGate>
                          </div>
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

      {/* ── Reassign Dialog ── */}
      <Dialog
        open={!!reassigning}
        onOpenChange={(o) => {
          if (!o) closeReassign();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
          </DialogHeader>
          {reassigning?.current_teacher && (
            <p className="text-sm text-muted-foreground -mt-2">
              Currently assigned to{" "}
              <strong>{reassigning.current_teacher}</strong>
            </p>
          )}
          <div className="space-y-2 py-2">
            <Label htmlFor="reassign-teacher">Select new teacher</Label>
            <Select
              value={selectedTeacherId}
              onValueChange={setSelectedTeacherId}
              disabled={teachersLoading}
            >
              <SelectTrigger id="reassign-teacher">
                <SelectValue
                  placeholder={teachersLoading ? "Loading…" : "Pick a teacher"}
                />
              </SelectTrigger>
              <SelectContent>
                {eligibleTeachers.map((ta) => (
                  <SelectItem key={ta.teacher_id} value={ta.teacher_id}>
                    {ta.teacher_name}
                  </SelectItem>
                ))}
                {!teachersLoading && !eligibleTeachers.length && (
                  <SelectItem value="__none__" disabled>
                    No teachers allocated for this subject/class
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReassign}>
              Cancel
            </Button>
            <Button
              onClick={confirmReassign}
              disabled={!selectedTeacherId || reassign.isPending}
            >
              {reassign.isPending ? "Saving…" : "Reassign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
