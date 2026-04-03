import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const attendanceRecords: any[] = [];
const students: any[] = [];
import { Download, Calendar, Users, ClipboardList } from "lucide-react";

const staffAttendance = [
  { id: "sa1", name: "Mr. Kamau", department: "Mathematics", date: "2024-03-15", check_in: "07:30", check_out: "16:00", status: "present" },
  { id: "sa2", name: "Mrs. Otieno", department: "English", date: "2024-03-15", check_in: "07:45", check_out: "16:15", status: "present" },
  { id: "sa3", name: "Mr. Hassan", department: "Kiswahili", date: "2024-03-15", check_in: "08:10", check_out: "16:00", status: "late" },
  { id: "sa4", name: "Dr. Mwangi", department: "Science", date: "2024-03-15", check_in: "—", check_out: "—", status: "absent" },
  { id: "sa5", name: "Ms. Wambui", department: "Social Studies", date: "2024-03-15", check_in: "07:25", check_out: "16:30", status: "present" },
  { id: "sa6", name: "Rev. Omondi", department: "CRE", date: "2024-03-15", check_in: "07:55", check_out: "15:30", status: "half_day" },
  { id: "sa7", name: "Coach Kiprop", department: "PE", date: "2024-03-15", check_in: "07:20", check_out: "16:00", status: "present" },
  { id: "sa8", name: "Mrs. Njuguna", department: "Mathematics", date: "2024-03-15", check_in: "07:40", check_out: "16:00", status: "present" },
];

const dailyAttendanceSummary = [
  { date: "2024-03-15", total: 10, present: 6, absent: 2, late: 1, half_day: 1, rate: 75.0 },
  { date: "2024-03-14", total: 10, present: 8, absent: 1, late: 1, half_day: 0, rate: 90.0 },
  { date: "2024-03-13", total: 10, present: 9, absent: 0, late: 1, half_day: 0, rate: 95.0 },
  { date: "2024-03-12", total: 10, present: 7, absent: 2, late: 1, half_day: 0, rate: 80.0 },
  { date: "2024-03-11", total: 10, present: 10, absent: 0, late: 0, half_day: 0, rate: 100.0 },
];

const attendanceTypeData = [
  { id: "at1", student: "Amina Wanjiku", admNo: "ADM-2024-001", class: "Grade 8 East", totalDays: 60, present: 55, absent: 3, late: 2, excused: 0, rate: 91.7 },
  { id: "at2", student: "Brian Ochieng", admNo: "ADM-2024-002", class: "Grade 7 West", totalDays: 60, present: 58, absent: 1, late: 1, excused: 0, rate: 96.7 },
  { id: "at3", student: "Catherine Muthoni", admNo: "ADM-2024-003", class: "Grade 8 East", totalDays: 60, present: 52, absent: 5, late: 3, excused: 0, rate: 86.7 },
  { id: "at4", student: "David Kipchoge", admNo: "ADM-2024-004", class: "Grade 6 North", totalDays: 60, present: 57, absent: 2, late: 1, excused: 0, rate: 95.0 },
  { id: "at5", student: "Esther Akinyi", admNo: "ADM-2024-005", class: "Grade 7 West", totalDays: 60, present: 40, absent: 15, late: 5, excused: 0, rate: 66.7 },
  { id: "at6", student: "Francis Mutua", admNo: "ADM-2024-006", class: "Grade 8 East", totalDays: 60, present: 56, absent: 2, late: 2, excused: 0, rate: 93.3 },
  { id: "at7", student: "Hassan Mohamed", admNo: "ADM-2024-008", class: "Grade 7 West", totalDays: 60, present: 54, absent: 4, late: 2, excused: 0, rate: 90.0 },
  { id: "at8", student: "Kevin Otieno", admNo: "ADM-2024-010", class: "Grade 8 West", totalDays: 60, present: 50, absent: 7, late: 3, excused: 0, rate: 83.3 },
];

const present = attendanceRecords.filter(a => a.status === "present").length;
const absent = attendanceRecords.filter(a => a.status === "absent").length;
const late = attendanceRecords.filter(a => a.status === "late").length;

const statusColor: Record<string, string> = {
  present: "bg-success/10 text-success border-0",
  absent: "bg-destructive/10 text-destructive border-0",
  late: "bg-warning/10 text-warning border-0",
  half_day: "bg-info/10 text-info border-0",
};

const AttendanceReports = () => (
  <DashboardLayout title="Attendance Reports" subtitle="Student and staff attendance reports">
    <Tabs defaultValue="student" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
        <TabsTrigger value="student">Student Attendance</TabsTrigger>
        <TabsTrigger value="type">Attendance Type</TabsTrigger>
        <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
        <TabsTrigger value="staff">Staff Attendance</TabsTrigger>
      </TabsList>

      {/* STUDENT ATTENDANCE */}
      <TabsContent value="student" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Student Attendance Report</CardTitle>
              <div className="flex items-center gap-2">
                <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{["Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                <Select><SelectTrigger className="w-32 h-9"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>{["January","February","March","April"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Present</p><p className="text-xl font-bold text-success">{present}</p></div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Absent</p><p className="text-xl font-bold text-destructive">{absent}</p></div>
              <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Late</p><p className="text-xl font-bold text-warning">{late}</p></div>
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Rate</p><p className="text-xl font-bold text-primary">{((present / attendanceRecords.length) * 100).toFixed(1)}%</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{attendanceRecords.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.student_name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{a.admission_no}</TableCell>
                <TableCell>{a.grade}</TableCell>
                <TableCell className="text-muted-foreground">{a.date}</TableCell>
                <TableCell><Badge className={statusColor[a.status]}>{a.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ATTENDANCE TYPE REPORT */}
      <TabsContent value="type" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" />Student Attendance Type Report</CardTitle>
              <div className="flex items-center gap-2">
                <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Class</TableHead>
              <TableHead className="font-semibold text-center">Total Days</TableHead><TableHead className="font-semibold text-center">Present</TableHead>
              <TableHead className="font-semibold text-center">Absent</TableHead><TableHead className="font-semibold text-center">Late</TableHead>
              <TableHead className="font-semibold text-center">Rate</TableHead>
            </TableRow></TableHeader>
            <TableBody>{attendanceTypeData.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.student}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{a.admNo}</TableCell>
                <TableCell>{a.class}</TableCell>
                <TableCell className="text-center">{a.totalDays}</TableCell>
                <TableCell className="text-center font-semibold text-success">{a.present}</TableCell>
                <TableCell className="text-center font-semibold text-destructive">{a.absent}</TableCell>
                <TableCell className="text-center font-semibold text-warning">{a.late}</TableCell>
                <TableCell className="text-center">
                  <Badge className={a.rate >= 90 ? "bg-success/10 text-success border-0" : a.rate >= 75 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>
                    {a.rate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* DAILY ATTENDANCE */}
      <TabsContent value="daily" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Daily Attendance Summary</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold text-center">Total</TableHead><TableHead className="font-semibold text-center">Present</TableHead>
              <TableHead className="font-semibold text-center">Absent</TableHead><TableHead className="font-semibold text-center">Late</TableHead><TableHead className="font-semibold text-center">Half Day</TableHead>
              <TableHead className="font-semibold text-center">Rate</TableHead>
            </TableRow></TableHeader>
            <TableBody>{dailyAttendanceSummary.map(d => (
              <TableRow key={d.date}>
                <TableCell className="font-medium">{d.date}</TableCell>
                <TableCell className="text-center">{d.total}</TableCell>
                <TableCell className="text-center font-semibold text-success">{d.present}</TableCell>
                <TableCell className="text-center font-semibold text-destructive">{d.absent}</TableCell>
                <TableCell className="text-center font-semibold text-warning">{d.late}</TableCell>
                <TableCell className="text-center text-muted-foreground">{d.half_day}</TableCell>
                <TableCell className="text-center"><Badge className={d.rate >= 90 ? "bg-success/10 text-success border-0" : d.rate >= 75 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>{d.rate}%</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* STAFF ATTENDANCE */}
      <TabsContent value="staff" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Staff Attendance Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Present</p><p className="text-xl font-bold text-success">{staffAttendance.filter(s => s.status === "present").length}</p></div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Absent</p><p className="text-xl font-bold text-destructive">{staffAttendance.filter(s => s.status === "absent").length}</p></div>
              <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Late</p><p className="text-xl font-bold text-warning">{staffAttendance.filter(s => s.status === "late").length}</p></div>
              <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Half Day</p><p className="text-xl font-bold text-info">{staffAttendance.filter(s => s.status === "half_day").length}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Staff</TableHead><TableHead className="font-semibold">Department</TableHead><TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Check In</TableHead><TableHead className="font-semibold">Check Out</TableHead><TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{staffAttendance.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.department}</TableCell>
                <TableCell className="text-muted-foreground">{s.date}</TableCell>
                <TableCell className="font-mono text-sm">{s.check_in}</TableCell>
                <TableCell className="font-mono text-sm">{s.check_out}</TableCell>
                <TableCell><Badge className={statusColor[s.status]}>{s.status.replace("_", " ")}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default AttendanceReports;
