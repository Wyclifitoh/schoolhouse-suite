import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { exams, examSchedules, marksRegister, gradingSystem, classes } from "@/data/mockData";
import {
  ClipboardCheck, Plus, Calendar, Award, BookOpen, FileText, Download,
  TrendingUp, Users, BarChart3, Medal,
} from "lucide-react";

const Examinations = () => {
  const [selectedExam, setSelectedExam] = useState(exams[0]);

  return (
    <DashboardLayout title="Examinations" subtitle="Exam management, scheduling, marks entry & progress reports">
      <Tabs defaultValue="exams" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="exams" className="gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" />Exams</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="marks" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Marks Register</TabsTrigger>
          <TabsTrigger value="grades" className="gap-1.5"><Award className="h-3.5 w-3.5" />Grading System</TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Progress Report</TabsTrigger>
        </TabsList>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><ClipboardCheck className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total Exams</p><p className="text-2xl font-bold text-foreground">{exams.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><ClipboardCheck className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold text-foreground">{exams.filter(e => e.status === "completed").length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><Calendar className="h-5 w-5 text-info" /></div>
              <div><p className="text-sm text-muted-foreground">Upcoming</p><p className="text-2xl font-bold text-foreground">{exams.filter(e => e.status === "upcoming").length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><TrendingUp className="h-5 w-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">Avg. Pass Rate</p><p className="text-2xl font-bold text-foreground">82%</p></div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Examination List</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Create Exam</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Create Examination</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Exam Name</Label><Input placeholder="e.g. Mid-Term 1 Examination" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Exam Type</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="cat">CAT</SelectItem><SelectItem value="mid_term">Mid-Term</SelectItem><SelectItem value="end_term">End-Term</SelectItem><SelectItem value="mock">Mock</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>Term</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="t1_2024">Term 1 2024</SelectItem><SelectItem value="t2_2024">Term 2 2024</SelectItem><SelectItem value="t3_2024">Term 3 2024</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Start Date</Label><Input type="date" /></div>
                        <div className="space-y-2"><Label>End Date</Label><Input type="date" /></div>
                      </div>
                      <div className="space-y-2"><Label>Classes</Label>
                        <div className="grid grid-cols-3 gap-2">{classes.map(c => (
                          <label key={c.id} className="flex items-center gap-2 text-sm p-2 rounded border cursor-pointer hover:bg-muted/50">
                            <input type="checkbox" className="rounded" />{c.name}
                          </label>
                        ))}</div>
                      </div>
                      <Button className="w-full mt-2">Create Examination</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Exam Name</TableHead><TableHead className="font-semibold">Type</TableHead><TableHead className="font-semibold">Term</TableHead>
                <TableHead className="font-semibold">Date Range</TableHead><TableHead className="font-semibold">Classes</TableHead><TableHead className="font-semibold">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>{exams.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{e.type.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{e.term}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{e.start_date} → {e.end_date}</TableCell>
                  <TableCell><div className="flex gap-1 flex-wrap">{e.classes.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}</div></TableCell>
                  <TableCell><Badge className={
                    e.status === "completed" ? "bg-success/10 text-success border-0" :
                    e.status === "upcoming" ? "bg-info/10 text-info border-0" :
                    "bg-warning/10 text-warning border-0"
                  }>{e.status}</Badge></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Exam Schedule</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedExam.id} onValueChange={v => setSelectedExam(exams.find(e => e.id === v) || exams[0])}>
                    <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Schedule</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Add Exam Schedule</DialogTitle></DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Subject</Label>
                            <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{["Mathematics","English","Kiswahili","Science","Social Studies","CRE"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                          </div>
                          <div className="space-y-2"><Label>Date</Label><Input type="date" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Start Time</Label><Input type="time" /></div>
                          <div className="space-y-2"><Label>End Time</Label><Input type="time" /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2"><Label>Room</Label><Input placeholder="Exam Hall 1" /></div>
                          <div className="space-y-2"><Label>Full Marks</Label><Input type="number" defaultValue="100" /></div>
                          <div className="space-y-2"><Label>Pass Marks</Label><Input type="number" defaultValue="40" /></div>
                        </div>
                        <Button className="w-full mt-2">Add to Schedule</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Time</TableHead><TableHead className="font-semibold">Room</TableHead>
                <TableHead className="font-semibold">Full Marks</TableHead><TableHead className="font-semibold">Pass Marks</TableHead>
              </TableRow></TableHeader>
              <TableBody>{examSchedules.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.subject}</TableCell>
                  <TableCell className="text-muted-foreground">{s.date}</TableCell>
                  <TableCell className="text-muted-foreground">{s.start_time} - {s.end_time}</TableCell>
                  <TableCell><Badge variant="secondary">{s.room}</Badge></TableCell>
                  <TableCell className="font-semibold">{s.full_marks}</TableCell>
                  <TableCell className="text-muted-foreground">{s.pass_marks}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marks Register */}
        <TabsContent value="marks" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Marks Register - Mid-Term 1 (Grade 8 East)</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Enter Marks</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Rank</TableHead><TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead>
                  <TableHead className="font-semibold text-center">Math</TableHead><TableHead className="font-semibold text-center">Eng</TableHead>
                  <TableHead className="font-semibold text-center">Kis</TableHead><TableHead className="font-semibold text-center">Sci</TableHead>
                  <TableHead className="font-semibold text-center">SST</TableHead><TableHead className="font-semibold text-center">CRE</TableHead>
                  <TableHead className="font-semibold text-center">Total</TableHead><TableHead className="font-semibold text-center">%</TableHead>
                  <TableHead className="font-semibold text-center">Grade</TableHead>
                </TableRow></TableHeader>
                <TableBody>{marksRegister.sort((a, b) => a.rank - b.rank).map(m => (
                  <TableRow key={m.id}>
                    <TableCell><div className="flex items-center gap-1">
                      {m.rank <= 3 && <Medal className={`h-4 w-4 ${m.rank === 1 ? "text-yellow-500" : m.rank === 2 ? "text-gray-400" : "text-orange-400"}`} />}
                      <span className="font-semibold">{m.rank}</span>
                    </div></TableCell>
                    <TableCell className="font-medium">{m.student}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{m.admission_no}</TableCell>
                    {[m.math, m.english, m.kiswahili, m.science, m.social_studies, m.cre].map((mark, i) => (
                      <TableCell key={i} className={`text-center font-medium ${mark < 40 ? "text-destructive" : mark >= 80 ? "text-success" : ""}`}>{mark}</TableCell>
                    ))}
                    <TableCell className="text-center font-bold">{m.total}/600</TableCell>
                    <TableCell className="text-center font-semibold">{m.percentage}%</TableCell>
                    <TableCell className="text-center"><Badge className={
                      m.grade.startsWith("A") ? "bg-success/10 text-success border-0" :
                      m.grade.startsWith("B") ? "bg-info/10 text-info border-0" :
                      m.grade.startsWith("C") ? "bg-warning/10 text-warning border-0" :
                      "bg-destructive/10 text-destructive border-0"
                    }>{m.grade}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grading System */}
        <TabsContent value="grades" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-base font-semibold">Kenyan Grading System (8-4-4 / CBC)</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Standard grading scale used for KCPE & CBC assessments</p></div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Grade</TableHead><TableHead className="font-semibold">Min Marks</TableHead><TableHead className="font-semibold">Max Marks</TableHead>
                <TableHead className="font-semibold">Points</TableHead><TableHead className="font-semibold">Remark</TableHead>
              </TableRow></TableHeader>
              <TableBody>{gradingSystem.map(g => (
                <TableRow key={g.grade}>
                  <TableCell><Badge className={
                    g.grade.startsWith("A") ? "bg-success/10 text-success border-0" :
                    g.grade.startsWith("B") ? "bg-info/10 text-info border-0" :
                    g.grade.startsWith("C") ? "bg-warning/10 text-warning border-0" :
                    "bg-destructive/10 text-destructive border-0"
                  }>{g.grade}</Badge></TableCell>
                  <TableCell className="font-semibold">{g.min}</TableCell>
                  <TableCell className="font-semibold">{g.max}</TableCell>
                  <TableCell className="font-semibold">{g.points}</TableCell>
                  <TableCell className="text-muted-foreground">{g.remark}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Report */}
        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Student Progress Report</CardTitle>
                <div className="flex gap-2">
                  <Select><SelectTrigger className="w-44 h-9"><SelectValue placeholder="Select Student" /></SelectTrigger>
                    <SelectContent>{marksRegister.map(m => <SelectItem key={m.id} value={m.id}>{m.student}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Print Report</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Sample Progress Report Card */}
              <div className="border rounded-lg p-6 space-y-6 max-w-2xl mx-auto">
                <div className="text-center space-y-1 border-b pb-4">
                  <h2 className="text-lg font-bold text-foreground">CHUO ACADEMY</h2>
                  <p className="text-sm text-muted-foreground">P.O. Box 12345, Nairobi | Tel: 020-1234567</p>
                  <p className="text-sm font-semibold text-primary mt-2">STUDENT PROGRESS REPORT</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Student: </span><span className="font-medium">Catherine Muthoni</span></div>
                  <div><span className="text-muted-foreground">Adm No: </span><span className="font-medium font-mono">ADM-2024-003</span></div>
                  <div><span className="text-muted-foreground">Class: </span><span className="font-medium">Grade 8 East</span></div>
                  <div><span className="text-muted-foreground">Exam: </span><span className="font-medium">Mid-Term 1 2024</span></div>
                </div>
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold text-center">Marks</TableHead>
                    <TableHead className="font-semibold text-center">Grade</TableHead><TableHead className="font-semibold">Remark</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {[
                      { subject: "Mathematics", marks: 92, grade: "A", remark: "Excellent" },
                      { subject: "English", marks: 88, grade: "A", remark: "Excellent" },
                      { subject: "Kiswahili", marks: 85, grade: "A", remark: "Excellent" },
                      { subject: "Science", marks: 90, grade: "A", remark: "Excellent" },
                      { subject: "Social Studies", marks: 82, grade: "A", remark: "Excellent" },
                      { subject: "CRE", marks: 88, grade: "A", remark: "Excellent" },
                    ].map(s => (
                      <TableRow key={s.subject}>
                        <TableCell className="font-medium">{s.subject}</TableCell>
                        <TableCell className="text-center font-semibold">{s.marks}</TableCell>
                        <TableCell className="text-center"><Badge className="bg-success/10 text-success border-0">{s.grade}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{s.remark}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell>TOTAL</TableCell><TableCell className="text-center">525/600</TableCell>
                      <TableCell className="text-center"><Badge className="bg-success/10 text-success border-0">A</Badge></TableCell>
                      <TableCell>Rank: 1st out of 45</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                  <div><span className="text-muted-foreground">Mean Grade: </span><span className="font-bold text-success">A (87.5%)</span></div>
                  <div><span className="text-muted-foreground">Position: </span><span className="font-bold">1 / 45</span></div>
                </div>
                <div className="text-sm border-t pt-4 space-y-2">
                  <div><span className="text-muted-foreground">Class Teacher's Remark: </span><span className="italic">Outstanding performance. Keep it up!</span></div>
                  <div><span className="text-muted-foreground">Principal's Remark: </span><span className="italic">Excellent work. A role model student.</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Examinations;
