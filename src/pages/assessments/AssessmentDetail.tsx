import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useAssessment, useAssessmentTasks, usePublishAssessment,
  useSetAssessmentStatus, useSubmitTask,
} from "@/hooks/useAssessments";
import { ClipboardCheck, PlayCircle, Lock, ArrowLeft, PencilLine } from "lucide-react";

export default function AssessmentDetail() {
  const { id } = useParams();
  const { data: a, isLoading } = useAssessment(id);
  const { data: tasks = [] } = useAssessmentTasks({ assessment_id: id });
  const publish = usePublishAssessment();
  const setStatus = useSetAssessmentStatus();
  const submit = useSubmitTask();

  if (isLoading || !a) {
    return (
      <DashboardLayout>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-40 w-full" />
      </DashboardLayout>
    );
  }

  const taskCount = tasks.length;
  const doneCount = tasks.filter((t) => t.marked_count >= t.student_count && t.student_count > 0).length;
  const pct = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Link to="/assessments" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> All assessments
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2 mt-1">
              <ClipboardCheck className="h-7 w-7 text-primary" />
              {a.name}
            </h1>
            <p className="text-muted-foreground">{a.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{a.status.replace("_", " ")}</Badge>
              {a.type_name && <Badge variant="outline">{a.type_name} · {a.type_weight}%</Badge>}
              {a.start_date && <Badge variant="outline">{a.start_date} → {a.end_date}</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            {a.status === "draft" && (
              <Button onClick={() => publish.mutate(a.id)}>
                <PlayCircle className="h-4 w-4 mr-1" /> Publish & generate tasks
              </Button>
            )}
            {(a.status === "published" || a.status === "in_progress") && (
              <Button variant="outline" onClick={() => setStatus.mutate({ id: a.id, status: "locked" })}>
                <Lock className="h-4 w-4 mr-1" /> Lock
              </Button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs uppercase text-muted-foreground">Classes</div>
              <div className="text-2xl font-bold">{a.classes?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs uppercase text-muted-foreground">Subjects</div>
              <div className="text-2xl font-bold">{a.subjects?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs uppercase text-muted-foreground">Tasks completed</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{doneCount}/{taskCount}</div>
                <Progress value={pct} className="h-2 flex-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Teacher tasks</CardTitle></CardHeader>
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
                  {tasks.map((t) => {
                    const p = t.student_count
                      ? Math.round((t.marked_count / t.student_count) * 100) : 0;
                    return (
                      <TableRow key={t.id}>
                        <TableCell>{t.grade_name}</TableCell>
                        <TableCell>{t.stream_name || "—"}</TableCell>
                        <TableCell>{t.subject_name}</TableCell>
                        <TableCell>{t.teacher_name || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                        <TableCell className="min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <Progress value={p} className="h-2" />
                            <span className="text-xs text-muted-foreground">{t.marked_count}/{t.student_count}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          <Link to={`/assessments/marks/${t.id}`}>
                            <Button size="sm" variant="outline">
                              <PencilLine className="h-3.5 w-3.5 mr-1" /> Enter marks
                            </Button>
                          </Link>
                          {t.status === "in_progress" && (
                            <Button size="sm" variant="ghost" onClick={() => submit.mutate(t.id)}>
                              Submit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!tasks.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        {a.status === "draft"
                          ? "Publish this assessment to auto-generate teacher tasks."
                          : "No tasks yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
