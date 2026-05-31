import { useMemo, useState } from "react";
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
import {
  useClasses,
  useStaff,
  useTeachers,
  useStreams,
} from "@/hooks/useClasses";
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
  const { data: classes = [] } = useClasses();
  const { data: staff = [] } = useTeachers();
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const { data: allocations = [], isLoading } = useTeacherAllocations({
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
    stream_id: "",
  });
  const { data: streams = [] } = useStreams(form.grade_id || undefined);
  const { data: gradeSubjects = [] } = useSubjectsForGrade(form.grade_id);

  const teachers = useMemo(
    () =>
      (staff as any[]).filter(
        (s) =>
          (s.staff_type || s.designation || "")
            .toLowerCase()
            .includes("teach") || !s.staff_type,
      ),
    [staff],
  );

  const handleCreate = () => {
    if (!form.teacher_id || !form.subject_id || !form.grade_id) return;
    create.mutate(
      {
        teacher_id: form.teacher_id,
        subject_id: form.subject_id,
        grade_id: form.grade_id,
        stream_id: form.stream_id || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            teacher_id: "",
            grade_id: "",
            subject_id: "",
            stream_id: "",
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
                  {(staff as any[]).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
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
                  {(classes as any[]).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
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
                          {teachers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.first_name} {s.last_name}
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
                            stream_id: "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pick class" />
                        </SelectTrigger>
                        <SelectContent>
                          {(classes as any[]).map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
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
                          {(gradeSubjects as any[]).map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.grade_id &&
                        (gradeSubjects as any[]).length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            No subjects allocated to this class. Allocate
                            subjects first.
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
                          {(streams as any[]).map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
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
                      Save
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
                {(allocations as any[]).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.teacher_name?.trim() || "—"}
                    </TableCell>
                    <TableCell>{a.subject_name}</TableCell>
                    <TableCell>{a.grade_name}</TableCell>
                    <TableCell>
                      {a.stream_name ? (
                        <Badge variant="outline">{a.stream_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          All
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => del.mutate(a.id)}
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
