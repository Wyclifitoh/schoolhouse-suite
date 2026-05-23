import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useExams, useMarksRegister, useBulkSaveMarks, CBC_LEVELS,
} from "@/hooks/useExams";
import { useExamSubjects } from "@/hooks/useExamsExtended";
import { useSubmitDraftMarks } from "@/hooks/useExamsExtended";
import { useStudents } from "@/hooks/useStudents";
import { useGrades } from "@/hooks/useGrades";
import { ClipboardCheck, Save, Send, Download } from "lucide-react";

export default function MarksEntry() {
  const { data: exams = [] } = useExams();
  const { data: grades = [] } = useGrades();
  const [examId, setExamId] = useState<string>("");
  const [gradeId, setGradeId] = useState<string>("");
  const [subject, setSubject] = useState<string>("");

  const exam = exams.find((e: any) => e.id === examId);
  const isCBC = (exam?.curriculum_type || "CBC") === "CBC";
  const { data: students = [] } = useStudents({ gradeId: gradeId || undefined, enabled: !!gradeId });
  const { data: subjects = [] } = useExamSubjects(examId);
  const { data: marks = [] } = useMarksRegister(examId, { grade_id: gradeId || undefined });

  const bulk = useBulkSaveMarks();
  const submit = useSubmitDraftMarks();

  const [draft, setDraft] = useState<Record<string, { score?: string; level?: string; remarks?: string }>>({});

  const rows = useMemo(() => {
    if (!students) return [];
    return (students as any[]).map((s) => {
      const existing = (marks as any[]).find(
        (m) => m.student_id === s.id && m.subject_name === subject,
      );
      const d = draft[s.id] || {};
      return {
        student: s,
        existing,
        score: d.score ?? (existing?.score ?? ""),
        level: d.level ?? (existing?.performance_level ?? ""),
        remarks: d.remarks ?? (existing?.remarks ?? ""),
      };
    });
  }, [students, marks, subject, draft]);

  const setCell = (id: string, patch: Partial<{ score: string; level: string; remarks: string }>) =>
    setDraft((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const subjectMaxMarks = subjects.find((s: any) => s.subject_name === subject)?.max_marks || 100;

  const onSave = async () => {
    if (!subject || !examId) return;
    const payload = rows
      .filter((r) => r.score !== "" || r.level)
      .map((r) => ({
        exam_id: examId,
        student_id: r.student.id,
        subject_name: subject,
        score: r.score === "" ? null : Number(r.score),
        out_of: subjectMaxMarks,
        performance_level: r.level || null,
        remarks: r.remarks || null,
        status: "DRAFT",
      }));
    if (!payload.length) return;
    await bulk.mutateAsync(payload as any);
    setDraft({});
  };

  const onSubmit = async () => {
    await onSave();
    if (examId) await submit.mutateAsync(examId);
  };

  const downloadCsv = () => {
    const head = "Admission No,Student,Score,Out Of,Level,Remarks\n";
    const body = rows
      .map((r) => `${r.student.admission_number || ""},"${r.student.first_name} ${r.student.last_name}",${r.score ?? ""},${subjectMaxMarks},${r.level ?? ""},"${(r.remarks ?? "").replace(/"/g, "'")}"`)
      .join("\n");
    const blob = new Blob([head + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `marks-${exam?.name || examId}-${subject}.csv`;
    a.click();
  };

  const locked = exam?.status === "LOCKED" || exam?.status === "ARCHIVED";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-primary" /> Marks Entry
          </h1>
          <p className="text-muted-foreground">Teacher marks entry with autosave-ready draft, CBC and 8-4-4 modes.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-muted-foreground">Exam</label>
                <Select value={examId} onValueChange={setExamId}>
                  <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>
                    {(exams as any[]).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} <span className="ml-2 text-xs text-muted-foreground">[{e.status}]</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm text-muted-foreground">Class</label>
                <Select value={gradeId} onValueChange={setGradeId}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {(grades as any[]).map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm text-muted-foreground">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {(subjects as any[]).map((s) => (
                      <SelectItem key={s.id} value={s.subject_name}>{s.subject_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadCsv} disabled={!rows.length}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button onClick={onSave} disabled={!subject || !examId || locked || bulk.isPending}>
                  <Save className="h-4 w-4 mr-1" /> Save Draft
                </Button>
                <Button onClick={onSubmit} disabled={!subject || !examId || locked || submit.isPending}>
                  <Send className="h-4 w-4 mr-1" /> Submit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {locked && (
              <div className="mb-3 text-sm text-warning">This exam is {exam?.status}. Marks are read-only.</div>
            )}
            {!examId || !subject ? (
              <p className="text-muted-foreground text-sm">Select an exam and subject to start entering marks.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adm #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="w-32">Score / {subjectMaxMarks}</TableHead>
                      {isCBC && <TableHead className="w-32">CBC Level</TableHead>}
                      <TableHead>Remarks</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.student.id}>
                        <TableCell>{r.student.admission_number}</TableCell>
                        <TableCell>{r.student.first_name} {r.student.last_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={subjectMaxMarks}
                            value={r.score as any}
                            disabled={locked}
                            onChange={(e) => setCell(r.student.id, { score: e.target.value })}
                          />
                        </TableCell>
                        {isCBC && (
                          <TableCell>
                            <Select
                              value={r.level as string}
                              onValueChange={(v) => setCell(r.student.id, { level: v })}
                              disabled={locked}
                            >
                              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                              <SelectContent>
                                {CBC_LEVELS.map((l) => (
                                  <SelectItem key={l.value} value={l.value}>{l.value} — {l.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        <TableCell>
                          <Input
                            value={r.remarks as string}
                            disabled={locked}
                            onChange={(e) => setCell(r.student.id, { remarks: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.existing?.status || "—"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rows.length && (
                      <TableRow><TableCell colSpan={isCBC ? 6 : 5} className="text-center text-muted-foreground">No students in this class.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
