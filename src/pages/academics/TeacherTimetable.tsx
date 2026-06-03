import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTeachers } from "@/hooks/useClasses";
import { useEntries, usePeriods } from "@/hooks/useTimetable";
import { Clock, Download, AlertCircle } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TeacherTimetable = () => {
  useSeo("Teacher Timetable", "Individual teacher weekly schedule view.");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const { data: teachers = [] } = useTeachers();
  const { data: periods = [] } = usePeriods();
  const { data: entries = [], isLoading } = useEntries({
    teacher_id: selectedTeacher || undefined,
  });

  const lessonPeriods = useMemo(
    () => periods.filter((p) => p.kind === "lesson" && p.is_active),
    [periods],
  );

  const getEntry = (day: string, periodNum: number) =>
    entries.find((t) => t.day === day && t.period === periodNum);

  const totalPeriods = entries.length;
  const slotCount = lessonPeriods.length * days.length;
  const freeSlots = Math.max(0, slotCount - totalPeriods);
  const subjectCount = new Set(entries.map((e) => e.subject)).size;

  const selectedTeacherName = teachers.find(
    (t) => t.teacher_id === selectedTeacher,
  );

  return (
    <DashboardLayout
      title="Teacher Timetable"
      subtitle="View individual teacher schedules"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalPeriods}</p>
              <p className="text-xs text-muted-foreground">
                Total Periods/Week
              </p>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{freeSlots}</p>
              <p className="text-xs text-muted-foreground">Free Slots</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">{subjectCount}</p>
              <p className="text-xs text-muted-foreground">Subjects Assigned</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Teacher Schedule
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedTeacher}
                  onValueChange={setSelectedTeacher}
                >
                  <SelectTrigger className="w-64 h-9">
                    <SelectValue placeholder="Select Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.teacher_id} value={t.teacher_id}>
                        {t.first_name} {t.last_name}
                        {t.specialization ? ` · ${t.specialization}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {!selectedTeacher ? (
              <p className="text-center py-8 text-sm text-muted-foreground">
                Select a teacher to view their timetable.
              </p>
            ) : isLoading ? (
              <div className="p-6">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : lessonPeriods.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-6 w-6 text-warning mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No lesson periods configured. Set them up in{" "}
                  <b>Class Timetable → Setup</b>.
                </p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-6 w-6 text-warning mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No periods scheduled for{" "}
                  <b>
                    {selectedTeacherName?.first_name}{" "}
                    {selectedTeacherName?.last_name}
                  </b>
                  . Generate the timetable from <b>Class Timetable</b> first, or
                  allocate this teacher to subjects.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold w-24">Period</TableHead>
                    <TableHead className="font-semibold text-[11px]">
                      Time
                    </TableHead>
                    {days.map((d) => (
                      <TableHead key={d} className="font-semibold text-center">
                        {d}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessonPeriods.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.label || `Period ${p.position}`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {p.start_time?.slice(0, 5)}–{p.end_time?.slice(0, 5)}
                      </TableCell>
                      {days.map((d) => {
                        const entry = getEntry(d, p.position);
                        return (
                          <TableCell key={d} className="text-center p-1.5">
                            {entry ? (
                              <div className="bg-primary/5 border border-primary/10 rounded-lg p-2">
                                <p className="text-xs font-semibold text-primary">
                                  {entry.subject}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {entry.class_name} {entry.section}
                                </p>
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground/40"
                              >
                                Free
                              </Badge>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherTimetable;
