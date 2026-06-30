import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  useAssessmentAnalytics,
  useDownloadAnalytics,
  usePreviousAssessments,
  useAssessmentComparison,
} from "@/hooks/useAssessments";
import { useClasses, useStreams, useSubjects } from "@/hooks/useClasses";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/PermissionGate";
import {
  BarChart3,
  Trophy,
  TrendingUp,
  Users,
  FileText,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";

const BAND_COLORS: Record<string, string> = {
  EE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  ME: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  AE: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  BE: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

export default function Analytics() {
  const { data: assessments = [] } = useAssessmentsList();
  const [assessmentId, setAssessmentId] = useState<string>("");
  const dl = useDownloadAnalytics();
  const { data: previous = [] } = usePreviousAssessments(assessmentId);
  const [prevId, setPrevId] = useState<string>("");
  const { data: cmp } = useAssessmentComparison(assessmentId, prevId);

  // --- Page filters (apply to displayed analytics AND exports) ---
  const { data: grades = [] } = useClasses();
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const { data: streams = [] } = useStreams(
    filterGrade !== "all" ? filterGrade : undefined,
  );
  const { data: subjects = [] } = useSubjects();
  const [filterStream, setFilterStream] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const buildFilters = () => ({
    grade_id: filterGrade !== "all" ? filterGrade : undefined,
    stream_id: filterStream !== "all" ? filterStream : undefined,
    subject_id: filterSubject !== "all" ? filterSubject : undefined,
  });

  const { data, isLoading } = useAssessmentAnalytics(
    assessmentId,
    buildFilters(),
  );

  const overview = data?.overview;
  const subjectsData = data?.subjects || [];
  const bands = data?.bands || [];
  const leaderboard = data?.leaderboard || [];
  const gradesData = data?.grades || [];
  const streamsData = data?.streams || [];
  const bandTotal = bands.reduce((s, b) => s + Number(b.n || 0), 0) || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" /> Assessment
              Analytics
            </h1>
            <p className="text-muted-foreground">
              CBC band distribution, subject means and class leaderboards.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[260px]">
              <label className="text-xs text-muted-foreground">
                Assessment
              </label>
              <Select value={assessmentId} onValueChange={setAssessmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Export filters bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex items-center gap-1 text-sm font-medium mr-2">
                <Filter className="h-4 w-4 text-muted-foreground" /> Filters
              </div>
              <div className="min-w-[160px]">
                <label className="text-[11px] text-muted-foreground">
                  Class / Grade
                </label>
                <Select
                  value={filterGrade}
                  onValueChange={(v) => {
                    setFilterGrade(v);
                    setFilterStream("all");
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {(grades as any[]).map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[160px]">
                <label className="text-[11px] text-muted-foreground">
                  Stream
                </label>
                <Select value={filterStream} onValueChange={setFilterStream}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All streams</SelectItem>
                    {(streams as any[]).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[180px]">
                <label className="text-[11px] text-muted-foreground">
                  Subject
                </label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {(subjects as any[]).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <PermissionGate permission="reports:export">
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={!assessmentId || dl.isPending}
                    onClick={() =>
                      dl.mutate({
                        assessmentId,
                        format: "pdf",
                        filters: buildFilters(),
                      })
                    }
                  >
                    <FileText className="h-4 w-4 mr-1" /> PDF
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!assessmentId || dl.isPending}
                    onClick={() =>
                      dl.mutate({
                        assessmentId,
                        format: "xlsx",
                        filters: buildFilters(),
                      })
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                  </Button>
                </div>
              </PermissionGate>
            </div>
          </CardContent>
        </Card>

        {assessmentId && previous.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle>Comparison vs previous assessment</CardTitle>
              <div className="min-w-[260px]">
                <Select
                  value={prevId || "none"}
                  onValueChange={(v) => setPrevId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick previous assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {(previous as any[]).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (
                        {p.mean_pct != null
                          ? Number(p.mean_pct).toFixed(1) + "%"
                          : "—"}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            {cmp && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      Current mean
                    </div>
                    <div className="text-2xl font-bold">
                      {Number(cmp.overall?.current?.mean_pct || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      Previous mean
                    </div>
                    <div className="text-2xl font-bold">
                      {Number(cmp.overall?.previous?.mean_pct || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Change</div>
                    <div
                      className={`text-2xl font-bold flex items-center gap-1 ${
                        cmp.overall?.delta > 0
                          ? "text-emerald-600"
                          : cmp.overall?.delta < 0
                            ? "text-rose-600"
                            : ""
                      }`}
                    >
                      {cmp.overall?.delta > 0 ? (
                        <ArrowUp className="h-5 w-5" />
                      ) : cmp.overall?.delta < 0 ? (
                        <ArrowDown className="h-5 w-5" />
                      ) : null}
                      {Number(cmp.overall?.delta || 0).toFixed(1)} pts
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-emerald-700">
                      Most improved
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Δ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(cmp.movers?.improved || [])
                          .slice(0, 10)
                          .map((m: any) => (
                            <TableRow key={m.student_id}>
                              <TableCell className="text-sm">
                                {m.first_name} {m.last_name}
                              </TableCell>
                              <TableCell className="text-right text-emerald-600 tabular-nums">
                                +{Number(m.delta).toFixed(1)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-rose-700">
                      Most declined
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Δ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(cmp.movers?.declined || [])
                          .slice(0, 10)
                          .map((m: any) => (
                            <TableRow key={m.student_id}>
                              <TableCell className="text-sm">
                                {m.first_name} {m.last_name}
                              </TableCell>
                              <TableCell className="text-right text-rose-600 tabular-nums">
                                {Number(m.delta).toFixed(1)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Students",
              value: overview?.students_count ?? "—",
              icon: Users,
            },
            {
              label: "Marks recorded",
              value: overview?.marks_count ?? "—",
              icon: TrendingUp,
            },
            {
              label: "Mean %",
              value:
                overview?.mean_pct != null
                  ? Number(overview.mean_pct).toFixed(1)
                  : "—",
              icon: TrendingUp,
            },
            {
              label: "Top %",
              value:
                overview?.max_pct != null
                  ? Number(overview.max_pct).toFixed(1)
                  : "—",
              icon: Trophy,
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>CBC band distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bands.map((b) => {
                const pct = (Number(b.n) / bandTotal) * 100;
                return (
                  <div key={b.band_code} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BAND_COLORS[b.band_code] || ""}`}
                      >
                        {b.band_code}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {b.n} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {!bands.length && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  {assessmentId
                    ? isLoading
                      ? "Loading…"
                      : "No band data."
                    : "Select an assessment."}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subject means</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">N</TableHead>
                    <TableHead className="text-right">Mean %</TableHead>
                    <TableHead className="text-right">Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectsData.map((s: any) => (
                    <TableRow key={s.subject_id}>
                      <TableCell className="font-medium">
                        {s.subject_name}
                      </TableCell>
                      <TableCell className="text-right">{s.n}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {Number(s.mean_pct || 0).toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                        {Number(s.min_pct || 0).toFixed(0)} –{" "}
                        {Number(s.max_pct || 0).toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!subjectsData.length && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No subject data.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Mean %</TableHead>
                    <TableHead>AL</TableHead>
                    <TableHead>Band</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((r: any, i: number) => (
                    <TableRow key={r.student_id}>
                      <TableCell>
                        <Badge>{i + 1}</Badge>
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
                        {Number(r.percentage || 0).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {r.overall_al ? (
                          <Badge variant="outline">{r.overall_al}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {r.overall_band ? (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${BAND_COLORS[r.overall_band] || ""}`}
                          >
                            {r.overall_band}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!leaderboard.length && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        Compute results first.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grade & stream means</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">
                  Grades
                </div>
                {gradesData.map((g: any) => (
                  <div
                    key={g.grade_id}
                    className="flex justify-between text-sm py-1 border-b last:border-0"
                  >
                    <span>{g.grade_name}</span>
                    <span className="tabular-nums">
                      {Number(g.mean_pct || 0).toFixed(1)}%
                    </span>
                  </div>
                ))}
                {!gradesData.length && (
                  <div className="text-xs text-muted-foreground">No data.</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">
                  Streams
                </div>
                {streamsData.map((s: any) => (
                  <div
                    key={s.stream_id}
                    className="flex justify-between text-sm py-1 border-b last:border-0"
                  >
                    <span>
                      {s.grade_name} · {s.stream_name}
                    </span>
                    <span className="tabular-nums">
                      {Number(s.mean_pct || 0).toFixed(1)}%
                    </span>
                  </div>
                ))}
                {!streamsData.length && (
                  <div className="text-xs text-muted-foreground">No data.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
