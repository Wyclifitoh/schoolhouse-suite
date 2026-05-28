import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useExams,
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
  useExamSchedules,
  useCreateSchedule,
  useDeleteSchedule,
} from "@/hooks/useExams";
import {
  useAssessmentTypes,
  useGradingScales,
  useExamLifecycle,
} from "@/hooks/useExamsExtended";
import { useClasses, useSubjects } from "@/hooks/useClasses";
import { useTerm } from "@/contexts/TermContext";
import {
  ClipboardCheck,
  Plus,
  Calendar,
  Award,
  BookOpen,
  FileText,
  TrendingUp,
  Target,
  GraduationCap,
  Layers,
  Settings,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Lock,
  Send,
  ShieldCheck,
  Undo2,
  BarChart3,
  FileBadge,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-info/10 text-info",
  REVIEWED: "bg-warning/10 text-warning",
  APPROVED: "bg-success/10 text-success",
  LOCKED: "bg-primary/10 text-primary",
  ARCHIVED: "bg-destructive/10 text-destructive",
};

const CURRICULA = [
  { value: "CBC", label: "CBC (Competency Based)" },
  { value: "8-4-4", label: "8-4-4 (Traditional)" },
  { value: "IGCSE", label: "IGCSE / International" },
];

const blankExam = {
  name: "",
  type: "CAT",
  curriculum_type: "CBC",
  assessment_type_id: "",
  grading_scale_id: "",
  term_id: "",
  academic_year_id: "",
  start_date: "",
  end_date: "",
  description: "",
  weight: 100,
  classes: [] as string[],
};

const cbcRubric = [
  {
    level: "Exceeding Expectations (EE)",
    score: 4,
    color: "bg-success/10 text-success",
  },
  {
    level: "Meeting Expectations (ME)",
    score: 3,
    color: "bg-info/10 text-info",
  },
  {
    level: "Approaching Expectations (AE)",
    score: 2,
    color: "bg-warning/10 text-warning",
  },
  {
    level: "Below Expectations (BE)",
    score: 1,
    color: "bg-destructive/10 text-destructive",
  },
];

const grading844 = [
  ["A", 80, 100, 12, "Excellent"],
  ["A-", 75, 79, 11, "Very Good"],
  ["B+", 70, 74, 10, "Good"],
  ["B", 65, 69, 9, "Good"],
  ["B-", 60, 64, 8, "Fairly Good"],
  ["C+", 55, 59, 7, "Average"],
  ["C", 50, 54, 6, "Average"],
  ["C-", 45, 49, 5, "Below Average"],
  ["D+", 40, 44, 4, "Below Average"],
  ["D", 35, 39, 3, "Poor"],
  ["D-", 30, 34, 2, "Poor"],
  ["E", 0, 29, 1, "Very Poor"],
] as const;

// =========================================================================
// CREATE / EDIT EXAM DIALOG
// =========================================================================
function ExamFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: any;
  onSubmit: (payload: any) => void;
  submitting?: boolean;
}) {
  const { data: grades = [] } = useClasses();
  const { data: assessmentTypes = [] } = useAssessmentTypes();
  const { data: gradingScales = [] } = useGradingScales();
  const { selectedTerm, selectedAcademicYear, terms } = useTerm();

  const [form, setForm] = useState<any>(initial || blankExam);

  // Keep form in sync when dialog opens or initial changes.
  const upd = (p: Partial<typeof blankExam>) =>
    setForm((f: any) => ({ ...f, ...p }));

  const toggleClass = (id: string) =>
    upd({
      classes: form.classes?.includes(id)
        ? form.classes.filter((c: string) => c !== id)
        : [...(form.classes || []), id],
    });

  const submit = () => {
    if (!form.name?.trim()) return toast.error("Exam name is required");
    if (!form.classes?.length) return toast.error("Select at least one class");
    const payload = {
      name: form.name.trim(),
      type: form.type,
      curriculum_type: form.curriculum_type,
      assessment_type_id: form.assessment_type_id || null,
      grading_scale_id: form.grading_scale_id || null,
      term_id: form.term_id || selectedTerm?.id || null,
      academic_year_id:
        form.academic_year_id || selectedAcademicYear?.id || null,
      term: form.term_id
        ? (terms as any[]).find((t: any) => t.id === form.term_id)?.name
        : selectedTerm?.name || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      description: form.description || null,
      weight: Number(form.weight) || 100,
      classes: form.classes.map((grade_id: string) => ({ grade_id })),
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? "Edit Examination" : "Create Examination"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Exam Name *</Label>
            <Input
              placeholder="e.g. End-Term 2 Examination"
              value={form.name}
              onChange={(e) => upd({ name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Curriculum *</Label>
              <Select
                value={form.curriculum_type}
                onValueChange={(v) => upd({ curriculum_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRICULA.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exam Type</Label>
              <Select value={form.type} onValueChange={(v) => upd({ type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAT">
                    Continuous Assessment (CAT)
                  </SelectItem>
                  <SelectItem value="MID_TERM">Mid-Term</SelectItem>
                  <SelectItem value="END_TERM">End-Term</SelectItem>
                  <SelectItem value="MOCK">Mock</SelectItem>
                  <SelectItem value="KCPE">KCPE</SelectItem>
                  <SelectItem value="KCSE">KCSE</SelectItem>
                  <SelectItem value="KPSEA">KPSEA</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assessment Type</Label>
              <Select
                value={form.assessment_type_id}
                onValueChange={(v) => upd({ assessment_type_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select (configure in Settings)" />
                </SelectTrigger>
                <SelectContent>
                  {(assessmentTypes as any[]).length === 0 && (
                    <SelectItem value="__none" disabled>
                      No assessment types configured
                    </SelectItem>
                  )}
                  {(assessmentTypes as any[]).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grading Scale</Label>
              <Select
                value={form.grading_scale_id}
                onValueChange={(v) => upd({ grading_scale_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select (uses default)" />
                </SelectTrigger>
                <SelectContent>
                  {(gradingScales as any[]).length === 0 && (
                    <SelectItem value="__none" disabled>
                      No grading scales configured
                    </SelectItem>
                  )}
                  {(gradingScales as any[]).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.kind})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Term</Label>
              <Select
                value={form.term_id || selectedTerm?.id || ""}
                onValueChange={(v) => upd({ term_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {(terms as any[]).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Weight (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.weight}
                onChange={(e) => upd({ weight: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date || ""}
                onChange={(e) => upd({ start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.end_date || ""}
                onChange={(e) => upd({ end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Classes / Grades *</Label>
            {grades.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No grades configured yet. Add grades in Academics first.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {grades.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg border cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.classes?.includes(g.id) || false}
                      onChange={() => toggleClass(g.id)}
                    />
                    <span className="truncate">{g.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="Optional notes about this examination..."
              value={form.description}
              onChange={(e) => upd({ description: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting
              ? "Saving…"
              : initial?.id
                ? "Save Changes"
                : "Create Examination"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// SCHEDULE DIALOG
// =========================================================================
function ScheduleDialog({
  open,
  onOpenChange,
  examId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  examId: string;
  onSaved?: () => void;
}) {
  const { data: subjects = [] } = useSubjects();
  const create = useCreateSchedule();
  const [form, setForm] = useState({
    subject_name: "",
    exam_date: "",
    start_time: "",
    end_time: "",
    room: "",
    full_marks: 100,
    pass_marks: 50,
  });

  const submit = () => {
    if (!form.subject_name) return toast.error("Subject is required");
    create.mutate({ exam_id: examId, ...form } as any, {
      onSuccess: () => {
        onSaved?.();
        onOpenChange(false);
        setForm({ ...form, subject_name: "" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Schedule Entry</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select
              value={form.subject_name}
              onValueChange={(v) => setForm({ ...form, subject_name: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.exam_date}
                onChange={(e) =>
                  setForm({ ...form, exam_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Start</Label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Full Marks</Label>
              <Input
                type="number"
                value={form.full_marks}
                onChange={(e) =>
                  setForm({ ...form, full_marks: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Pass Marks</Label>
              <Input
                type="number"
                value={form.pass_marks}
                onChange={(e) =>
                  setForm({ ...form, pass_marks: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// MAIN PAGE
// =========================================================================
const Examinations = () => {
  const { data: examsList = [] } = useExams();
  const create = useCreateExam();
  const update = useUpdateExam();
  const del = useDeleteExam();
  const lifecycle = useExamLifecycle();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(
    undefined,
  );
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const selectedExam = useMemo(
    () => examsList.find((e) => e.id === selectedExamId) || examsList[0],
    [examsList, selectedExamId],
  );
  const { data: schedulesList = [] } = useExamSchedules(selectedExam?.id);

  const stats = useMemo(() => {
    const total = examsList.length;
    const approved = examsList.filter((e: any) =>
      ["APPROVED", "LOCKED"].includes(e.status),
    ).length;
    const draft = examsList.filter((e: any) => e.status === "DRAFT").length;
    const pending = examsList.filter((e: any) =>
      ["SUBMITTED", "REVIEWED"].includes(e.status),
    ).length;
    return { total, approved, draft, pending };
  }, [examsList]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (exam: any) => {
    setEditing(exam);
    setDialogOpen(true);
  };

  const handleSubmit = (payload: any) => {
    if (editing?.id) {
      update.mutate(
        { id: editing.id, ...payload },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <DashboardLayout
      title="Examinations & Assessment"
      subtitle="Manage exams, schedules, marks, analytics & report cards — CBC and 8-4-4 ready"
    >
      <Tabs defaultValue="exams" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="exams" className="gap-1.5 rounded-lg">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Exams
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 rounded-lg">
            <Calendar className="h-3.5 w-3.5" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="marks" className="gap-1.5 rounded-lg">
            <BookOpen className="h-3.5 w-3.5" />
            Marks Entry
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 rounded-lg">
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 rounded-lg">
            <FileBadge className="h-3.5 w-3.5" />
            Report Cards
          </TabsTrigger>
          <TabsTrigger value="grading" className="gap-1.5 rounded-lg">
            <Award className="h-3.5 w-3.5" />
            Grading
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5 rounded-lg">
            <Settings className="h-3.5 w-3.5" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* ===================== EXAMS ===================== */}
        <TabsContent value="exams" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              {
                title: "Total Exams",
                value: stats.total,
                icon: ClipboardCheck,
                color: "bg-primary/10 text-primary",
              },
              {
                title: "Approved / Locked",
                value: stats.approved,
                icon: ShieldCheck,
                color: "bg-success/10 text-success",
              },
              {
                title: "Pending Review",
                value: stats.pending,
                icon: TrendingUp,
                color: "bg-warning/10 text-warning",
              },
              {
                title: "Drafts",
                value: stats.draft,
                icon: FileText,
                color: "bg-info/10 text-info",
              },
            ].map((s) => (
              <Card key={s.title}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  Examinations
                </CardTitle>
                <Button size="sm" className="rounded-lg" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Exam
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {examsList.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  No exams created yet. Click <strong>Create Exam</strong> to
                  add your first one.
                </p>
              ) : (
                <div className="mx-6 mb-6 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Exam</TableHead>
                        <TableHead>Curriculum</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examsList.map((e: any) => (
                        <TableRow key={e.id} className="hover:bg-muted/30">
                          <TableCell className="font-semibold">
                            <div>{e.name}</div>
                            {e.classes?.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {e.classes.join(", ")}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {e.curriculum_type || "CBC"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {(e.type || "—").replace(/_/g, " ").toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {e.term || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {e.start_date
                              ? `${e.start_date} → ${e.end_date || "—"}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${STATUS_STYLES[e.status] || STATUS_STYLES.DRAFT} border-0`}
                            >
                              {e.status || "DRAFT"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(e)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/exams/entry?exam_id=${e.id}`}>
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Enter Marks
                                  </Link>
                                </DropdownMenuItem>
                                {e.status === "draft" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      lifecycle.submit.mutate({ id: e.id })
                                    }
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit for Review
                                  </DropdownMenuItem>
                                )}
                                {e.status === "submitted" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      lifecycle.review.mutate({ id: e.id })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Reviewed
                                  </DropdownMenuItem>
                                )}
                                {["SUBMITTED", "REVIEWED"].includes(
                                  e.status,
                                ) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      lifecycle.approve.mutate({ id: e.id })
                                    }
                                  >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Approve & Publish
                                  </DropdownMenuItem>
                                )}
                                {e.status === "APPROVED" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      lifecycle.lock.mutate({ id: e.id })
                                    }
                                  >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Lock
                                  </DropdownMenuItem>
                                )}
                                {["APPROVED", "LOCKED"].includes(e.status) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      lifecycle.reopen.mutate({ id: e.id })
                                    }
                                  >
                                    <Undo2 className="h-4 w-4 mr-2" />
                                    Reopen
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    if (confirm(`Delete exam "${e.name}"?`))
                                      del.mutate(e.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== SCHEDULE ===================== */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-bold">
                  Exam Schedule
                </CardTitle>
                <div className="flex items-center gap-2">
                  {examsList.length > 0 && (
                    <Select
                      value={selectedExam?.id}
                      onValueChange={(v) => setSelectedExamId(v)}
                    >
                      <SelectTrigger className="w-56 h-9 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {examsList.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    size="sm"
                    className="rounded-lg"
                    disabled={!selectedExam}
                    onClick={() => setScheduleOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Entry
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedExam ? (
                <p className="text-center text-muted-foreground py-8">
                  Create an exam first to add a schedule.
                </p>
              ) : schedulesList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No schedule entries yet for this exam.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Full Marks</TableHead>
                        <TableHead>Pass</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedulesList.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-semibold">
                            {s.subject_name || s.subject}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.exam_date || s.date || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.start_time
                              ? `${s.start_time} – ${s.end_time || "?"}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {s.room ? (
                              <Badge variant="secondary">{s.room}</Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="font-bold">
                            {s.full_marks}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.pass_marks}
                          </TableCell>
                          <TableCell className="text-right">
                            <DeleteScheduleButton id={s.id} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedExam && (
            <ScheduleDialog
              open={scheduleOpen}
              onOpenChange={setScheduleOpen}
              examId={selectedExam.id}
            />
          )}
        </TabsContent>

        {/* ===================== MARKS ===================== */}
        <TabsContent value="marks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Marks Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The dedicated marks entry workspace supports CBC performance
                levels (EE/ME/AE/BE) and traditional numeric scores with
                autosave, bulk import, and submission for review.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/exams/entry">
                    <BookOpen className="h-4 w-4 mr-1.5" />
                    Open Marks Entry
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/exams/review">
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Review Queue
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== ANALYTICS ===================== */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Exam Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Subject-level means, pass rates, top performers and optional
                rankings (CBC compliant — rankings are disabled by default for
                lower primary).
              </p>
              <Button asChild>
                <Link to="/exams/analytics">
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  Open Analytics Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== REPORT CARDS ===================== */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileBadge className="h-5 w-5 text-primary" />
                Report Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure CBC, 8-4-4 or hybrid report card templates and
                batch-generate per term. Published runs become visible to
                parents and students in the portal.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/reports/cards">
                    <FileBadge className="h-4 w-4 mr-1.5" />
                    Open Report Cards
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/reports/exams">
                    <FileText className="h-4 w-4 mr-1.5" />
                    Exam Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== GRADING REFERENCE ===================== */}
        <TabsContent value="grading" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  CBC Performance Rubric
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cbcRubric.map((r) => (
                  <div
                    key={r.level}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <Badge
                      className={`${r.color} border-0 min-w-[40px] justify-center`}
                    >
                      {r.score}
                    </Badge>
                    <span className="text-sm font-medium">{r.level}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  8-4-4 Grading (KCSE)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Range</TableHead>
                      <TableHead>Pts</TableHead>
                      <TableHead>Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grading844.map((g) => (
                      <TableRow key={g[0]}>
                        <TableCell>
                          <Badge variant="outline" className="font-bold">
                            {g[0]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {g[1]} – {g[2]}
                        </TableCell>
                        <TableCell className="font-semibold">{g[3]}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {g[4]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                These are reference scales. Your school can configure custom
                grading bands and scales.
              </p>
              <Button asChild variant="outline">
                <Link to="/settings/academics">
                  <Settings className="h-4 w-4 mr-1.5" />
                  Configure Grading Scales
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== CONFIGURATION ===================== */}
        <TabsContent value="config" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Assessment Types",
                desc: "Define CAT, mid-term, end-term, project, observation, etc.",
                icon: Layers,
                link: "/settings/academics",
              },
              {
                title: "Grading Scales",
                desc: "CBC rubrics, 8-4-4 grade bands, hybrid scoring.",
                icon: Award,
                link: "/settings/academics",
              },
              {
                title: "CBC Competencies",
                desc: "Core competencies and learning area strands.",
                icon: Target,
                link: "/settings/academics",
              },
              {
                title: "Subjects",
                desc: "Manage subject catalog used across exams.",
                icon: BookOpen,
                link: "/academics/subjects",
              },
              {
                title: "Streams & Classes",
                desc: "Grades and streams used to scope exams.",
                icon: GraduationCap,
                link: "/academics/streams",
              },
              {
                title: "Terms & Academic Years",
                desc: "Sessions that scope all exams and marks.",
                icon: Calendar,
                link: "/settings",
              },
            ].map((c) => (
              <Card key={c.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold">{c.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.desc}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Link to={c.link}>
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      Configure
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ExamFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={
          editing
            ? {
                ...blankExam,
                ...editing,
                classes: [], // edit dialog doesn't repopulate classes (server-only)
              }
            : null
        }
        onSubmit={handleSubmit}
        submitting={create.isPending || update.isPending}
      />
    </DashboardLayout>
  );
};

// Tiny helper so the schedule row has a working delete button.
function DeleteScheduleButton({ id }: { id: string }) {
  const del = useDeleteSchedule();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (confirm("Delete this schedule entry?")) del.mutate(id);
      }}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

export default Examinations;
