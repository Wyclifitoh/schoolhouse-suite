import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { UserCheck, Plus, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClasses, useTeachers, useStreams } from "@/hooks/useClasses";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  useTeacherAllocations,
  useCreateTeacherAllocation,
  useDeleteTeacherAllocation,
} from "@/hooks/useAssessments";
import { usePermissions } from "@/hooks/usePermission";

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

function TeacherSearchSelect({ 
  value, 
  onValueChange, 
  teachers, 
  placeholder = "Select a teacher...", 
  allowAll = false, 
  allowUnassigned = false, 
  className 
}: { 
  value: string; 
  onValueChange: (v: string) => void; 
  teachers: any[]; 
  placeholder?: string; 
  allowAll?: boolean; 
  allowUnassigned?: boolean; 
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedTeacher = teachers.find(t => t.teacher_id === value);
  const displayText = value === "all" ? "All teachers" : value === "unassigned" ? "Unassigned" : selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between font-normal h-9", !value && "text-muted-foreground", className)}>
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search teachers..." />
          <CommandList>
            <CommandEmpty>No teacher found.</CommandEmpty>
            <CommandGroup>
              {allowAll && (
                <CommandItem value="all" onSelect={() => { onValueChange("all"); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")} />
                  All teachers
                </CommandItem>
              )}
              {allowUnassigned && (
                <CommandItem value="unassigned" onSelect={() => { onValueChange("unassigned"); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === "unassigned" ? "opacity-100" : "opacity-0")} />
                  <span className="italic">Unassigned</span>
                </CommandItem>
              )}
              {teachers.map(teacher => (
                <CommandItem 
                  key={teacher.teacher_id} 
                  value={`${teacher.first_name} ${teacher.last_name} ${teacher.specialization || ""}`} 
                  onSelect={() => { onValueChange(teacher.teacher_id); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === teacher.teacher_id ? "opacity-100" : "opacity-0")} />
                  {teacher.first_name} {teacher.last_name} {teacher.specialization ? `- ${teacher.specialization}` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const TeacherAllocation = () => {
  const perms = usePermissions(["classes:create", "classes:delete"]);
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
    subjects: {} as Record<string, string[]>,
  });
  const [classForm, setClassForm] = useState({
    grade_id: "",
    stream_id: "none",
    subjectTeachers: {} as Record<string, string>,
  });
  const [mode, setMode] = useState<"teacher" | "class">("teacher");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: streams = [] } = useStreams(form.grade_id || undefined);
  const { data: gradeSubjects = [] } = useSubjectsForGrade(form.grade_id);
  const { data: classFormStreams = [] } = useStreams(classForm.grade_id || undefined);
  const { data: classFormSubjects = [] } = useSubjectsForGrade(classForm.grade_id);

  const isLoading = teachersLoading || classesLoading || allocationsLoading;

  const handleCreate = () => {
    const allocations = Object.entries(form.subjects).map(([subject_id, stream_ids]) => ({
      subject_id,
      stream_ids,
    }));
    
    if (!form.teacher_id || allocations.length === 0 || !form.grade_id) return;

    setIsSubmitting(true);
    create.mutate(
      {
        teacher_id: form.teacher_id,
        grade_id: form.grade_id,
        allocations,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            teacher_id: "",
            grade_id: "",
            subjects: {},
          });
        },
        onSettled: () => setIsSubmitting(false),
      },
    );
  };

  const handleClassCreate = async () => {
    const teacherMap: Record<string, { subject_id: string; stream_ids: string[] }[]> = {};
    Object.entries(classForm.subjectTeachers).forEach(([subject_id, teacher_id]) => {
      if (!teacherMap[teacher_id]) teacherMap[teacher_id] = [];
      teacherMap[teacher_id].push({
        subject_id,
        stream_ids: [classForm.stream_id],
      });
    });

    if (Object.keys(teacherMap).length === 0 || !classForm.grade_id) return;

    setIsSubmitting(true);
    try {
      const promises = Object.entries(teacherMap).map(([teacher_id, allocations]) =>
        create.mutateAsync({
          teacher_id,
          grade_id: classForm.grade_id,
          allocations,
        })
      );
      await Promise.all(promises);
      setOpen(false);
      setClassForm({ grade_id: "", stream_id: "none", subjectTeachers: {} });
    } catch (e) {
      // error handled by mutation callbacks
    } finally {
      setIsSubmitting(false);
    }
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
              <TeacherSearchSelect 
                value={filterTeacher} 
                onValueChange={setFilterTeacher} 
                teachers={teachersList} 
                allowAll={true}
                className="w-44"
              />

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

              {perms["classes:create"] && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" /> Allocate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Allocation</DialogTitle>
                  </DialogHeader>

                  <Tabs value={mode} onValueChange={(v) => setMode(v as "teacher" | "class")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="teacher">By Teacher</TabsTrigger>
                      <TabsTrigger value="class">By Class</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="teacher" className="space-y-3">
                      <div>
                      <label className="text-xs font-medium">Teacher</label>
                      <TeacherSearchSelect
                        value={form.teacher_id}
                        onValueChange={(v) => setForm({ ...form, teacher_id: v })}
                        teachers={teachersList}
                        placeholder="Pick teacher"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium">Class</label>
                      <Select
                        value={form.grade_id}
                        onValueChange={(v) =>
                          setForm({
                            ...form,
                            grade_id: v,
                            subjects: {},
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
                      <label className="text-xs font-medium">Subjects & Streams</label>
                      <div className="mt-1 max-h-60 overflow-y-auto rounded-md border p-2 space-y-2 bg-background">
                        {gradeSubjects.map((subject) => {
                          const isSelected = subject.id in form.subjects;
                          const selectedStreams = form.subjects[subject.id] || [];

                          return (
                            <div key={subject.id} className={`rounded border p-2 transition ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                              <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                                <Checkbox 
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    setForm(f => {
                                      const next = { ...f.subjects };
                                      if (checked) next[subject.id] = ["none"]; // Default to 'All streams'
                                      else delete next[subject.id];
                                      return { ...f, subjects: next };
                                    });
                                  }}
                                />
                                <span className="flex-1 font-medium truncate">{subject.name} {subject.code && `(${subject.code})`}</span>
                              </label>

                              {isSelected && streams.length > 0 && (
                                <div className="pl-6 flex flex-wrap gap-1">
                                  <Badge 
                                    variant={selectedStreams.includes("none") ? "default" : "outline"}
                                    className="cursor-pointer text-[10px] px-1.5 py-0"
                                    onClick={() => setForm(f => ({ ...f, subjects: { ...f.subjects, [subject.id]: ["none"] } }))}
                                  >
                                    All Streams
                                  </Badge>
                                  {streams.map(st => {
                                    const hasStream = selectedStreams.includes(st.id);
                                    return (
                                      <Badge 
                                        key={st.id}
                                        variant={hasStream && !selectedStreams.includes("none") ? "default" : "outline"}
                                        className="cursor-pointer text-[10px] px-1.5 py-0"
                                        onClick={() => {
                                          setForm(f => {
                                            const curr = f.subjects[subject.id] || [];
                                            let next = curr.filter(x => x !== "none");
                                            if (hasStream) next = next.filter(x => x !== st.id);
                                            else next.push(st.id);
                                            
                                            if (next.length === 0) next = ["none"];
                                            return { ...f, subjects: { ...f.subjects, [subject.id]: next } };
                                          });
                                        }}
                                      >
                                        {st.name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {form.grade_id && gradeSubjects.length > 0 && (
                          <div className="pt-2 mt-2 border-t flex items-center justify-between">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => {
                                const all: Record<string, string[]> = {};
                                gradeSubjects.forEach((s: any) => all[s.id] = ["none"]);
                                setForm(f => ({ ...f, subjects: all }));
                              }}
                            >
                              Select All
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => setForm(f => ({ ...f, subjects: {} }))}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                        
                        {!form.grade_id && (
                          <p className="text-xs text-muted-foreground">Pick a class first</p>
                        )}
                      </div>
                      {form.grade_id && gradeSubjects.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          No subjects allocated to this class. Allocate subjects first.
                        </p>
                      )}
                    </div>
                    </TabsContent>
                    
                    <TabsContent value="class" className="space-y-3">
                      <div>
                        <label className="text-xs font-medium">Class</label>
                        <Select
                          value={classForm.grade_id}
                          onValueChange={(v) =>
                            setClassForm({
                              ...classForm,
                              grade_id: v,
                              subjectTeachers: {},
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
                        <label className="text-xs font-medium">Stream (optional)</label>
                        <Select
                          value={classForm.stream_id}
                          onValueChange={(v) =>
                            setClassForm({ ...classForm, stream_id: v })
                          }
                          disabled={!classForm.grade_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All streams" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">All streams</SelectItem>
                            {classFormStreams.map((stream) => (
                              <SelectItem key={stream.id} value={stream.id}>
                                {stream.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium">Subject Teachers</label>
                        <div className="mt-1 max-h-60 overflow-y-auto rounded-md border p-2 space-y-2 bg-background">
                          {classForm.grade_id && classFormSubjects.length === 0 && (
                            <p className="text-xs text-amber-600 p-2">
                              No subjects allocated to this class. Allocate subjects first.
                            </p>
                          )}
                          {!classForm.grade_id && (
                            <p className="text-xs text-muted-foreground p-2">Pick a class first</p>
                          )}
                          {classFormSubjects.map((subject) => (
                            <div key={subject.id} className="flex items-center gap-3 p-2 border rounded hover:bg-muted/30">
                              <span className="flex-1 text-sm font-medium truncate">
                                {subject.name} {subject.code && `(${subject.code})`}
                              </span>
                              <div className="w-1/2">
                                <TeacherSearchSelect
                                  value={classForm.subjectTeachers[subject.id] || "unassigned"}
                                  onValueChange={(v) =>
                                    setClassForm((f) => {
                                      const next = { ...f.subjectTeachers };
                                      if (v === "unassigned") delete next[subject.id];
                                      else next[subject.id] = v;
                                      return { ...f, subjectTeachers: next };
                                    })
                                  }
                                  teachers={teachersList}
                                  placeholder="Assign teacher..."
                                  allowUnassigned={true}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    {mode === "teacher" ? (
                      <Button
                        onClick={handleCreate}
                        disabled={
                          !form.teacher_id ||
                          Object.keys(form.subjects).length === 0 ||
                          !form.grade_id ||
                          isSubmitting
                        }
                      >
                        {isSubmitting ? "Saving..." : "Save Allocation"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleClassCreate}
                        disabled={
                          !classForm.grade_id ||
                          Object.keys(classForm.subjectTeachers).length === 0 ||
                          isSubmitting
                        }
                      >
                        {isSubmitting ? "Saving..." : "Save Allocation"}
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              )}
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
                      {perms["classes:delete"] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => del.mutate(allocation.id)}
                          disabled={del.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
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
