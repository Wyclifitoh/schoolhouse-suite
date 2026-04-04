import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Users, GraduationCap, UserCheck, BookOpen, History } from "lucide-react";
import { useStudentReportData } from "@/hooks/useReports";
import { useClasses } from "@/hooks/useClasses";

const LoadingSkeleton = () => (
  <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
);
const EmptyState = ({ message }: { message: string }) => (
  <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>
);

const StudentReports = () => {
  const [classFilter, setClassFilter] = useState("");
  const { data: report, isLoading } = useStudentReportData({ classId: classFilter });
  const { data: classesData } = useClasses();

  const students = report?.students || [];
  const guardians = report?.guardians || [];
  const history = report?.history || [];
  const summary = report?.summary || { total: 0, male: 0, female: 0, active: 0 };
  const classes = classesData?.classes || classesData || [];

  return (
    <DashboardLayout title="Student Reports" subtitle="Comprehensive student information reports">
      <Tabs defaultValue="student" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="student">Student Report</TabsTrigger>
          <TabsTrigger value="class">Class & Stream</TabsTrigger>
          <TabsTrigger value="guardian">Guardian Report</TabsTrigger>
          <TabsTrigger value="history">Student History</TabsTrigger>
          <TabsTrigger value="admission">Admission Report</TabsTrigger>
          <TabsTrigger value="gender">Gender Ratio</TabsTrigger>
        </TabsList>

        {/* STUDENT REPORT */}
        <TabsContent value="student" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold">Student Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {Array.isArray(classes) && classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{summary.total}</p></div>
                <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Male</p><p className="text-xl font-bold text-primary">{summary.male}</p></div>
                <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Female</p><p className="text-xl font-bold text-info">{summary.female}</p></div>
                <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-success">{summary.active}</p></div>
              </div>
              {isLoading ? <LoadingSkeleton /> : students.length === 0 ? <EmptyState message="No students found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Adm No.</TableHead>
                  <TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Gender</TableHead>
                  <TableHead className="font-semibold">DOB</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{students.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                    <TableCell>{s.grade_name} {s.stream_name || ""}</TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell className="text-muted-foreground">{s.date_of_birth}</TableCell>
                    <TableCell><Badge className={s.status === "active" ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
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
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : !Array.isArray(classes) || classes.length === 0 ? <EmptyState message="No class data available" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Streams</TableHead>
                  <TableHead className="font-semibold">Students</TableHead>
                </TableRow></TableHeader>
                <TableBody>{classes.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.stream_count || c.streams?.length || 0}</TableCell>
                    <TableCell className="font-semibold">{c.student_count || 0}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
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
              {isLoading ? <LoadingSkeleton /> : guardians.length === 0 ? <EmptyState message="No guardian data available" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Email</TableHead><TableHead className="font-semibold">Occupation</TableHead>
                </TableRow></TableHeader>
                <TableBody>{guardians.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.first_name} {g.last_name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{g.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{g.email || "—"}</TableCell>
                    <TableCell>{g.occupation || "—"}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
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
              {isLoading ? <LoadingSkeleton /> : history.length === 0 ? <EmptyState message="No student history events found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Event</TableHead>
                  <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Details</TableHead>
                </TableRow></TableHeader>
                <TableBody>{history.map((h: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{h.student_name}</TableCell>
                    <TableCell><Badge className="bg-primary/10 text-primary border-0">{h.event}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{h.date}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{h.remarks || "—"}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADMISSION REPORT */}
        <TabsContent value="admission" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary" />Admission Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : students.length === 0 ? <EmptyState message="No admission data found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Adm No.</TableHead>
                  <TableHead className="font-semibold">Join Date</TableHead><TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{students.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                    <TableCell className="text-muted-foreground">{s.admission_date || s.created_at}</TableCell>
                    <TableCell>{s.grade_name} {s.stream_name || ""}</TableCell>
                    <TableCell><Badge className={s.status === "active" ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GENDER RATIO */}
        <TabsContent value="gender" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Gender Ratio</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-6 rounded-xl bg-primary/10 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Male</p>
                  <p className="text-3xl font-black text-primary">{summary.male}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.total ? ((summary.male / summary.total) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="p-6 rounded-xl bg-info/10 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Female</p>
                  <p className="text-3xl font-black text-info">{summary.female}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.total ? ((summary.female / summary.total) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="p-6 rounded-xl bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-3xl font-black">{summary.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentReports;
