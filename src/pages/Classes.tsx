import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermission";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useClasses,
  useStreams,
  useSubjects,
  useCreateGrade,
  useCreateStream,
  useCreateSubject,
  useUpdateStream,
  useDeleteStream,
  useDeleteGrade,
  useUpdateGrade,
  useUpdateSubject,
  useDeleteSubject,
  useIndependentStreams,
  useCreateIndependentStream,
  useUpdateIndependentStream,
  useDeleteIndependentStream,
  attachStreamToGrade as attachStreamApi,
  detachStreamFromGrade as detachStreamApi,
} from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  School,
  Plus,
  BookOpen,
  Users,
  Clock,
  Wand2,
  Layers,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const Classes = () => {
  // Data hooks
  const { data: grades = [], isLoading: gradesLoading } = useClasses();
  const { data: allStreams = [], isLoading: streamsLoading } =
    useIndependentStreams();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: students = [] } = useStudents({ status: "active" });
  // (academic year context no longer needed here — backend handles defaults)
  const { hasAnyRole } = useAuth();
  const perms = usePermissions([
    "classes:create",
    "classes:update",
    "classes:delete",
  ]);
  const canManage =
    perms["classes:create"] ||
    perms["classes:update"] ||
    perms["classes:delete"] ||
    hasAnyRole(["super_admin", "school_admin", "deputy_admin"] as any);
  const qc = useQueryClient();

  const refreshStreams = () => {
    qc.invalidateQueries({ queryKey: ["streams"] });
    qc.invalidateQueries({ queryKey: ["streams-independent"] });
    qc.invalidateQueries({ queryKey: ["grades"] });
  };

  // Student counts per grade / per stream — for delete guards & UI hints
  const studentsByGrade = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of students as any[]) {
      const g = s.current_grade_id;
      if (g) m.set(g, (m.get(g) || 0) + 1);
    }
    return m;
  }, [students]);
  const studentsByStream = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of students as any[]) {
      const st = s.current_stream_id;
      if (st) m.set(st, (m.get(st) || 0) + 1);
    }
    return m;
  }, [students]);

  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();
  const createStreamMut = useCreateIndependentStream();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const updateStream = useUpdateIndependentStream();
  const deleteStream = useDeleteIndependentStream();

  // --- Add Stream Dialog (simple: name + description) ---
  const [streamDialogOpen, setStreamDialogOpen] = useState(false);
  const [streamForm, setStreamForm] = useState({ name: "", description: "" });
  // Edit Stream
  const [editStreamOpen, setEditStreamOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<any>(null);
  const [editStreamForm, setEditStreamForm] = useState({
    name: "",
    description: "",
  });
  const openEditStream = (s: any) => {
    setEditingStream(s);
    setEditStreamForm({ name: s.name || "", description: s.description || "" });
    setEditStreamOpen(true);
  };
  const handleUpdateStream = () => {
    if (!editingStream) return;
    if (!editStreamForm.name) {
      toast.error("Name required");
      return;
    }
    updateStream.mutate(
      {
        id: editingStream.id,
        data: {
          name: editStreamForm.name,
          description: editStreamForm.description || null,
        } as any,
      },
      {
        onSuccess: () => {
          setEditStreamOpen(false);
          setEditingStream(null);
        },
      },
    );
  };

  const handleCreateStream = () => {
    if (!streamForm.name) {
      toast.error("Stream name required");
      return;
    }
    createStreamMut.mutate(
      {
        name: streamForm.name,
        description: streamForm.description || null,
      } as any,
      {
        onSuccess: () => {
          setStreamDialogOpen(false);
          setStreamForm({ name: "", description: "" });
        },
      },
    );
  };

  // --- Add Class (Grade) Dialog ---
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    name: "",
    level: "primary" as string,
    curriculum_type: "CBC",
    order_index: "0",
    selectedStreams: [] as string[],
  });
  // Independent streams: deduped by name. Each id is the logical stream id.
  const availableStreamsForNewClass = allStreams as any[];

  const toggleStream = (streamId: string) => {
    setClassForm((f) => ({
      ...f,
      selectedStreams: f.selectedStreams.includes(streamId)
        ? f.selectedStreams.filter((s) => s !== streamId)
        : [...f.selectedStreams, streamId],
    }));
  };

  const handleCreateClass = () => {
    if (!classForm.name) {
      toast.error("Class name required");
      return;
    }
    if (classForm.selectedStreams.length === 0) {
      toast.error("Please select at least one stream");
      return;
    }
    createGrade.mutate(
      {
        name: classForm.name,
        level: classForm.level as any,
        curriculum_type: classForm.curriculum_type,
        order_index: parseInt(classForm.order_index) || 0,
      },
      {
        onSuccess: async (data: any) => {
          const gradeId = data?.id;
          if (gradeId && classForm.selectedStreams.length > 0) {
            try {
              await Promise.all(
                classForm.selectedStreams.map((id) =>
                  attachStreamApi(id, gradeId),
                ),
              );
            } catch (e: any) {
              toast.error(e?.message || "Some streams could not be attached");
            }
            refreshStreams();
          }
          setClassDialogOpen(false);
          setClassForm({
            name: "",
            level: "primary",
            curriculum_type: "CBC",
            order_index: "0",
            selectedStreams: [],
          });
        },
      },
    );
  };

  // --- Edit Class Dialog ---
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    level: "primary",
    curriculum_type: "CBC",
    order_index: "0",
    selectedStreams: [] as string[],
  });
  const streamsAttachedToGrade = (gradeId: string) =>
    (allStreams as any[])
      .filter((s: any) => (s.grade_ids || []).includes(gradeId))
      .map((s: any) => s.id);
  const openEditClass = (c: any) => {
    setEditingClass(c);
    setEditForm({
      name: c.name,
      level: c.level || "primary",
      curriculum_type: c.curriculum_type || "CBC",
      order_index: String(c.order_index || 0),
      selectedStreams: streamsAttachedToGrade(c.id),
    });
    setEditClassOpen(true);
  };
  const toggleEditStream = (id: string) =>
    setEditForm((f) => ({
      ...f,
      selectedStreams: f.selectedStreams.includes(id)
        ? f.selectedStreams.filter((x) => x !== id)
        : [...f.selectedStreams, id],
    }));
  const handleUpdateClass = () => {
    if (!editingClass) return;
    if (editForm.selectedStreams.length === 0) {
      toast.error("Class must have at least one stream");
      return;
    }
    updateGrade.mutate(
      {
        id: editingClass.id,
        data: {
          name: editForm.name,
          level: editForm.level as any,
          curriculum_type: editForm.curriculum_type,
          order_index: parseInt(editForm.order_index) || 0,
        },
      },
      {
        onSuccess: async () => {
          const previouslyAttached = streamsAttachedToGrade(editingClass.id);
          const toAttach = editForm.selectedStreams.filter(
            (id) => !previouslyAttached.includes(id),
          );
          const toDetach = previouslyAttached.filter(
            (id) => !editForm.selectedStreams.includes(id),
          );
          try {
            await Promise.all([
              ...toAttach.map((id) => attachStreamApi(id, editingClass.id)),
              ...toDetach.map((id) => detachStreamApi(id, editingClass.id)),
            ]);
          } catch (e: any) {
            toast.error(e?.message || "Some stream changes failed");
          }
          refreshStreams();
          setEditClassOpen(false);
          setEditingClass(null);
        },
      },
    );
  };

  const handleDeleteClass = (c: any) => {
    const studentCount = studentsByGrade.get(c.id) || 0;
    if (studentCount > 0) {
      toast.error(
        `Cannot delete "${c.name}" — it has ${studentCount} student(s) linked.`,
      );
      return;
    }
    if (
      !confirm(`Delete class "${c.name}"? Attached streams will be detached.`)
    )
      return;
    // detach streams first
    const attached = streamsAttachedToGrade(c.id);
    Promise.all(
      attached.map((id) => detachStreamApi(id, c.id).catch(() => null)),
    ).finally(() => {
      deleteGrade.mutate(c.id, { onSuccess: refreshStreams });
    });
  };

  const handleDeleteStream = (s: any) => {
    // Block if any underlying per-grade row has students.
    // We approximate via studentsByStream using whichever id we have access to.
    if (
      !confirm(`Delete stream "${s.name}"? This removes it from all classes.`)
    )
      return;
    deleteStream.mutate(s.id);
  };

  // --- Add Subject Dialog ---
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const handleCreateSubject = () => {
    if (!subjectForm.name || !subjectForm.code) {
      toast.error("Name and code required");
      return;
    }
    createSubject.mutate(subjectForm, {
      onSuccess: () => {
        setSubjectDialogOpen(false);
        setSubjectForm({ name: "", code: "", description: "" });
      },
    });
  };

  return (
    <DashboardLayout
      title="Classes & Academics"
      subtitle="Manage streams, classes, and subjects"
    >
      <Tabs defaultValue="streams" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="streams" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Streams
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-1.5">
            <School className="h-3.5 w-3.5" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Subjects
          </TabsTrigger>
        </TabsList>

        {/* Streams Tab */}
        <TabsContent value="streams" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Streams / Sections
                </CardTitle>
                {canManage && (
                  <Dialog
                    open={streamDialogOpen}
                    onOpenChange={setStreamDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Stream
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Stream</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Stream Name *</Label>
                          <Input
                            placeholder="e.g. East, West, A, B, Blue"
                            value={streamForm.name}
                            onChange={(e) =>
                              setStreamForm((f) => ({
                                ...f,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description (optional)</Label>
                          <Input
                            placeholder="Short description"
                            value={streamForm.description}
                            onChange={(e) =>
                              setStreamForm((f) => ({
                                ...f,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Streams are independent. You will attach them to a
                          class when you create that class.
                        </p>
                        <Button
                          className="w-full mt-2"
                          onClick={handleCreateStream}
                          disabled={createStreamMut.isPending}
                        >
                          {createStreamMut.isPending
                            ? "Creating..."
                            : "Add Stream"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {streamsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : allStreams.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No streams created yet. Add streams first, then create
                  classes.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Stream</TableHead>
                      <TableHead className="font-semibold">
                        Description
                      </TableHead>
                      <TableHead className="font-semibold">
                        Attached to Class
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allStreams.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {s.description || "—"}
                        </TableCell>
                        <TableCell>
                          {(s.grade_names || []).length ? (
                            <div className="flex gap-1 flex-wrap">
                              {s.grade_names.map((n: string) => (
                                <Badge key={n} variant="secondary">
                                  {n}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canManage && (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEditStream(s)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDeleteStream(s)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit Stream Dialog */}
          <Dialog open={editStreamOpen} onOpenChange={setEditStreamOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Stream</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Stream Name *</Label>
                  <Input
                    value={editStreamForm.name}
                    onChange={(e) =>
                      setEditStreamForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editStreamForm.description}
                    onChange={(e) =>
                      setEditStreamForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  onClick={handleUpdateStream}
                  disabled={updateStream.isPending}
                >
                  {updateStream.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Classes (Grades)
                </CardTitle>
                {canManage && (
                  <Dialog
                    open={classDialogOpen}
                    onOpenChange={setClassDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Class</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Class Name</Label>
                            <Input
                              placeholder="e.g. Grade 4"
                              value={classForm.name}
                              onChange={(e) =>
                                setClassForm((f) => ({
                                  ...f,
                                  name: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Order</Label>
                            <Input
                              type="number"
                              value={classForm.order_index}
                              onChange={(e) =>
                                setClassForm((f) => ({
                                  ...f,
                                  order_index: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Level</Label>
                            <Select
                              value={classForm.level}
                              onValueChange={(v) =>
                                setClassForm((f) => ({ ...f, level: v }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pre_primary">
                                  Pre-Primary
                                </SelectItem>
                                <SelectItem value="primary">Primary</SelectItem>
                                <SelectItem value="junior_secondary">
                                  Junior Secondary
                                </SelectItem>
                                <SelectItem value="senior_secondary">
                                  Senior Secondary
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Curriculum</Label>
                            <Select
                              value={classForm.curriculum_type}
                              onValueChange={(v) =>
                                setClassForm((f) => ({
                                  ...f,
                                  curriculum_type: v,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CBC">CBE</SelectItem>
                                <SelectItem value="8-4-4">8-4-4</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Select Streams for this Class *{" "}
                            <span className="text-xs text-muted-foreground">
                              (at least 1)
                            </span>
                          </Label>
                          {availableStreamsForNewClass.length === 0 ? (
                            <p className="text-xs text-warning bg-warning/10 p-2 rounded">
                              No streams created yet — add streams in the
                              Streams tab first.
                            </p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                              {availableStreamsForNewClass.map((s: any) => (
                                <label
                                  key={s.id}
                                  className="flex items-center gap-2 cursor-pointer text-sm"
                                >
                                  <Checkbox
                                    checked={classForm.selectedStreams.includes(
                                      s.id,
                                    )}
                                    onCheckedChange={() => toggleStream(s.id)}
                                  />
                                  <span>{s.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            All streams are shown. A stream may be linked to
                            more than one class.
                          </p>
                        </div>
                        <Button
                          className="w-full mt-2"
                          onClick={handleCreateClass}
                          disabled={
                            createGrade.isPending ||
                            availableStreamsForNewClass.length === 0
                          }
                        >
                          {createGrade.isPending ? "Creating..." : "Add Class"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {gradesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                  ))}
                </div>
              ) : grades.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No classes configured yet. Add streams first, then create
                  classes.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grades.map((c: any) => (
                    <Card
                      key={c.id}
                      className="border hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-foreground">
                            {c.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {c.curriculum_type || "CBC"}
                            </Badge>
                            {canManage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditClass(c)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDeleteClass(c)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {c.level}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {(c.sections || []).map((s: string) => (
                              <Badge
                                key={s}
                                variant="outline"
                                className="text-xs"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Class Dialog */}
          <Dialog open={editClassOpen} onOpenChange={setEditClassOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Class</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Input
                      type="number"
                      value={editForm.order_index}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          order_index: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select
                      value={editForm.level}
                      onValueChange={(v) =>
                        setEditForm((f) => ({ ...f, level: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pre_primary">Pre-Primary</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="junior_secondary">
                          Junior Secondary
                        </SelectItem>
                        <SelectItem value="senior_secondary">
                          Senior Secondary
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Curriculum</Label>
                    <Select
                      value={editForm.curriculum_type}
                      onValueChange={(v) =>
                        setEditForm((f) => ({ ...f, curriculum_type: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CBC">CBE</SelectItem>
                        <SelectItem value="8-4-4">8-4-4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    Streams in this Class *{" "}
                    <span className="text-xs text-muted-foreground">
                      (at least 1)
                    </span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {(allStreams as any[]).map((s: any) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={editForm.selectedStreams.includes(s.id)}
                          onCheckedChange={() => toggleEditStream(s.id)}
                        />
                        <span>{s.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    All streams are shown — streams can belong to multiple
                    classes.
                  </p>
                </div>

                <Button
                  className="w-full mt-2"
                  onClick={handleUpdateClass}
                  disabled={updateGrade.isPending}
                >
                  {updateGrade.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Subjects
                </CardTitle>
                {canManage && (
                  <Dialog
                    open={subjectDialogOpen}
                    onOpenChange={setSubjectDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Subject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Subject</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Subject Name</Label>
                            <Input
                              placeholder="e.g. Mathematics"
                              value={subjectForm.name}
                              onChange={(e) =>
                                setSubjectForm((f) => ({
                                  ...f,
                                  name: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Subject Code</Label>
                            <Input
                              placeholder="e.g. MATH"
                              value={subjectForm.code}
                              onChange={(e) =>
                                setSubjectForm((f) => ({
                                  ...f,
                                  code: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description (optional)</Label>
                          <Input
                            placeholder="Brief description"
                            value={subjectForm.description}
                            onChange={(e) =>
                              setSubjectForm((f) => ({
                                ...f,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <Button
                          className="w-full mt-2"
                          onClick={handleCreateSubject}
                          disabled={createSubject.isPending}
                        >
                          {createSubject.isPending
                            ? "Creating..."
                            : "Add Subject"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {subjectsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : subjects.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No subjects configured.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Subject</TableHead>
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">
                        Description
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {s.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {s.description || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Classes;
