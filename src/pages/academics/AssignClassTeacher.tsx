import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useStreams, useStaff, useUpdateStream } from "@/hooks/useClasses";
import { UserCheck, Edit, Plus } from "lucide-react";
import { toast } from "sonner";

const AssignClassTeacher = () => {
  const { data: streams = [], isLoading } = useStreams();
  const { data: staff = [] } = useStaff();
  const updateStream = useUpdateStream();

  const [showAssign, setShowAssign] = useState(false);
  const [streamId, setStreamId] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const stats = useMemo(() => {
    const arr = streams as any[];
    return {
      total: arr.length,
      assigned: arr.filter(s => s.class_teacher_id).length,
      unassigned: arr.filter(s => !s.class_teacher_id).length,
    };
  }, [streams]);

  const handleAssign = () => {
    if (!streamId || !teacherId) { toast.error("Select a stream and teacher"); return; }
    updateStream.mutate({ id: streamId, data: { class_teacher_id: teacherId } as any }, {
      onSuccess: () => { setShowAssign(false); setStreamId(""); setTeacherId(""); },
    });
  };

  const teacherName = (id: string | null) => {
    const t = (staff as any[]).find(s => s.id === id);
    return t ? `${t.first_name} ${t.last_name}` : null;
  };

  return (
    <DashboardLayout title="Assign Class Teacher" subtitle="Manage class teacher assignments per stream">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p><p className="text-xs text-muted-foreground">Total Streams</p>
          </CardContent></Card>
          <Card className="bg-success/5 border-success/10"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.assigned}</p><p className="text-xs text-muted-foreground">Assigned</p>
          </CardContent></Card>
          <Card className="bg-destructive/5 border-destructive/10"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.unassigned}</p><p className="text-xs text-muted-foreground">Unassigned</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Class Teacher Assignments
              </CardTitle>
              <Dialog open={showAssign} onOpenChange={setShowAssign}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Assign Teacher</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Assign Class Teacher</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2"><Label>Class & Stream *</Label>
                      <Select value={streamId} onValueChange={setStreamId}>
                        <SelectTrigger><SelectValue placeholder="Select stream" /></SelectTrigger>
                        <SelectContent>{(streams as any[]).map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.grade_name || "—"} · {s.name}</SelectItem>
                        ))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Teacher *</Label>
                      <Select value={teacherId} onValueChange={setTeacherId}>
                        <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                        <SelectContent>{(staff as any[]).map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                        ))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={updateStream.isPending}>{updateStream.isPending ? "Saving..." : "Assign"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
            (streams as any[]).length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No streams yet. Add streams first.</p> : (
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Stream</TableHead>
                  <TableHead className="font-semibold">Class Teacher</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(streams as any[]).map(s => {
                    const tName = teacherName(s.class_teacher_id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.grade_name || "—"}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{tName || <span className="text-muted-foreground italic">Not assigned</span>}</TableCell>
                        <TableCell>
                          <Badge variant={tName ? "default" : "destructive"} className="text-[10px]">{tName ? "assigned" : "unassigned"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setStreamId(s.id); setTeacherId(s.class_teacher_id || ""); setShowAssign(true); }}>
                            <Edit className="h-3.5 w-3.5" />
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

export default AssignClassTeacher;
