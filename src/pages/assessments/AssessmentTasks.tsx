import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAssessmentTasks } from "@/hooks/useAssessments";
import { FileText, PencilLine } from "lucide-react";

export default function AssessmentTasks() {
  const [status, setStatus] = useState<string>("");
  const { data: tasks = [], isLoading } = useAssessmentTasks(
    status ? { status } : {},
  );

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
          <div className="min-w-[180px]">
            <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Tasks ({tasks.length})</CardTitle></CardHeader>
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
                      ? Math.round((t.marked_count / t.student_count) * 100) : 0;
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Link to={`/assessments/${t.assessment_id}`} className="hover:underline">
                            {t.assessment_name}
                          </Link>
                        </TableCell>
                        <TableCell>{t.grade_name}{t.stream_name ? ` · ${t.stream_name}` : ""}</TableCell>
                        <TableCell>{t.subject_name}</TableCell>
                        <TableCell>{t.teacher_name || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <Progress value={p} className="h-2" />
                            <span className="text-xs text-muted-foreground">{t.marked_count}/{t.student_count}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Link to={`/assessments/marks/${t.id}`}>
                            <Button size="sm" variant="outline">
                              <PencilLine className="h-3.5 w-3.5 mr-1" /> Enter
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!isLoading && !tasks.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No tasks found.
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
