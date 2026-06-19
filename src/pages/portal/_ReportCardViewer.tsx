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
import { Award, Target, MessageSquare } from "lucide-react";

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
