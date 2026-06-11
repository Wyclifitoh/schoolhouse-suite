import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Shield, ChevronRight, Search, ArrowLeft, Save } from "lucide-react";

interface Role {
  code: string;
  label: string;
  description: string;
  permission_count: number;
}

interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
}

const ACTIONS = ["create", "read", "update", "delete", "manage"] as const;

// ----------------------------------------------------------------------------
// /settings/roles  — list all system roles
// ----------------------------------------------------------------------------
export const RolesList = () => {
  const navigate = useNavigate();
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["system-roles"],
    queryFn: async () => {
      const r = await api.get<any>("/roles");
      return (r?.data || r || []) as Role[];
    },
  });

  return (
    <DashboardLayout
      title="Roles & Permissions"
      subtitle="Manage system roles and what each role is allowed to do"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" /> System Roles
          </CardTitle>
          <CardDescription>
            Click <span className="font-medium">Assign Permissions</span> on a role to choose what CRUD actions users with
            that role can perform across the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold text-center">Permissions</TableHead>
                    <TableHead className="font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell>
                        <div className="font-medium text-foreground">{r.label}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{r.code}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.description}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {r.permission_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/settings/roles/${r.code}/permissions`)}
                        >
                          Assign Permissions <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
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

  // Group permissions by module
  const grouped = useMemo(() => {
    const filtered = all.filter(
      (p) =>
        !search ||
        p.module.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()),
    );
    const map: Record<string, Record<string, Permission>> = {};
    for (const p of filtered) {
      map[p.module] ||= {};
      map[p.module][p.action] = p;
    }
    return map;
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
              <Button variant="ghost" size="sm" onClick={() => navigate("/settings/roles")}>
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
                    {ACTIONS.map((a) => (
                      <TableHead key={a} className="font-semibold text-center capitalize">
                        {a}
                      </TableHead>
                    ))}
                    <TableHead className="font-semibold text-right">All</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(grouped)
                    .sort()
                    .map((module) => {
                      const actions = grouped[module];
                      const allOn = Object.values(actions).every((p) => selected.has(p.id));
                      return (
                        <TableRow key={module} className="hover:bg-muted/30">
                          <TableCell className="font-medium capitalize">{module}</TableCell>
                          {ACTIONS.map((a) => {
                            const p = actions[a];
                            return (
                              <TableCell key={a} className="text-center">
                                {p ? (
                                  <Checkbox
                                    checked={selected.has(p.id)}
                                    onCheckedChange={() => toggle(p.id)}
                                  />
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right">
                            <Checkbox
                              checked={allOn}
                              onCheckedChange={(v) => toggleAllForModule(module, !!v)}
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
