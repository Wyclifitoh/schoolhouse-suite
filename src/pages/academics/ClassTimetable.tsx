import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  useClasses, useStreams, useSubjects, useStaff,
  useTimetable, useCreateTimetableEntry, useDeleteTimetableEntry,
} from "@/hooks/useClasses";
import { Calendar, Plus, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSeo } from "@/hooks/useSeo";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = Array.from({ length: 8 }, (_, i) => i + 1);
const periodTimes = ["8:00-8:40", "8:40-9:20", "9:20-10:00", "10:20-11:00", "11:00-11:40", "11:40-12:20", "2:00-2:40", "2:40-3:20"];

const ClassTimetable = () => {
  useSeo("Class Timetable", "Manage class period schedules across the school week.");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState({ day: "", period: "", subject_id: "", teacher_id: "" });

  const { data: grades = [] } = useClasses();
  const { data: streams = [] } = useStreams(selectedGrade || undefined);
  const { data: subjects = [] } = useSubjects();
  const { data: staff = [] } = useStaff();
  const { data: entries = [], isLoading } = useTimetable(selectedStream || undefined);
  const createMut = useCreateTimetableEntry();
  const deleteMut = useDeleteTimetableEntry();

  const getEntry = (day: string, period: number) =>
    entries.find((e) => e.day === day && e.period === period);

  const handleAdd = () => {
    if (!selectedStream || !selectedGrade) { toast.error("Pick a class and stream first"); return; }
    if (!addData.day || !addData.period || !addData.subject_id) { toast.error("Fill required fields"); return; }
    createMut.mutate({
      stream_id: selectedStream,
      grade_id: selectedGrade,
      subject_id: addData.subject_id,
      teacher_id: addData.teacher_id || undefined,
      day: addData.day,
      period: Number(addData.period),
      start_time: periodTimes[Number(addData.period) - 1]?.split("-")[0],
      end_time: periodTimes[Number(addData.period) - 1]?.split("-")[1],
    } as any, {
      onSuccess: () => { setShowAdd(false); setAddData({ day: "", period: "", subject_id: "", teacher_id: "" }); },
    });
  };

  const subjectCount = useMemo(() => new Set(entries.map((e) => e.subject)).size, [entries]);

  return (
    <DashboardLayout title="Class Timetable" subtitle="View and manage class timetables">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Class Timetable
                {entries.length > 0 && <span className="text-xs text-muted-foreground font-normal ml-2">{entries.length} periods · {subjectCount} subjects</span>}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedGrade} onValueChange={(v) => { setSelectedGrade(v); setSelectedStream(""); }}>
                  <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedStream} onValueChange={setSelectedStream} disabled={!selectedGrade}>
                  <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Stream" /></SelectTrigger>
                  <SelectContent>{streams.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Dialog open={showAdd} onOpenChange={setShowAdd}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!selectedStream}><Plus className="h-4 w-4 mr-1.5" />Add Period</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Timetable Entry</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                      <div className="space-y-2"><Label>Day *</Label>
                        <Select value={addData.day} onValueChange={(v) => setAddData((p) => ({ ...p, day: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                          <SelectContent>{days.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Period *</Label>
                        <Select value={addData.period} onValueChange={(v) => setAddData((p) => ({ ...p, period: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                          <SelectContent>{periods.map((p) => <SelectItem key={p} value={String(p)}>Period {p} ({periodTimes[p - 1]})</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Subject *</Label>
                        <Select value={addData.subject_id} onValueChange={(v) => setAddData((p) => ({ ...p, subject_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Teacher</Label>
                        <Select value={addData.teacher_id} onValueChange={(v) => setAddData((p) => ({ ...p, teacher_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select teacher (optional)" /></SelectTrigger>
                          <SelectContent>{staff.map((t) => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                      <Button onClick={handleAdd} disabled={createMut.isPending}>{createMut.isPending ? "Adding..." : "Add Entry"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {!selectedStream ? (
              <p className="text-center py-10 text-sm text-muted-foreground">Select a class and stream to view its timetable.</p>
            ) : isLoading ? (
              <div className="p-6"><Skeleton className="h-64 w-full" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold w-24">Period</TableHead>
                    <TableHead className="font-semibold text-[11px] text-muted-foreground">Time</TableHead>
                    {days.map((d) => <TableHead key={d} className="font-semibold text-center">{d}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((p) => (
                    <TableRow key={p} className={p === 4 ? "border-t-2 border-dashed border-primary/20" : ""}>
                      <TableCell className="font-medium">Period {p}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{periodTimes[p - 1]}</TableCell>
                      {days.map((d) => {
                        const entry = getEntry(d, p);
                        return (
                          <TableCell key={d} className="text-center p-1.5">
                            {entry ? (
                              <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 group relative">
                                <p className="text-xs font-semibold text-primary">{entry.subject}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{entry.teacher?.trim() || "—"}</p>
                                <button
                                  onClick={() => deleteMut.mutate(entry.id)}
                                  className="absolute top-0.5 right-0.5 hidden group-hover:block p-0.5 rounded hover:bg-destructive/10"
                                  aria-label="Remove period"
                                >
                                  <Trash2 className="h-2.5 w-2.5 text-destructive" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground/40 py-3">—</div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClassTimetable;
