import { useState } from "react";
import {
  usePortalAssessmentResults,
  usePortalReportCards,
  PortalAssessmentResult,
} from "@/hooks/usePortalApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronDown, FileText, Trophy, Target, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportCardViewer } from "@/pages/portal/_ReportCardViewer";

const pct = (n?: number | null) =>
  n == null ? "—" : `${Number(n).toFixed(1)}%`;

function bandTone(band?: string | null) {
  const b = (band || "").toUpperCase();
  if (b.startsWith("EE") || b === "4") return "bg-success/10 text-success";
  if (b.startsWith("ME") || b === "3") return "bg-primary/10 text-primary";
  if (b.startsWith("AE") || b === "2") return "bg-warning/10 text-warning";
  if (b) return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card/60 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-1 text-lg font-black leading-none">{value}</p>
    </div>
  );
}

function ResultCard({ r }: { r: PortalAssessmentResult }) {
  const [open, setOpen] = useState(false);
  const percentage = Number(r.percentage) || 0;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left transition hover:bg-accent/20"
      >
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-black">
                {r.assessment_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {[r.term_name, r.year_name, r.grade_name, r.stream_name]
                  .filter(Boolean)
                  .join(" • ") || "—"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {r.overall_band && (
                <Badge className={cn("border-0", bandTone(r.overall_band))}>
                  {r.overall_band}
                </Badge>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-end justify-between">
              <span className="text-2xl font-black">{pct(percentage)}</span>
              <span className="text-xs text-muted-foreground">
                {Number(r.total_score || 0)} / {Number(r.total_out_of || 0)}
              </span>
            </div>
            <Progress value={Math.min(100, percentage)} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric
              icon={Target}
              label="Mean"
              value={
                r.mean_score != null ? Number(r.mean_score).toFixed(1) : "—"
              }
            />
            <Metric
              icon={Trophy}
              label="Class rank"
              value={
                r.class_position
                  ? `${r.class_position}${r.class_size ? `/${r.class_size}` : ""}`
                  : "—"
              }
            />
            <Metric
              icon={Trophy}
              label="Stream rank"
              value={r.stream_position ? String(r.stream_position) : "—"}
            />
            <Metric
              icon={BookOpen}
              label="Subjects"
              value={String(r.subjects?.length || r.subjects_count || 0)}
            />
          </div>
        </CardContent>
      </button>

      {open && (
        <div className="border-t bg-muted/20 px-5 py-4">
          {r.subjects?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 text-left font-semibold">Subject</th>
                    <th className="py-2 text-right font-semibold">Score</th>
                    <th className="py-2 text-center font-semibold">Level</th>
                    <th className="py-2 text-center font-semibold">Band</th>
                    <th className="hidden py-2 text-left font-semibold sm:table-cell">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.subjects.map((s, i) => (
                    <tr key={`${s.subject_name}-${i}`} className="border-t">
                      <td className="py-2 pr-2 font-medium">
                        {s.subject_name}
                      </td>
                      <td className="py-2 text-right font-black tabular-nums">
                        {s.score ?? "—"}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{s.out_of ?? 100}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        {s.achievement_level_code || "—"}
                      </td>
                      <td className="py-2 text-center">
                        {s.band_code ? (
                          <Badge
                            className={cn("border-0", bandTone(s.band_code))}
                          >
                            {s.band_code}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="hidden py-2 text-xs text-muted-foreground sm:table-cell">
                        {s.remarks || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Subject breakdown not available for this assessment.
            </p>
          )}
          {r.remarks && (
            <p className="mt-3 rounded-lg bg-card p-3 text-xs italic text-muted-foreground">
              {r.remarks}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export function ResultsList({ studentId }: { studentId?: string }) {
  const { data: results = [], isLoading } =
    usePortalAssessmentResults(studentId);
  const { data: cards = [] } = usePortalReportCards(studentId);
  const [openCard, setOpenCard] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!results.length && !cards.length) {
    return (
      <div className="rounded-xl bg-muted/30 py-14 text-center text-sm text-muted-foreground">
        No published results yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((r) => (
        <ResultCard key={r.id} r={r} />
      ))}

      {cards.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <FileText className="h-4 w-4 text-primary" /> Report Cards
            </h3>
            {cards.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {c.assessment_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Published{" "}
                    {new Date(c.published_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenCard(c.id)}
                >
                  View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {openCard && (
        <ReportCardViewer
          card={cards.find((c) => c.id === openCard)!}
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  );
}
