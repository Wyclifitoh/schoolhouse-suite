import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { computeSubject844, gradeFor844 } from "@/lib/grading844";
import type { TaskRoster } from "@/hooks/useAssessments";
import { useBulkSavePaperMarks, useSubmitTask } from "@/hooks/useAssessments";

type Draft = Record<
  string,
  { papers: Record<string, string>; remarks?: string }
>;

function parseStored(v: any): Record<string, number | null> {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return v as Record<string, number | null>;
}

export function PaperMarksGrid({
  roster,
  locked,
}: {
  roster: TaskRoster;
  locked: boolean;
}) {
  const papers = roster.papers || [];
  const calcType = roster.subject_config?.calculation_type || "GENERAL";
  const calcCfg = roster.subject_config?.calculation_config || {};
  const task = roster.task;

  const save = useBulkSavePaperMarks();
  const submit = useSubmitTask();

  const [draft, setDraft] = useState<Draft>({});
  useEffect(() => {
    setDraft({});
  }, [task.id]);

  const rows = useMemo(() => {
    return roster.students.map((s) => {
      const stored = parseStored(s.mark?.paper_scores);
      const d = draft[s.id]?.papers || {};
      const paperVals: Record<string, string> = {};
      papers.forEach((p) => {
        paperVals[p.id] =
          d[p.id] ?? (stored[p.id] != null ? String(stored[p.id]) : "");
      });
      const numMarks: Record<string, number | null> = {};
      Object.entries(paperVals).forEach(([k, v]) => {
        numMarks[k] = v === "" ? null : Number(v);
      });
      const calc = computeSubject844(
        papers as any,
        numMarks,
        calcType,
        calcCfg,
      );
      const grade = gradeFor844(calc.percentage);
      const remarks =
        draft[s.id]?.remarks ?? s.mark?.remarks ?? (grade ? grade.remark : "");
      return { student: s, paperVals, calc, grade, remarks };
    });
  }, [roster.students, papers, draft, calcType, calcCfg]);

  const setPaper = (sid: string, pid: string, v: string) =>
    setDraft((p) => ({
      ...p,
      [sid]: { ...p[sid], papers: { ...(p[sid]?.papers || {}), [pid]: v } },
    }));
  const setRemarks = (sid: string, v: string) =>
    setDraft((p) => ({
      ...p,
      [sid]: { ...p[sid], papers: p[sid]?.papers || {}, remarks: v },
    }));

  const onSave = async () => {
    if (!papers.length) {
      toast.error(
        "This subject has no papers configured. Add papers under Academics → Subjects.",
      );
      return;
    }
    const items = rows
      .filter((r) => {
        const stored = parseStored(r.student.mark?.paper_scores);
        const dirty =
          papers.some((p) => {
            const cur = r.paperVals[p.id];
            const old = stored[p.id] != null ? String(stored[p.id]) : "";
            return cur !== old;
          }) || (r.remarks || "") !== (r.student.mark?.remarks || "");
        return dirty;
      })
      .map((r) => {
        const paper_scores: Record<string, number | null> = {};
        papers.forEach((p) => {
          const v = r.paperVals[p.id];
          paper_scores[p.id] = v === "" ? null : Number(v);
        });
        return {
          student_id: r.student.id,
          subject_id: task.subject_id,
          paper_scores,
          remarks: r.remarks || null,
        };
      });
    if (!items.length) {
      toast.info("Nothing to save");
      return;
    }
    await save.mutateAsync({
      assessment_id: task.assessment_id,
      task_id: task.id,
      items,
    });
    setDraft({});
  };

  const onSubmit = async () => {
    await onSave();
    await submit.mutateAsync(task.id);
  };

  if (!papers.length) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        This 8-4-4 subject has no papers configured. Open{" "}
        <b>Academics → Subjects</b>, find <b>{task.subject_name}</b>, and add
        its papers (e.g. Paper 1, Paper 2, Practical) first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2 flex-wrap">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> 8-4-4 · {calcType} · {papers.length}{" "}
          paper{papers.length > 1 ? "s" : ""}
        </Badge>
        <PermissionGate permission="exams:update">
          <Button
            variant="outline"
            onClick={onSave}
            disabled={locked || save.isPending}
          >
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button onClick={onSubmit} disabled={locked || submit.isPending}>
            <Send className="h-4 w-4 mr-1" /> Save &amp; Submit
          </Button>
        </PermissionGate>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Adm #</TableHead>
              <TableHead>Student</TableHead>
              {papers.map((p) => (
                <TableHead key={p.id} className="w-28 text-center">
                  {p.name}
                  <div className="text-[10px] text-muted-foreground">
                    / {Number(p.max_marks)}{" "}
                    {p.paper_type !== "THEORY" ? `· ${p.paper_type}` : ""}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-20 text-center">Total</TableHead>
              <TableHead className="w-16 text-center">%</TableHead>
              <TableHead className="w-16 text-center">Grade</TableHead>
              <TableHead className="w-16 text-center">Pts</TableHead>
              <TableHead>Remarks (auto)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.student.id}>
                <TableCell>{r.student.admission_number}</TableCell>
                <TableCell>
                  {r.student.first_name} {r.student.last_name}
                </TableCell>
                {papers.map((p) => (
                  <TableCell key={p.id}>
                    <Input
                      type="number"
                      min={0}
                      max={Number(p.max_marks)}
                      value={r.paperVals[p.id]}
                      disabled={locked}
                      onChange={(e) =>
                        setPaper(r.student.id, p.id, e.target.value)
                      }
                      className="h-8 text-center"
                    />
                  </TableCell>
                ))}
                <TableCell className="text-center tabular-nums">
                  {r.calc.total}/{r.calc.outOf}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {r.calc.percentage}
                </TableCell>
                <TableCell className="text-center">
                  {r.grade ? (
                    <Badge>{r.grade.code}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {r.grade?.points ?? "—"}
                </TableCell>
                <TableCell>
                  <Input
                    value={r.remarks}
                    placeholder="Auto-filled from grade"
                    disabled={locked}
                    onChange={(e) => setRemarks(r.student.id, e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell
                  colSpan={papers.length + 7}
                  className="text-center text-muted-foreground py-8"
                >
                  No students in this class.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
