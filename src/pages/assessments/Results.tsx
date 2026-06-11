import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  useAssessmentsList,
  useAssessmentResults,
  useComputeResults,
  useBulkResultStatus,
  useRecomputeResultPositions,
  type ResultStatus,
} from "@/hooks/useAssessments";
import { useGrades, useStreams } from "@/hooks/useGrades";
import { useAuth } from "@/contexts/AuthContext";
import {
  ClipboardCheck,
  RefreshCw,
  ListChecks,
  CheckCircle2,
  Send,
  Undo2,
  Trophy,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PermissionGate } from "@/components/PermissionGate";

const STATUS_COLORS: Record<ResultStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  approved: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  published: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  revoked: "bg-destructive/15 text-destructive",
};

const APPROVER_ROLES = [
  "super_admin",
  "admin",
  "school_admin",
  "deputy_admin",
  "manager",
];

export default function Results() {
  const { hasAnyRole } = useAuth();
  const canApprove = hasAnyRole(APPROVER_ROLES as any);

  const { data: assessments = [] } = useAssessmentsList();
  const { data: grades = [] } = useGrades();
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [gradeId, setGradeId] = useState<string>("");
  const [streamId, setStreamId] = useState<string>("");
  const { data: streams = [] } = useStreams(gradeId || undefined);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (statusFilter) f.status = statusFilter;
    if (gradeId) f.grade_id = gradeId;
    if (streamId) f.stream_id = streamId;
    return f;
  }, [statusFilter, gradeId, streamId]);

  const { data: results = [], isLoading } = useAssessmentResults(
    assessmentId,
    filters,
  );
  const compute = useComputeResults();
  const positions = useRecomputeResultPositions();
  const setStatus = useBulkResultStatus();

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const allSelected =
    results.length > 0 && results.every((r) => selected.has(r.id));

  const doStatus = (status: ResultStatus) => {
    if (!assessmentId) return;
    if (!selected.size) return toast.error("Select at least one result");
    if (["approved", "published", "revoked"].includes(status) && !canApprove) {
      return toast.error(
        "Only admins or managers can approve, publish or revoke.",
      );
    }
    setStatus.mutate(
      { assessment_id: assessmentId, ids: Array.from(selected), status },
      { onSuccess: () => setSelected(new Set()) },
    );
  };

  const summary = useMemo(() => {
    const totals = { count: results.length, mean: 0, published: 0, pending: 0 };
    if (!results.length) return totals;
    totals.mean =
      results.reduce((sum, r) => sum + Number(r.percentage || 0), 0) /
      results.length;
    totals.published = results.filter((r) => r.status === "published").length;
    totals.pending = results.filter(
      (r) => r.status === "pending_review",
    ).length;
    return totals;
  }, [results]);

  const exportRows = useMemo(
    () =>
      results.map((r, i) => ({
        "#": r.class_position ?? i + 1,
        "Admission No.": r.admission_number,
        Student: `${r.first_name} ${r.last_name}`,
        Class: `${r.grade_name || ""}${r.stream_name ? " · " + r.stream_name : ""}`,
        Total: Number(r.total_score || 0),
        "Out Of": Number(r.total_out_of || 0),
        "Mean %": Number(r.percentage || 0).toFixed(1),
        AL: r.overall_al || "",
        Band: r.overall_band || "",
        Status: r.status,
      })),
    [results],
  );

  const assessmentName = useMemo(
    () => assessments.find((a) => a.id === assessmentId)?.name || "Results",
    [assessments, assessmentId],
  );

  const exportExcel = () => {
    if (!exportRows.length) return toast.error("Nothing to export");
    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws["!cols"] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 26 },
      { wch: 22 },
      { wch: 8 },
      { wch: 8 },
      { wch: 9 },
      { wch: 6 },
      { wch: 10 },
      { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `${assessmentName.replace(/[^a-z0-9_-]+/gi, "_")}.xlsx`);
  };

  const exportPdf = () => {
    if (!exportRows.length) return toast.error("Nothing to export");
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    doc.setFontSize(14);
    doc.text(assessmentName, 40, 36);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      `Students: ${summary.count}  ·  Mean: ${summary.mean ? summary.mean.toFixed(1) + "%" : "—"}  ·  Published: ${summary.published}  ·  Pending: ${summary.pending}`,
      40,
      54,
    );
    doc.setTextColor(0);
    const head = [Object.keys(exportRows[0])];
    const body = exportRows.map((r) => Object.values(r) as any[]);
    autoTable(doc, {
      head,
      body,
      startY: 70,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 40, right: 40 },
    });
    doc.save(`${assessmentName.replace(/[^a-z0-9_-]+/gi, "_")}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-primary" /> Results
            </h1>
            <p className="text-muted-foreground">
              Aggregate, review, approve and publish assessment results.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px]">
              <label className="text-xs text-muted-foreground">
                Assessment
              </label>
              <Select
                value={assessmentId}
                onValueChange={(v) => {
                  setAssessmentId(v);
                  setSelected(new Set());
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} <span className="opacity-50">— {a.status}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <label className="text-xs text-muted-foreground">Class</label>
              <Select
                value={gradeId || "all"}
                onValueChange={(v) => {
                  setGradeId(v === "all" ? "" : v);
                  setStreamId("");
                  setSelected(new Set());
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <label className="text-xs text-muted-foreground">Stream</label>
              <Select
                value={streamId || "all"}
                onValueChange={(v) => {
                  setStreamId(v === "all" ? "" : v);
                  setSelected(new Set());
                }}
                disabled={!gradeId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={gradeId ? "All streams" : "Pick class"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All streams</SelectItem>
                  {streams.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select
                value={statusFilter || "all"}
                onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending_review">Pending review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <PermissionGate permission="exams:update">
              <Button
                variant="outline"
                disabled={!assessmentId || compute.isPending}
                onClick={() => compute.mutate(assessmentId)}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {compute.isPending ? "Computing…" : "Compute"}
              </Button>
              <Button
                variant="outline"
                disabled={!assessmentId || positions.isPending}
                onClick={() => positions.mutate(assessmentId)}
              >
                <Trophy className="h-4 w-4 mr-1" /> Rank
              </Button>
            </PermissionGate>
            <PermissionGate permission="reports:export">
              <Button
                variant="outline"
                disabled={!results.length}
                onClick={exportExcel}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button
                variant="outline"
                disabled={!results.length}
                onClick={exportPdf}
              >
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
            </PermissionGate>
          </div>
        </div>

        {!canApprove && (
          <div className="rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Teachers can submit results for review. Approving &amp; publishing
            is restricted to admins and managers.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Students", value: summary.count, icon: ListChecks },
            {
              label: "Mean %",
              value: summary.mean ? summary.mean.toFixed(1) : "—",
              icon: Trophy,
            },
            {
              label: "Pending review",
              value: summary.pending,
              icon: ClipboardCheck,
            },
            {
              label: "Published",
              value: summary.published,
              icon: CheckCircle2,
            },
          ].map((c, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-2xl font-bold">{c.value as any}</div>
                </div>
                <c.icon className="h-6 w-6 text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle>Results roster</CardTitle>
            <div className="flex flex-wrap gap-2">
              <PermissionGate permission={["exams:update", "exams:publish"]}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selected.size || setStatus.isPending}
                  onClick={() => doStatus("pending_review")}
                >
                  <Send className="h-4 w-4 mr-1" /> Submit for review
                </Button>
              </PermissionGate>
              <PermissionGate permission="exams:publish">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selected.size || setStatus.isPending}
                  onClick={() => doStatus("approved")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  disabled={!selected.size || setStatus.isPending}
                  onClick={() => doStatus("published")}
                >
                  <Send className="h-4 w-4 mr-1" /> Publish
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!selected.size || setStatus.isPending}
                  onClick={() => doStatus("revoked")}
                >
                  <Undo2 className="h-4 w-4 mr-1" /> Revoke
                </Button>
              </PermissionGate>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(v) =>
                        setSelected(
                          v ? new Set(results.map((r) => r.id)) : new Set(),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Mean %</TableHead>
                  <TableHead>AL</TableHead>
                  <TableHead>Band</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggle(r.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {r.class_position ?? i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {r.first_name} {r.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.admission_number}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.grade_name}
                      {r.stream_name ? ` · ${r.stream_name}` : ""}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.total_score).toFixed(0)} /{" "}
                      {Number(r.total_out_of).toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(r.percentage || 0).toFixed(1)}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const pts = (r as any).total_points;
                        if (pts != null && !isNaN(Number(pts))) {
                          return (
                            <Badge variant="outline">
                              AL{Math.round(Number(pts))}
                            </Badge>
                          );
                        }
                        return r.overall_al ? (
                          <Badge variant="outline">{r.overall_al}</Badge>
                        ) : (
                          "—"
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {r.overall_band ? <Badge>{r.overall_band}</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!results.length && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-10"
                    >
                      {!assessmentId
                        ? "Select an assessment to view results."
                        : isLoading
                          ? "Loading…"
                          : "No results yet — click Compute."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
