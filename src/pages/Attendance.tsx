import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { attendanceRecords } from "@/data/mockData";
import { Search, Download, ClipboardCheck, UserCheck, UserX, Clock, Filter, CalendarDays } from "lucide-react";

const statusConfig = {
  present: { label: "Present", className: "bg-success/10 text-success border-0 hover:bg-success/20" },
  absent: { label: "Absent", className: "bg-destructive/10 text-destructive border-0 hover:bg-destructive/20" },
  late: { label: "Late", className: "bg-warning/10 text-warning border-0 hover:bg-warning/20" },
};

const Attendance = () => {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [records, setRecords] = useState(attendanceRecords);

  const filtered = records.filter((r) => {
    const matchesSearch = r.student_name.toLowerCase().includes(search.toLowerCase()) || r.admission_no.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = gradeFilter === "all" || r.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late").length;

  const toggleStatus = (id: string) => {
    const cycle: Array<"present" | "absent" | "late"> = ["present", "absent", "late"];
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const idx = cycle.indexOf(r.status);
        return { ...r, status: cycle[(idx + 1) % cycle.length] };
      })
    );
  };

  return (
    <DashboardLayout title="Attendance" subtitle="Track daily student attendance">
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{records.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <UserCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-2xl font-bold text-foreground">{presentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold text-foreground">{absentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Late</p>
              <p className="text-2xl font-bold text-foreground">{lateCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">Attendance Register</CardTitle>
              <Badge variant="secondary" className="font-normal">
                <CalendarDays className="h-3 w-3 mr-1" />
                15 Mar 2024
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Button size="sm">Save Attendance</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission no..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-36 h-9">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {["Grade 6", "Grade 7", "Grade 8"].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Admission No.</TableHead>
                  <TableHead className="font-semibold">Grade</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const cfg = statusConfig[r.status];
                  return (
                    <TableRow key={r.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {r.student_name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <p className="font-medium text-foreground">{r.student_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{r.admission_no}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{r.grade}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.date}</TableCell>
                      <TableCell>
                        <Badge variant="default" className={cfg.className}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => toggleStatus(r.id)}
                        >
                          Toggle
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {records.length} records
            </p>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />Present {presentCount}</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />Absent {absentCount}</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />Late {lateCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Attendance;
