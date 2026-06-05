import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { useTeacherAllocations } from "@/hooks/useAssessments";
import { useEntries } from "@/hooks/useTimetable";
import {
  ArrowLeft, Mail, Phone, MapPin, IdCard, Briefcase, Building2, GraduationCap,
  Calendar, DollarSign, BookOpen, Clock,
} from "lucide-react";
import { format } from "date-fns";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const StaffProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff", id],
    queryFn: () => api.get<any>(`/staff/${id}`),
    enabled: !!id,
  });
  const s: any = (staff as any)?.data ?? staff;
  const teacherId = s?.teacher_id;

  const { data: allocations = [] } = useTeacherAllocations({ teacher_id: teacherId });
  const { data: entries = [] } = useEntries({ teacher_id: teacherId });

  const { data: attendance = [] } = useQuery({
    queryKey: ["staff-attendance-history", id],
    queryFn: async () => {
      const now = new Date();
      const r = await api.get<any[]>(
        `/staff-attendance/summary?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
      );
      const rows = (r as any)?.data ?? r ?? [];
      return (rows as any[]).filter((x: any) => x.staff_id === id);
    },
    enabled: !!id,
  });

  const periodCount = entries.length;

  return (
    <DashboardLayout title="Staff Profile" subtitle="Complete staff record">
      <Button variant="ghost" size="sm" onClick={() => navigate("/staff")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Staff
      </Button>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !s ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Staff not found</CardContent></Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start gap-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold flex-shrink-0">
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h2 className="text-2xl font-bold">{s.first_name} {s.last_name}</h2>
                  <p className="text-sm text-muted-foreground font-mono">{s.employee_number}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className="capitalize">{s.role?.replace(/_/g, " ")}</Badge>
                    <Badge variant={s.status === "active" ? "default" : "secondary"} className="capitalize">{s.status}</Badge>
                    {s.designation_name && <Badge variant="outline">{s.designation_name}</Badge>}
                    {s.department_name && <Badge variant="outline">{s.department_name}</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {s.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{s.email}</div>}
                  {s.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{s.phone}</div>}
                  {s.id_number && <div className="flex items-center gap-2"><IdCard className="h-4 w-4 text-muted-foreground" />{s.id_number}</div>}
                  {s.join_date && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Joined {format(new Date(s.join_date), "dd MMM yyyy")}</div>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {teacherId && <TabsTrigger value="allocations">Allocations ({allocations.length})</TabsTrigger>}
              {teacherId && <TabsTrigger value="timetable">Timetable ({periodCount})</TabsTrigger>}
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Employment</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <Row icon={Building2} label="Department" value={s.department_name} />
                    <Row icon={Briefcase} label="Designation" value={s.designation_name} />
                    <Row icon={GraduationCap} label="Qualification" value={s.qualification} />
                    <Row icon={DollarSign} label="Salary (KES)" value={s.salary ? Number(s.salary).toLocaleString() : null} />
                    {s.tsc_number && <Row icon={IdCard} label="TSC #" value={s.tsc_number} />}
                    {s.specialization && <Row icon={BookOpen} label="Specialization" value={s.specialization} />}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Statutory & Bank</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <Row label="KRA PIN" value={s.kra_pin} />
                    <Row label="NHIF / SHIF" value={s.nhif_number} />
                    <Row label="NSSF" value={s.nssf_number} />
                    <Row label="Bank" value={s.bank_name} />
                    <Row label="Account" value={s.bank_account} />
                  </CardContent>
                </Card>
              </div>
              {s.address && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Address</CardTitle></CardHeader>
                  <CardContent className="text-sm flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />{s.address}
                  </CardContent>
                </Card>
              )}
              {s.bio && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Bio</CardTitle></CardHeader>
                  <CardContent className="text-sm whitespace-pre-wrap">{s.bio}</CardContent>
                </Card>
              )}
            </TabsContent>

            {teacherId && (
              <TabsContent value="allocations" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {allocations.length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground">No subject allocations yet.</p>
                    ) : (
                      <Table>
                        <TableHeader><TableRow className="bg-muted/50">
                          <TableHead>Subject</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Stream</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {allocations.map((a: any) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.subject_name}</TableCell>
                              <TableCell>{a.grade_name}</TableCell>
                              <TableCell>{a.stream_name || <span className="text-muted-foreground text-xs">All</span>}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {teacherId && (
              <TabsContent value="timetable" className="mt-4">
                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    {entries.length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground">
                        No periods scheduled. Generate the timetable from the Class Timetable page.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader><TableRow className="bg-muted/50">
                          <TableHead>Day</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Class</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {[...entries]
                            .sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.period - b.period)
                            .map((e: any) => (
                              <TableRow key={e.id}>
                                <TableCell>{e.day}</TableCell>
                                <TableCell>{e.period}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {e.start_time?.slice(0, 5)}–{e.end_time?.slice(0, 5)}
                                </TableCell>
                                <TableCell className="font-medium">{e.subject}</TableCell>
                                <TableCell>{e.class_name} {e.section}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">This Month</CardTitle></CardHeader>
                <CardContent>
                  {attendance.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {attendance.map((r: any) => (
                        <>
                          <Stat key="p" label="Present" value={r.present_days || 0} tint="text-success" />
                          <Stat key="l" label="Late" value={r.late_days || 0} tint="text-warning" />
                          <Stat key="a" label="Absent" value={r.absent_days || 0} tint="text-destructive" />
                          <Stat key="lv" label="Leave" value={r.leave_days || 0} />
                          <Stat key="hd" label="Half-day" value={r.half_days || 0} />
                        </>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
};

function Row({ icon: Icon, label, value }: { icon?: any; label: string; value: any }) {
  return (
    <div className="flex items-center justify-between border-b last:border-0 py-1.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}{label}
      </div>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <div className="rounded-md border p-3 text-center">
      <p className={`text-2xl font-bold ${tint || ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default StaffProfile;
