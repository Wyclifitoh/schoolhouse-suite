import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { timetableEntries } from "@/data/mockData";
import { Clock, Download, Wand2 } from "lucide-react";
import { toast } from "sonner";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = Array.from({ length: 8 }, (_, i) => i + 1);
const periodTimes = ["8:00-8:40", "8:40-9:20", "9:20-10:00", "10:20-11:00", "11:00-11:40", "11:40-12:20", "2:00-2:40", "2:40-3:20"];

const teachers = [...new Set(timetableEntries.map(t => t.teacher))];

const TeacherTimetable = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0] || "");

  const filtered = timetableEntries.filter(t => t.teacher === selectedTeacher);
  const getEntry = (day: string, period: number) => filtered.find(t => t.day === day && t.period === period);
  const totalPeriods = filtered.length;
  const freeSlots = days.length * periods.length - totalPeriods;

  return (
    <DashboardLayout title="Teacher Timetable" subtitle="View individual teacher schedules">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalPeriods}</p>
              <p className="text-xs text-muted-foreground">Total Periods/Week</p>
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
              <p className="text-2xl font-bold text-warning">{[...new Set(filtered.map(f => f.subject))].length}</p>
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
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold w-24">Period</TableHead>
                  <TableHead className="font-semibold text-[11px]">Time</TableHead>
                  {days.map(d => <TableHead key={d} className="font-semibold text-center">{d}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map(p => (
                  <TableRow key={p}>
                    <TableCell className="font-medium">Period {p}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{periodTimes[p - 1]}</TableCell>
                    {days.map(d => {
                      const entry = getEntry(d, p);
                      return (
                        <TableCell key={d} className="text-center p-1.5">
                          {entry ? (
                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-2">
                              <p className="text-xs font-semibold text-primary">{entry.subject}</p>
                              <p className="text-[10px] text-muted-foreground">{entry.class} {entry.section}</p>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground/40">Free</Badge>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherTimetable;
