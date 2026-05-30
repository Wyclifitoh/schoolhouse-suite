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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardCheck, Plus, Search, FileText, Settings,
  CheckCircle2, Lock, Archive, PlayCircle, Trash2,
} from "lucide-react";
import {
  useAssessmentsList,
  useAssessmentTypes,
  useSaveAssessment,
  usePublishAssessment,
  useSetAssessmentStatus,
  useDeleteAssessment,
  type AssessmentStatus,
} from "@/hooks/useAssessments";
import { useGrades } from "@/hooks/useGrades";

const STATUS_STYLES: Record<AssessmentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  locked: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  archived: "bg-zinc-500/15 text-zinc-600 border-zinc-500/30",
};

function NewAssessmentDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string; description: string; assessment_type_id: string;
    start_date: string; end_date: string; grade_ids: string[]; out_of: number;
  }>({
    name: "", description: "", assessment_type_id: "",
    start_date: "", end_date: "", grade_ids: [], out_of: 100,
  });
  const { data: types = [] } = useAssessmentTypes();
  const { data: grades = [] } = useGrades();
  const save = useSaveAssessment();

  const reset = () =>
    setForm({ name: "", description: "", assessment_type_id: "", start_date: "", end_date: "", grade_ids: [], out_of: 100 });

  const submit = async () => {
    if (!form.name.trim() || form.grade_ids.length === 0) return;
    await save.mutateAsync(form as any);
    reset(); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> New Assessment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Assessment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. End Term 1 — Grade 4" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.assessment_type_id} onValueChange={(v) => setForm({ ...form, assessment_type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(types as any[]).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.weight}%)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <Label>Default out-of</Label>
              <Input type="number" value={form.out_of} onChange={(e) => setForm({ ...form, out_of: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Classes *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto p-2 rounded border">
              {(grades as any[]).map((g) => {
                const checked = form.grade_ids.includes(g.id);
                return (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
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
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending || !form.name || !form.grade_ids.length}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Assessments() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const { data: list = [], isLoading } = useAssessmentsList({ q: q || undefined, status: status || undefined });
  const publish = usePublishAssessment();
  const setStatusM = useSetAssessmentStatus();
  const remove = useDeleteAssessment();

  const summary = useMemo(() => {
    const by = { draft: 0, published: 0, in_progress: 0, locked: 0, archived: 0 } as Record<string, number>;
    (list as any[]).forEach((a) => { by[a.status] = (by[a.status] || 0) + 1; });
    return by;
  }, [list]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-primary" /> Assessments
            </h1>
            <p className="text-muted-foreground">
              Create CBC/CBE assessments, auto-generate teacher tasks, and track progress end-to-end.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/assessments/settings"><Button variant="outline"><Settings className="h-4 w-4 mr-1" /> Settings</Button></Link>
            <Link to="/assessments/tasks"><Button variant="outline"><FileText className="h-4 w-4 mr-1" /> My Tasks</Button></Link>
            <NewAssessmentDialog />
          </div>
        </div>

        <div className="grid sm:grid-cols-5 gap-3">
          {(["draft","published","in_progress","locked","archived"] as AssessmentStatus[]).map((s) => (
            <Card key={s}>
              <CardContent className="pt-4">
                <div className="text-xs uppercase text-muted-foreground">{s.replace("_"," ")}</div>
                <div className="text-2xl font-bold">{summary[s] || 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="h-4 w-4 absolute left-2 top-3 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="min-w-[180px]">
                <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                  {isLoading && Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                  ))}
                  {!isLoading && (list as any[]).map((a) => {
                    const pct = a.task_count ? Math.round((a.task_done / a.task_count) * 100) : 0;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Link to={`/assessments/${a.id}`} className="font-medium hover:underline">
                            {a.name}
                          </Link>
                          {a.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">{a.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {a.type_name ? (
                            <Badge variant="outline">{a.type_code} · {a.type_weight}%</Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.start_date || "—"} → {a.end_date || "—"}
                        </TableCell>
                        <TableCell>{a.class_count} · {a.subject_count} subj</TableCell>
                        <TableCell className="min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2" />
                            <span className="text-xs text-muted-foreground">{a.task_done}/{a.task_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_STYLES[a.status as AssessmentStatus]}>
                            {a.status.replace("_"," ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {a.status === "draft" && (
                            <Button size="sm" variant="outline" onClick={() => publish.mutate(a.id)}>
                              <PlayCircle className="h-3.5 w-3.5 mr-1" /> Publish
                            </Button>
                          )}
                          {(a.status === "published" || a.status === "in_progress") && (
                            <Button size="sm" variant="outline" onClick={() => setStatusM.mutate({ id: a.id, status: "locked" })}>
                              <Lock className="h-3.5 w-3.5 mr-1" /> Lock
                            </Button>
                          )}
                          {a.status === "locked" && (
                            <Button size="sm" variant="outline" onClick={() => setStatusM.mutate({ id: a.id, status: "archived" })}>
                              <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                            </Button>
                          )}
                          {a.status === "draft" && (
                            <Button size="sm" variant="ghost" onClick={() => {
                              if (confirm("Delete this assessment?")) remove.mutate(a.id);
                            }}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!isLoading && !list.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No assessments yet. Click <b>New Assessment</b> to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
