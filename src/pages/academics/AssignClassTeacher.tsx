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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useStreams, useTeachers, useUpdateStream } from "@/hooks/useClasses";
import { usePermissions } from "@/hooks/usePermission";
import { useAuth } from "@/contexts/AuthContext";
import { UserCheck, Edit, Plus, X, Search } from "lucide-react";
import { toast } from "sonner";

const AssignClassTeacher = () => {
  const { hasAnyRole } = useAuth();
  const isSuperAdmin = hasAnyRole(["super_admin"]);
  const perms = usePermissions(["classes:create", "classes:update", "classes:delete"]);
  const { data: streams = [], isLoading } = useStreams();
  const { data: teachers = [] } = useTeachers();
  const updateStream = useUpdateStream();

  const [showAssign, setShowAssign] = useState(false);
  const [streamId, setStreamId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const arr = streams as any[];
    return {
      total: arr.length,
      assigned: arr.filter((s) => s.class_teacher_id).length,
      unassigned: arr.filter((s) => !s.class_teacher_id).length,
    };
  }, [streams]);

  const teacherById = (id: string | null) => {
    if (!id) return null;
    return teachers.find((t) => t.teacher_id === id) || null;
  };

  const filteredStreams = useMemo(() => {
    const arr = streams as any[];
    if (!search) return arr;
    const q = search.toLowerCase();
    return arr.filter((s) => {
      const t = teacherById(s.class_teacher_id);
      const tName = t ? `${t.first_name} ${t.last_name}` : "";
      return (
        s.name?.toLowerCase().includes(q) ||
        s.grade_name?.toLowerCase().includes(q) ||
        tName.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streams, teachers, search]);

  const handleAssign = () => {
    if (!streamId || !teacherId) {
      toast.error("Select a stream and teacher");
      return;
    }
    updateStream.mutate(
      { id: streamId, data: { class_teacher_id: teacherId } as any },
      {
        onSuccess: () => {
          setShowAssign(false);
          setStreamId("");
          setTeacherId("");
        },
      },
    );
  };

  const handleRemove = (sid: string) => {
    updateStream.mutate({ id: sid, data: { class_teacher_id: null } as any });
  };

  return (
    <DashboardLayout
      title="Assign Class Teacher"
      subtitle="Manage class teacher assignments per stream"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Streams</p>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">
                {stats.assigned}
              </p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">
                {stats.unassigned}
              </p>
              <p className="text-xs text-muted-foreground">Unassigned</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Class Teacher
                Assignments
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search class / stream / teacher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 w-64"
                  />
                </div>
                {perms["classes:update"] && (
                <Dialog
                  open={showAssign}
                  onOpenChange={(o) => {
                    setShowAssign(o);
                    if (!o) {
                      setStreamId("");
                      setTeacherId("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Assign Teacher
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {streamId ? "Reassign" : "Assign"} Class Teacher
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                      <div className="space-y-2">
                        <Label>Class & Stream *</Label>
                        <Select value={streamId} onValueChange={setStreamId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stream" />
                          </SelectTrigger>
                          <SelectContent>
                            {(streams as any[]).map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.grade_name || "—"} · {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Teacher *</Label>
                        <Select value={teacherId} onValueChange={setTeacherId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((t) => (
                              <SelectItem
                                key={t.teacher_id}
                                value={t.teacher_id}
                              >
                                {t.first_name} {t.last_name}
                                {t.specialization
                                  ? ` · ${t.specialization}`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAssign(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAssign}
                        disabled={updateStream.isPending}
                      >
                        {updateStream.isPending ? "Saving..." : "Assign"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredStreams.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">
                No streams found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Class</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead>Class Teacher</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStreams.map((s: any) => {
                    const t = teacherById(s.class_teacher_id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.grade_name || "—"}
                        </TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>
                          {t ? (
                            <div>
                              <p className="font-medium">
                                {t.first_name} {t.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t.employee_number}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Not assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={t ? "default" : "destructive"}
                            className="text-[10px]"
                          >
                            {t ? "assigned" : "unassigned"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {perms["classes:update"] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStreamId(s.id);
                                setTeacherId(s.class_teacher_id || "");
                                setShowAssign(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {t && isSuperAdmin && perms["classes:delete"] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(s.id)}
                              title="Remove"
                            >
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AssignClassTeacher;
