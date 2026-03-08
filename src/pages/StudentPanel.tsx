import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Banknote, TrendingUp, CalendarCheck, CheckCircle2, Clock, AlertTriangle, FileText, Download } from "lucide-react";
import { students, studentFeeCollection, marksRegister, attendanceRecords, downloads, timetableEntries, notices } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const student = students[0];
const feeData = studentFeeCollection[0];
const marks = marksRegister.filter(m => m.admission_no === student.admission_no);
const myTimetable = timetableEntries.filter(t => t.class === student.grade && t.section === student.stream);
const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const StudentPanel = () => (
  <DashboardLayout title="Student Dashboard" subtitle={`${student.full_name} — ${student.grade} ${student.stream}`}>
    <div className="grid gap-4 sm:grid-cols-4 mb-6">
      <Card><CardContent className="p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div>
        <div><p className="text-xs text-muted-foreground">Class</p><p className="text-lg font-bold text-foreground">{student.grade} {student.stream}</p></div>
      </CardContent></Card>
      <Card><CardContent className="p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><TrendingUp className="h-5 w-5 text-success" /></div>
        <div><p className="text-xs text-muted-foreground">Last Exam</p><p className="text-lg font-bold text-foreground">{marks[0]?.percentage ?? "—"}%</p></div>
      </CardContent></Card>
      <Card><CardContent className="p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><CalendarCheck className="h-5 w-5 text-info" /></div>
        <div><p className="text-xs text-muted-foreground">Attendance</p><p className="text-lg font-bold text-foreground">94.2%</p></div>
      </CardContent></Card>
      <Card><CardContent className="p-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${feeData.balance > 0 ? "bg-destructive/10" : "bg-success/10"}`}>
          <Banknote className={`h-5 w-5 ${feeData.balance > 0 ? "text-destructive" : "text-success"}`} />
        </div>
        <div><p className="text-xs text-muted-foreground">Fee Balance</p><p className={`text-lg font-bold ${feeData.balance > 0 ? "text-destructive" : "text-success"}`}>{formatKES(feeData.balance)}</p></div>
      </CardContent></Card>
    </div>

    <Tabs defaultValue="timetable" className="space-y-4">
      <TabsList>
        <TabsTrigger value="timetable">Timetable</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
        <TabsTrigger value="downloads">Downloads</TabsTrigger>
        <TabsTrigger value="notices">Notices</TabsTrigger>
      </TabsList>

      <TabsContent value="timetable">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">My Timetable</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-20">Period</TableHead>
                {days.map(d => <TableHead key={d}>{d}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {[1,2,3,4,5,6,7,8].map(p => (
                  <TableRow key={p}>
                    <TableCell className="font-medium text-muted-foreground">P{p}</TableCell>
                    {days.map(d => {
                      const entry = myTimetable.find(t => t.day === d && t.period === p);
                      return <TableCell key={d} className="text-xs">{entry ? <div><p className="font-medium text-foreground">{entry.subject}</p><p className="text-muted-foreground">{entry.start}–{entry.end}</p></div> : <span className="text-muted-foreground/40">—</span>}</TableCell>;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="results">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">My Exam Results</CardTitle></CardHeader>
          <CardContent>
            {marks.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-primary/5 p-3 text-center"><p className="text-2xl font-bold text-primary">{marks[0].total}/600</p><p className="text-xs text-muted-foreground">Total</p></div>
                  <div className="rounded-lg bg-success/5 p-3 text-center"><p className="text-2xl font-bold text-success">{marks[0].grade}</p><p className="text-xs text-muted-foreground">Grade</p></div>
                  <div className="rounded-lg bg-info/5 p-3 text-center"><p className="text-2xl font-bold text-info">#{marks[0].rank}</p><p className="text-xs text-muted-foreground">Rank</p></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[{s:"Math",m:marks[0].math},{s:"English",m:marks[0].english},{s:"Kiswahili",m:marks[0].kiswahili},{s:"Science",m:marks[0].science},{s:"Social Studies",m:marks[0].social_studies},{s:"CRE",m:marks[0].cre}].map(x => (
                    <div key={x.s} className="flex justify-between items-center rounded-md border p-3">
                      <span className="text-sm text-muted-foreground">{x.s}</span>
                      <span className={`text-sm font-bold ${x.m >= 70 ? "text-success" : x.m >= 40 ? "text-foreground" : "text-destructive"}`}>{x.m}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-center text-sm text-muted-foreground py-8">No results yet.</p>}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="downloads">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Available Downloads</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {downloads.filter(d => d.audience === "All" || d.audience.includes(student.grade)).map(d => (
                <div key={d.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <div><p className="text-sm font-medium text-foreground">{d.title}</p><p className="text-xs text-muted-foreground">{d.category} · {d.size}</p></div>
                  </div>
                  <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notices" className="space-y-3">
        {notices.filter(n => n.audience === "All" || n.audience === "Students").map(n => (
          <Card key={n.id}><CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div><h4 className="text-sm font-semibold text-foreground">{n.title}</h4><p className="text-sm text-muted-foreground mt-1">{n.message}</p></div>
              <p className="text-xs text-muted-foreground ml-4">{n.date}</p>
            </div>
          </CardContent></Card>
        ))}
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default StudentPanel;
