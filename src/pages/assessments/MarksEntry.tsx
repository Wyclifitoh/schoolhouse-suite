import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  useTaskRoster,
  useBulkSaveAssessmentMarks,
  useSubmitTask,
  useAchievementLevels,
} from "@/hooks/useAssessments";
import { useRemarkBands, previewRemark } from "@/hooks/useRemarkBands";
import {
  ArrowLeft,
  Save,
  Send,
  Download,
  Upload,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { PermissionGate } from "@/components/PermissionGate";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { PaperMarksGrid } from "@/components/assessments/PaperMarksGrid";

type Draft = Record<
  string,
  { score?: string; status?: string; remarks?: string }
>;

function previewAL(levels: any[], score: number, outOf: number) {
  if (score === null || isNaN(score) || outOf <= 0) return null;
  const pct = (score / outOf) * 100;
  return levels.find(
    (l) => pct >= Number(l.min_score) && pct <= Number(l.max_score),
  );
}

export default function MarksEntry() {
  const { taskId } = useParams();
  const { data, isLoading } = useTaskRoster(taskId);
  const { data: levels = [] } = useAchievementLevels();
  const bulk = useBulkSaveAssessmentMarks();
  const submit = useSubmitTask();
  const { user, hasAnyRole } = useAuth();
  const canEnterMarks = usePermission("exams:update");
  // A teacher assigned to the task may enter marks even without the global
  // exams:update permission bit; server-side still enforces school scoping.
  const isTaskOwner =
    !!user &&
    !!data?.task &&
    ((data.task as any).teacher_id === user.id ||
      (data.task as any).assigned_teacher_id === user.id);
  const canSave =
    canEnterMarks ||
    isTaskOwner ||
    hasAnyRole(["super_admin", "admin", "school_admin", "teacher"]);

  const task = data?.task;
  const outOf = data?.out_of ?? 100;
  const gradeId = (task as any)?.grade_id;
  const subjectId = task?.subject_id;

  // 8-4-4 paper-based entry: when the assessment snapshot has papers wired
  // for this subject, delegate to the paper grid which knows how to compute
  // per-paper contributions, grade, points and remarks.
  const usePaperFlow =
    String((data as any)?.curriculum_type || "").replace(
      /[^0-9A-Za-z]/g,
      "",
    ) === "844" ||
    !!data?.subject_config?.uses_papers ||
    !!(data?.papers && data.papers.length > 0);

  const { data: bands = [] } = useRemarkBands({
    subject_id: subjectId,
    grade_id: gradeId,
  });

  const [draft, setDraft] = useState<Draft>({});
  const [localOutOf, setLocalOutOf] = useState<number>(100);

  useEffect(() => {
    setDraft({});
    if (data?.out_of) {
      setLocalOutOf(data.out_of);
    }
  }, [taskId, data?.out_of]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<null | {
    rows: Array<{
      admission_number: string;
      name: string;
      score: number | null;
      existing?: any;
    }>;
    matched: number;
    unmatched: number;
  }>(null);

  const locked =
    task && ["locked", "archived"].includes((task as any).assessment_status);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.students.map((s) => {
      const d = draft[s.id] || {};
      const score =
        d.score ?? (s.mark?.score != null ? String(s.mark.score) : "");
      // Auto-status when score present
      const baseStatus = d.status ?? s.mark?.status ?? "pending";
      const status =
        score !== "" &&
        !["absent", "exempted", "transferred_in", "transferred_out"].includes(
          baseStatus,
        )
          ? "present"
          : baseStatus;

      // Auto-remark preview if empty
      let remarks = d.remarks ?? s.mark?.remarks ?? "";
      if (!remarks && score !== "" && status === "present") {
        const numScore = Number(score);
        if (!isNaN(numScore)) {
          const auto = previewRemark(bands as any, {
            subject_id: subjectId,
            grade_id: gradeId,
            pct: outOf > 0 ? (numScore / outOf) * 100 : 0,
          });
          if (auto) remarks = auto;
        }
      }
      return { student: s, score, status, remarks, mark: s.mark };
    });
  }, [data, draft, bands, subjectId, gradeId, localOutOf]);

  const setCell = (
    id: string,
    patch: Partial<{ score: string; status: string; remarks: string }>,
  ) => setDraft((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const onSave = async () => {
    if (!task) return;
    // Server will re-resolve AL + remarks; we just send what changed.
    const items = rows
      .filter(
        (r) =>
          r.score !== (r.mark?.score != null ? String(r.mark.score) : "") ||
          r.status !== (r.mark?.status ?? "pending") ||
          r.remarks !== (r.mark?.remarks ?? ""),
      )
      .map((r) => ({
        student_id: r.student.id,
        subject_id: task.subject_id,
        score: r.score === "" ? null : Number(r.score),
        out_of: localOutOf,
        status: r.status,
        // Send remarks only if teacher changed it from the auto-preview; backend
        // resolves auto-remarks itself when this is null/empty.
        remarks: r.remarks || null,
      }));
    const outOfChanged = localOutOf !== outOf;

    if (!items.length && !outOfChanged) {
      toast.info("Nothing to save");
      return;
    }

    await bulk.mutateAsync({
      assessment_id: task.assessment_id,
      task_id: task.id,
      global_out_of: localOutOf,
      items,
    });
    setDraft({});
  };

  const onSubmit = async () => {
    await onSave();
    if (task) await submit.mutateAsync(task.id);
  };

  // ---------- DOWNLOAD TEMPLATE (XLSX) ----------
  const downloadTemplate = () => {
    if (!task || !data) return;
    const meta = [
      ["Assessment", task.assessment_name],
      [
        "Class",
        `${task.grade_name}${task.stream_name ? ` · ${task.stream_name}` : ""}`,
      ],
      ["Subject", `${task.subject_name} (${task.subject_code})`],
      ["Out of", outOf],
      [],
      [
        "INSTRUCTIONS:",
        "Enter the Score column only. Achievement Level, Band, Status and Remarks are filled automatically on import.",
      ],
      [],
    ];
    const head = ["Admission No", "Student Name", "Score", "Out of"];
    const body = data.students.map((s) => [
      s.admission_number,
      `${s.first_name} ${s.last_name}`,
      s.mark?.score ?? "",
      localOutOf,
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([...meta, head, ...body]);
    sheet["!cols"] = [{ wch: 16 }, { wch: 28 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Marks");
    const file =
      `marks-template-${task.assessment_name}-${task.subject_name}`.replace(
        /\W+/g,
        "_",
      );
    XLSX.writeFile(wb, `${file}.xlsx`);
  };

  // ---------- IMPORT ----------
  const onPickFile = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const all: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });
      // Find header row containing "Admission No"
      const headerIdx = all.findIndex((r) =>
        r.some((c) => String(c).trim().toLowerCase().startsWith("admission")),
      );
      if (headerIdx === -1) {
        toast.error("Could not find header row with 'Admission No'.");
        return;
      }
      const header = all[headerIdx].map((c) => String(c).trim().toLowerCase());
      const admIdx = header.findIndex((c) => c.startsWith("admission"));
      const scoreIdx = header.findIndex((c) => c.startsWith("score"));
      if (admIdx < 0 || scoreIdx < 0) {
        toast.error(
          "Template must include 'Admission No' and 'Score' columns.",
        );
        return;
      }
      const byAdm = new Map(
        data.students.map((s) => [
          String(s.admission_number).trim().toUpperCase(),
          s,
        ]),
      );
      const parsed: typeof importPreview.rows = [];
      for (let i = headerIdx + 1; i < all.length; i++) {
        const r = all[i];
        const adm = String(r[admIdx] ?? "").trim();
        if (!adm) continue;
        const stu = byAdm.get(adm.toUpperCase());
        const raw = r[scoreIdx];
        const score = raw === "" || raw == null ? null : Number(raw);
        parsed.push({
          admission_number: adm,
          name: stu ? `${stu.first_name} ${stu.last_name}` : "—",
          score: isNaN(score as any) ? null : score,
          existing: stu,
        });
      }
      const matched = parsed.filter((p) => p.existing).length;
      const unmatched = parsed.length - matched;
      setImportPreview({ rows: parsed, matched, unmatched });
    } catch (err: any) {
      toast.error(err.message || "Failed to read file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const applyImport = async () => {
    if (!importPreview || !task) return;
    // Merge into draft so the preview updates and the user can still adjust.
    setDraft((prev) => {
      const next = { ...prev };
      for (const r of importPreview.rows) {
        if (!r.existing) continue;
        if (r.score == null || isNaN(r.score)) continue;
        if (r.score < 0 || r.score > localOutOf) continue;
        next[r.existing.id] = {
          ...next[r.existing.id],
          score: String(r.score),
          status: "present",
        };
      }
      return next;
    });
    setImportPreview(null);
    toast.success(
      `Imported ${importPreview.matched} students. Click Save to commit.`,
    );
  };

  if (isLoading || !task) {
    return (
      <DashboardLayout>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </DashboardLayout>
    );
  }

  if (usePaperFlow && data) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div>
            <Link
              to={`/assessments/${task.assessment_id}`}
              className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to assessment
            </Link>
            <h1 className="text-3xl font-bold mt-1">Marks Entry</h1>
            <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <p>
                <strong>Assessment:</strong> {task.assessment_name}
              </p>
              <p>
                <strong>Class:</strong> {task.grade_name}
                {task.stream_name ? ` · ${task.stream_name}` : ""}
              </p>
              <p>
                <strong>Subject:</strong> {task.subject_name}
              </p>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Paper Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <PaperMarksGrid roster={data} locked={!!locked} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const markedCount = rows.filter(
    (r) => r.score !== "" || ["absent", "exempted"].includes(r.status),
  ).length;
  const completion = rows.length
    ? Math.round((markedCount / rows.length) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            to={`/assessments/${task.assessment_id}`}
            className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to assessment
          </Link>
          <h1 className="text-3xl font-bold mt-1">Marks Entry</h1>
          <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <p>
              <strong>Assessment:</strong> {task.assessment_name}
            </p>
            <p>
              <strong>Class:</strong> {task.grade_name}
              {task.stream_name ? ` · ${task.stream_name}` : ""}
            </p>
            <p>
              <strong>Subject:</strong> {task.subject_name}
            </p>
            <p>
              <strong>Teacher:</strong>{" "}
              {task.teacher_name?.trim() ? (
                task.teacher_name
              ) : (
                <span className="italic text-amber-600">Unassigned</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Out of:</span>
              <Input
                type="number"
                className="w-20 h-8"
                min={1}
                value={localOutOf}
                disabled={!!locked}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setLocalOutOf(isNaN(v) || v < 1 ? 1 : v);
                }}
              />
            </div>
            <Badge variant="outline">
              {markedCount}/{rows.length} entered ({completion}%)
            </Badge>
            <Badge variant="outline">{task.status}</Badge>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Auto remarks: {bands.length}{" "}
              bands
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap justify-between gap-2">
              <CardTitle>Roster</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={onFile}
                />
                <Button variant="outline" onClick={downloadTemplate}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> Download template
                </Button>
                {canSave && (
                  <>
                    <Button
                      variant="outline"
                      onClick={onPickFile}
                      disabled={!!locked}
                    >
                      <Upload className="h-4 w-4 mr-1" /> Import marks
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onSave}
                      disabled={!!locked || bulk.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" /> Save draft
                    </Button>
                    <Button
                      onClick={onSave}
                      disabled={!!locked || bulk.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                    <Button
                      onClick={onSubmit}
                      disabled={!!locked || submit.isPending}
                    >
                      <Send className="h-4 w-4 mr-1" /> Save &amp; Submit
                    </Button>
                  </>
                )}
                {!canSave && (
                  <span className="text-xs text-muted-foreground self-center">
                    Read only — not assigned to this task.
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {locked && (
              <div className="mb-3 text-sm text-amber-600">
                This assessment is {(task as any).assessment_status}. Marks are
                read-only.
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Adm #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-48">Score / {localOutOf}</TableHead>
                    <TableHead className="w-20">AL</TableHead>
                    <TableHead className="w-20">Band</TableHead>
                    <TableHead className="w-36">Status</TableHead>
                    <TableHead>Remarks (auto)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const num = r.score === "" ? NaN : Number(r.score);
                    const al = previewAL(levels as any[], num, localOutOf);
                    return (
                      <TableRow key={r.student.id}>
                        <TableCell>{r.student.admission_number}</TableCell>
                        <TableCell>
                          {r.student.first_name} {r.student.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-20"
                              min={0}
                              max={localOutOf}
                              value={r.score}
                              disabled={
                                !!locked ||
                                r.status === "absent" ||
                                r.status === "exempted"
                              }
                              onChange={(e) => {
                                let val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > localOutOf)
                                  val = localOutOf;
                                setCell(r.student.id, {
                                  score: isNaN(val)
                                    ? e.target.value
                                    : String(val),
                                });
                              }}
                            />
                            {r.score !== "" &&
                              !isNaN(Number(r.score)) &&
                              localOutOf > 0 && (
                                <span className="text-xs text-muted-foreground w-12 text-right">
                                  {(
                                    (Number(r.score) / localOutOf) *
                                    100
                                  ).toFixed(0)}
                                  %
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {al ? (
                            <Badge variant="secondary">{al.code}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {al ? (
                            <Badge variant="outline">{al.band_code}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={r.status}
                            onValueChange={(v) =>
                              setCell(r.student.id, { status: v })
                            }
                            disabled={!!locked}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="exempted">Exempted</SelectItem>
                              <SelectItem value="transferred_in">
                                Transferred in
                              </SelectItem>
                              <SelectItem value="transferred_out">
                                Transferred out
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={r.remarks}
                            placeholder="Auto-filled from score"
                            disabled={!!locked}
                            onChange={(e) =>
                              setCell(r.student.id, { remarks: e.target.value })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!rows.length && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
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

      {/* ---------- Import preview dialog ---------- */}
      <Dialog
        open={!!importPreview}
        onOpenChange={(o) => !o && setImportPreview(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import preview</DialogTitle>
          </DialogHeader>
          {importPreview && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {importPreview.matched} matched
                </Badge>
                {importPreview.unmatched > 0 && (
                  <Badge variant="destructive">
                    {importPreview.unmatched} unmatched
                  </Badge>
                )}
                <Badge variant="outline">Out of {localOutOf}</Badge>
              </div>
              <div className="max-h-80 overflow-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Adm</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="w-20 text-right">Score</TableHead>
                      <TableHead className="w-28">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.rows.map((r, i) => {
                      const invalid =
                        r.score != null &&
                        (r.score < 0 || r.score > localOutOf);
                      return (
                        <TableRow key={i}>
                          <TableCell>{r.admission_number}</TableCell>
                          <TableCell>{r.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.score ?? "—"}
                          </TableCell>
                          <TableCell>
                            {!r.existing ? (
                              <Badge variant="destructive">Not found</Badge>
                            ) : invalid ? (
                              <Badge variant="destructive">Out of range</Badge>
                            ) : r.score == null ? (
                              <Badge variant="outline">Blank</Badge>
                            ) : (
                              <Badge variant="secondary">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground">
                Status &amp; remarks will be auto-filled based on the score when
                you save.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportPreview(null)}>
              Cancel
            </Button>
            <Button onClick={applyImport} disabled={!importPreview?.matched}>
              <Download className="h-4 w-4 mr-1" /> Apply to roster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
