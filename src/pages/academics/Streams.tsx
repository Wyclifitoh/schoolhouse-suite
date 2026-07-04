import { useState } from "react";
import { usePermissions } from "@/hooks/usePermission";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Layers, Plus, Trash2, Users, Pencil } from "lucide-react";
import {
  useClasses,
  useIndependentStreams,
  useCreateIndependentStream,
  useDeleteIndependentStream,
  useUpdateIndependentStream,
} from "@/hooks/useClasses";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Streams = () => {
  const { data: grades = [] } = useClasses();
  const { data: streams = [], isLoading } = useIndependentStreams();
  const { primaryRole } = useAuth();
  const rawP = usePermissions(["classes:create", "classes:update", "classes:delete"]);
  const isTeacher = primaryRole === "teacher";
  const p = isTeacher ? { "classes:create": false, "classes:update": false, "classes:delete": false } : rawP;
  const createStream = useCreateIndependentStream();
  const deleteStream = useDeleteIndependentStream();
  const updateStream = useUpdateIndependentStream();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    capacity: "40",
  });
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    capacity: "",
  });

  const handleAdd = () => {
    if (!form.name) {
      toast.error("Stream name is required");
      return;
    }
    createStream.mutate(
      {
        name: form.name,
        description: form.description || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      },
      {
        onSuccess: () => {
          setShowAdd(false);
          setForm({ name: "", description: "", capacity: "40" });
        },
      },
    );
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setEditForm({
      name: s.name,
      description: s.description || "",
      capacity: s.capacity ? String(s.capacity) : "",
    });
  };
  const handleSaveEdit = () => {
    if (!editing) return;
    updateStream.mutate(
      {
        id: editing.id,
        data: {
          name: editForm.name,
          description: editForm.description || null,
          capacity: editForm.capacity
            ? (parseInt(editForm.capacity) as any)
            : null,
        } as any,
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleDelete = (s: any) => {
    if (confirm(`Delete stream "${s.name}"? This removes it from all classes.`))
      deleteStream.mutate(s.id);
  };

  const totalCapacity = (streams as any[]).reduce(
    (sum: number, s: any) => sum + (s.capacity || 0),
    0,
  );

  return (
    <DashboardLayout
      title="Streams / Sections"
      subtitle="Manage streams independently — attach them to classes from the Classes tab"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {streams.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Streams</p>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{totalCapacity}</p>
              <p className="text-xs text-muted-foreground">Total Capacity</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">{grades.length}</p>
              <p className="text-xs text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> All Streams
              </CardTitle>
              {p["classes:create"] && (
              <Dialog open={showAdd} onOpenChange={setShowAdd}>
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
                  <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                      <Label>Stream Name *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="e.g. Blue, East, A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={form.description}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Capacity</Label>
                      <Input
                        type="number"
                        value={form.capacity}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, capacity: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAdd(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAdd}
                      disabled={createStream.isPending}
                    >
                      {createStream.isPending ? "Adding..." : "Add Stream"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : streams.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">
                No streams yet.
              </p>
            ) : (
              <>
              <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Stream</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">
                      Attached Classes
                    </TableHead>
                    <TableHead className="font-semibold">Capacity</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(streams as any[]).map((s: any) => (
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
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.capacity || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDelete(s)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Mobile View Streams */}
              <div className="md:hidden flex flex-col gap-3 p-4">
                {(streams as any[]).map((s: any) => (
                  <Card key={s.id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-lg">{s.name}</div>
                        {s.description && (
                          <div className="text-sm text-muted-foreground">{s.description}</div>
                        )}
                      </div>
                      <div className="flex justify-end gap-1">
                        {p["classes:update"] && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {p["classes:delete"] && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDelete(s)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-muted-foreground mb-1">Attached Classes</span>
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
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-xs uppercase text-muted-foreground">Capacity:</span>
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {s.capacity || "—"}
                    </div>
                  </Card>
                ))}
              </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Stream</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, capacity: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateStream.isPending}
              >
                {updateStream.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Streams;
