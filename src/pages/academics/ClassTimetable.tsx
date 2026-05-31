import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Plus, Trash2, Wand2, AlertTriangle, Printer, Download, Coffee, Clock } from "lucide-react";
import { toast } from "sonner";
import { useSeo } from "@/hooks/useSeo";
import { useClasses, useStreams, useSubjects, useStaff } from "@/hooks/useClasses";
import {
  usePeriods, useSavePeriod, useDeletePeriod,
  useRequirements, useBulkUpsertRequirements,
  useEntries, useGenerateTimetable, useClashes,
  type PeriodRow, type PeriodKind,
} from "@/hooks/useTimetable";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const KINDS: { value: PeriodKind; label: string }[] = [
  { value: "lesson", label: "Lesson" },
  { value: "break", label: "Break" },
  { value: "lunch", label: "Lunch" },
  { value: "assembly", label: "Assembly" },
];

function kindBadge(k: PeriodKind) {
  const map: Record<PeriodKind, string> = {
    lesson: "bg-primary/10 text-primary border-primary/20",
    break: "bg-warning/10 text-warning border-warning/20",
    lunch: "bg-success/10 text-success border-success/20",
    assembly: "bg-accent/10 text-accent border-accent/20",
  };
  return map[k];
}

// ============ Period Setup Tab ============
function PeriodSetup() {
  const { data: periods = [], isLoading } = usePeriods();
  const save = useSavePeriod();
  const del = useDeletePeriod();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<PeriodRow>>({
    label: "", start_time: "", end_time: "", position: 0, kind: "lesson",
  });
  const reset = () => setForm({ label: "", start_time: "", end_time: "", position: periods.length + 1, kind: "lesson" });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Period Setup
          </CardTitle>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) reset(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Period</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{form.id ? "Edit" : "Add"} period</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="col-span-2 space-y-1.5">
                  <Label>Label</Label>
                  <Input value={form.label || ""} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="e.g. Period 1 or Morning Break" />
                </div>
                <div className="space-y-1.5">
                  <Label>Start</Label>
                  <Input type="time" value={form.start_time || ""} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>End</Label>
                  <Input type="time" value={form.end_time || ""} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Position</Label>
                  <Input type="number" value={form.position ?? 0} onChange={(e) => setForm((p) => ({ ...p, position: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kind</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm((p) => ({ ...p, kind: v as PeriodKind }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={save.isPending} onClick={() => {
                  if (!form.label || !form.start_time || !form.end_time) { toast.error("Fill required fields"); return; }
                  save.mutate(form as any, { onSuccess: () => setOpen(false) });
                }}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? <div className="p-6"><Skeleton className="h-40 w-full" /></div> :
          periods.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No periods configured yet. Add lessons, breaks, lunch, and assembly slots.
            </p>
          ) : (
            <Table>
              <TableHeader><TableRow className="bg-muted/40">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {periods.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.position}</TableCell>
                    <TableCell className="font-medium">{p.label}</TableCell>
                    <TableCell className="text-sm">{p.start_time?.slice(0, 5)} – {p.end_time?.slice(0, 5)}</TableCell>
                    <TableCell><Badge className={kindBadge(p.kind)} variant="outline">{p.kind}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setForm(p); setOpen(true); }}>
                        <Calendar className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </CardContent>
    </Card>
  );
}

// ============ Lesson Requirements Tab ============
function LessonRequirements() {
  const { data: grades = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const [gradeId, setGradeId] = useState("");
  const { data: reqs = [], isLoading } = useRequirements(gradeId || undefined);
  const bulkSave = useBulkUpsertRequirements();
  const [draft, setDraft] = useState<Record<string, number>>({});

  const merged = useMemo(() => {
    const map = new Map<string, number>();
    reqs.forEach((r) => map.set(r.subject_id, r.lessons_per_week));
    return subjects.map((s) => ({
      subject_id: s.id,
      subject_name: s.name,
      lessons_per_week: draft[s.id] ?? map.get(s.id) ?? 0,
    }));
  }, [subjects, reqs, draft]);

  const handleSave = () => {
    if (!gradeId) { toast.error("Pick a class first"); return; }
    const items = merged
      .filter((m) => m.lessons_per_week > 0)
      .map((m) => ({ grade_id: gradeId, subject_id: m.subject_id, lessons_per_week: m.lessons_per_week }));
    bulkSave.mutate(items, { onSuccess: () => setDraft({}) });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Lessons per week (by class)</CardTitle>
          <div className="flex gap-2">
            <Select value={gradeId} onValueChange={setGradeId}>
              <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" disabled={!gradeId || bulkSave.isPending} onClick={handleSave}>Save</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!gradeId ? (
          <p className="text-center text-sm text-muted-foreground py-8">Choose a class to configure its weekly lesson load.</p>
        ) : isLoading ? <div className="p-6"><Skeleton className="h-40 w-full" /></div> : (
          <Table>
            <TableHeader><TableRow className="bg-muted/40">
              <TableHead>Subject</TableHead>
              <TableHead className="w-44">Lessons / week</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {merged.map((m) => (
                <TableRow key={m.subject_id}>
                  <TableCell>{m.subject_name}</TableCell>
                  <TableCell>
                    <Input type="number" min={0} max={20} value={m.lessons_per_week}
                      onChange={(e) => setDraft((d) => ({ ...d, [m.subject_id]: Math.max(0, Number(e.target.value || 0)) }))}
                      className="w-24" />
                  </TableCell>
                </TableRow>
              ))}
              {merged.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-6">
                  No subjects in the system yet.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ============ Auto-Generate Tab ============
function AutoGenerate() {
  const { data: grades = [] } = useClasses();
  const [selected, setSelected] = useState<string[]>([]);
  const gen = useGenerateTimetable();
  const { data: clashes } = useClashes();

  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" />Auto-generate timetables</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pick the classes to generate. Existing entries for affected streams will be replaced.
            Uses period setup, lesson requirements, and teacher subject allocations.
          </p>
          <div className="flex flex-wrap gap-2">
            {grades.map((g) => (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                className={`px-3 py-1.5 rounded-md border text-sm transition ${
                  selected.includes(g.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button disabled={!selected.length || gen.isPending}
              onClick={() => gen.mutate({ grade_ids: selected, replace: true })}>
              <Wand2 className="h-4 w-4 mr-2" />{gen.isPending ? "Generating..." : "Generate"}
            </Button>
            <Button variant="outline" disabled={!grades.length}
              onClick={() => setSelected(grades.map((g) => g.id))}>Select all</Button>
            <Button variant="ghost" onClick={() => setSelected([])}>Clear</Button>
          </div>
          {gen.data && (
            <Alert>
              <AlertTitle>Result</AlertTitle>
              <AlertDescription className="text-sm">
                Assigned {(gen.data as any)?.data?.assigned ?? (gen.data as any).assigned} lessons,
                skipped {(gen.data as any)?.data?.skipped ?? (gen.data as any).skipped}.
                {((gen.data as any)?.data?.warnings || (gen.data as any).warnings || []).length > 0 && (
                  <ul className="list-disc pl-4 mt-2 text-xs max-h-40 overflow-auto">
                    {((gen.data as any)?.data?.warnings || (gen.data as any).warnings).slice(0, 20).map((w: string, i: number) =>
                      <li key={i}>{w}</li>)}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Clash detection</CardTitle></CardHeader>
        <CardContent>
          {!clashes || (clashes.teacherClashes.length === 0 && clashes.classClashes.length === 0) ? (
            <p className="text-sm text-success">No clashes detected.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {clashes.teacherClashes.length > 0 && (
                <div>
                  <p className="font-medium">Teacher double-bookings: {clashes.teacherClashes.length}</p>
                  <ul className="text-xs text-muted-foreground pl-4 list-disc">
                    {clashes.teacherClashes.slice(0, 10).map((c, i) =>
                      <li key={i}>Teacher {c.teacher_id.slice(0, 8)} — {c.day} period {c.period} ({c.c} lessons)</li>)}
                  </ul>
                </div>
              )}
              {clashes.classClashes.length > 0 && (
                <div>
                  <p className="font-medium">Class double-bookings: {clashes.classClashes.length}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ View Tabs ============
function TimetableGrid({
  entries,
  periods,
  showClass,
}: {
  entries: ReturnType<typeof useEntries>["data"];
  periods: PeriodRow[];
  showClass?: boolean;
}) {
  const lessons = periods.filter((p) => p.kind === "lesson" && p.is_active);
  const getEntry = (day: string, pos: number) =>
    (entries || []).find((e) => e.day === day && Number(e.period) === pos);

  if (!periods.length) {
    return <p className="text-center text-sm text-muted-foreground py-8">Configure periods first.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow className="bg-muted/40">
          <TableHead className="w-32">Period</TableHead>
          <TableHead className="w-32 text-xs">Time</TableHead>
          {DAYS.map((d) => <TableHead key={d} className="text-center">{d}</TableHead>)}
        </TableRow></TableHeader>
        <TableBody>
          {periods.map((p) => (
            <TableRow key={p.id} className={p.kind !== "lesson" ? "bg-muted/30" : ""}>
              <TableCell className="font-medium flex items-center gap-1.5">
                {p.kind !== "lesson" && <Coffee className="h-3 w-3 text-muted-foreground" />}
                {p.label}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {p.start_time?.slice(0, 5)}–{p.end_time?.slice(0, 5)}
              </TableCell>
              {DAYS.map((d) => {
                if (p.kind !== "lesson") {
                  return <TableCell key={d} className="text-center text-xs text-muted-foreground italic">{p.kind}</TableCell>;
                }
                const e = getEntry(d, p.position);
                return (
                  <TableCell key={d} className="p-1.5 text-center">
                    {e ? (
                      <div className="bg-primary/5 border border-primary/10 rounded p-1.5">
                        <p className="text-xs font-semibold text-primary leading-tight">{e.subject}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {showClass ? `${e.class_name} ${e.section}` : e.teacher?.trim() || "—"}
                        </p>
                      </div>
                    ) : <span className="text-xs text-muted-foreground/40">—</span>}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ClassView() {
  const { data: grades = [] } = useClasses();
  const [gradeId, setGradeId] = useState("");
  const { data: streams = [] } = useStreams(gradeId || undefined);
  const [streamId, setStreamId] = useState("");
  const { data: entries = [] } = useEntries({ stream_id: streamId || undefined });
  const { data: periods = [] } = usePeriods();

  const exportCsv = () => {
    if (!entries.length) return;
    const rows = [["Day", "Period", "Start", "End", "Subject", "Teacher"]];
    entries.forEach((e) => rows.push([e.day, String(e.period), e.start_time || "", e.end_time || "", e.subject, e.teacher?.trim() || ""]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `timetable-${streamId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Class Timetable</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={gradeId} onValueChange={(v) => { setGradeId(v); setStreamId(""); }}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={streamId} onValueChange={setStreamId} disabled={!gradeId}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Stream" /></SelectTrigger>
              <SelectContent>{streams.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={!entries.length} onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />Print
            </Button>
            <Button size="sm" variant="outline" disabled={!entries.length} onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1" />CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!streamId ? (
          <p className="text-center text-sm text-muted-foreground py-8">Pick a class and stream.</p>
        ) : <TimetableGrid entries={entries} periods={periods} />}
      </CardContent>
    </Card>
  );
}

function TeacherView() {
  const { data: staff = [] } = useStaff();
  const [teacherId, setTeacherId] = useState("");
  const { data: entries = [] } = useEntries({ teacher_id: teacherId || undefined });
  const { data: periods = [] } = usePeriods();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Teacher Timetable</CardTitle>
          <div className="flex gap-2">
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger className="w-56 h-9"><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>{staff.map((t) => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={!entries.length} onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!teacherId ? (
          <p className="text-center text-sm text-muted-foreground py-8">Pick a teacher.</p>
        ) : <TimetableGrid entries={entries} periods={periods} showClass />}
      </CardContent>
    </Card>
  );
}

// ============ Page ============
const ClassTimetable = () => {
  useSeo("Class Timetable", "Automated timetable generation with period setup, lesson requirements, and clash detection.");

  return (
    <DashboardLayout title="Timetable" subtitle="Configure periods, lesson loads, auto-generate, and view class/teacher schedules">
      <Tabs defaultValue="class" className="space-y-4 print:space-y-0">
        <TabsList className="print:hidden">
          <TabsTrigger value="class">Class View</TabsTrigger>
          <TabsTrigger value="teacher">Teacher View</TabsTrigger>
          <TabsTrigger value="periods">Period Setup</TabsTrigger>
          <TabsTrigger value="requirements">Lesson Requirements</TabsTrigger>
          <TabsTrigger value="generate">Auto-Generate</TabsTrigger>
        </TabsList>
        <TabsContent value="class"><ClassView /></TabsContent>
        <TabsContent value="teacher"><TeacherView /></TabsContent>
        <TabsContent value="periods"><PeriodSetup /></TabsContent>
        <TabsContent value="requirements"><LessonRequirements /></TabsContent>
        <TabsContent value="generate"><AutoGenerate /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ClassTimetable;
