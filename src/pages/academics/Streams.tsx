import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const streamsData = [
  { id: "str1", name: "East", class: "Grade 6", students: 35, capacity: 40, classTeacher: "Mrs. Kamau", status: "active" },
  { id: "str2", name: "North", class: "Grade 6", students: 38, capacity: 40, classTeacher: "Mr. Omondi", status: "active" },
  { id: "str3", name: "West", class: "Grade 7", students: 42, capacity: 45, classTeacher: "Mr. Mwangi", status: "active" },
  { id: "str4", name: "East", class: "Grade 8", students: 45, capacity: 45, classTeacher: "Mrs. Otieno", status: "active" },
  { id: "str5", name: "West", class: "Grade 8", students: 40, capacity: 45, classTeacher: "", status: "active" },
];

const Streams = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [newStream, setNewStream] = useState({ name: "", class: "", capacity: "40" });

  const totalStudents = streamsData.reduce((s, c) => s + c.students, 0);
  const totalCapacity = streamsData.reduce((s, c) => s + c.capacity, 0);

  return (
    <DashboardLayout title="Streams / Sections" subtitle="Manage class streams and student distribution">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{streamsData.length}</p>
              <p className="text-xs text-muted-foreground">Total Streams</p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/5 border-secondary/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{totalCapacity}</p>
              <p className="text-xs text-muted-foreground">Total Capacity</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">{Math.round((totalStudents / totalCapacity) * 100)}%</p>
              <p className="text-xs text-muted-foreground">Utilization</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> All Streams
              </CardTitle>
              <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Stream</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Stream</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2"><Label>Stream Name *</Label><Input value={newStream.name} onChange={e => setNewStream(p => ({ ...p, name: e.target.value }))} placeholder="e.g. South" /></div>
                    <div className="space-y-2"><Label>Class *</Label>
                      <Select value={newStream.class} onValueChange={v => setNewStream(p => ({ ...p, class: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{["Grade 6", "Grade 7", "Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={newStream.capacity} onChange={e => setNewStream(p => ({ ...p, capacity: e.target.value }))} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                    <Button onClick={() => { if (!newStream.name || !newStream.class) { toast.error("Fill required fields"); return; } toast.success("Stream added"); setShowAdd(false); }}>Add Stream</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Stream</TableHead>
                <TableHead className="font-semibold">Class Teacher</TableHead>
                <TableHead className="font-semibold">Students</TableHead>
                <TableHead className="font-semibold">Capacity</TableHead>
                <TableHead className="font-semibold">Utilization</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {streamsData.map(s => {
                  const pct = Math.round((s.students / s.capacity) * 100);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.class}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.classTeacher || <span className="text-muted-foreground italic">Not assigned</span>}</TableCell>
                      <TableCell><div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-muted-foreground" />{s.students}</div></TableCell>
                      <TableCell>{s.capacity}</TableCell>
                      <TableCell>
                        <Badge variant={pct >= 95 ? "destructive" : pct >= 80 ? "default" : "secondary"} className="text-[10px]">{pct}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Streams;
