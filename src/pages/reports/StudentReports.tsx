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
import { students, classes, parents } from "@/data/mockData";
import { Download, Users, GraduationCap, UserCheck } from "lucide-react";

const StudentReports = () => {
  const maleCount = students.filter(s => s.gender === "Male").length;
  const femaleCount = students.filter(s => s.gender === "Female").length;
  const activeCount = students.filter(s => s.status === "active").length;

  return (
    <DashboardLayout title="Student Reports" subtitle="Student information, class and admission reports">
      <Tabs defaultValue="student" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="student">Student Report</TabsTrigger>
          <TabsTrigger value="class">Class & Stream</TabsTrigger>
          <TabsTrigger value="admission">Admission Report</TabsTrigger>
          <TabsTrigger value="gender">Gender Ratio</TabsTrigger>
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
                  <Select><SelectTrigger className="w-32 h-9"><SelectValue placeholder="Gender" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select>
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
              <div className="rounded-md border overflow-hidden">
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Gender</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                    <TableCell>{s.grade} {s.stream}</TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell><Badge className={s.status === "active" ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              </div>
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
                <TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Sections</TableHead>
                <TableHead className="font-semibold">Students</TableHead>
                <TableHead className="font-semibold">Curriculum</TableHead>
                <TableHead className="font-semibold">Avg per Section</TableHead>
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
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Adm No.</TableHead>
                <TableHead className="font-semibold">Join Date</TableHead>
                <TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Previous School</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>{students.sort((a, b) => b.joined.localeCompare(a.joined)).map(s => (
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
                <TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold text-center">Male</TableHead>
                <TableHead className="font-semibold text-center">Female</TableHead>
                <TableHead className="font-semibold text-center">Total</TableHead>
                <TableHead className="font-semibold text-center">Ratio</TableHead>
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
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentReports;
