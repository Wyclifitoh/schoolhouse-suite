import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import {
  useLessonPlansPaginated,
  useLessonPlanDashboard,
  useLessonCoverage,
  useSetLessonStatus,
  useDeleteLessonPlan,
  useDuplicateLessonPlan,
  downloadLessonPlanPdf,
  LessonPlan,
} from "@/hooks/useLessonPlans";
import { useSubjects, useClasses } from "@/hooks/useClasses";
import {
  Plus,
  FileText,
  Copy,
  Trash2,
  Eye,
  Download,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  FileSignature,
  Sparkles,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermission";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    draft: "bg-amber-100 text-amber-800",
    published: "bg-blue-100 text-blue-800",
    delivered: "bg-emerald-100 text-emerald-800",
  };
  return map[s] || "bg-muted";
};

export default function LessonPlans() {
  const perms = usePermissions(["classes:create","classes:update","classes:delete"]);
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [filters, setFilters] = useState<{
    search?: string;
    status?: string;
    subject_id?: string;
    grade_id?: string;
    page: number;
    limit: number;
  }>({ page: 1, limit: 20 });

  const { data: list, isLoading } = useLessonPlansPaginated(filters);
  const { data: dash } = useLessonPlanDashboard();
  const subjectsQ = useSubjects();
  const classesQ = useClasses();

  const setStatus = useSetLessonStatus();
  const del = useDeleteLessonPlan();
  const dup = useDuplicateLessonPlan();

  const subjects = (subjectsQ.data as any[]) || [];
  const grades = (classesQ.data as any[]) || [];

  // Coverage filters (separate)
  const [covFilter, setCovFilter] = useState<{
    subject_id?: string;
    grade_id?: string;
  }>({});
  const coverageQ = useLessonCoverage(covFilter);

  const totals = dash?.totals;

  const rows = list?.rows || [];

  return (
    <DashboardLayout title="CBE Lesson Plans">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpenCheck className="w-6 h-6 text-primary" /> Lesson Planning
            </h2>
            <p className="text-sm text-muted-foreground">
              Plan, publish, and track curriculum coverage in line with the
              Kenyan CBE framework.
            </p>
          </div>
          {perms["classes:create"] && (
            <Button onClick={() => navigate("/lesson-plans/new")}>
              <Plus className="w-4 h-4 mr-2" /> New Lesson Plan
            </Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">My Plans</TabsTrigger>
            <TabsTrigger value="coverage">Curriculum Coverage</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* OVERVIEW ------------------------ */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Plans</p>
                  <p className="text-2xl font-bold">{totals?.total ?? "—"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {totals?.drafts ?? "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totals?.published ?? "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {totals?.delivered ?? "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Upcoming Lessons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dash?.upcoming?.length ? (
                    <ul className="space-y-2 text-sm">
                      {dash.upcoming.map((u) => (
                        <li
                          key={u.id}
                          className="flex justify-between border-b pb-2 last:border-0"
                        >
                          <span>
                            <strong>{u.subject_name}</strong> · {u.grade_name}{" "}
                            {u.stream_name || ""}
                            <span className="text-muted-foreground">
                              {" "}
                              — {u.lesson_title || "Untitled"}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            {u.lesson_date} {u.start_time || ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No upcoming planned lessons
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Teacher Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dash?.compliance?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teacher</TableHead>
                          <TableHead className="text-right">Plans</TableHead>
                          <TableHead className="text-right">
                            Published
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dash.compliance.slice(0, 8).map((c) => (
                          <TableRow key={c.staff_id || c.teacher_id || c.name}>
                            <TableCell>{c.name}</TableCell>
                            <TableCell className="text-right">
                              {c.plans}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.published}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PLANS LIST ---------------------- */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardContent className="p-4 flex flex-wrap gap-3">
                <Input
                  placeholder="Search lesson title…"
                  className="max-w-xs"
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value, page: 1 })
                  }
                />
                <Select
                  value={filters.subject_id || "all"}
                  onValueChange={(v) =>
                    setFilters({
                      ...filters,
                      subject_id: v === "all" ? undefined : v,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.grade_id || "all"}
                  onValueChange={(v) =>
                    setFilters({
                      ...filters,
                      grade_id: v === "all" ? undefined : v,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All grades</SelectItem>
                    {grades.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(v) =>
                    setFilters({
                      ...filters,
                      status: v === "all" ? undefined : v,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Strand / Sub-Strand</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                          >
                            No lesson plans yet. Click{" "}
                            <strong>New Lesson Plan</strong> to start.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((p: LessonPlan) => (
                          <TableRow key={p.id}>
                            <TableCell className="whitespace-nowrap">
                              {p.lesson_date}
                            </TableCell>
                            <TableCell>{p.subject_name}</TableCell>
                            <TableCell>
                              {p.grade_name} {p.stream_name || ""}
                            </TableCell>
                            <TableCell className="text-xs">
                              {p.strand_name || "—"}{" "}
                              {p.sub_strand_name
                                ? ` › ${p.sub_strand_name}`
                                : ""}
                            </TableCell>
                            <TableCell className="text-xs">
                              {p.teacher_name}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusBadge(p.status)}>
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    navigate(`/lesson-plans/${p.id}`)
                                  }
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => downloadLessonPlanPdf(p.id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                {perms["classes:create"] && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => dup.mutate({ id: p.id })}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                )}
                                {p.status === "draft" && perms["classes:update"] && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setStatus.mutate({
                                        id: p.id,
                                        action: "publish",
                                      })
                                    }
                                  >
                                    <FileSignature className="w-3 h-3 mr-1" />
                                    Publish
                                  </Button>
                                )}
                                {p.status === "published" && perms["classes:update"] && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setStatus.mutate({
                                        id: p.id,
                                        action: "deliver",
                                      })
                                    }
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Delivered
                                  </Button>
                                )}
                                {perms["classes:delete"] && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm("Delete this lesson plan?"))
                                        del.mutate(p.id);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {list?.pagination && list.pagination.totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 text-sm">
                <span>
                  Page {list.pagination.page} of {list.pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={filters.page >= list.pagination.totalPages}
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>

          {/* COVERAGE ------------------------ */}
          <TabsContent value="coverage" className="space-y-4">
            <Card>
              <CardContent className="p-4 flex flex-wrap gap-3">
                <Select
                  value={covFilter.subject_id || ""}
                  onValueChange={(v) =>
                    setCovFilter({ ...covFilter, subject_id: v })
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={covFilter.grade_id || ""}
                  onValueChange={(v) =>
                    setCovFilter({ ...covFilter, grade_id: v })
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {!covFilter.subject_id || !covFilter.grade_id ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Pick a subject and grade to see curriculum coverage.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Coverage: {coverageQ.data?.covered ?? 0} /{" "}
                    {coverageQ.data?.total_sub_strands ?? 0} sub-strands (
                    {coverageQ.data?.pct ?? 0}%)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={coverageQ.data?.pct || 0} />
                  {coverageQ.data?.by_strand?.length ? (
                    coverageQ.data.by_strand.map((b) => (
                      <div key={b.strand_id} className="border rounded-md p-3">
                        <div className="flex justify-between mb-2">
                          <strong>{b.strand_name}</strong>
                          <span className="text-sm text-muted-foreground">
                            {b.covered}/{b.total}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {b.sub_strands.map((ss) => (
                            <div key={ss.id} className="text-xs">
                              <div className="flex justify-between mb-0.5">
                                <span>{ss.name}</span>
                                <span className="text-muted-foreground">
                                  {ss.done}/{ss.expected}
                                </span>
                              </div>
                              <Progress value={ss.pct} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No strands configured for this subject/grade yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TEMPLATES ----------------------- */}
          <TabsContent value="templates">
            <TemplatesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// --- Templates inline panel ------------------------------------------
import {
  useLessonPlanTemplates,
  useSaveLessonPlanTemplate,
  useDeleteLessonPlanTemplate,
} from "@/hooks/useLessonPlans";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function TemplatesPanel() {
  const { data: templates = [] } = useLessonPlanTemplates();
  const save = useSaveLessonPlanTemplate();
  const del = useDeleteLessonPlanTemplate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    is_global: false,
    content: {},
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setForm({
              title: "",
              description: "",
              is_global: false,
              content: {},
            });
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No templates yet
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.title}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      {t.is_global ? (
                        <Badge>Global</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setForm(t);
                          setOpen(true);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete template?")) del.mutate(t.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Template" : "New Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!!form.is_global}
                onCheckedChange={(v) => setForm({ ...form, is_global: v })}
              />
              <Label>Global (available to all teachers)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                save.mutate(form, { onSuccess: () => setOpen(false) })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
