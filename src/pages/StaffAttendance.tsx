import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle, XCircle, Clock, Save } from "lucide-react";
import { format } from "date-fns";

const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present", color: "default" },
  { value: "absent", label: "Absent", color: "destructive" },
  { value: "late", label: "Late", color: "secondary" },
  { value: "half_day", label: "Half Day", color: "outline" },
  { value: "on_leave", label: "On Leave", color: "secondary" },
];

export default function StaffAttendance() {
  const { currentSchool } = useSchool();
  const { user } = useAuth();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; check_in: string; check_out: string }>>({});

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("staff").select("id, staff_id_number, first_name, last_name, department_id, departments(name)").eq("school_id", schoolId).eq("status", "active").order("first_name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: existingAttendance = [] } = useQuery({
    queryKey: ["staff-attendance", schoolId, selectedDate],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("staff_attendance").select("*").eq("school_id", schoolId).eq("date", selectedDate);
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((a: any) => { map[a.staff_id] = { status: a.status, check_in: a.check_in_time || "", check_out: a.check_out_time || "" }; });
        setAttendanceMap(map);
      }
      return data || [];
    },
    enabled: !!schoolId,
  });

  const updateAttendance = (staffId: string, field: string, value: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId] || { status: "present", check_in: "", check_out: "" }, [field]: value },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("No school");
      const records = Object.entries(attendanceMap).map(([staffId, data]) => ({
        school_id: schoolId,
        staff_id: staffId,
        date: selectedDate,
        status: data.status,
        check_in_time: data.check_in || null,
        check_out_time: data.check_out || null,
        recorded_by: user?.id,
      }));
      if (records.length === 0) throw new Error("No attendance data");
      const { error } = await supabase.from("staff_attendance").upsert(records, { onConflict: "staff_id,date" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance"] });
      toast({ title: "Attendance saved successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const markAll = (status: string) => {
    const map: Record<string, any> = {};
    staffList.forEach((s: any) => { map[s.id] = { status, check_in: attendanceMap[s.id]?.check_in || "", check_out: attendanceMap[s.id]?.check_out || "" }; });
    setAttendanceMap(map);
  };

  const presentCount = Object.values(attendanceMap).filter(a => a.status === "present").length;
  const absentCount = Object.values(attendanceMap).filter(a => a.status === "absent").length;

  return (
    <DashboardLayout title="Staff Attendance">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Attendance</h1>
            <p className="text-muted-foreground">Record daily staff attendance</p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />{saveMutation.isPending ? "Saving..." : "Save Attendance"}
          </Button>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-44" />
          </div>
          <Button variant="outline" size="sm" onClick={() => markAll("present")}>Mark All Present</Button>
          <Button variant="outline" size="sm" onClick={() => markAll("absent")}>Mark All Absent</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{staffList.length}</div><p className="text-sm text-muted-foreground">Total Staff</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{presentCount}</div><p className="text-sm text-muted-foreground">Present</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{absentCount}</div><p className="text-sm text-muted-foreground">Absent</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{staffList.length - presentCount - absentCount}</div><p className="text-sm text-muted-foreground">Unmarked</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff: any) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-mono text-sm">{staff.staff_id_number}</TableCell>
                    <TableCell className="font-medium">{staff.first_name} {staff.last_name}</TableCell>
                    <TableCell>{staff.departments?.name || "—"}</TableCell>
                    <TableCell>
                      <Select value={attendanceMap[staff.id]?.status || ""} onValueChange={v => updateAttendance(staff.id, "status", v)}>
                        <SelectTrigger className="w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{ATTENDANCE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input type="time" className="w-28" value={attendanceMap[staff.id]?.check_in || ""} onChange={e => updateAttendance(staff.id, "check_in", e.target.value)} /></TableCell>
                    <TableCell><Input type="time" className="w-28" value={attendanceMap[staff.id]?.check_out || ""} onChange={e => updateAttendance(staff.id, "check_out", e.target.value)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
