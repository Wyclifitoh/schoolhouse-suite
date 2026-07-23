import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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
import { FileSpreadsheet, Save, Send, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { PermissionGate } from "@/components/PermissionGate";
import {
  computeSubject844,
  gradeFor844,
  gradeForLevels,
} from "@/lib/grading844";
import { useGradingSystem } from "@/hooks/useGradingSystems";
import type { TaskRoster } from "@/hooks/useAssessments";
import { useBulkSavePaperMarks, useSubmitTask } from "@/hooks/useAssessments";
import { useRemarkBands, previewRemark } from "@/hooks/useRemarkBands";

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
  const gradingSystemId =
    (roster.subject_config as any)?.grading_system_id || undefined;
  const { data: gradingSystem } = useGradingSystem(gradingSystemId);
  const levels = gradingSystem?.levels || null;
  const task = roster.task;
  const { data: bands = [] } = useRemarkBands({
    subject_id: task.subject_id,
    grade_id: task.grade_id,
  });

  const save = useBulkSavePaperMarks();
  const submit = useSubmitTask();
  const fileRef = useRef<HTMLInputElement>(null);

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
      const grade =
        gradeForLevels(calc.percentage, levels as any) ||
        (gradeFor844(calc.percentage) as any);
      let remarks = draft[s.id]?.remarks ?? s.mark?.remarks ?? "";
      if (!remarks && Number.isFinite(calc.percentage)) {
        const auto = previewRemark(bands as any, {
          subject_id: task.subject_id,
          grade_id: task.grade_id,
          pct: calc.percentage,
          level_code: grade?.code || null,
        });
        remarks = auto || (grade ? grade.remark : "");
      }
      return { student: s, paperVals, calc, grade, remarks };
    });
  }, [roster.students, papers, draft, calcType, calcCfg, levels, bands, task.subject_id, task.grade_id]);

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

  const downloadTemplate = () => {
    const meta = [
      ["Assessment", task.assessment_name],
      [
        "Class",
        `${task.grade_name}${task.stream_name ? ` · ${task.stream_name}` : ""}`,
      ],
      [
        "Subject",
        `${task.subject_name}${task.subject_code ? ` (${task.subject_code})` : ""}`,
      ],
      ["Mode", "8-4-4 paper marks"],
      [],
      [
        "INSTRUCTIONS:",
        "Enter raw marks under each paper column. Do not enter totals, grade or points.",
      ],
      [],
    ];
    const head = [
      "Admission No",
      "Student Name",
      ...papers.map((p) => `${p.name} / ${Number(p.max_marks)}`),
    ];
    const body = roster.students.map((s) => {
      const stored = parseStored(s.mark?.paper_scores);
      return [
        s.admission_number,
        `${s.first_name} ${s.last_name}`,
        ...papers.map((p) => stored[p.id] ?? ""),
      ];
    });
    const sheet = XLSX.utils.aoa_to_sheet([...meta, head, ...body]);
    sheet["!cols"] = [
      { wch: 16 },
      { wch: 28 },
      ...papers.map(() => ({ wch: 14 })),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Paper Marks");
    const file =
      `paper-marks-template-${task.assessment_name}-${task.subject_name}`.replace(
        /\W+/g,
        "_",
      );
    XLSX.writeFile(wb, `${file}.xlsx`);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const all: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });
      const headerIdx = all.findIndex((r) =>
        r.some((c) => String(c).trim().toLowerCase().startsWith("admission")),
      );
      if (headerIdx === -1) {
        toast.error("Could not find header row with 'Admission No'.");
        return;
      }
      const header = all[headerIdx].map((c) => String(c).trim().toLowerCase());
      const admIdx = header.findIndex((c) => c.startsWith("admission"));
      const paperIndexes = papers.map((p) => {
        const name = p.name.toLowerCase();
        const code = String((p as any).code || "").toLowerCase();
        return header.findIndex(
          (c) => c.startsWith(name) || (!!code && c.startsWith(code)),
        );
      });
      if (admIdx < 0 || paperIndexes.every((i) => i < 0)) {
        toast.error(
          "Template must include Admission No and at least one paper column.",
        );
        return;
      }
      const byAdm = new Map(
        roster.students.map((s) => [
          String(s.admission_number).trim().toUpperCase(),
          s,
        ]),
      );
      let matched = 0;
      let imported = 0;
      const next: Draft = {};
      for (let i = headerIdx + 1; i < all.length; i++) {
        const r = all[i];
        const adm = String(r[admIdx] ?? "")
          .trim()
          .toUpperCase();
        if (!adm) continue;
        const stu = byAdm.get(adm);
        if (!stu) continue;
        matched++;
        const paperVals: Record<string, string> = {};
        papers.forEach((p, idx) => {
          const col = paperIndexes[idx];
          if (col < 0) return;
          const raw = r[col];
          if (raw === "" || raw == null) return;
          const score = Number(raw);
          if (
            !Number.isFinite(score) ||
            score < 0 ||
            score > Number(p.max_marks)
          )
            return;
          paperVals[p.id] = String(score);
          imported++;
        });
        if (Object.keys(paperVals).length) {
          next[stu.id] = { ...(next[stu.id] || {}), papers: paperVals };
        }
      }
      setDraft((prev) => ({ ...prev, ...next }));
      toast.success(
        `Imported ${imported} paper marks for ${matched} students. Click Save to commit.`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to read file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
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
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onFile}
        />
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> 8-4-4 ·{" "}
          {papers.some((p: any) => Number(p.contribution_pct) > 0)
            ? "Contribution"
            : calcType}{" "}
          · {papers.length} paper{papers.length > 1 ? "s" : ""}
          {gradingSystem?.name ? ` · ${gradingSystem.name}` : ""}
        </Badge>
        <Button variant="outline" onClick={downloadTemplate}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Download template
        </Button>
        <PermissionGate permission="exams:update">
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={locked}
          >
            <Upload className="h-4 w-4 mr-1" /> Import marks
          </Button>
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
                    {Number((p as any).contribution_pct) > 0
                      ? ` · ${Number((p as any).contribution_pct)}%`
                      : ""}
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
