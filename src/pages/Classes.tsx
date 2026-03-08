import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { classes, subjects, subjectAssignments, timetableEntries } from "@/data/mockData";
import {
  School, Plus, BookOpen, Users, Clock, Wand2, Calendar,
} from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const Classes = () => {
  const [timetableClass, setTimetableClass] = useState("Grade 8");
  const [timetableSection, setTimetableSection] = useState("East");

  const filteredTimetable = timetableEntries.filter(t => t.class === timetableClass && t.section === timetableSection);
  const periods = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <DashboardLayout title="Classes & Timetable" subtitle="Manage classes, sections, subjects, and timetable">
      <Tabs defaultValue="classes" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="classes" className="gap-1.5"><School className="h-3.5 w-3.5" />Classes & Sections</TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Subjects</TabsTrigger>
          <TabsTrigger value="assign" className="gap-1.5"><Users className="h-3.5 w-3.5" />Assign Subjects</TabsTrigger>
          <TabsTrigger value="timetable" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Timetable</TabsTrigger>
        </TabsList>

        {/* Classes & Sections */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Classes & Sections</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Class</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Class Name</Label><Input placeholder="e.g. Grade 9" /></div>
                        <div className="space-y-2"><Label>Alias</Label><Input placeholder="e.g. Class 9" /></div>
                      </div>
                      <div className="space-y-2"><Label>Sections (comma-separated)</Label><Input placeholder="e.g. A, B, C" /></div>
                      <div className="space-y-2"><Label>Curriculum</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="cbc">CBC</SelectItem><SelectItem value="844">8-4-4</SelectItem></SelectContent></Select>
                      </div>
                      <Button className="w-full mt-2">Add Class</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {classes.map(c => (
                  <Card key={c.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-foreground">{c.name}</h3>
                        <Badge variant="secondary" className="text-xs">{c.curriculum}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{c.alias}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">{c.sections.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="h-3.5 w-3.5" />{c.students}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects */}
        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Subjects</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Subject</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Subject Name</Label><Input placeholder="e.g. Mathematics" /></div>
                        <div className="space-y-2"><Label>Subject Code</Label><Input placeholder="e.g. MATH" /></div>
                      </div>
                      <div className="space-y-2"><Label>Type</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="theory">Theory</SelectItem><SelectItem value="practical">Practical</SelectItem></SelectContent></Select>
                      </div>
                      <Button className="w-full mt-2">Add Subject</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold">Code</TableHead><TableHead className="font-semibold">Type</TableHead><TableHead className="font-semibold">Classes</TableHead>
              </TableRow></TableHeader>
              <TableBody>{subjects.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="font-mono">{s.code}</Badge></TableCell>
                  <TableCell><Badge className={s.type === "theory" ? "bg-primary/10 text-primary border-0" : "bg-warning/10 text-warning border-0"}>{s.type}</Badge></TableCell>
                  <TableCell><div className="flex gap-1 flex-wrap">{s.classes.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}</div></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assign Subjects */}
        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Subject-Teacher Assignments</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Assign Subject</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Assign Subject to Teacher</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Subject</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div className="space-y-2"><Label>Teacher</Label><Input placeholder="Teacher name" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Class</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>Section</Label><Input placeholder="e.g. East" /></div>
                      </div>
                      <Button className="w-full mt-2">Assign</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold">Teacher</TableHead><TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Section</TableHead>
              </TableRow></TableHeader>
              <TableBody>{subjectAssignments.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.subject}</TableCell>
                  <TableCell>{a.teacher}</TableCell>
                  <TableCell><Badge variant="secondary">{a.class}</Badge></TableCell>
                  <TableCell>{a.section}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timetable */}
        <TabsContent value="timetable" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Class Timetable</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={timetableClass} onValueChange={setTimetableClass}>
                    <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={timetableSection} onValueChange={setTimetableSection}>
                    <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{["East","West","North","South","A","B","C"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="sm" variant="outline"><Wand2 className="h-4 w-4 mr-1.5" />Auto Generate</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1 min-w-[800px]">
                  {/* Header */}
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Period</div>
                  {days.map(d => <div key={d} className="p-2 text-xs font-semibold text-center bg-muted/50 rounded">{d}</div>)}

                  {/* Periods */}
                  {periods.map(p => (
                    <>
                      <div key={`p-${p}`} className="p-2 flex items-center">
                        <div>
                          <p className="text-xs font-semibold text-foreground">P{p}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {p <= 3 ? `${7 + p}:00` : p === 4 ? "10:20" : `${p + 6}:00`}
                          </p>
                        </div>
                      </div>
                      {days.map(day => {
                        const entry = filteredTimetable.find(t => t.day === day && t.period === p);
                        return (
                          <div key={`${day}-${p}`} className={`p-2 rounded border text-center min-h-[60px] flex flex-col items-center justify-center ${
                            entry ? "bg-primary/5 border-primary/20" : "border-dashed border-muted-foreground/20"
                          }`}>
                            {entry ? (
                              <>
                                <p className="text-xs font-semibold text-foreground">{entry.subject}</p>
                                <p className="text-[10px] text-muted-foreground">{entry.teacher}</p>
                                <p className="text-[10px] text-primary">{entry.room}</p>
                              </>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">—</p>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Classes;
