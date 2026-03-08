import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { timetableEntries, classes, subjects } from "@/data/mockData";
import { Calendar, Plus, Wand2, Download, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = Array.from({ length: 8 }, (_, i) => i + 1);
const periodTimes = ["8:00-8:40", "8:40-9:20", "9:20-10:00", "10:20-11:00", "11:00-11:40", "11:40-12:20", "2:00-2:40", "2:40-3:20"];

const ClassTimetable = () => {
  const [selectedClass, setSelectedClass] = useState("Grade 8");
  const [selectedSection, setSelectedSection] = useState("East");
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState({ day: "", period: "", subject: "", teacher: "" });

  const filtered = timetableEntries.filter(t => t.class === selectedClass && t.section === selectedSection);

  const getEntry = (day: string, period: number) => filtered.find(t => t.day === day && t.period === period);

  const handleAutoGenerate = () => {
    toast.success("Timetable auto-generated for " + selectedClass + " " + selectedSection);
  };

  const handleAddEntry = () => {
    if (!addData.day || !addData.period || !addData.subject) {
      toast.error("Fill all required fields");
      return;
    }
    toast.success("Period added successfully");
    setShowAdd(false);
    setAddData({ day: "", period: "", subject: "", teacher: "" });
  };

  return (
    <DashboardLayout title="Class Timetable" subtitle="View and manage class timetables">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Class Timetable
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Grade 6", "Grade 7", "Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{["East", "West", "North"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Dialog open={showAdd} onOpenChange={setShowAdd}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Period</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Timetable Entry</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                      <div className="space-y-2"><Label>Day *</Label>
                        <Select value={addData.day} onValueChange={v => setAddData(p => ({ ...p, day: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                          <SelectContent>{days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Period *</Label>
                        <Select value={addData.period} onValueChange={v => setAddData(p => ({ ...p, period: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                          <SelectContent>{periods.map(p => <SelectItem key={p} value={String(p)}>Period {p} ({periodTimes[p - 1]})</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Subject *</Label>
                        <Select value={addData.subject} onValueChange={v => setAddData(p => ({ ...p, subject: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Teacher</Label><Input value={addData.teacher} onChange={e => setAddData(p => ({ ...p, teacher: e.target.value }))} placeholder="Teacher name" /></div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                      <Button onClick={handleAddEntry}>Add Entry</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="secondary" onClick={handleAutoGenerate}><Wand2 className="h-4 w-4 mr-1.5" />Auto Generate</Button>
                <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold w-24">Period</TableHead>
                  <TableHead className="font-semibold text-[11px] text-muted-foreground">Time</TableHead>
                  {days.map(d => <TableHead key={d} className="font-semibold text-center">{d}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map(p => (
                  <TableRow key={p} className={p === 4 ? "border-t-2 border-dashed border-primary/20" : ""}>
                    <TableCell className="font-medium">Period {p}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{periodTimes[p - 1]}</TableCell>
                    {days.map(d => {
                      const entry = getEntry(d, p);
                      return (
                        <TableCell key={d} className="text-center p-1.5">
                          {entry ? (
                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 group relative">
                              <p className="text-xs font-semibold text-primary">{entry.subject}</p>
                              <p className="text-[10px] text-muted-foreground">{entry.teacher}</p>
                              <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                                <button className="p-0.5 rounded hover:bg-muted"><Edit className="h-2.5 w-2.5 text-muted-foreground" /></button>
                                <button className="p-0.5 rounded hover:bg-destructive/10"><Trash2 className="h-2.5 w-2.5 text-destructive" /></button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground/50 py-3">—</div>
                          )}
                        </TableCell>
                      );
                    })}
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

export default ClassTimetable;
