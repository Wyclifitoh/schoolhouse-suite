import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, BookOpen, ClipboardCheck, FileText } from "lucide-react";

const homeworkData = [
  { id: "hw1", title: "Algebra Equations", subject: "Mathematics", class: "Grade 8 East", assigned: "2024-03-10", due: "2024-03-14", teacher: "Mr. Kamau", total: 45, submitted: 40, evaluated: 38, status: "completed" },
  { id: "hw2", title: "Essay Writing", subject: "English", class: "Grade 8 East", assigned: "2024-03-11", due: "2024-03-15", teacher: "Mrs. Otieno", total: 45, submitted: 42, evaluated: 42, status: "completed" },
  { id: "hw3", title: "Insha ya Mdahalo", subject: "Kiswahili", class: "Grade 7 West", assigned: "2024-03-12", due: "2024-03-16", teacher: "Mr. Hassan", total: 42, submitted: 35, evaluated: 30, status: "in_progress" },
  { id: "hw4", title: "Photosynthesis Lab Report", subject: "Science", class: "Grade 8 East", assigned: "2024-03-13", due: "2024-03-18", teacher: "Dr. Mwangi", total: 45, submitted: 20, evaluated: 0, status: "pending" },
  { id: "hw5", title: "Map Reading Exercise", subject: "Social Studies", class: "Grade 7 West", assigned: "2024-03-14", due: "2024-03-19", teacher: "Ms. Wambui", total: 42, submitted: 10, evaluated: 0, status: "pending" },
  { id: "hw6", title: "Bible Stories", subject: "CRE", class: "Grade 6 North", assigned: "2024-03-14", due: "2024-03-17", teacher: "Rev. Omondi", total: 38, submitted: 38, evaluated: 38, status: "completed" },
];

const evaluationData = [
  { id: "ev1", homework: "Algebra Equations", student: "Amina Wanjiku", class: "Grade 8 East", submitted: "2024-03-13", marks: 85, max: 100, grade: "A-", remarks: "Excellent work" },
  { id: "ev2", homework: "Algebra Equations", student: "Catherine Muthoni", class: "Grade 8 East", submitted: "2024-03-13", marks: 92, max: 100, grade: "A", remarks: "Outstanding" },
  { id: "ev3", homework: "Algebra Equations", student: "Francis Mutua", class: "Grade 8 East", submitted: "2024-03-14", marks: 68, max: 100, grade: "B", remarks: "Good effort" },
  { id: "ev4", homework: "Essay Writing", student: "Amina Wanjiku", class: "Grade 8 East", submitted: "2024-03-14", marks: 78, max: 100, grade: "A-", remarks: "Well structured" },
  { id: "ev5", homework: "Essay Writing", student: "Kevin Otieno", class: "Grade 8 East", submitted: "2024-03-14", marks: 72, max: 100, grade: "B+", remarks: "Good language" },
  { id: "ev6", homework: "Bible Stories", student: "Grace Njeri", class: "Grade 6 North", submitted: "2024-03-16", marks: 90, max: 100, grade: "A", remarks: "Very creative" },
];

const dailyAssignments = [
  { id: "da1", date: "2024-03-15", subject: "Mathematics", class: "Grade 8 East", title: "Practice Problems pg. 45", teacher: "Mr. Kamau" },
  { id: "da2", date: "2024-03-15", subject: "English", class: "Grade 8 East", title: "Comprehension Exercise 12", teacher: "Mrs. Otieno" },
  { id: "da3", date: "2024-03-15", subject: "Kiswahili", class: "Grade 7 West", title: "Ufahamu uk. 78", teacher: "Mr. Hassan" },
  { id: "da4", date: "2024-03-14", subject: "Science", class: "Grade 8 East", title: "Experiment Report - Acids", teacher: "Dr. Mwangi" },
  { id: "da5", date: "2024-03-14", subject: "Social Studies", class: "Grade 7 West", title: "County Government Questions", teacher: "Ms. Wambui" },
  { id: "da6", date: "2024-03-14", subject: "Mathematics", class: "Grade 6 North", title: "Fractions Worksheet", teacher: "Mrs. Njuguna" },
  { id: "da7", date: "2024-03-13", subject: "English", class: "Grade 7 West", title: "Letter Writing", teacher: "Mrs. Otieno" },
  { id: "da8", date: "2024-03-13", subject: "CRE", class: "Grade 8 East", title: "Parables Summary", teacher: "Rev. Omondi" },
];

const statusColor: Record<string, string> = {
  completed: "bg-success/10 text-success border-0",
  in_progress: "bg-info/10 text-info border-0",
  pending: "bg-warning/10 text-warning border-0",
};

const HomeworkReports = () => (
  <DashboardLayout title="Homework Reports" subtitle="Homework assignment and evaluation reports">
    <Tabs defaultValue="homework" className="space-y-6">
      <TabsList className="bg-muted/50 p-1">
        <TabsTrigger value="homework">Homework Report</TabsTrigger>
        <TabsTrigger value="evaluation">Evaluation Report</TabsTrigger>
        <TabsTrigger value="daily">Daily Assignment</TabsTrigger>
      </TabsList>

      {/* HOMEWORK REPORT */}
      <TabsContent value="homework" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Homework Report</CardTitle>
              <div className="flex items-center gap-2">
                <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Assigned</p><p className="text-xl font-bold text-primary">{homeworkData.length}</p></div>
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-bold text-success">{homeworkData.filter(h => h.status === "completed").length}</p></div>
              <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Submission Rate</p><p className="text-xl font-bold text-info">{((homeworkData.reduce((s, h) => s + h.submitted, 0) / homeworkData.reduce((s, h) => s + h.total, 0)) * 100).toFixed(0)}%</p></div>
              <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Pending Evaluation</p><p className="text-xl font-bold text-warning">{homeworkData.filter(h => h.evaluated < h.submitted).length}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Subject</TableHead>
              <TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold text-center">Submitted</TableHead>
              <TableHead className="font-semibold text-center">Evaluated</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{homeworkData.map(h => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{h.title}</TableCell>
                <TableCell><Badge variant="secondary">{h.subject}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{h.class}</TableCell>
                <TableCell className="text-muted-foreground">{h.due}</TableCell>
                <TableCell className="text-center font-semibold">{h.submitted}/{h.total}</TableCell>
                <TableCell className="text-center font-semibold">{h.evaluated}/{h.submitted}</TableCell>
                <TableCell><Badge className={statusColor[h.status]}>{h.status.replace("_", " ")}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* EVALUATION REPORT */}
      <TabsContent value="evaluation" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" />Homework Evaluation Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Homework</TableHead>
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold">Submitted</TableHead>
              <TableHead className="font-semibold text-center">Marks</TableHead>
              <TableHead className="font-semibold text-center">Grade</TableHead>
              <TableHead className="font-semibold">Remarks</TableHead>
            </TableRow></TableHeader>
            <TableBody>{evaluationData.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.homework}</TableCell>
                <TableCell>{e.student}</TableCell>
                <TableCell className="text-muted-foreground">{e.class}</TableCell>
                <TableCell className="text-muted-foreground">{e.submitted}</TableCell>
                <TableCell className="text-center font-bold">{e.marks}/{e.max}</TableCell>
                <TableCell className="text-center"><Badge className={e.marks >= 75 ? "bg-success/10 text-success border-0" : e.marks >= 50 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>{e.grade}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{e.remarks}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* DAILY ASSIGNMENT */}
      <TabsContent value="daily" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Daily Assignment Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Subject</TableHead>
              <TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold">Assignment</TableHead>
              <TableHead className="font-semibold">Teacher</TableHead>
            </TableRow></TableHeader>
            <TableBody>{dailyAssignments.map(d => (
              <TableRow key={d.id}>
                <TableCell className="text-muted-foreground">{d.date}</TableCell>
                <TableCell><Badge variant="secondary">{d.subject}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{d.class}</TableCell>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell className="text-muted-foreground">{d.teacher}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default HomeworkReports;
