import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useTaskRoster, useBulkSaveAssessmentMarks, useSubmitTask, useAchievementLevels,
} from "@/hooks/useAssessments";
import { ArrowLeft, Save, Send, Download, CheckCircle2 } from "lucide-react";

type Draft = Record<string, { score?: string; status?: string; remarks?: string }>;

function previewAL(levels: any[], score: number, outOf: number) {
  if (score === null || isNaN(score) || outOf <= 0) return null;
  const pct = (score / outOf) * 100;
  return levels.find((l) => pct >= Number(l.min_score) && pct <= Number(l.max_score));
}

export default function MarksEntry() {
  const { taskId } = useParams();
  const { data, isLoading } = useTaskRoster(taskId);
  const { data: levels = [] } = useAchievementLevels();
  const bulk = useBulkSaveAssessmentMarks();
  const submit = useSubmitTask();

  const [draft, setDraft] = useState<Draft>({});
  useEffect(() => { setDraft({}); }, [taskId]);

  const task = data?.task;
  const outOf = data?.out_of ?? 100;
  const locked = task && ["locked","archived"].includes(task.assessment_status);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.students.map((s) => {
      const d = draft[s.id] || {};
      return {
        student: s,
        score: d.score ?? (s.mark?.score != null ? String(s.mark.score) : ""),
        status: d.status ?? s.mark?.status ?? "pending",
        remarks: d.remarks ?? s.mark?.remarks ?? "",
        mark: s.mark,
      };
    });
  }, [data, draft]);

  const setCell = (id: string, patch: Partial<{ score: string; status: string; remarks: string }>) =>
    setDraft((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const onSave = async () => {
    if (!task) return;
    const items = rows
      .filter((r) => r.score !== "" || r.status !== "pending" || r.remarks)
      .map((r) => ({
        student_id: r.student.id,
        subject_id: task.subject_id,
        score: r.score === "" ? null : Number(r.score),
        out_of: outOf,
        status: r.status,
        remarks: r.remarks || null,
      }));
    if (!items.length) return;
    await bulk.mutateAsync({
      assessment_id: task.assessment_id,
      task_id: task.id,
      items,
    });
    setDraft({});
  };

  const onSubmit = async () => {
    await onSave();
    if (task) await submit.mutateAsync(task.id);
  };

  const downloadCsv = () => {
    if (!task) return;
    const head = "Adm No,Student,Score,Out Of,AL,Band,Status,Remarks\n";
    const body = rows.map((r) => {
      const al = previewAL(levels as any[], Number(r.score), outOf);
      return `${r.student.admission_number || ""},"${r.student.first_name} ${r.student.last_name}",${r.score || ""},${outOf},${al?.code || ""},${al?.band_code || ""},${r.status},"${(r.remarks || "").replace(/"/g, "'")}"`;
    }).join("\n");
    const blob = new Blob([head + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `marks-${task.assessment_name}-${task.subject_name}.csv`;
    a.click();
  };

  if (isLoading || !task) {
    return (
      <DashboardLayout>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </DashboardLayout>
    );
  }

  const markedCount = rows.filter((r) => r.score !== "" || r.status === "absent" || r.status === "exempted").length;
  const completion = rows.length ? Math.round((markedCount / rows.length) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link to={`/assessments/${task.assessment_id}`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to assessment
          </Link>
          <h1 className="text-3xl font-bold mt-1">Marks Entry</h1>
          <p className="text-muted-foreground">
            {task.assessment_name} · {task.grade_name}{task.stream_name ? ` · ${task.stream_name}` : ""} · {task.subject_name}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="outline">Out of {outOf}</Badge>
            <Badge variant="outline">{markedCount}/{rows.length} entered ({completion}%)</Badge>
            <Badge variant="outline">{task.status}</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap justify-between gap-2">
              <CardTitle>Roster</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadCsv}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button onClick={onSave} disabled={locked || bulk.isPending}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
                <Button onClick={onSubmit} disabled={locked || submit.isPending}>
                  <Send className="h-4 w-4 mr-1" /> Save & Submit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {locked && (
              <div className="mb-3 text-sm text-amber-600">
                This assessment is {task.assessment_status}. Marks are read-only.
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Adm #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-32">Score / {outOf}</TableHead>
                    <TableHead className="w-24">AL</TableHead>
                    <TableHead className="w-24">Band</TableHead>
                    <TableHead className="w-36">Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const num = r.score === "" ? NaN : Number(r.score);
                    const al = previewAL(levels as any[], num, outOf);
                    return (
                      <TableRow key={r.student.id}>
                        <TableCell>{r.student.admission_number}</TableCell>
                        <TableCell>{r.student.first_name} {r.student.last_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number" min={0} max={outOf}
                            value={r.score}
                            disabled={locked || r.status === "absent" || r.status === "exempted"}
                            onChange={(e) => setCell(r.student.id, { score: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          {al ? <Badge variant="secondary">{al.code}</Badge> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {al ? <Badge variant="outline">{al.band_code}</Badge> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <Select value={r.status} onValueChange={(v) => setCell(r.student.id, { status: v })} disabled={locked}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="exempted">Exempted</SelectItem>
                              <SelectItem value="transferred_in">Transferred in</SelectItem>
                              <SelectItem value="transferred_out">Transferred out</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={r.remarks}
                            disabled={locked}
                            onChange={(e) => setCell(r.student.id, { remarks: e.target.value })}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No students in this class.
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
