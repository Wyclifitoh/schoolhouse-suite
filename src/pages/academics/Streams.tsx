import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Plus, Edit, Trash2, Users } from "lucide-react";
import { useClasses, useStreams, useCreateStream, useDeleteStream, useUpdateStream, useStaff } from "@/hooks/useClasses";
import { useTerm } from "@/contexts/TermContext";
import { toast } from "sonner";

const Streams = () => {
  const { data: grades = [] } = useClasses();
  const { data: streams = [], isLoading } = useStreams();
  const { data: staff = [] } = useStaff();
  const { currentAcademicYear } = useTerm();

  const createStream = useCreateStream();
  const deleteStream = useDeleteStream();
  const updateStream = useUpdateStream();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", grade_id: "", capacity: "40", class_teacher_id: "" });

  const handleAdd = () => {
    if (!form.name || !form.grade_id) { toast.error("Class and stream name are required"); return; }
    if (!currentAcademicYear?.id) { toast.error("Set a current Academic Year in Settings first"); return; }
    createStream.mutate({
      name: form.name,
      grade_id: form.grade_id,
      capacity: form.capacity ? (parseInt(form.capacity) as any) : null,
      class_teacher_id: form.class_teacher_id || null,
      academic_year_id: currentAcademicYear.id,
    } as any, {
      onSuccess: () => { setShowAdd(false); setForm({ name: "", grade_id: "", capacity: "40", class_teacher_id: "" }); },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this stream? Students assigned will lose this stream.")) deleteStream.mutate(id);
  };

  const totalCapacity = streams.reduce((s: number, c: any) => s + (c.capacity || 0), 0);

  return (
    <DashboardLayout title="Streams / Sections" subtitle="Manage class streams and student distribution">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{streams.length}</p><p className="text-xs text-muted-foreground">Total Streams</p>
          </CardContent></Card>
          <Card className="bg-success/5 border-success/10"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{totalCapacity}</p><p className="text-xs text-muted-foreground">Total Capacity</p>
          </CardContent></Card>
          <Card className="bg-warning/5 border-warning/10"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{grades.length}</p><p className="text-xs text-muted-foreground">Classes</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> All Streams
              </CardTitle>
              <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogTrigger asChild><Button size="sm" disabled={grades.length === 0}><Plus className="h-4 w-4 mr-1.5" />Add Stream</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Stream</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2"><Label>Class *</Label>
                      <Select value={form.grade_id} onValueChange={v => setForm(p => ({ ...p, grade_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{grades.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Stream Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. East" /></div>
                    <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Class Teacher (optional)</Label>
                      <Select value={form.class_teacher_id} onValueChange={v => setForm(p => ({ ...p, class_teacher_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                        <SelectContent>{(staff as any[]).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={createStream.isPending}>{createStream.isPending ? "Adding..." : "Add Stream"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {grades.length === 0 && <p className="text-xs text-muted-foreground mt-1">Create a class first in Academics → Classes.</p>}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
            streams.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No streams yet.</p> : (
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Stream</TableHead>
                  <TableHead className="font-semibold">Class Teacher</TableHead>
                  <TableHead className="font-semibold">Capacity</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(streams as any[]).map((s: any) => {
                    const teacher = (staff as any[]).find(t => t.id === s.class_teacher_id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.grade_name || "—"}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{teacher ? `${teacher.first_name} ${teacher.last_name}` : <span className="text-muted-foreground italic">Not assigned</span>}</TableCell>
                        <TableCell><div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-muted-foreground" />{s.capacity || "—"}</div></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Streams;
