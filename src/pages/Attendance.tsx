import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGrades } from "@/hooks/useGrades";
import {
  useStudentAttendance,
  useSaveAttendance,
  useAttendanceSummary,
  type AttendanceStatus,
  type StudentAttendanceRow,
} from "@/hooks/useAttendance";
import {
  Search,
  Download,
  ClipboardCheck,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { usePermission } from "@/hooks/usePermission";
import { useStreams } from "@/hooks/useClasses";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; chip: string; dot: string }
> = {
  present: {
    label: "Present",
    chip: "bg-success/10 text-success border-0",
    dot: "bg-success",
  },
  absent: {
    label: "Absent",
    chip: "bg-destructive/10 text-destructive border-0",
    dot: "bg-destructive",
  },
  late: {
    label: "Late",
    chip: "bg-warning/10 text-warning border-0",
    dot: "bg-warning",
  },
  excused: {
    label: "Excused",
    chip: "bg-muted text-foreground border-0",
    dot: "bg-muted-foreground",
  },
};

type StatusMap = Record<string, { status: AttendanceStatus; remarks?: string }>;

const Attendance = () => {
  const canUpdate = usePermission("attendance:update");
  const canCreate = usePermission("attendance:create");
  const { user, hasAnyRole } = useAuth();
  const isTeacher = hasAnyRole(["teacher"]);
  const canEditAttendance = canUpdate || canCreate;
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const { data: streams = [] } = useStreams(
    gradeFilter !== "all" ? gradeFilter : undefined,
  );
  // Class-teacher scoping: when a teacher opens a grade they don't own,
  // show them an informational banner and disable editing.
  const isNotMyClass =
    isTeacher &&
    gradeFilter !== "all" &&
    streams.length > 0 &&
    !streams.some((s) => s.class_teacher_id && s.class_teacher_id === user?.id);
  const classTeacherName = (() => {
    const s = streams.find((x) => x.class_teacher_id);
    return s ? "the assigned class teacher" : "no class teacher yet";
  })();
  const editingBlocked = !canEditAttendance || (isTeacher && isNotMyClass);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [overrides, setOverrides] = useState<StatusMap>({});
  const [remarkOpen, setRemarkOpen] = useState<string | null>(null);
  const [remarkDraft, setRemarkDraft] = useState("");

  const { data: serverRecords = [], isLoading } = useStudentAttendance(
    selectedDate,
    gradeFilter,
  );
  const { data: grades = [] } = useGrades();
  const { mutate: saveAttendance, isPending: isSaving } = useSaveAttendance();

  // Reset overrides when the underlying date/grade changes
  useEffect(() => {
    setOverrides({});
  }, [selectedDate, gradeFilter]);

  // Hydrate overrides from server (so non-present marks persist on edit)
  useEffect(() => {
    const initial: StatusMap = {};
    for (const r of serverRecords) {
      if (r.is_marked && r.status !== "present") {
        initial[r.student_id] = { status: r.status, remarks: r.remarks ?? "" };
      } else if (r.is_marked && r.remarks) {
        initial[r.student_id] = { status: "present", remarks: r.remarks };
      }
    }
    setOverrides(initial);
  }, [serverRecords]);

  const effective = (s: StudentAttendanceRow) =>
    overrides[s.student_id] || {
      status: s.status as AttendanceStatus,
      remarks: s.remarks ?? "",
    };

  const filtered = useMemo(
    () =>
      serverRecords.filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.student_name?.toLowerCase().includes(q) ||
          r.admission_number?.toLowerCase().includes(q)
        );
      }),
    [serverRecords, search],
  );

  const tallies = useMemo(() => {
    const t = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const r of filtered) t[effective(r).status]++;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, overrides]);

  const setStatus = (studentId: string, status: AttendanceStatus) =>
    setOverrides((o) => ({
      ...o,
      [studentId]: { ...(o[studentId] || {}), status },
    }));

  const setRemark = (studentId: string, remarks: string) =>
    setOverrides((o) => ({
      ...o,
      [studentId]: { status: o[studentId]?.status || "present", remarks },
    }));

  const markAll = (status: AttendanceStatus) => {
    const next: StatusMap = {};
    for (const r of filtered)
      next[r.student_id] = {
        status,
        remarks: overrides[r.student_id]?.remarks,
      };
    setOverrides((prev) => ({ ...prev, ...next }));
  };

  const resetOverrides = () => setOverrides({});

  const dirtyCount = Object.keys(overrides).length;

  const handleSave = () => {
    if (serverRecords.length === 0) {
      toast.error("No students loaded for this date/grade.");
      return;
    }
    // Persist EVERY student so the day is fully captured (default-present model)
    const records = serverRecords.map((s) => {
      const eff = effective(s);
      return {
        student_id: s.student_id,
        status: eff.status,
        remarks: eff.remarks?.trim() || undefined,
      };
    });
    saveAttendance(
      { date: selectedDate, records },
      {
        onSuccess: () => toast.success(`Attendance saved (${records.length})`),
        onError: (err: any) =>
          toast.error(err?.message || "Failed to save attendance."),
      },
    );
  };

  const exportCsv = () => {
    const header = [
      "Admission",
      "Student",
      "Grade",
      "Stream",
      "Status",
      "Remarks",
    ];
    const rows = filtered.map((s) => {
      const e = effective(s);
      return [
        s.admission_number || "",
        s.student_name || "",
        s.grade_name || "",
        s.stream_name || "",
        e.status,
        (e.remarks || "").replace(/[\r\n,]+/g, " "),
      ].join(",");
    });
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------- Monthly summary tab --------
  const now = new Date();
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);
  const [summaryGrade, setSummaryGrade] = useState("all");
  const { data: summary = [], isLoading: summaryLoading } =
    useAttendanceSummary(summaryYear, summaryMonth, summaryGrade);

  return (
    <DashboardLayout
      title="Attendance"
      subtitle="Default-present register — only mark exceptions"
    >
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily" className="gap-1.5">
            <ClipboardCheck className="h-4 w-4" /> Daily Register
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> Monthly Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4 pb-24 sm:pb-0">
          {/* Stat cards */}
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              {
                label: "Total",
                value: filtered.length,
                icon: ClipboardCheck,
                tint: "bg-primary/10 text-primary",
              },
              {
                label: "Present",
                value: tallies.present,
                icon: UserCheck,
                tint: "bg-success/10 text-success",
              },
              {
                label: "Absent",
                value: tallies.absent,
                icon: UserX,
                tint: "bg-destructive/10 text-destructive",
              },
              {
                label: "Late",
                value: tallies.late,
                icon: Clock,
                tint: "bg-warning/10 text-warning",
              },
            ].map((c) => (
              <Card key={c.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.tint}`}
                  >
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-10" />
                    ) : (
                      <p className="text-xl font-bold">{c.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-semibold">
                    Register
                  </CardTitle>
                  <Badge variant="secondary" className="font-normal">
                    {format(new Date(selectedDate), "EEE, dd MMM yyyy")}
                  </Badge>
                  {dirtyCount > 0 && (
                    <Badge className="bg-warning/15 text-warning border-0">
                      {dirtyCount} pending
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PermissionGate permission="reports:export">
                    <Button variant="outline" size="sm" onClick={exportCsv}>
                      <Download className="h-4 w-4 mr-1.5" /> Export CSV
                    </Button>
                  </PermissionGate>
                  {canEditAttendance && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetOverrides}
                        disabled={dirtyCount === 0}
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
                      </Button>
                      {/* Desktop save button — hidden on mobile (shown in sticky bar) */}
                      <Button
                        size="sm"
                        className="hidden sm:inline-flex"
                        onClick={handleSave}
                        disabled={isSaving || isLoading || editingBlocked}
                      >
                        <Save className="h-4 w-4 mr-1.5" />{" "}
                        {isSaving ? "Saving…" : "Save Day"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isTeacher && isNotMyClass && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You are not the class teacher for this class. Only{" "}
                    {classTeacherName} can mark attendance here.
                  </AlertDescription>
                </Alert>
              )}
              {/* Filter bar */}
              <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name or admission no…"
                    className="pl-9 h-9 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    className="flex-1 h-9 sm:w-44 sm:flex-none"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="flex-1 h-9 sm:w-44 sm:flex-none">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All grades</SelectItem>
                      {grades.map((g: any) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1 text-xs sm:ml-auto">
                  <span className="text-muted-foreground mr-1">Bulk:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    disabled={editingBlocked}
                    onClick={() => markAll("present")}
                  >
                    All present
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    disabled={editingBlocked}
                    onClick={() => markAll("absent")}
                  >
                    All absent
                  </Button>
                </div>
              </div>

              {/* Mobile card list — shown below md */}
              <div className="md:hidden space-y-3">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    No active students for this filter.
                  </div>
                ) : (
                  filtered.map((s) => {
                    const eff = effective(s);
                    const meta = STATUS_META[eff.status];
                    return (
                      <div
                        key={s.student_id}
                        className="rounded-lg border p-3 space-y-3 bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                            {s.student_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {s.student_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.admission_number}
                              {s.grade_name ? ` · ${s.grade_name}` : ""}
                              {s.stream_name ? ` ${s.stream_name}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${meta.dot}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setRemarkOpen(s.student_id);
                                setRemarkDraft(eff.remarks || "");
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {/* Status buttons — full-width grid, big tap targets */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {(
                            [
                              "present",
                              "absent",
                              "late",
                              "excused",
                            ] as AttendanceStatus[]
                          ).map((st) => (
                            <button
                              key={st}
                              disabled={editingBlocked}
                              onClick={() => setStatus(s.student_id, st)}
                              className={`py-3 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                eff.status === st
                                  ? STATUS_META[st].chip +
                                    " ring-2 ring-current"
                                  : "text-muted-foreground bg-muted/50 hover:bg-muted active:bg-muted"
                              }`}
                            >
                              {STATUS_META[st].label}
                            </button>
                          ))}
                        </div>
                        {eff.remarks && (
                          <p className="text-[11px] text-muted-foreground italic px-1">
                            “{eff.remarks}”
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop table — hidden below md */}
              <div className="hidden md:block rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold w-32">
                        Admission
                      </TableHead>
                      <TableHead className="font-semibold">Class</TableHead>
                      <TableHead className="font-semibold w-[320px]">
                        Quick mark
                      </TableHead>
                      <TableHead className="font-semibold w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      [1, 2, 3, 4].map((i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No active students for this filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((s) => {
                        const eff = effective(s);
                        const meta = STATUS_META[eff.status];
                        return (
                          <TableRow key={s.student_id} className="group">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                  {s.student_name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {s.student_name}
                                  </p>
                                  {eff.remarks && (
                                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                                      “{eff.remarks}”
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {s.admission_number}
                            </TableCell>
                            <TableCell className="text-xs">
                              {s.grade_name || "—"}
                              {s.stream_name ? ` · ${s.stream_name}` : ""}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {(
                                  [
                                    "present",
                                    "absent",
                                    "late",
                                    "excused",
                                  ] as AttendanceStatus[]
                                ).map((st) => (
                                  <button
                                    key={st}
                                    disabled={editingBlocked}
                                    onClick={() => setStatus(s.student_id, st)}
                                    className={`h-7 px-2 rounded-md text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                      eff.status === st
                                        ? STATUS_META[st].chip +
                                          " ring-1 ring-current"
                                        : "text-muted-foreground hover:bg-muted"
                                    }`}
                                  >
                                    {STATUS_META[st].label}
                                  </button>
                                ))}
                                <span
                                  className={`ml-1 inline-block h-2 w-2 rounded-full ${meta.dot}`}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setRemarkOpen(s.student_id);
                                  setRemarkDraft(eff.remarks || "");
                                }}
                                title="Add remarks"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between mt-3 gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:block">
                  Tip: everyone is Present by default — only flip the ones who
                  aren't.
                </span>
                <div className="flex items-center gap-3">
                  {(
                    [
                      "present",
                      "absent",
                      "late",
                      "excused",
                    ] as AttendanceStatus[]
                  ).map((st) => (
                    <span key={st} className="flex items-center gap-1">
                      <span
                        className={`h-2 w-2 rounded-full ${STATUS_META[st].dot}`}
                      />
                      {STATUS_META[st].label} {tallies[st]}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sticky mobile Save button — fixed bottom bar, visible only on small screens */}
        <PermissionGate permission="attendance:update">
          <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-background/95 backdrop-blur border-t p-3 flex gap-2">
            <div className="flex-1 text-xs text-muted-foreground flex items-center gap-1">
              {dirtyCount > 0 ? (
                <span className="font-medium text-warning">
                  {dirtyCount} pending
                </span>
              ) : (
                <span>{format(new Date(selectedDate), "EEE, dd MMM")}</span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={resetOverrides}
              disabled={dirtyCount === 0}
              className="h-9"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-9 px-6"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? "Saving…" : "Save Day"}
            </Button>
          </div>
        </PermissionGate>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold">
                  Monthly Summary
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(summaryYear)}
                    onValueChange={(v) => setSummaryYear(Number(v))}
                  >
                    <SelectTrigger className="w-28 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        now.getFullYear() - 1,
                        now.getFullYear(),
                        now.getFullYear() + 1,
                      ].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(summaryMonth)}
                    onValueChange={(v) => setSummaryMonth(Number(v))}
                  >
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {format(new Date(2000, m - 1, 1), "MMMM")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={summaryGrade} onValueChange={setSummaryGrade}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All grades</SelectItem>
                      {grades.map((g: any) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Absent</TableHead>
                    <TableHead className="text-right">Late</TableHead>
                    <TableHead className="text-right">Excused</TableHead>
                    <TableHead className="text-right">Marked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryLoading ? (
                    [1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : summary.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No data for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.map((r: any) => (
                      <TableRow key={r.student_id}>
                        <TableCell>
                          <div className="font-medium">{r.student_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {r.admission_number}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.grade_name || "—"}
                          {r.stream_name ? ` · ${r.stream_name}` : ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(r.present_days) || 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-destructive">
                          {Number(r.absent_days) || 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-warning">
                          {Number(r.late_days) || 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(r.excused_days) || 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {Number(r.total_marked) || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Remarks dialog */}
      <Dialog
        open={!!remarkOpen}
        onOpenChange={(o) => {
          if (!o) setRemarkOpen(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add remarks</DialogTitle>
          </DialogHeader>
          <Textarea
            value={remarkDraft}
            onChange={(e) => setRemarkDraft(e.target.value)}
            rows={4}
            placeholder="e.g. sick, parent called, late bus…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (remarkOpen) setRemark(remarkOpen, remarkDraft);
                setRemarkOpen(null);
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Attendance;
