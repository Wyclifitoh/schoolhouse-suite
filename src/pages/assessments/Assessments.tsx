import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardCheck,
  Plus,
  Search,
  FileText,
  Settings,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { QuickActions } from "@/components/help/QuickActions";
import { AssessmentStatusLegend } from "@/components/assessments/AssessmentStatusLegend";
import { AssessmentNav } from "@/components/assessments/AssessmentNav";
import { PermissionGate } from "@/components/PermissionGate";
import { useCan } from "@/hooks/usePermission";
import {
  useAssessmentsList,
  useAssessmentTypes,
  useSaveAssessment,
  useAssessmentTransition,
  useDeleteAssessment,
} from "@/hooks/useAssessments";
import {
  AssessmentLifecycleActions,
  AssessmentStatusBadge,
} from "@/components/assessments/AssessmentLifecycleActions";
import {
  LIFECYCLE_ORDER,
  STATUS_META,
  progressOf,
  statusOf,
  type LifecycleStatus,
} from "@/lib/assessmentLifecycle";
import { useGrades } from "@/hooks/useGrades";
import { useTerm } from "@/contexts/TermContext";
import { Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function NewAssessmentDialog() {
  const { selectedTerm, selectedAcademicYear } = useTerm();
  const [open, setOpen] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    assessment_type_id: string;
    start_date: string;
    end_date: string;
    grade_ids: string[];
    out_of: number;
    curriculum_type: "CBC" | "844";
  }>({
    name: "",
    description: "",
    assessment_type_id: "",
    start_date: "",
    end_date: "",
    grade_ids: [],
    out_of: 100,
    curriculum_type: "CBC",
  });
  const { data: types = [] } = useAssessmentTypes();
  const { data: grades = [] } = useGrades();
  const save = useSaveAssessment();

  const reset = () =>
    setForm({
      name: "",
      description: "",
      assessment_type_id: "",
      start_date: "",
      end_date: "",
      grade_ids: [],
      out_of: 100,
      curriculum_type: "CBC",
    });

  const submit = async () => {
    if (!form.name.trim() || form.grade_ids.length === 0) return;
    try {
      await save.mutateAsync({
        ...form,
        term_id: selectedTerm?.id,
        academic_year_id: selectedAcademicYear?.id,
      } as any);
      reset();
      setOpen(false);
    } catch (e: any) {
      if (e.message?.includes("subscription is inactive")) {
        setBillingError(e.message);
      }
    }
  };

  return (
    <PermissionGate permission="exams:create">
      <AlertDialog open={!!billingError} onOpenChange={() => setBillingError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" /> Access Denied
            </AlertDialogTitle>
            <AlertDialogDescription>
              {billingError}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setBillingError(null)}>Okay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-1" /> New Assessment
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Assessment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Curriculum *</Label>
              <Select
                value={form.curriculum_type}
                onValueChange={(v) =>
                  setForm({ ...form, curriculum_type: v as "CBC" | "844" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBC">CBE (competency-based)</SelectItem>
                  <SelectItem value="844">
                    8-4-4 (Secondary — papers + grades)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {form.curriculum_type === "844"
                  ? "Marks entry will use per-paper inputs and 8-4-4 letter grades (A–E)."
                  : "Marks entry will use competency-based Achievement Levels (EE/ME/AE/BE)."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. End Term 1 — Grade 4"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={form.assessment_type_id}
                  onValueChange={(v) =>
                    setForm({ ...form, assessment_type_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(types as any[]).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.weight}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Default out-of</Label>
                <Input
                  type="number"
                  value={form.out_of}
                  onChange={(e) =>
                    setForm({ ...form, out_of: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Classes *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto p-2 rounded border mobile-grid-keep">
                {(grades as any[]).map((g) => {
                  const checked = form.grade_ids.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          setForm({
                            ...form,
                            grade_ids: v
                              ? [...form.grade_ids, g.id]
                              : form.grade_ids.filter((x) => x !== g.id),
                          })
                        }
                      />
                      {g.name}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Subjects are auto-attached from each class' subject allocation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={save.isPending || !form.name || !form.grade_ids.length}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGate>
  );
}

export default function Assessments() {
  const { selectedTerm, selectedAcademicYear } = useTerm();
  // Permission-driven, never role-driven: an "Exam Officer" (or any custom
  // role) that holds the assessment write/config codes gets the same tools.
  const canCreate = useCan("exams:create");
  const canConfigure = useCan(
    "exams:update",
    "assessments:bands:manage",
    "settings:update",
  );
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [billingError, setBillingError] = useState<string | null>(null);
  const { data: list = [], isLoading } = useAssessmentsList({
    q: q || undefined,
    status: status || undefined,
    term_id: selectedTerm?.id,
    year_id: selectedAcademicYear?.id,
  });
  const transition = useAssessmentTransition();
  const remove = useDeleteAssessment();

  // Counts follow the official lifecycle. "Published" counts assessments whose
  // results were actually released — including ones later locked or archived.
  const summary = useMemo(() => {
    const by: Record<string, number> = {
      draft: 0,
      open: 0,
      completed: 0,
      published: 0,
      locked: 0,
      archived: 0,
    };
    let resultsPublished = 0;
    (list as any[]).forEach((a) => {
      by[statusOf(a)] = (by[statusOf(a)] || 0) + 1;
      if (a.results_published) resultsPublished += 1;
    });
    return { by, resultsPublished };
  }, [list]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AlertDialog open={!!billingError} onOpenChange={() => setBillingError(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-destructive" /> Access Denied
              </AlertDialogTitle>
              <AlertDialogDescription>
                {billingError}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setBillingError(null)}>Okay</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AssessmentNav />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-primary" /> Assessments
            </h1>
            <p className="text-muted-foreground">
              Create CBE assessments, auto-generate teacher tasks, and track
              progress end-to-end.
            </p>
          </div>
          <div className="flex gap-2">
            {canConfigure && (
              <Link to="/assessments/settings">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-1" /> Settings
                </Button>
              </Link>
            )}
            <Link to="/assessments/tasks">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-1" /> My Tasks
              </Button>
            </Link>
            <AssessmentStatusLegend />
            {canCreate && <NewAssessmentDialog />}
          </div>
        </div>

        <QuickActions
          article="creating-assessments"
          actions={[
            {
              label: "Create Assessment",
              icon: Plus,
              to: "/assessments?new=1",
              variant: "default",
              hidden: !canCreate,
              hint: "Set up a new assessment for one or more classes",
            },
            {
              label: "Enter Marks",
              icon: FileText,
              to: "/assessments/tasks",
              hint: "Open your marks-entry tasks",
            },
            {
              label: "Review",
              icon: ClipboardCheck,
              to: "/assessments?status=completed",
              hint: "Check submitted marks before publishing",
            },
            {
              label: "Publish",
              icon: Settings,
              to: "/assessments?status=published",
              hidden: !canConfigure,
              hint: "Published assessments are visible to parents",
            },
          ]}
        />


        {/* Lifecycle summary — each card is also a one-click status filter. */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LIFECYCLE_ORDER.map((s2) => {
            const active = status === s2;
            const count = summary.by[s2] || 0;
            return (
              <button
                key={s2}
                type="button"
                onClick={() => setStatus(active ? "" : s2)}
                aria-pressed={active}
                title={STATUS_META[s2].meaning}
                className={`group rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  active
                    ? "border-primary ring-2 ring-primary/20 shadow-sm"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {STATUS_META[s2].label}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      count ? "bg-primary" : "bg-muted"
                    }`}
                  />
                </div>
                <div
                  className={`mt-1 text-2xl font-bold tabular-nums ${
                    count ? "text-foreground" : "text-muted-foreground/60"
                  }`}
                >
                  {count}
                </div>
                {s2 === "published" &&
                  summary.resultsPublished > (summary.by.published || 0) && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {summary.resultsPublished} released in total
                    </div>
                  )}
              </button>
            );
          })}
        </div>


        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="h-4 w-4 absolute left-2 top-3 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search by name…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="min-w-[180px]">
                <Select
                  value={status || "all"}
                  onValueChange={(v) => setStatus(v === "all" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {LIFECYCLE_ORDER.map((s2) => (
                      <SelectItem key={s2} value={s2}>
                        {STATUS_META[s2].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading &&
                    (list as any[]).map((a) => {
                      const progress = progressOf(a);
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Link
                              to={`/assessments/${a.id}`}
                              className="font-medium hover:underline"
                            >
                              {a.name}
                            </Link>
                            {a.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {a.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {a.type_name ? (
                              <Badge variant="outline">
                                {a.type_code} · {a.type_weight}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {a.start_date || "—"} → {a.end_date || "—"}
                          </TableCell>
                          <TableCell>
                            {a.class_count} · {a.subject_count} subj
                          </TableCell>
                          {/* Marks progress — deliberately separate from status. */}
                          <TableCell className="min-w-[160px]">
                            <div className="flex items-center gap-2">
                              <Progress value={progress.pct} className="h-2" />
                              <span className="text-xs text-muted-foreground">
                                {progress.done}/{progress.total}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <AssessmentStatusBadge row={a} />
                          </TableCell>
                          <TableCell className="text-right space-x-1 space-y-1">
                            <AssessmentLifecycleActions
                              row={a}
                              pending={transition.isPending}
                              onAction={async (action) => {
                                try {
                                  await transition.mutateAsync({ id: a.id, action });
                                } catch (e: any) {
                                  if (e.message?.includes("subscription is inactive")) {
                                    setBillingError(e.message);
                                  }
                                }
                              }}
                            />
                            <PermissionGate permission="exams:delete">
                              {statusOf(a) === "draft" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Delete this assessment?"))
                                      remove.mutate(a.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </PermissionGate>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {!isLoading && !list.length && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No assessments yet. Click <b>New Assessment</b> to
                        create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-3 p-4">
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4 flex flex-col gap-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </Card>
                ))}
              {!isLoading && (list as any[]).length === 0 && (
                <div className="text-center text-muted-foreground py-8 border rounded-lg">
                  No assessments yet.{" "}
                  {canCreate ? "Click New Assessment to create one." : ""}
                </div>
              )}
              {!isLoading &&
                (list as any[]).map((a) => {
                  const progress = progressOf(a);
                  return (
                    <Card key={a.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <Link
                            to={`/assessments/${a.id}`}
                            className="font-medium hover:underline text-lg"
                          >
                            {a.name}
                          </Link>
                          {a.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {a.description}
                            </div>
                          )}
                        </div>
                        <AssessmentStatusBadge row={a} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="block text-xs uppercase opacity-70">
                            Type
                          </span>
                          {a.type_name ? (
                            <span className="font-medium text-foreground">
                              {a.type_code} · {a.type_weight}%
                            </span>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                        <div>
                          <span className="block text-xs uppercase opacity-70">
                            Window
                          </span>
                          <span className="font-medium text-foreground">
                            {a.start_date || "—"} → {a.end_date || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase opacity-70">
                            Scope
                          </span>
                          <span className="font-medium text-foreground">
                            {a.class_count} classes, {a.subject_count} subj
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase opacity-70">
                            Tasks
                          </span>
                          <span className="font-medium text-foreground">
                            {progress.done}/{progress.total} done
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span className="font-medium">{progress.pct}%</span>
                        </div>
                        <Progress value={progress.pct} className="h-2" />
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t mt-1">
                        <AssessmentLifecycleActions
                          row={a}
                          pending={transition.isPending}
                          onAction={(action) =>
                            transition.mutate({ id: a.id, action })
                          }
                        />
                        <PermissionGate permission="exams:delete">
                          {statusOf(a) === "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm("Delete this assessment?"))
                                  remove.mutate(a.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </PermissionGate>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
