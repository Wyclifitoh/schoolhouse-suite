import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import {
  useSelectedChild,
  SelectedChildProvider,
} from "@/contexts/SelectedChildContext";

import { usePortalAssessmentResults } from "@/hooks/usePortalApi";
import {
  PortalCard,
  PortalEmpty,
  ListSkeleton,
  ScoreRing,
} from "@/components/portal/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  GraduationCap,
  TrendingUp,
  Trophy,
  BarChart3,
  Minus,
  Printer,
  Download,
  BookOpen,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

const TERM_ALL = "__all__";

export default function AcademicsPage() {
  return (
    <SelectedChildProvider>
      <Body />
    </SelectedChildProvider>
  );
}


function Body() {
  const { selected } = useSelectedChild();
  const { data: results = [], isLoading } = usePortalAssessmentResults(
    selected?.id,
  );
  const [term, setTerm] = useState<string>(TERM_ALL);
  const [tab, setTab] = useState("overview");

  const terms = useMemo(() => {
    const seen: string[] = [];
    results.forEach((r) => {
      const label = [r.term_name, r.year_name].filter(Boolean).join(" · ");
      if (label && !seen.includes(label)) seen.push(label);
    });
    return seen;
  }, [results]);

  const scoped = useMemo(
    () =>
      term === TERM_ALL
        ? results
        : results.filter(
            (r) =>
              [r.term_name, r.year_name].filter(Boolean).join(" · ") === term,
          ),
    [results, term],
  );

  const latest = scoped[0];
  const previous = scoped[1];
  const subjects = latest?.subjects || [];
  const overall = latest?.percentage != null ? Number(latest.percentage) : null;

  const prevBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    (previous?.subjects || []).forEach((s) => {
      if (s.score != null)
        map[s.subject_name] = (Number(s.score) / (s.out_of || 100)) * 100;
    });
    return map;
  }, [previous]);

  const trend = useMemo(
    () =>
      [...scoped]
        .reverse()
        .filter((r) => r.percentage != null)
        .map((r) => ({
          name: r.assessment_name.slice(0, 14),
          percentage: Number(r.percentage),
        })),
    [scoped],
  );

  const best = useMemo(() => {
    const scored = subjects.filter((s) => s.score != null);
    if (!scored.length) return null;
    return scored.reduce((a, b) =>
      Number(b.score) / (b.out_of || 100) > Number(a.score) / (a.out_of || 100)
        ? b
        : a,
    );
  }, [subjects]);

  const termPicker = (
    <div className="flex items-center gap-2">
      <Select value={term} onValueChange={setTerm}>
        <SelectTrigger className="h-10 w-[13.5rem] rounded-xl bg-card text-sm font-semibold">
          <SelectValue placeholder="Select term" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TERM_ALL}>All terms</SelectItem>
          {terms.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-xl"
        onClick={() => window.print()}
        aria-label="Print report"
      >
        <Printer className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <PortalShell
      breadcrumb={`Home / Academics${
        term !== TERM_ALL ? ` / ${term}` : ""
      }`}
      title="Academic Performance"
      subtitle={
        selected
          ? `${selected.first_name} ${selected.last_name} — ${
              selected.grade_name || "Class not set"
            }${selected.stream_name ? ` (${selected.stream_name})` : ""}`
          : undefined
      }
      actions={termPicker}
    >
      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : !results.length ? (
        <PortalCard>
          <PortalEmpty
            icon={FileText}
            title="No published results yet"
            description="As soon as the school publishes an assessment, the full breakdown will appear here."
          />
        </PortalCard>
      ) : !latest ? (
        <PortalCard>
          <PortalEmpty
            compact
            icon={FileText}
            title="No results for this term"
            description="Pick another term from the dropdown above."
          />
        </PortalCard>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-5">
          <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-xl bg-muted p-1">
            {["overview", "subjects", "progress"].map((v) => (
              <TabsTrigger
                key={v}
                value={v}
                className="rounded-lg px-4 text-xs font-semibold capitalize"
              >
                {v === "subjects" ? "Subject performance" : v}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                icon={GraduationCap}
                tone="primary"
                label="Overall score"
                value={overall !== null ? `${overall}%` : "—"}
                hint={latest.assessment_name}
              />
              <Stat
                icon={Trophy}
                tone="warning"
                label="Class position"
                value={
                  latest.class_position != null
                    ? `#${latest.class_position}${
                        latest.class_size ? ` / ${latest.class_size}` : ""
                      }`
                    : "—"
                }
                hint={latest.grade_name || undefined}
              />
              <Stat
                icon={BookOpen}
                tone="info"
                label="Learning areas"
                value={String(subjects.length)}
                hint={best ? `Strongest: ${best.subject_name}` : undefined}
              />
              <Stat
                icon={Target}
                tone="success"
                label="Overall level"
                value={latest.overall_al || latest.overall_band || "—"}
                hint={
                  latest.published_at
                    ? `Published ${new Date(
                        latest.published_at,
                      ).toLocaleDateString()}`
                    : undefined
                }
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <PortalCard>
                <Head icon={GraduationCap} title="Overall performance" />
                <div className="flex flex-col items-center gap-4 py-2">
                  <ScoreRing
                    value={overall}
                    caption="Average"
                    tone={
                      overall == null
                        ? "neutral"
                        : overall >= 75
                          ? "success"
                          : overall >= 50
                            ? "primary"
                            : "warning"
                    }
                  />
                  <div className="flex flex-wrap justify-center gap-2">
                    {latest.overall_band && (
                      <Badge variant="outline">
                        Band {latest.overall_band}
                      </Badge>
                    )}
                    {latest.overall_al && (
                      <Badge variant="outline">AL {latest.overall_al}</Badge>
                    )}
                    <Badge variant="secondary">{latest.assessment_name}</Badge>
                  </div>
                </div>
              </PortalCard>

              <PortalCard className="lg:col-span-2">
                <Head
                  icon={BarChart3}
                  title="Subject performance"
                  right={
                    <span className="text-[11px] text-muted-foreground">
                      {latest.assessment_name}
                    </span>
                  }
                />
                <SubjectTable
                  subjects={subjects}
                  prevBySubject={prevBySubject}
                />
              </PortalCard>
            </div>

            {(latest.remarks || previous?.remarks) && (
              <PortalCard>
                <Head icon={FileText} title="Teacher remarks" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {latest.remarks || "—"}
                </p>
              </PortalCard>
            )}
          </TabsContent>

          <TabsContent value="subjects" className="space-y-5">
            <PortalCard>
              <Head
                icon={BarChart3}
                title="Detailed subject breakdown"
                right={
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                  </Button>
                }
              />
              <SubjectTable
                subjects={subjects}
                prevBySubject={prevBySubject}
                showRemarks
              />
            </PortalCard>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {scoped.slice(0, 6).map((r) => (
                <PortalCard key={r.id}>
                  <p className="truncate text-sm font-bold text-foreground">
                    {r.assessment_name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[r.term_name, r.year_name].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-2xl font-extrabold tracking-tight text-foreground">
                      {r.percentage != null ? `${r.percentage}%` : "—"}
                    </p>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{r.subjects_count} learning areas</p>
                      <p>
                        {r.class_position != null
                          ? `Position #${r.class_position}`
                          : "Position —"}
                      </p>
                    </div>
                  </div>
                </PortalCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <PortalCard>
              <Head
                icon={TrendingUp}
                title="Performance trend"
                right={
                  <span className="text-[11px] text-muted-foreground">
                    Overall average across published assessments
                  </span>
                }
              />
              {trend.length < 2 ? (
                <PortalEmpty
                  compact
                  icon={TrendingUp}
                  title="Not enough data yet"
                  description="Once two or more assessments are published, the trend line will appear here."
                />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </PortalCard>
          </TabsContent>
        </Tabs>
      )}
    </PortalShell>
  );
}

/* ------------------------------------------------------------------ */

function Head({
  icon: Icon,
  title,
  right,
}: {
  icon: typeof FileText;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="truncate text-[15px] font-bold tracking-tight text-foreground">
          {title}
        </h3>
      </div>
      {right}
    </header>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  hint?: string;
  tone: "primary" | "success" | "warning" | "info";
}) {
  const chip = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  }[tone];
  return (
    <PortalCard className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          chip,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-extrabold tracking-tight text-foreground">
          {value}
        </p>
        {hint && (
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        )}
      </div>
    </PortalCard>
  );
}

function SubjectTable({
  subjects,
  prevBySubject,
  showRemarks,
}: {
  subjects: {
    subject_name: string;
    score: number | null;
    out_of: number | null;
    achievement_level_code: string | null;
    band_code: string | null;
    remarks: string | null;
  }[];
  prevBySubject: Record<string, number>;
  showRemarks?: boolean;
}) {
  if (!subjects.length)
    return (
      <PortalEmpty
        compact
        icon={BarChart3}
        title="No subject breakdown"
        description="This assessment was published without a per-subject breakdown."
      />
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            <th className="pb-2.5 text-left">Learning area</th>
            <th className="pb-2.5 text-right">Score</th>
            <th className="pb-2.5 text-right">%</th>
            <th className="pb-2.5 text-center">Level</th>
            <th className="pb-2.5 text-center">Status</th>
            <th className="pb-2.5 text-right">Trend</th>
            {showRemarks && <th className="pb-2.5 text-left pl-4">Remarks</th>}
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => {
            const out = s.out_of || 100;
            const pct = s.score != null ? (Number(s.score) / out) * 100 : null;
            const prev = prevBySubject[s.subject_name];
            const delta = pct != null && prev != null ? pct - prev : null;
            return (
              <tr key={s.subject_name} className="border-t border-border/60">
                <td className="py-3 font-medium text-foreground">
                  {s.subject_name}
                </td>
                <td className="py-3 text-right text-muted-foreground">
                  {s.score != null ? `${s.score}/${out}` : "—"}
                </td>
                <td className="py-3 text-right font-semibold text-foreground">
                  {pct != null ? `${Math.round(pct)}%` : "—"}
                </td>
                <td className="py-3 text-center">
                  <Badge variant="outline" className="text-[10px]">
                    {s.achievement_level_code || s.band_code || "—"}
                  </Badge>
                </td>
                <td className="py-3 text-center">
                  {pct == null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
                        pct >= 75
                          ? "bg-success/10 text-success"
                          : pct >= 50
                            ? "bg-primary/10 text-primary"
                            : "bg-warning/10 text-warning",
                      )}
                    >
                      {pct >= 75
                        ? "Exceeding"
                        : pct >= 50
                          ? "On track"
                          : "Needs support"}
                    </span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <span className="inline-flex items-center justify-end gap-1 text-[11px] font-semibold">
                    {delta == null ? (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    ) : delta > 1 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-success">
                          +{Math.round(delta)}
                        </span>
                      </>
                    ) : delta < -1 ? (
                      <>
                        <TrendingUp className="h-4 w-4 rotate-180 text-destructive" />
                        <span className="text-destructive">
                          {Math.round(delta)}
                        </span>
                      </>
                    ) : (
                      <Minus className="h-4 w-4 text-warning" />
                    )}
                  </span>
                </td>
                {showRemarks && (
                  <td className="max-w-[16rem] truncate py-3 pl-4 text-muted-foreground">
                    {s.remarks || "—"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
