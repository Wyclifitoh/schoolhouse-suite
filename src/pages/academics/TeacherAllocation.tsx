import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserCheck, Plus, Trash2 } from "lucide-react";
import { useClasses, useTeachers, useStreams } from "@/hooks/useClasses";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  useTeacherAllocations,
  useCreateTeacherAllocation,
  useDeleteTeacherAllocation,
} from "@/hooks/useAssessments";

const unwrap = (d: any) => d?.data ?? d ?? [];

function useSubjectsForGrade(gradeId?: string) {
  return useQuery({
    queryKey: ["subjects-for-grade", gradeId],
    queryFn: async () => {
      if (!gradeId) return [];
      return (
        unwrap(
          await api.get<any>(
            `/assessments/subject-allocations/by-grade/${gradeId}`,
          ),
        ) || []
      );
    },
    enabled: !!gradeId,
  });
}

const TeacherAllocation = () => {
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: teachersList = [], isLoading: teachersLoading } = useTeachers();
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const { data: allocations = [], isLoading: allocationsLoading } =
    useTeacherAllocations({
      grade_id: filterGrade !== "all" ? filterGrade : undefined,
      teacher_id: filterTeacher !== "all" ? filterTeacher : undefined,
    });

  const create = useCreateTeacherAllocation();
  const del = useDeleteTeacherAllocation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    teacher_id: "",
    grade_id: "",
    subject_id: "",
    stream_id: "none",
  });
  const { data: streams = [] } = useStreams(form.grade_id || undefined);
  const { data: gradeSubjects = [] } = useSubjectsForGrade(form.grade_id);

  const isLoading = teachersLoading || classesLoading || allocationsLoading;

  const handleCreate = () => {
    if (!form.teacher_id || !form.subject_id || !form.grade_id) return;

    // Convert "none" to null for the API
    const streamId = form.stream_id === "none" ? null : form.stream_id;

    create.mutate(
      {
        teacher_id: form.teacher_id,
        subject_id: form.subject_id,
        grade_id: form.grade_id,
        stream_id: streamId,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            teacher_id: "",
            grade_id: "",
            subject_id: "",
            stream_id: "none",
          });
        },
      },
    );
  };

  return (
    <DashboardLayout
      title="Teacher Allocation"
      subtitle="Assign teachers to subject + class + stream. Controls marks entry & dashboards."
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <UserCheck className="h-4 w-4 text-primary" /> Teacher Subject
              Allocations
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teachers</SelectItem>
                  {teachersList.map((teacher) => (
                    <SelectItem
                      key={teacher.teacher_id}
                      value={teacher.teacher_id}
                    >
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" /> Allocate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Teacher Allocation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div>
                      <label className="text-xs font-medium">Teacher</label>
                      <Select
                        value={form.teacher_id}
                        onValueChange={(v) =>
                          setForm({ ...form, teacher_id: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pick teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachersList.map((teacher) => (
                            <SelectItem
                              key={teacher.teacher_id}
                              value={teacher.teacher_id}
                            >
                              {teacher.first_name} {teacher.last_name}
                              {teacher.specialization &&
                                ` - ${teacher.specialization}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium">Class</label>
                      <Select
                        value={form.grade_id}
                        onValueChange={(v) =>
                          setForm({
                            ...form,
                            grade_id: v,
                            subject_id: "",
                            stream_id: "none",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pick class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((grade) => (
                            <SelectItem key={grade.id} value={grade.id}>
                              {grade.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium">Subject</label>
                      <Select
                        value={form.subject_id}
                        onValueChange={(v) =>
                          setForm({ ...form, subject_id: v })
                        }
                        disabled={!form.grade_id}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              form.grade_id
                                ? "Pick subject"
                                : "Pick class first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}{" "}
                              {subject.code && `(${subject.code})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.grade_id && gradeSubjects.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          No subjects allocated to this class. Allocate subjects
                          first.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium">
                        Stream (optional)
                      </label>
                      <Select
                        value={form.stream_id}
                        onValueChange={(v) =>
                          setForm({ ...form, stream_id: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All streams" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">All streams</SelectItem>
                          {streams.map((stream) => (
                            <SelectItem key={stream.id} value={stream.id}>
                              {stream.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={
                        !form.teacher_id ||
                        !form.subject_id ||
                        !form.grade_id ||
                        create.isPending
                      }
                    >
                      {create.isPending ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : allocations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No allocations yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Teacher</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell className="font-medium">
                      {allocation.teacher_name?.trim() || "—"}
                    </TableCell>
                    <TableCell>{allocation.subject_name}</TableCell>
                    <TableCell>{allocation.grade_name}</TableCell>
                    <TableCell>
                      {allocation.stream_name ? (
                        <Badge variant="outline">
                          {allocation.stream_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          All streams
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => del.mutate(allocation.id)}
                        disabled={del.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default TeacherAllocation;
