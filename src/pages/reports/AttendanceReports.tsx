import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Calendar, Users, ClipboardList } from "lucide-react";
import { useAttendanceReportData } from "@/hooks/useReports";

const statusColor: Record<string, string> = {
  present: "bg-success/10 text-success border-0",
  absent: "bg-destructive/10 text-destructive border-0",
  late: "bg-warning/10 text-warning border-0",
  half_day: "bg-info/10 text-info border-0",
};

const LoadingSkeleton = () => (
  <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
);
const EmptyState = ({ message }: { message: string }) => (
  <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>
);

const AttendanceReports = () => {
  const [classFilter, setClassFilter] = useState("");
  const { data: report, isLoading } = useAttendanceReportData({ classId: classFilter });

  const studentAttendance = report?.studentAttendance || [];
  const staffAttendance = report?.staffAttendance || [];
  const dailySummary = report?.dailySummary || [];
  const typeSummary = report?.typeSummary || [];
  const summary = report?.summary || { present: 0, absent: 0, late: 0, total: 0, rate: 0 };

  return (
    <DashboardLayout title="Attendance Reports" subtitle="Student and staff attendance reports">
      <Tabs defaultValue="student" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="student">Student Attendance</TabsTrigger>
          <TabsTrigger value="type">Attendance Type</TabsTrigger>
          <TabsTrigger value="daily">Daily Summary</TabsTrigger>
          <TabsTrigger value="staff">Staff Attendance</TabsTrigger>
        </TabsList>

        {/* STUDENT ATTENDANCE */}
        <TabsContent value="student" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold">Student Attendance Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent><SelectItem value="">All</SelectItem></SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Present</p><p className="text-xl font-bold text-success">{summary.present}</p></div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Absent</p><p className="text-xl font-bold text-destructive">{summary.absent}</p></div>
                <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Late</p><p className="text-xl font-bold text-warning">{summary.late}</p></div>
                <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Rate</p><p className="text-xl font-bold text-primary">{summary.rate}%</p></div>
              </div>
              {isLoading ? <LoadingSkeleton /> : studentAttendance.length === 0 ? <EmptyState message="No attendance records found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead>
                  <TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{studentAttendance.map((a: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{a.student_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.admission_no}</TableCell>
                    <TableCell>{a.grade_name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.date}</TableCell>
                    <TableCell><Badge className={statusColor[a.status] || ""}>{a.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ATTENDANCE TYPE */}
        <TabsContent value="type" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" />Attendance Type Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : typeSummary.length === 0 ? <EmptyState message="No attendance type data available" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold text-center">Total</TableHead>
                  <TableHead className="font-semibold text-center">Present</TableHead><TableHead className="font-semibold text-center">Absent</TableHead>
                  <TableHead className="font-semibold text-center">Late</TableHead><TableHead className="font-semibold text-center">Rate</TableHead>
                </TableRow></TableHeader>
                <TableBody>{typeSummary.map((a: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{a.student_name}</TableCell>
                    <TableCell className="text-center">{a.total_days}</TableCell>
                    <TableCell className="text-center font-semibold text-success">{a.present}</TableCell>
                    <TableCell className="text-center font-semibold text-destructive">{a.absent}</TableCell>
                    <TableCell className="text-center font-semibold text-warning">{a.late}</TableCell>
                    <TableCell className="text-center"><Badge className={a.rate >= 90 ? "bg-success/10 text-success border-0" : a.rate >= 75 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>{a.rate}%</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DAILY SUMMARY */}
        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Daily Summary</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : dailySummary.length === 0 ? <EmptyState message="No daily attendance summary available" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold text-center">Total</TableHead>
                  <TableHead className="font-semibold text-center">Present</TableHead><TableHead className="font-semibold text-center">Absent</TableHead>
                  <TableHead className="font-semibold text-center">Late</TableHead><TableHead className="font-semibold text-center">Rate</TableHead>
                </TableRow></TableHeader>
                <TableBody>{dailySummary.map((d: any) => (
                  <TableRow key={d.date}>
                    <TableCell className="font-medium">{d.date}</TableCell>
                    <TableCell className="text-center">{d.total}</TableCell>
                    <TableCell className="text-center font-semibold text-success">{d.present}</TableCell>
                    <TableCell className="text-center font-semibold text-destructive">{d.absent}</TableCell>
                    <TableCell className="text-center font-semibold text-warning">{d.late}</TableCell>
                    <TableCell className="text-center"><Badge className={d.rate >= 90 ? "bg-success/10 text-success border-0" : d.rate >= 75 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>{d.rate}%</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STAFF ATTENDANCE */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Staff Attendance</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : staffAttendance.length === 0 ? <EmptyState message="No staff attendance data found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Staff</TableHead><TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Check In</TableHead>
                  <TableHead className="font-semibold">Check Out</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{staffAttendance.map((s: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{s.name || s.staff_name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.department}</TableCell>
                    <TableCell className="text-muted-foreground">{s.date}</TableCell>
                    <TableCell className="font-mono text-sm">{s.check_in || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{s.check_out || "—"}</TableCell>
                    <TableCell><Badge className={statusColor[s.status] || ""}>{(s.status || "").replace("_", " ")}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AttendanceReports;
