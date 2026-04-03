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
const students: any[] = []; const classes: any[] = []; const parents: any[] = [];
const subjects: any[] = []; const subjectAssignments: any[] = [];
import { Download, Users, GraduationCap, UserCheck, BookOpen, History, Key, Link2, User } from "lucide-react";

const StudentReports = () => {
  const maleCount = students.filter(s => s.gender === "Male").length;
  const femaleCount = students.filter(s => s.gender === "Female").length;
  const activeCount = students.filter(s => s.status === "active").length;

  const guardians = [
    { id: "g1", name: "Mary Wanjiku", phone: "0712345678", email: "mary@email.com", occupation: "Teacher", children: ["Amina Wanjiku", "Joy Wanjiku"], relation: "Mother" },
    { id: "g2", name: "John Ochieng", phone: "0723456789", email: "john@email.com", occupation: "Engineer", children: ["Brian Ochieng"], relation: "Father" },
    { id: "g3", name: "Peter Muthoni", phone: "0734567890", email: "peter@email.com", occupation: "Farmer", children: ["Catherine Muthoni"], relation: "Father" },
    { id: "g4", name: "James Kipchoge", phone: "0745678901", email: "james@email.com", occupation: "Athlete", children: ["David Kipchoge"], relation: "Father" },
    { id: "g5", name: "Rose Akinyi", phone: "0756789012", email: "rose@email.com", occupation: "Nurse", children: ["Esther Akinyi"], relation: "Mother" },
    { id: "g6", name: "Agnes Mutua", phone: "0767890123", email: "agnes@email.com", occupation: "Business", children: ["Francis Mutua"], relation: "Mother" },
    { id: "g7", name: "Fatuma Mohamed", phone: "0789012345", email: "fatuma@email.com", occupation: "Doctor", children: ["Hassan Mohamed"], relation: "Mother" },
    { id: "g8", name: "Sarah Otieno", phone: "0790123456", email: "sarah@email.com", occupation: "Accountant", children: ["Kevin Otieno"], relation: "Mother" },
  ];

  const studentHistory = [
    { id: "sh1", student: "Amina Wanjiku", admNo: "ADM-2024-001", event: "Enrolled", date: "2024-01-15", from: "Sunrise Academy", to: "Grade 8 East", remarks: "Transfer from Kiambu" },
    { id: "sh2", student: "Brian Ochieng", admNo: "ADM-2024-002", event: "Promoted", date: "2024-01-10", from: "Grade 6 West", to: "Grade 7 West", remarks: "Passed with 78%" },
    { id: "sh3", student: "Catherine Muthoni", admNo: "ADM-2024-003", event: "Enrolled", date: "2024-02-01", from: "Green Hills Primary", to: "Grade 8 East", remarks: "Mid-term admission" },
    { id: "sh4", student: "David Kipchoge", admNo: "ADM-2024-004", event: "Promoted", date: "2024-01-10", from: "Grade 5 North", to: "Grade 6 North", remarks: "Sports scholarship" },
    { id: "sh5", student: "Esther Akinyi", admNo: "ADM-2024-005", event: "Deactivated", date: "2024-03-01", from: "Grade 7 West", to: "—", remarks: "Fee default" },
  ];

  const siblings = students.filter(s => s.siblings && s.siblings.length > 0);

  return (
    <DashboardLayout title="Student Reports" subtitle="Comprehensive student information reports">
      <Tabs defaultValue="student" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="student">Student Report</TabsTrigger>
          <TabsTrigger value="class">Class & Stream</TabsTrigger>
          <TabsTrigger value="guardian">Guardian Report</TabsTrigger>
          <TabsTrigger value="history">Student History</TabsTrigger>
          <TabsTrigger value="class-subject">Class Subject</TabsTrigger>
          <TabsTrigger value="admission">Admission Report</TabsTrigger>
          <TabsTrigger value="sibling">Sibling Report</TabsTrigger>
          <TabsTrigger value="profile">Student Profile</TabsTrigger>
          <TabsTrigger value="gender">Gender Ratio</TabsTrigger>
          <TabsTrigger value="teacher-ratio">Teacher Ratio</TabsTrigger>
          <TabsTrigger value="credentials">Login Credentials</TabsTrigger>
        </TabsList>

        {/* STUDENT REPORT */}
        <TabsContent value="student" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Student Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>{["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{students.length}</p></div>
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Male</p><p className="text-xl font-bold">{maleCount}</p></div>
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Female</p><p className="text-xl font-bold">{femaleCount}</p></div>
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold">{activeCount}</p></div>
              </div>
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Gender</TableHead><TableHead className="font-semibold">DOB</TableHead><TableHead className="font-semibold">Category</TableHead><TableHead className="font-semibold">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>{students.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                  <TableCell>{s.grade} {s.stream}</TableCell>
                  <TableCell>{s.gender}</TableCell>
                  <TableCell className="text-muted-foreground">{s.dob}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{s.category}</Badge></TableCell>
                  <TableCell><Badge className={s.status === "active" ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{s.status}</Badge></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLASS & STREAM */}
        <TabsContent value="class" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" />Class & Stream Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Classes</p><p className="text-xl font-bold text-primary">{classes.length}</p></div>
                <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Total Sections</p><p className="text-xl font-bold text-info">{classes.reduce((s, c) => s + c.sections.length, 0)}</p></div>
                <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Total Students</p><p className="text-xl font-bold text-success">{classes.reduce((s, c) => s + c.students, 0)}</p></div>
              </div>
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Sections</TableHead><TableHead className="font-semibold">Students</TableHead>
                <TableHead className="font-semibold">Curriculum</TableHead><TableHead className="font-semibold">Avg/Section</TableHead>
              </TableRow></TableHeader>
              <TableBody>{classes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.sections.map(s => <Badge key={s} variant="secondary" className="mr-1">{s}</Badge>)}</TableCell>
                  <TableCell className="font-semibold">{c.students}</TableCell>
                  <TableCell><Badge className={c.curriculum === "CBC" ? "bg-primary/10 text-primary border-0" : "bg-info/10 text-info border-0"}>{c.curriculum}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{Math.round(c.students / c.sections.length)}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GUARDIAN REPORT */}
        <TabsContent value="guardian" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Guardian Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Guardian Name</TableHead><TableHead className="font-semibold">Relation</TableHead><TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Email</TableHead><TableHead className="font-semibold">Occupation</TableHead><TableHead className="font-semibold">Children</TableHead>
              </TableRow></TableHeader>
              <TableBody>{guardians.map(g => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>{g.relation}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{g.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{g.email}</TableCell>
                  <TableCell>{g.occupation}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{g.children.map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}</div></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STUDENT HISTORY */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><History className="h-4 w-4 text-primary" />Student History</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Event</TableHead>
                <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">From</TableHead><TableHead className="font-semibold">To</TableHead><TableHead className="font-semibold">Remarks</TableHead>
              </TableRow></TableHeader>
              <TableBody>{studentHistory.map(h => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.student}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{h.admNo}</TableCell>
                  <TableCell><Badge className={
                    h.event === "Enrolled" ? "bg-primary/10 text-primary border-0" :
                    h.event === "Promoted" ? "bg-success/10 text-success border-0" :
                    "bg-destructive/10 text-destructive border-0"
                  }>{h.event}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{h.date}</TableCell>
                  <TableCell>{h.from}</TableCell>
                  <TableCell>{h.to}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{h.remarks}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLASS SUBJECT REPORT */}
        <TabsContent value="class-subject" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Class Subject Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold">Code</TableHead><TableHead className="font-semibold">Teacher</TableHead>
                <TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Section</TableHead>
              </TableRow></TableHeader>
              <TableBody>{subjectAssignments.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.subject}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{subjects.find(s => s.name === a.subject)?.code || "—"}</Badge></TableCell>
                  <TableCell>{a.teacher}</TableCell>
                  <TableCell>{a.class}</TableCell>
                  <TableCell>{a.section}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADMISSION REPORT */}
        <TabsContent value="admission" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary" />Admission Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select><SelectTrigger className="w-32 h-9"><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent><SelectItem value="2024">2024</SelectItem><SelectItem value="2023">2023</SelectItem></SelectContent></Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">New Admissions</p><p className="text-xl font-bold text-primary">{students.filter(s => s.joined.startsWith("2024")).length}</p></div>
                <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-success">{activeCount}</p></div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Inactive</p><p className="text-xl font-bold text-destructive">{students.filter(s => s.status === "inactive").length}</p></div>
                <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">With Transfer</p><p className="text-xl font-bold text-info">{students.filter(s => s.previous_school).length}</p></div>
              </div>
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Join Date</TableHead>
                <TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Previous School</TableHead><TableHead className="font-semibold">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>{[...students].sort((a, b) => b.joined.localeCompare(a.joined)).map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                  <TableCell className="text-muted-foreground">{s.joined}</TableCell>
                  <TableCell>{s.grade} {s.stream}</TableCell>
                  <TableCell className="text-muted-foreground">{s.previous_school || "—"}</TableCell>
                  <TableCell><Badge className={s.status === "active" ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{s.status}</Badge></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SIBLING REPORT */}
        <TabsContent value="sibling" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" />Sibling Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Parent</TableHead><TableHead className="font-semibold">Siblings</TableHead>
              </TableRow></TableHeader>
              <TableBody>{siblings.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                  <TableCell>{s.grade} {s.stream}</TableCell>
                  <TableCell>{s.parent_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.siblings.map(sid => {
                        const sib = students.find(st => st.id === sid);
                        return sib ? <Badge key={sid} variant="secondary" className="text-[10px]">{sib.full_name}</Badge> : null;
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STUDENT PROFILE */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" />Student Profile Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">DOB</TableHead>
                <TableHead className="font-semibold">Blood</TableHead><TableHead className="font-semibold">Religion</TableHead><TableHead className="font-semibold">Nationality</TableHead>
                <TableHead className="font-semibold">NEMIS</TableHead><TableHead className="font-semibold">Category</TableHead>
              </TableRow></TableHeader>
              <TableBody>{students.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                  <TableCell className="text-muted-foreground">{s.dob}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{s.blood_group}</Badge></TableCell>
                  <TableCell>{s.religion}</TableCell>
                  <TableCell>{s.nationality}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.nemis_no}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{s.category}</Badge></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GENDER RATIO */}
        <TabsContent value="gender" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Gender Ratio Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Male</p><p className="text-xl font-bold text-primary">{maleCount} ({((maleCount / students.length) * 100).toFixed(1)}%)</p></div>
                <div className="p-3 rounded-lg bg-pink-500/10 text-center"><p className="text-xs text-muted-foreground">Female</p><p className="text-xl font-bold text-pink-600">{femaleCount} ({((femaleCount / students.length) * 100).toFixed(1)}%)</p></div>
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Ratio (M:F)</p><p className="text-xl font-bold">{maleCount}:{femaleCount}</p></div>
              </div>
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold text-center">Male</TableHead><TableHead className="font-semibold text-center">Female</TableHead>
                <TableHead className="font-semibold text-center">Total</TableHead><TableHead className="font-semibold text-center">Ratio</TableHead>
              </TableRow></TableHeader>
              <TableBody>{["Grade 6", "Grade 7", "Grade 8"].map(grade => {
                const gs = students.filter(s => s.grade === grade);
                const m = gs.filter(s => s.gender === "Male").length;
                const f = gs.filter(s => s.gender === "Female").length;
                return (
                  <TableRow key={grade}>
                    <TableCell className="font-medium">{grade}</TableCell>
                    <TableCell className="text-center font-semibold text-primary">{m}</TableCell>
                    <TableCell className="text-center font-semibold text-pink-600">{f}</TableCell>
                    <TableCell className="text-center font-semibold">{gs.length}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{m}:{f}</TableCell>
                  </TableRow>
                );
              })}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STUDENT TEACHER RATIO */}
        <TabsContent value="teacher-ratio" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Student Teacher Ratio Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Students</p><p className="text-xl font-bold text-primary">{students.length}</p></div>
                <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Total Teachers</p><p className="text-xl font-bold text-info">10</p></div>
                <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Overall Ratio</p><p className="text-xl font-bold text-success">{students.length}:10</p></div>
              </div>
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold text-center">Students</TableHead><TableHead className="font-semibold text-center">Teachers Assigned</TableHead>
                <TableHead className="font-semibold text-center">Ratio</TableHead><TableHead className="font-semibold text-center">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>{classes.map(c => {
                const teacherCount = subjectAssignments.filter(a => a.class === c.name).length;
                const uniqueTeachers = [...new Set(subjectAssignments.filter(a => a.class === c.name).map(a => a.teacher))].length;
                const ratio = uniqueTeachers > 0 ? Math.round(c.students / uniqueTeachers) : 0;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-center font-semibold">{c.students}</TableCell>
                    <TableCell className="text-center">{uniqueTeachers}</TableCell>
                    <TableCell className="text-center font-semibold">{c.students}:{uniqueTeachers}</TableCell>
                    <TableCell className="text-center"><Badge className={ratio <= 30 ? "bg-success/10 text-success border-0" : ratio <= 40 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>{ratio <= 30 ? "Optimal" : ratio <= 40 ? "Acceptable" : "High"}</Badge></TableCell>
                  </TableRow>
                );
              })}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOGIN CREDENTIALS */}
        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Key className="h-4 w-4 text-primary" />Student & Parent Login Credentials</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Student Username</TableHead>
                <TableHead className="font-semibold">Parent Name</TableHead><TableHead className="font-semibold">Parent Phone</TableHead><TableHead className="font-semibold">Parent Username</TableHead>
              </TableRow></TableHeader>
              <TableBody>{students.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                  <TableCell className="font-mono text-sm">{s.admission_no.toLowerCase()}</TableCell>
                  <TableCell>{s.parent_name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{s.parent_phone}</TableCell>
                  <TableCell className="font-mono text-sm">{s.parent_phone}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentReports;
