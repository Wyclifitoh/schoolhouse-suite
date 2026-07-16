import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Save,
  BookOpen,
  Info,
  Plus,
  Trash2,
  Users,
  CheckSquare,
  Square,
  RefreshCcw,
} from "lucide-react";
import { useClasses, useSubjects, useStreams } from "@/hooks/useClasses";
import {
  useSubjectAllocations,
  useAllocateSubjects,
  useOptionalGroups,
  useDeleteOptionalGroup,
  useSubjectRegistrations,
  useSetSubjectRegistrations,
} from "@/hooks/useAssessments";
import { PermissionGate } from "@/components/PermissionGate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Requirement = "REQUIRED" | "OPTIONAL";

interface SubjectCfg {
  requirement: Requirement;
  optional_group_id: string | null;
}

const SubjectAllocation = () => {
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const [gradeId, setGradeId] = useState<string>("");
  const { data: allocations = [], isLoading } = useSubjectAllocations(gradeId);
  const { data: groups = [] } = useOptionalGroups(gradeId);
  const allocate = useAllocateSubjects();
  const deleteGroup = useDeleteOptionalGroup();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cfg, setCfg] = useState<Record<string, SubjectCfg>>({});
  const [localGroups, setLocalGroups] = useState<
    { id: string; name: string; isNew?: boolean }[]
  >([]);
  const [newGroupName, setNewGroupName] = useState("");

  // Sync local state from server whenever the class or its allocations change.
  useEffect(() => {
    const next = new Set<string>();
    const nextCfg: Record<string, SubjectCfg> = {};
    for (const a of allocations as any[]) {
      next.add(a.subject_id);
      nextCfg[a.subject_id] = {
        requirement: (a.requirement as Requirement) || "REQUIRED",
        optional_group_id: a.optional_group_id || null,
      };
    }
    setSelected(next);
    setCfg(nextCfg);
    setLocalGroups((groups as any[]).map((g) => ({ id: g.id, name: g.name })));
  }, [allocations, groups, gradeId]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
      const c = { ...cfg };
      delete c[id];
      setCfg(c);
    } else {
      next.add(id);
      setCfg({
        ...cfg,
        [id]: { requirement: "REQUIRED", optional_group_id: null },
      });
    }
    setSelected(next);
  };

  const setSubjectCfg = (id: string, patch: Partial<SubjectCfg>) => {
    setCfg((c) => ({
      ...c,
      [id]: {
        ...(c[id] || { requirement: "REQUIRED", optional_group_id: null }),
        ...patch,
      },
    }));
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    if (localGroups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      setNewGroupName("");
      return;
    }
    // Temp id for optimistic use; the server upserts by name so any
    // subject configured with `optional_group_id === temp` is sent as
    // `new_group_name` instead when saving.
    const tempId = `new:${name}`;
    setLocalGroups([...localGroups, { id: tempId, name, isNew: true }]);
    setNewGroupName("");
  };

  const handleSave = () => {
    if (!gradeId) return;
    const subject_ids = Array.from(selected);
    const subject_config = subject_ids.map((sid) => {
      const c = cfg[sid] || {
        requirement: "REQUIRED",
        optional_group_id: null,
      };
      const isNewGroup =
        c.requirement === "OPTIONAL" && c.optional_group_id?.startsWith("new:");
      return {
        subject_id: sid,
        requirement: c.requirement,
        optional_group_id: isNewGroup ? null : c.optional_group_id,
        new_group_name: isNewGroup ? c.optional_group_id!.slice(4) : null,
      };
    });
    const newGroups = localGroups
      .filter((g) => g.isNew)
      .map((g) => ({ name: g.name, pick_count: 1 }));
    allocate.mutate({
      grade_id: gradeId,
      subject_ids,
      subject_config,
      groups: newGroups,
    });
  };

  const activeSubjects = (subjects as any[]).filter(
    (s) => (s.status ?? "active") === "active",
  );

  // -----------------------------------------------------------------
  // Student-level subject registration (secondary schools).
  // Loads only after Class + Subject are selected. Stream is optional.
  // -----------------------------------------------------------------
  const { data: streams = [] } = useStreams(gradeId || undefined);
  const [regStreamId, setRegStreamId] = useState<string>("");
  const [regSubjectId, setRegSubjectId] = useState<string>("");
  const regEnabled = !!(gradeId && regSubjectId);
  const { data: regData, isLoading: regLoading } = useSubjectRegistrations({
    grade_id: gradeId,
    stream_id: regStreamId || undefined,
    subject_id: regSubjectId,
  });
  const setRegs = useSetSubjectRegistrations();
  const [regSelected, setRegSelected] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (regData?.students) {
      const next = new Set<string>();
      regData.students.forEach((s) => {
        if (s.registered) next.add(s.id);
      });
      setRegSelected(next);
    }
  }, [regData]);

  const toggleReg = (id: string) => {
    const next = new Set(regSelected);
    next.has(id) ? next.delete(id) : next.add(id);
    setRegSelected(next);
  };
  const selectAllReg = () =>
    setRegSelected(new Set((regData?.students || []).map((s) => s.id)));
  const clearAllReg = () => setRegSelected(new Set());
  const invertReg = () => {
    const all = regData?.students || [];
    const next = new Set<string>();
    for (const s of all) if (!regSelected.has(s.id)) next.add(s.id);
    setRegSelected(next);
  };
  const saveReg = () => {
    if (!gradeId || !regSubjectId) return;
    setRegs.mutate({
      grade_id: gradeId,
      stream_id: regStreamId || null,
      subject_id: regSubjectId,
      student_ids: Array.from(regSelected),
    });
  };

  // Which subjects can be registered per-student? Only those actually
  // allocated to this class.
  const allocatedSubjects = useMemo(() => {
    const ids = new Set((allocations as any[]).map((a) => a.subject_id));
    return activeSubjects.filter((s: any) => ids.has(s.id));
  }, [allocations, activeSubjects]);
  const activeSubjectMeta = allocatedSubjects.find(
    (s: any) => s.id === regSubjectId,
  );
  const isSecondary = regData?.meta?.is_secondary ?? false;
  const isRequiredHere = regData?.meta?.requirement === "REQUIRED";

  return (
    <DashboardLayout
      title="Subject Allocation"
      subtitle="Assign subjects to each class and mark optional ones so rankings and report cards use a fair denominator."
    >
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Mark subjects that every learner sits as <b>Required</b>. Alternatives
          (e.g. CRE vs IRE, or one of French/German/Arabic) should be marked{" "}
          <b>Optional</b> and grouped together — each learner then counts one
          subject per group toward their mean and rank. Missing required marks
          still count as 0 so absentees can never shrink their own denominator.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Layers className="h-4 w-4 text-primary" /> Allocate by Class
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={gradeId} onValueChange={setGradeId}>
                <SelectTrigger className="w-56 h-9">
                  <SelectValue placeholder="Select a class…" />
                </SelectTrigger>
                <SelectContent>
                  {(classes as any[]).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <PermissionGate permission="classes:update">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!gradeId || allocate.isPending}
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Allocation
                </Button>
              </PermissionGate>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!gradeId ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Pick a class to allocate subjects.
            </p>
          ) : classesLoading || isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activeSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No active subjects. Add subjects first.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-2">
                {activeSubjects.map((s: any) => {
                  const checked = selected.has(s.id);
                  const c = cfg[s.id] || {
                    requirement: "REQUIRED" as Requirement,
                    optional_group_id: null,
                  };
                  return (
                    <div
                      key={s.id}
                      className={`rounded-md border p-3 transition ${
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(s.id)}
                        />
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.code || "—"}
                          </div>
                        </div>
                        {s.category && (
                          <Badge variant="outline" className="text-xs">
                            {s.category}
                          </Badge>
                        )}
                      </label>
                      {checked && (
                        <div className="mt-3 pl-8 flex flex-wrap items-center gap-2">
                          <Select
                            value={c.requirement}
                            onValueChange={(v) =>
                              setSubjectCfg(s.id, {
                                requirement: v as Requirement,
                                optional_group_id:
                                  v === "REQUIRED" ? null : c.optional_group_id,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REQUIRED">Required</SelectItem>
                              <SelectItem value="OPTIONAL">Optional</SelectItem>
                            </SelectContent>
                          </Select>
                          {c.requirement === "OPTIONAL" && (
                            <Select
                              value={c.optional_group_id || ""}
                              onValueChange={(v) =>
                                setSubjectCfg(s.id, { optional_group_id: v })
                              }
                            >
                              <SelectTrigger className="h-8 w-52 text-xs">
                                <SelectValue placeholder="Choose optional group…" />
                              </SelectTrigger>
                              <SelectContent>
                                {localGroups.length === 0 ? (
                                  <div className="px-2 py-1 text-xs text-muted-foreground">
                                    Add a group first →
                                  </div>
                                ) : (
                                  localGroups.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                      {g.name}
                                      {g.isNew ? " (new)" : ""}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          )}
                          {c.requirement === "OPTIONAL" &&
                            !c.optional_group_id && (
                              <span className="text-xs text-amber-600">
                                Assign a group so learners are graded fairly.
                              </span>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <aside className="space-y-3">
                <div className="rounded-md border p-3">
                  <div className="text-sm font-semibold mb-2">
                    Optional Groups
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Group subjects where each learner picks one (e.g.
                    "Religion", "Languages").
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g. Religion"
                      className="h-8 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addGroup();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addGroup}
                      disabled={!newGroupName.trim()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {localGroups.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No groups yet.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {localGroups.map((g) => {
                        const inGroup = Object.entries(cfg).filter(
                          ([, v]) =>
                            v.requirement === "OPTIONAL" &&
                            v.optional_group_id === g.id,
                        );
                        return (
                          <li
                            key={g.id}
                            className="flex items-center justify-between text-xs rounded border px-2 py-1.5"
                          >
                            <div>
                              <div className="font-medium">
                                {g.name}{" "}
                                {g.isNew && (
                                  <span className="text-muted-foreground">
                                    (unsaved)
                                  </span>
                                )}
                              </div>
                              <div className="text-muted-foreground">
                                {inGroup.length} subject
                                {inGroup.length === 1 ? "" : "s"}
                              </div>
                            </div>
                            {!g.isNew && (
                              <PermissionGate permission="classes:update">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => deleteGroup.mutate(g.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </PermissionGate>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ STUDENT REGISTRATION ============ */}
      <Card className="mt-6">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="h-4 w-4 text-primary" /> Student Registration
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Select which students in this class actually take a subject.
                Used by secondary schools with elective combinations. CBC/CBE
                schools can ignore this panel — every student automatically
                takes every allocated subject.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
            <div>
              <label className="text-xs text-muted-foreground">Class</label>
              <Select
                value={gradeId}
                onValueChange={(v) => {
                  setGradeId(v);
                  setRegSubjectId("");
                  setRegStreamId("");
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select class…" />
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
              <label className="text-xs text-muted-foreground">
                Stream (optional)
              </label>
              <Select
                value={regStreamId || "__all__"}
                onValueChange={(v) => setRegStreamId(v === "__all__" ? "" : v)}
                disabled={!gradeId}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All streams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All streams</SelectItem>
                  {(streams as any[]).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Subject</label>
              <Select
                value={regSubjectId}
                onValueChange={setRegSubjectId}
                disabled={!gradeId || allocatedSubjects.length === 0}
              >
                <SelectTrigger className="h-9">
                  <SelectValue
                    placeholder={
                      allocatedSubjects.length
                        ? "Select subject…"
                        : "Allocate subjects first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {allocatedSubjects.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!regEnabled ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Select a class and subject to register students.
            </p>
          ) : regLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : !isSecondary ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This school is set up on CBC/CBE. All active students in this
                class automatically take{" "}
                <b>{activeSubjectMeta?.name || "this subject"}</b> — no
                registration is required.
              </AlertDescription>
            </Alert>
          ) : isRequiredHere ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <b>{activeSubjectMeta?.name}</b> is marked <b>Required</b> on
                this class, so every student takes it. To register individual
                students, change its allocation to Optional first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {regSelected.size} of {regData?.students.length || 0} students
                  registered for <b>{activeSubjectMeta?.name}</b>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllReg}
                    type="button"
                  >
                    <CheckSquare className="h-3.5 w-3.5 mr-1" /> Select all
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllReg}
                    type="button"
                  >
                    <Square className="h-3.5 w-3.5 mr-1" /> Clear all
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={invertReg}
                    type="button"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Invert
                  </Button>
                  <PermissionGate permission="classes:update">
                    <Button
                      size="sm"
                      onClick={saveReg}
                      disabled={setRegs.isPending}
                    >
                      <Save className="h-3.5 w-3.5 mr-1" /> Save Registrations
                    </Button>
                  </PermissionGate>
                </div>
              </div>
              <div className="border rounded-md max-h-[420px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Adm #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Stream</TableHead>
                      <TableHead className="text-right">
                        Takes this subject
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(regData?.students || []).map((s) => {
                      const streamName =
                        (streams as any[]).find((st) => st.id === s.stream_id)
                          ?.name || "—";
                      const checked = regSelected.has(s.id);
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleReg(s.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {s.admission_number}
                          </TableCell>
                          <TableCell>
                            {s.first_name} {s.last_name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {streamName}
                          </TableCell>
                          <TableCell className="text-right">
                            {checked ? (
                              <Badge variant="default" className="text-xs">
                                Registered
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                —
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(regData?.students || []).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No active students in this class
                          {regStreamId ? " for the selected stream" : ""}.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default SubjectAllocation;
