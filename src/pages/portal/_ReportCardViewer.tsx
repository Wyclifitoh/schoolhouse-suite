import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PortalReportCard } from "@/hooks/usePortalApi";
import {
  Award,
  Target,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const BAND_COLORS: Record<string, string> = {
  EE: "bg-success/15 text-success border-success/30",
  ME: "bg-primary/15 text-primary border-primary/30",
  AE: "bg-warning/15 text-warning border-warning/30",
  BE: "bg-destructive/15 text-destructive border-destructive/30",
};

export function ReportCardViewer({
  card,
  onClose,
}: {
  card: PortalReportCard;
  onClose: () => void;
}) {
  const p: any = card.payload || {};
  const subjects: any[] = p.subjects || [];
  const competencies: any[] = p.competencies || [];
  const is844 =
    String(p.kind || p.curriculum || "").toUpperCase() === "844" ||
    subjects.some((s: any) => s.grade_code || s.points != null);

  if (is844) {
    return <Report844 card={card} onClose={onClose} />;
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {card.assessment_name}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Published {new Date(card.published_at).toLocaleDateString()}
          </p>
        </DialogHeader>

        {/* Header summary */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-2">
          <SummaryStat label="Mean %" value={`${p.percentage ?? "—"}%`} />
          <SummaryStat label="Overall AL" value={p.overall_al || "—"} />
          <SummaryStat
            label="Band"
            value={p.overall_band || "—"}
            band={p.overall_band || undefined}
          />
          <SummaryStat
            label="Class Position"
            value={p.class_position ? String(p.class_position) : "—"}
          />
        </div>

        <ProgressSection
          progress={p.progress}
          currentAssessmentId={card.assessment_id}
        />

        {/* Subjects */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold">Subjects</h4>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-center">AL</TableHead>
                  <TableHead className="text-center">Band</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-xs text-muted-foreground py-6"
                    >
                      No subject data
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {s.subject_name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.score ?? "—"} / {s.out_of ?? "—"}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {s.achievement_level_code || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.band_code ? (
                          <Badge
                            variant="outline"
                            className={
                              BAND_COLORS[s.band_code] ||
                              "border-muted-foreground/30"
                            }
                          >
                            {s.band_code}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.remarks || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Competencies */}
        {competencies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold">Competency Ratings</h4>
            </div>
            <div className="grid gap-2 grid-cols-2">
              {competencies.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-md border bg-muted/30"
                >
                  <span className="text-sm font-medium">{c.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      BAND_COLORS[c.rating] || "border-muted-foreground/30"
                    }
                  >
                    {c.rating}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remarks */}
        {(card.teacher_remarks || card.principal_remarks) && (
          <div className="space-y-3">
            {card.teacher_remarks && (
              <RemarkBlock title="Class Teacher" text={card.teacher_remarks} />
            )}
            {card.principal_remarks && (
              <RemarkBlock title="Head Teacher" text={card.principal_remarks} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({
  label,
  value,
  band,
}: {
  label: string;
  value: string;
  band?: string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-black ${
          band && BAND_COLORS[band] ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RemarkBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-1.5 mb-1">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress section: term assessments table, previous-term comparison */
/*  and a trend chart. Renders nothing if progress data is missing.    */
/* ------------------------------------------------------------------ */
function ProgressSection({
  progress,
  currentAssessmentId,
}: {
  progress: any;
  currentAssessmentId?: string;
}) {
  if (!progress) return null;
  const termAssessments: any[] = progress.term_assessments || [];
  const subjectMatrix: any[] = progress.subject_matrix || [];
  const previous = progress.previous_term;
  const trend: any[] = progress.trend || [];

  // Build subject x assessment pivot
  const subjectMap = new Map<
    string,
    { name: string; code?: string; cells: Map<string, any> }
  >();
  for (const row of subjectMatrix) {
    if (!subjectMap.has(row.subject_id)) {
      subjectMap.set(row.subject_id, {
        name: row.subject_name,
        code: row.subject_code,
        cells: new Map(),
      });
    }
    subjectMap.get(row.subject_id)!.cells.set(row.assessment_id, row);
  }

  const hasTerm = termAssessments.length > 1;
  const hasTrend = trend.length > 1;
  if (!hasTerm && !previous && !hasTrend) return null;

  const trendData = trend.map((t) => ({
    name: (t.name || "").slice(0, 14),
    pct: Number(t.percentage) || 0,
  }));

  return (
    <div className="space-y-4 my-3">
      {previous && (
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold">Previous Term Comparison</h4>
            </div>
            <DeltaChip delta={previous.delta_percentage} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <PrevCell label="Previous" value={previous.assessment_name} />
            <PrevCell
              label="Mean %"
              value={`${Number(previous.percentage || 0).toFixed(1)}%`}
            />
            <PrevCell label="Grade/AL" value={previous.overall_al || "—"} />
            <PrevCell
              label="Position"
              value={
                previous.class_position ? String(previous.class_position) : "—"
              }
            />
          </div>
        </div>
      )}

      {hasTerm && subjectMap.size > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold">All Term Assessments</h4>
          </div>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  {termAssessments.map((a) => (
                    <TableHead key={a.id} className="text-center">
                      <span
                        className={
                          a.id === currentAssessmentId
                            ? "text-primary font-bold"
                            : ""
                        }
                      >
                        {a.name}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(subjectMap.values()).map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    {termAssessments.map((a) => {
                      const cell = s.cells.get(a.id);
                      return (
                        <TableCell
                          key={a.id}
                          className="text-center text-xs tabular-nums"
                        >
                          {cell ? (
                            <span>
                              {cell.score ?? "—"}
                              {cell.out_of ? `/${cell.out_of}` : ""}
                              {cell.grade_code ||
                              cell.achievement_level_code ? (
                                <span className="ml-1 font-bold">
                                  (
                                  {cell.grade_code ||
                                    cell.achievement_level_code}
                                  )
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>Overall %</TableCell>
                  {termAssessments.map((a) => (
                    <TableCell
                      key={a.id}
                      className="text-center text-xs tabular-nums"
                    >
                      {a.percentage
                        ? `${Number(a.percentage).toFixed(1)}%`
                        : "—"}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {hasTrend && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold">Performance Trend</h4>
          </div>
          <div
            className="rounded-lg border bg-card p-3"
            style={{ height: 200 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function PrevCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded p-2 border">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function DeltaChip({ delta }: { delta: number | null | undefined }) {
  if (delta == null) return null;
  const up = delta > 0;
  const down = delta < 0;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  const cls = up
    ? "bg-success/15 text-success border-success/30"
    : down
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : "bg-muted text-muted-foreground border-muted-foreground/30";
  return (
    <Badge variant="outline" className={cls}>
      <Icon className="h-3 w-3 mr-1" />
      {up ? "+" : ""}
      {delta.toFixed(1)}%
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  8-4-4 (Zeraki-style) report card template                          */
/* ------------------------------------------------------------------ */

function Report844({
  card,
  onClose,
}: {
  card: PortalReportCard;
  onClose: () => void;
}) {
  const p: any = card.payload || {};
  const subjects: any[] = p.subjects || [];
  const totalPoints = subjects.reduce(
    (acc, s) => acc + (Number(s.points) || 0),
    0,
  );
  const totalMarks = subjects.reduce(
    (acc, s) => acc + (Number(s.score) || 0),
    0,
  );
  const totalOutOf = subjects.reduce(
    (acc, s) => acc + (Number(s.out_of) || 0),
    0,
  );
  const mean =
    p.percentage ??
    (totalOutOf > 0 ? Math.round((totalMarks / totalOutOf) * 10000) / 100 : 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {card.assessment_name}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            8-4-4 Report Card · Published{" "}
            {new Date(card.published_at).toLocaleDateString()}
          </p>
        </DialogHeader>

        {/* Header summary */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-2">
          <SummaryStat label="Mean Mark" value={`${mean}%`} />
          <SummaryStat
            label="Mean Grade"
            value={p.mean_grade || p.overall_grade || "—"}
          />
          <SummaryStat
            label="Total Points"
            value={String(totalPoints || "—")}
          />
          <SummaryStat
            label="Position"
            value={
              p.class_position
                ? `${p.class_position}${p.class_total ? ` / ${p.class_total}` : ""}`
                : "—"
            }
          />
        </div>

        <ProgressSection
          progress={p.progress}
          currentAssessmentId={card.assessment_id}
        />

        {/* Subjects */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold">Subjects</h4>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Marks</TableHead>
                  <TableHead className="text-right">Out Of</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-xs text-muted-foreground py-6"
                    >
                      No subject data
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((s, i) => {
                    const pct =
                      s.percentage ??
                      (s.out_of > 0
                        ? Math.round((s.score / s.out_of) * 10000) / 100
                        : null);
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {s.subject_name}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {s.score ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {s.out_of ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {pct != null ? `${pct}%` : "—"}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {s.grade_code || s.achievement_level_code || "—"}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {s.points ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.remarks || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Remarks */}
        {(card.teacher_remarks || card.principal_remarks) && (
          <div className="space-y-3 mt-4">
            {card.teacher_remarks && (
              <RemarkBlock title="Class Teacher" text={card.teacher_remarks} />
            )}
            {card.principal_remarks && (
              <RemarkBlock title="Head Teacher" text={card.principal_remarks} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
