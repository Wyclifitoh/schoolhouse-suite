import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Shield,
  ChevronRight,
  Search,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Role {
  id?: string;
  code: string;
  label: string;
  description: string;
  permission_count: number;
  builtin?: boolean;
}

interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
}

// Preferred display order for actions; any extra actions found in the
// catalog (import, export, assign, waive, approve, publish, etc.) are
// appended automatically so no permission is ever hidden from the UI.
const ACTION_ORDER = [
  "read",
  "create",
  "update",
  "delete",
  "manage",
  "approve",
  "assign",
  "waive",
  "import",
  "export",
  "publish",
  "promote",
  "transfer",
  "receipt",
  "reverse",
  "issue",
];

// ----------------------------------------------------------------------------
// /settings/roles  — list all system roles
// ----------------------------------------------------------------------------
export const RolesList = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["system-roles"],
    queryFn: async () => {
      const r = await api.get<any>("/roles");
      return (r?.data || r || []) as Role[];
    },
  });

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ code: "", label: "", description: "" });

  const createRole = useMutation({
    mutationFn: () => api.post("/roles/custom", form),
    onSuccess: () => {
      toast.success("Custom role created");
      qc.invalidateQueries({ queryKey: ["system-roles"] });
      setAddOpen(false);
      setForm({ code: "", label: "", description: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/custom/${id}`),
    onSuccess: () => {
      toast.success("Custom role deleted");
      qc.invalidateQueries({ queryKey: ["system-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardLayout
      title="Roles & Permissions"
      subtitle="Manage system roles and what each role is allowed to do"
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-primary" /> System Roles
              </CardTitle>
              <CardDescription className="mt-1">
                Click <span className="font-medium">Assign Permissions</span> on
                a role to choose what actions users with that role can perform.
                Built-in roles cannot be deleted but their permissions are fully
                configurable per school.
              </CardDescription>
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Custom Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create custom role</DialogTitle>
                  <DialogDescription>
                    Define a new role for this school. After creating, assign
                    permissions to control what users with this role can do.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <Label htmlFor="role-label">Role name</Label>
                    <Input
                      id="role-label"
                      placeholder="e.g. Sports Coordinator"
                      value={form.label}
                      onChange={(e) =>
                        setForm({ ...form, label: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-code">Role code</Label>
                    <Input
                      id="role-code"
                      placeholder="e.g. sports_coordinator"
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lowercase letters, numbers and underscores only.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="role-desc">Description (optional)</Label>
                    <Textarea
                      id="role-desc"
                      placeholder="What this role is responsible for"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createRole.mutate()}
                    disabled={!form.code || !form.label || createRole.isPending}
                  >
                    {createRole.isPending ? "Creating…" : "Create role"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold text-center">
                      Permissions
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {r.label}
                          {!r.builtin && (
                            <Badge variant="outline" className="text-[10px]">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {r.code}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {r.permission_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/settings/roles/${r.code}/permissions`)
                            }
                          >
                            Assign Permissions{" "}
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                          {!r.builtin && r.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete role “{r.label}”?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Users currently assigned to this role will
                                    lose its permissions immediately. This
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteRole.mutate(r.id!)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete role
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

// ----------------------------------------------------------------------------
// /settings/roles/:role/permissions  — assign permissions to a single role
// ----------------------------------------------------------------------------
export const RolePermissionsEditor = () => {
  const { role = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: all = [], isLoading: allLoading } = useQuery({
    queryKey: ["permissions-catalog"],
    queryFn: async () => {
      const r = await api.get<any>("/roles/permissions");
      return (r?.data || r || []) as Permission[];
    },
  });

  const { data: current = [], isLoading: currentLoading } = useQuery({
    queryKey: ["role-permissions", role],
    queryFn: async () => {
      const r = await api.get<any>(`/roles/${role}/permissions`);
      return (r?.data || r || []) as Permission[];
    },
    enabled: !!role,
  });

  useEffect(() => {
    setSelected(new Set(current.map((p) => p.id)));
  }, [current]);

  const save = useMutation({
    mutationFn: () =>
      api.put(`/roles/${role}/permissions`, {
        permission_ids: Array.from(selected),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role-permissions", role] });
      qc.invalidateQueries({ queryKey: ["system-roles"] });
      toast.success("Permissions saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Group permissions by module and compute the union of actions present
  // across the entire catalog so we render one column per real action.
  const { grouped, actions } = useMemo(() => {
    const filtered = all.filter(
      (p) =>
        !search ||
        p.module.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()),
    );
    const map: Record<string, Record<string, Permission>> = {};
    const actionSet = new Set<string>();
    for (const p of filtered) {
      const action = p.action || p.code.split(":").pop() || "manage";
      map[p.module] ||= {};
      map[p.module][action] = p;
      actionSet.add(action);
    }
    const ordered = [
      ...ACTION_ORDER.filter((a) => actionSet.has(a)),
      ...[...actionSet].filter((a) => !ACTION_ORDER.includes(a)).sort(),
    ];
    return { grouped: map, actions: ordered };
  }, [all, search]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllForModule = (module: string, on: boolean) => {
    setSelected((s) => {
      const next = new Set(s);
      Object.values(grouped[module]).forEach((p) => {
        if (on) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  const loading = allLoading || currentLoading;

  return (
    <DashboardLayout
      title={`Assign Permissions — ${role}`}
      subtitle="Tick the actions users with this role should be allowed to perform"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/settings/roles")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> {role}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {selected.size} selected
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter modules…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 h-9 w-56"
                />
              </div>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                <Save className="h-4 w-4 mr-1.5" />
                {save.isPending ? "Saving…" : "Save Permissions"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Module</TableHead>
                    {actions.map((a) => (
                      <TableHead
                        key={a}
                        className="font-semibold text-center capitalize"
                      >
                        {a}
                      </TableHead>
                    ))}
                    <TableHead className="font-semibold text-right">
                      All
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(grouped)
                    .sort()
                    .map((module) => {
                      const moduleActions = grouped[module];
                      const allOn = Object.values(moduleActions).every((p) =>
                        selected.has(p.id),
                      );
                      return (
                        <TableRow key={module} className="hover:bg-muted/30">
                          <TableCell className="font-medium capitalize">
                            {module}
                          </TableCell>
                          {actions.map((a) => {
                            const p = moduleActions[a];
                            return (
                              <TableCell key={a} className="text-center">
                                {p ? (
                                  <Checkbox
                                    checked={selected.has(p.id)}
                                    onCheckedChange={() => toggle(p.id)}
                                  />
                                ) : (
                                  <span className="text-muted-foreground/40">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right">
                            <Checkbox
                              checked={allOn}
                              onCheckedChange={(v) =>
                                toggleAllForModule(module, !!v)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};
