import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { classes, timetableEntries } from "@/data/mockData";
import { UserCheck, Edit, Plus } from "lucide-react";
import { toast } from "sonner";

const teachers = [...new Set(timetableEntries.map(t => t.teacher))];

const classTeacherAssignments = [
  { id: "cta1", class: "Grade 6", section: "North", teacher: "Mr. Omondi", students: 38, status: "assigned" },
  { id: "cta2", class: "Grade 6", section: "East", teacher: "Mrs. Kamau", students: 35, status: "assigned" },
  { id: "cta3", class: "Grade 7", section: "West", teacher: "Mr. Mwangi", students: 42, status: "assigned" },
  { id: "cta4", class: "Grade 8", section: "East", teacher: "Mrs. Otieno", students: 45, status: "assigned" },
  { id: "cta5", class: "Grade 8", section: "West", teacher: "", students: 40, status: "unassigned" },
];

const AssignClassTeacher = () => {
  const [showAssign, setShowAssign] = useState(false);
  const [assignData, setAssignData] = useState({ class: "", section: "", teacher: "" });

  const handleAssign = () => {
    if (!assignData.class || !assignData.teacher) { toast.error("Select class and teacher"); return; }
    toast.success(`${assignData.teacher} assigned as class teacher for ${assignData.class} ${assignData.section}`);
    setShowAssign(false);
  };

  return (
    <DashboardLayout title="Assign Class Teacher" subtitle="Manage class teacher assignments">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{classTeacherAssignments.length}</p>
              <p className="text-xs text-muted-foreground">Total Classes</p>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{classTeacherAssignments.filter(c => c.status === "assigned").length}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{classTeacherAssignments.filter(c => c.status === "unassigned").length}</p>
              <p className="text-xs text-muted-foreground">Unassigned</p>
            </CardContent>
          </Card>
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
                    <div className="space-y-2"><Label>Class *</Label>
                      <Select value={assignData.class} onValueChange={v => setAssignData(p => ({ ...p, class: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{["Grade 6", "Grade 7", "Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Section</Label>
                      <Select value={assignData.section} onValueChange={v => setAssignData(p => ({ ...p, section: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                        <SelectContent>{["East", "West", "North"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Teacher *</Label>
                      <Select value={assignData.teacher} onValueChange={v => setAssignData(p => ({ ...p, teacher: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                        <SelectContent>{teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
                    <Button onClick={handleAssign}>Assign</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Section</TableHead>
                  <TableHead className="font-semibold">Class Teacher</TableHead>
                  <TableHead className="font-semibold">Students</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classTeacherAssignments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.class}</TableCell>
                    <TableCell>{a.section}</TableCell>
                    <TableCell>{a.teacher || <span className="text-muted-foreground italic">Not assigned</span>}</TableCell>
                    <TableCell>{a.students}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "assigned" ? "default" : "destructive"} className="text-[10px]">
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm"><Edit className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AssignClassTeacher;
