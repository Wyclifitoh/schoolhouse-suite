/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, Save, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";

const ATTENDANCE_STATUSES = [
  { value: "present",  label: "Present" },
  { value: "absent",   label: "Absent" },
  { value: "late",     label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "on_leave", label: "On Leave" },
];

const STATUS_VARIANT: Record<string, any> = {
  present: "default", absent: "destructive", late: "secondary",
  half_day: "outline", on_leave: "secondary",
};

export default function StaffAttendance() {
  const { currentSchool } = useSchool();
  const { user } = useAuth();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: string; check_in: string; check_out: string }>
  >({});
  const [summaryMonth, setSummaryMonth] = useState(format(new Date(), "yyyy-MM"));

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff", schoolId],
    queryFn: () => api.get<any[]>("/staff"),
    enabled: !!schoolId,
  });

  const { data: existing = [] } = useQuery({
    queryKey: ["staff-attendance", schoolId, selectedDate],
    queryFn: () => api.get<any[]>(`/staff-attendance?date=${selectedDate}`),
    enabled: !!schoolId,
  });

  useEffect(() => {
    const map: Record<string, any> = {};
    existing.forEach((a: any) => {
      map[a.staff_id] = {
        status: a.status,
        check_in: a.check_in || "",
        check_out: a.check_out || "",
      };
    });
    setAttendanceMap(map);
  }, [existing]);

  const [year, month] = summaryMonth.split("-");
  const { data: summary = [] } = useQuery({
    queryKey: ["staff-attendance-summary", schoolId, summaryMonth],
    queryFn: () =>
      api.get<any[]>(`/staff-attendance/summary?year=${year}&month=${Number(month)}`),
    enabled: !!schoolId,
  });

  const setRow = (staffId: string, field: string, value: string) =>
    setAttendanceMap((prev) => ({
      ...prev,
      [staffId]: { status: "present", check_in: "", check_out: "", ...prev[staffId], [field]: value },
    }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const records = Object.entries(attendanceMap)
        .filter(([, d]) => d.status)
        .map(([staff_id, d]) => ({
          staff_id, status: d.status,
          check_in: d.check_in || null, check_out: d.check_out || null,
        }));
      if (records.length === 0) throw new Error("Nothing to save");
      return api.post("/staff-attendance/bulk", { date: selectedDate, records });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["staff-attendance-summary"] });
      toast({ title: "Attendance saved" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const checkInMutation = useMutation({
    mutationFn: (staff_id: string) => api.post("/staff-attendance/check-in", { staff_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance"] });
      toast({ title: "Check-in recorded" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const checkOutMutation = useMutation({
    mutationFn: (staff_id: string) => api.post("/staff-attendance/check-out", { staff_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance"] });
      toast({ title: "Check-out recorded" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const markAll = (status: string) => {
    const map: Record<string, any> = {};
    staffList.forEach((s: any) => {
      map[s.id] = {
        status,
        check_in: attendanceMap[s.id]?.check_in || "",
        check_out: attendanceMap[s.id]?.check_out || "",
      };
    });
    setAttendanceMap(map);
  };

  const counts = {
    present: Object.values(attendanceMap).filter((a) => a.status === "present").length,
    absent:  Object.values(attendanceMap).filter((a) => a.status === "absent").length,
    late:    Object.values(attendanceMap).filter((a) => a.status === "late").length,
  };

  return (
    <DashboardLayout title="Staff Attendance">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Staff Attendance</h1>
            <p className="text-muted-foreground">Daily check-in/out with late tracking & monthly summary</p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Attendance"}
          </Button>
        </div>

        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Daily Register</TabsTrigger>
            <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4 mt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Input type="date" value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)} className="w-44" />
              </div>
              <Button variant="outline" size="sm" onClick={() => markAll("present")}>Mark All Present</Button>
              <Button variant="outline" size="sm" onClick={() => markAll("absent")}>Mark All Absent</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6">
                <div className="text-2xl font-bold">{staffList.length}</div>
                <p className="text-sm text-muted-foreground">Total Staff</p></CardContent></Card>
              <Card><CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{counts.present}</div>
                <p className="text-sm text-muted-foreground">Present</p></CardContent></Card>
              <Card><CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{counts.late}</div>
                <p className="text-sm text-muted-foreground">Late</p></CardContent></Card>
              <Card><CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{counts.absent}</div>
                <p className="text-sm text-muted-foreground">Absent</p></CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead className="text-right">Quick</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((staff: any) => {
                      const row = attendanceMap[staff.id];
                      return (
                        <TableRow key={staff.id}>
                          <TableCell className="font-mono text-sm">{staff.employee_number || "—"}</TableCell>
                          <TableCell className="font-medium">{staff.first_name} {staff.last_name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{staff.role}</Badge></TableCell>
                          <TableCell>
                            <Select value={row?.status || ""}
                              onValueChange={(v) => setRow(staff.id, "status", v)}>
                              <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {ATTENDANCE_STATUSES.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input type="time" className="w-28" value={row?.check_in || ""}
                              onChange={(e) => setRow(staff.id, "check_in", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input type="time" className="w-28" value={row?.check_out || ""}
                              onChange={(e) => setRow(staff.id, "check_out", e.target.value)} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost"
                                onClick={() => checkInMutation.mutate(staff.id)}
                                title="Check-in now">
                                <LogIn className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost"
                                onClick={() => checkOutMutation.mutate(staff.id)}
                                title="Check-out now">
                                <LogOut className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Input type="month" value={summaryMonth}
                onChange={(e) => setSummaryMonth(e.target.value)} className="w-44" />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Late</TableHead>
                      <TableHead className="text-right">Absent</TableHead>
                      <TableHead className="text-right">Leave</TableHead>
                      <TableHead className="text-right">Half-Day</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No records for this month</TableCell></TableRow>
                    ) : (
                      summary.map((row: any) => (
                        <TableRow key={row.staff_id}>
                          <TableCell className="font-mono text-sm">{row.employee_number || "—"}</TableCell>
                          <TableCell className="font-medium">{row.staff_name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{row.role}</Badge></TableCell>
                          <TableCell className="text-right text-green-600 font-medium">{row.present_days || 0}</TableCell>
                          <TableCell className="text-right text-yellow-600">{row.late_days || 0}</TableCell>
                          <TableCell className="text-right text-red-600">{row.absent_days || 0}</TableCell>
                          <TableCell className="text-right">{row.leave_days || 0}</TableCell>
                          <TableCell className="text-right">{row.half_days || 0}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
