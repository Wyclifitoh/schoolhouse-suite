import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchool } from "@/contexts/SchoolContext";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen, Plus, Search, Edit, Trash2, ClipboardCheck, Calendar, Users,
} from "lucide-react";
import { useClasses, useStreams, useSubjects } from "@/hooks/useClasses";
import { usePermissions } from "@/hooks/usePermission";
import { formatDate } from "@/utils/date";

const HomeworkForm = ({ homework, onSave, onClose }: { homework?: any; onSave: (d: any) => void; onClose: () => void }) => {
  const [title, setTitle] = useState(homework?.title || "");
  const [description, setDescription] = useState(homework?.description || "");
  const [subject, setSubject] = useState(homework?.subject || "");
  const [className, setClassName] = useState(homework?.class_name || "");
  const [section, setSection] = useState(homework?.section || "");
  const [dueDate, setDueDate] = useState(homework?.due_date || "");
  const [maxMarks, setMaxMarks] = useState(homework?.max_marks?.toString() || "100");
  const { data: subjects = [] } = useSubjects();
  const { data: classes = [] } = useClasses();
  const selectedClass = (classes as any[]).find((c: any) => c.name === className);
  const { data: streams = [] } = useStreams(selectedClass?.id);

  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2"><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Exercises" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Subject *</Label>
          <Select value={subject} onValueChange={setSubject}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {(subjects as any[]).length === 0 && <SelectItem value="__none" disabled>No subjects configured</SelectItem>}
              {(subjects as any[]).map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent></Select>
        </div>
        <div className="space-y-2"><Label>Class *</Label>
          <Select value={className} onValueChange={(v) => { setClassName(v); setSection(""); }}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {(classes as any[]).length === 0 && <SelectItem value="__none" disabled>No classes configured</SelectItem>}
              {(classes as any[]).map((c: any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Stream / Section</Label>
          <Select value={section} onValueChange={setSection} disabled={!selectedClass}>
            <SelectTrigger><SelectValue placeholder={selectedClass ? "All streams" : "Select class first"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All streams</SelectItem>
              {(streams as any[]).map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Due Date *</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
        <div className="space-y-2"><Label>Max Marks</Label><Input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label>Description / Instructions</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Homework details and instructions..." rows={3} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => {
          if (!title || !subject || !className || !dueDate) { toast.error("Fill all required fields"); return; }
          onSave({ title, description, subject, class_name: className, section: section && section !== "__all" ? section : null, due_date: dueDate, max_marks: Number(maxMarks) });
        }}>{homework ? "Update" : "Assign"}</Button>
      </DialogFooter>
    </div>
  );
};

const EvaluationDialog = ({ submission, onSave }: { submission: any; onSave: (d: any) => void }) => {
  const [marks, setMarks] = useState(submission?.marks?.toString() || "");
  const [remarks, setRemarks] = useState(submission?.remarks || "");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><ClipboardCheck className="h-3.5 w-3.5 mr-1" />Evaluate</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Evaluate Submission</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2"><Label>Marks</Label><Input type="number" value={marks} onChange={e => setMarks(e.target.value)} /></div>
          <div className="space-y-2"><Label>Remarks</Label><Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { onSave({ id: submission.id, marks: Number(marks), remarks, status: "evaluated" }); setOpen(false); }}>Save</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Homework = () => {
  const { currentSchool } = useSchool();
  const queryClient = useQueryClient();
  const schoolId = currentSchool?.id;
  const perms = usePermissions(["classes:create","classes:update","classes:delete"]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedHw, setSelectedHw] = useState<string | null>(null);

  const { data: homeworkList = [] } = useQuery({
    queryKey: ["homework", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const res = await api.get<any>("/homework");
      return (res?.data || res || []) as any[];
    },
    enabled: !!schoolId,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["homework-submissions", selectedHw],
    queryFn: async () => {
      if (!selectedHw) return [];
      const res = await api.get<any>(`/homework/${selectedHw}/submissions`);
      return (res?.data || res || []) as any[];
    },
    enabled: !!selectedHw,
  });

  const saveHw = useMutation({
    mutationFn: async (data: any) => {
      if (editing) await api.put(`/homework/${editing.id}`, data);
      else await api.post("/homework", data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["homework"] }); toast.success(editing ? "Homework updated" : "Homework assigned"); setDialogOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteHw = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/homework/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["homework"] }); toast.success("Homework deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const evaluateSub = useMutation({
    mutationFn: async (data: any) => {
      await api.put(`/homework/submissions/${data.id}`, { marks: data.marks, remarks: data.remarks, status: data.status });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["homework-submissions"] }); toast.success("Evaluation saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = homeworkList.filter((h: any) =>
    h.title.toLowerCase().includes(search.toLowerCase()) ||
    h.subject.toLowerCase().includes(search.toLowerCase()) ||
    h.class_name.toLowerCase().includes(search.toLowerCase())
  );

  const today = new Date().toISOString().split("T")[0];
  const activeCount = homeworkList.filter((h: any) => h.due_date >= today).length;
  const overdueCount = homeworkList.filter((h: any) => h.due_date < today && h.status === "active").length;

  return (
    <DashboardLayout title="Homework" subtitle="Assign, track and evaluate homework">
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="list" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Assignments</TabsTrigger>
          <TabsTrigger value="submissions" className="gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" />Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total Assignments</p><p className="text-2xl font-bold">{homeworkList.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Calendar className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-success">{activeCount}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><Calendar className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-destructive">{overdueCount}</p></div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Homework List</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  {perms["classes:create"] && <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Assign Homework</Button></DialogTrigger>
                    <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing ? "Edit Homework" : "Assign Homework"}</DialogTitle></DialogHeader>
                      <HomeworkForm homework={editing} onSave={d => saveHw.mutate(d)} onClose={() => { setDialogOpen(false); setEditing(null); }} />
                    </DialogContent>
                  </Dialog>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Title</TableHead><TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead><TableHead className="font-semibold">Max Marks</TableHead><TableHead className="font-semibold">Status</TableHead><TableHead className="font-semibold w-24">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No homework found</TableCell></TableRow>}
                {filtered.map((h: any) => {
                  const isOverdue = h.due_date < today && h.status === "active";
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.title}</TableCell>
                      <TableCell><Badge variant="secondary">{h.subject}</Badge></TableCell>
                      <TableCell>{h.class_name} {h.section}</TableCell>
                      <TableCell className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>{formatDate(h.due_date)}</TableCell>
                      <TableCell>{h.max_marks}</TableCell>
                      <TableCell><Badge className={isOverdue ? "bg-destructive/10 text-destructive border-0" : "bg-success/10 text-success border-0"}>{isOverdue ? "Overdue" : "Active"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {perms["classes:update"] && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(h); setDialogOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>}
                          {perms["classes:delete"] && <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete homework?</AlertDialogTitle><AlertDialogDescription>This will also delete all submissions.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteHw.mutate(h.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Submission Tracking</CardTitle>
                <Select value={selectedHw || ""} onValueChange={setSelectedHw}>
                  <SelectTrigger className="w-64 h-9"><SelectValue placeholder="Select homework" /></SelectTrigger>
                  <SelectContent>{homeworkList.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.title} - {h.class_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedHw ? (
                <div className="text-center py-12 text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Select a homework to view submissions</p></div>
              ) : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Submitted</TableHead>
                  <TableHead className="font-semibold">Marks</TableHead><TableHead className="font-semibold">Status</TableHead><TableHead className="font-semibold">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {submissions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No submissions yet</TableCell></TableRow>}
                  {submissions.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.students?.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{s.students?.admission_number || "—"}</TableCell>
                       <TableCell className="text-muted-foreground">{formatDate(s.submission_date)}</TableCell>
                      <TableCell className="font-semibold">{s.marks ?? "—"}</TableCell>
                      <TableCell><Badge className={
                        s.status === "evaluated" ? "bg-success/10 text-success border-0" :
                        s.status === "submitted" ? "bg-primary/10 text-primary border-0" :
                        "bg-muted text-muted-foreground border-0"
                      }>{s.status}</Badge></TableCell>
                      <TableCell><EvaluationDialog submission={s} onSave={d => evaluateSub.mutate(d)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Homework;
