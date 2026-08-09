import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Shield,
  Search,
  Save,
  Plus,
  Trash2,
  Users,
  RotateCcw,
  Lock,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Copy,
  ListChecks,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { usePermissionSet } from "@/hooks/usePermission";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  ACTION_ORDER,
  actionLabel,
  moduleLabel,
  categoryForModule,
  relativeTime,
} from "./permissionTaxonomy";

interface Role {
  id?: string;
  code: string;
  label: string;
  description: string | null;
  permission_count: number;
  user_count?: number;
  builtin?: boolean;
  customised?: boolean;
  modified_at?: string | null;
}

interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
}

const unwrap = <T,>(r: any): T => (r?.data ?? r) as T;

const sortActions = (a: Permission, b: Permission) => {
  const ia = ACTION_ORDER.indexOf(a.action);
  const ib = ACTION_ORDER.indexOf(b.action);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
};

type ModuleGroup = { module: string; list: Permission[] };
type CategoryGroup = { key: string; label: string; modules: ModuleGroup[] };

/**
 * Roles & Permissions workspace — roles on the left, the selected role's
 * grants on the right. Presentation only: every read and write goes through
 * the existing RBAC endpoints, so authorization stays the single write path.
 */
const RolesWorkspace = () => {
  const { role: roleParam } = useParams();
  const qc = useQueryClient();
  const { has, ready } = usePermissionSet();
  const canEdit =
    ready && (has("roles:assign_permissions") || has("roles:manage"));

  const [selected, setSelected] = useState<string | null>(roleParam || null);
  const [roleSearch, setRoleSearch] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulk, setBulk] = useState<"all" | "none" | null>(null);
  const [form, setForm] = useState({ code: "", label: "", description: "" });
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  const [mobileRoles, setMobileRoles] = useState(false);

  const rolesQ = useQuery({
    queryKey: ["roles", "list"],
    queryFn: async () => unwrap<Role[]>(await api.get("/roles")) || [],
  });
  const permsQ = useQuery({
    queryKey: ["roles", "catalog"],
    queryFn: async () =>
      unwrap<Permission[]>(await api.get("/roles/permissions")) || [],
  });

  const roles = rolesQ.data || [];
  const catalog = permsQ.data || [];

  useEffect(() => {
    if (!selected && roles.length) setSelected(roles[0].code);
  }, [roles, selected]);

  const activeRole = roles.find((r) => r.code === selected) || null;

  const grantsQ = useQuery({
    queryKey: ["roles", "grants", selected],
    queryFn: async () =>
      unwrap<Permission[]>(await api.get(`/roles/${selected}/permissions`)) ||
      [],
    enabled: !!selected,
  });

  useEffect(() => {
    if (grantsQ.data) setDraft(new Set(grantsQ.data.map((p) => p.id)));
  }, [grantsQ.data, selected]);

  const byId = useMemo(() => {
    const m = new Map<string, Permission>();
    catalog.forEach((p) => m.set(p.id, p));
    return m;
  }, [catalog]);

  const serverIds = useMemo(
    () => new Set((grantsQ.data || []).map((p) => p.id)),
    [grantsQ.data],
  );

  const changes = useMemo(() => {
    const granted: string[] = [];
    const revoked: string[] = [];
    draft.forEach((id) => {
      if (!serverIds.has(id)) granted.push(byId.get(id)?.code || id);
    });
    serverIds.forEach((id) => {
      if (!draft.has(id)) revoked.push(byId.get(id)?.code || id);
    });
    return { granted: granted.sort(), revoked: revoked.sort() };
  }, [draft, serverIds, byId]);

  const dirty = changes.granted.length > 0 || changes.revoked.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q),
    );
  }, [roles, roleSearch]);

  const categoryGroups: CategoryGroup[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (p: Permission) =>
      !q ||
      p.code.toLowerCase().includes(q) ||
      moduleLabel(p.module).toLowerCase().includes(q) ||
      actionLabel(p.action).toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q);

    const byModule = new Map<string, Permission[]>();
    catalog.filter(matches).forEach((p) => {
      const list = byModule.get(p.module) || [];
      list.push(p);
      byModule.set(p.module, list);
    });

    const order = [...CATEGORIES.map((c) => c.key), "other"];
    const buckets = new Map<string, ModuleGroup[]>();
    Array.from(byModule.entries())
      .sort((a, b) => moduleLabel(a[0]).localeCompare(moduleLabel(b[0])))
      .forEach(([module, list]) => {
        const key = categoryForModule(module);
        const arr = buckets.get(key) || [];
        arr.push({ module, list: [...list].sort(sortActions) });
        buckets.set(key, arr);
      });

    return order
      .filter((k) => buckets.get(k)?.length)
      .map((k) => ({
        key: k,
        label: CATEGORY_LABELS[k] || k,
        modules: buckets.get(k)!,
      }));
  }, [catalog, search]);

  const save = useMutation({
    mutationFn: () =>
      api.put(`/roles/${selected}/permissions`, {
        permission_ids: Array.from(draft),
      }),
    onSuccess: (res: any) => {
      const d = unwrap<any>(res) || {};
      const added = d.added?.length ?? changes.granted.length;
      const removed = d.removed?.length ?? changes.revoked.length;
      toast.success(
        `Saved — ${added} granted, ${removed} revoked. Active immediately for all users with this role.`,
      );
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["me-permissions"] });
    },
    onError: (e: any) =>
      toast.error(e?.message || "Could not save permissions"),
  });

  const resetToDefaults = useMutation({
    mutationFn: () => api.post(`/roles/${selected}/permissions/reset`, {}),
    onSuccess: () => {
      toast.success("Role restored to system defaults");
      setResetOpen(false);
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["me-permissions"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not reset role"),
  });

  const createRole = useMutation({
    mutationFn: async () => {
      const created = unwrap<any>(await api.post("/roles/custom", form));
      if (duplicateOf && created?.code) {
        const src =
          unwrap<Permission[]>(
            await api.get(`/roles/${duplicateOf}/permissions`),
          ) || [];
        await api.put(`/roles/${created.code}/permissions`, {
          permission_ids: src.map((p) => p.id),
        });
      }
      return created;
    },
    onSuccess: (created: any) => {
      toast.success(duplicateOf ? "Role duplicated" : "Custom role created");
      setAddOpen(false);
      setDuplicateOf(null);
      setForm({ code: "", label: "", description: "" });
      qc.invalidateQueries({ queryKey: ["roles"] });
      if (created?.code) setSelected(created.code);
    },
    onError: (e: any) => toast.error(e?.message || "Could not create role"),
  });

  const updateRole = useMutation({
    mutationFn: () =>
      api.put(`/roles/custom/${activeRole?.id}`, {
        label: form.label,
        description: form.description,
      }),
    onSuccess: () => {
      toast.success("Role updated");
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not update role"),
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/custom/${id}`),
    onSuccess: () => {
      toast.success("Role deleted");
      setDeleteOpen(false);
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: any) =>
      toast.error(e?.message || "Could not delete this role"),
  });

  const toggle = (id: string) =>
    setDraft((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const setMany = (list: Permission[], on: boolean) =>
    setDraft((prev) => {
      const next = new Set(prev);
      list.forEach((p) => (on ? next.add(p.id) : next.delete(p.id)));
      return next;
    });

  const applyBulk = () => {
    if (bulk === "all") setDraft(new Set(catalog.map((p) => p.id)));
    if (bulk === "none") setDraft(new Set());
    setBulk(null);
  };

  const toggleCategory = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const loading = rolesQ.isLoading || permsQ.isLoading;
  const grantedTotal = draft.size;
  const catalogTotal = catalog.length;
  const modifiedLabel = relativeTime(activeRole?.modified_at);

  if (ready && !has("roles:read") && !has("roles:manage")) {
    return (
      <DashboardLayout title="Roles & Permissions" subtitle="Access control">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="text-base font-semibold">
              You cannot view Roles &amp; Permissions
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ask an administrator for the “Roles &amp; Permissions” access.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const rolesSidebar = (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Roles (
          {roleSearch.trim()
            ? `${filteredRoles.length}/${roles.length}`
            : roles.length}
          )
        </p>
        {canEdit && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setDuplicateOf(null);
              setForm({ code: "", label: "", description: "" });
              setAddOpen(true);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
        )}
      </div>
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="Search roles…"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>
      <div className="p-2">
        {loading &&
          [...Array(6)].map((_, i) => (
            <Skeleton key={i} className="mb-1 h-16 w-full rounded-lg" />
          ))}
        {filteredRoles.map((r) => {
          const active = r.code === selected;
          return (
            <button
              key={r.code}
              onClick={() => {
                setSelected(r.code);
                setMobileRoles(false);
              }}
              className={cn(
                "mb-1 w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-primary/30 bg-primary/5"
                  : "border-transparent hover:bg-muted/60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {r.label}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {r.user_count ?? 0}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {r.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  {r.permission_count}
                  {r.customised && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </span>
              </div>
              <Badge
                variant={r.builtin ? "secondary" : "outline"}
                className="mt-1.5 text-[10px]"
              >
                {r.builtin ? "Built-in" : "Custom"}
              </Badge>
            </button>
          );
        })}
        {!loading && !filteredRoles.length && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            No roles match “{roleSearch}”.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Roles & Permissions"
      subtitle="Control what each role can access"
    >
      <div className={cn("pb-24", !dirty && "pb-4")}>
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Roles &amp; Permissions</h1>
            <p className="text-sm text-muted-foreground">
              Manage roles and control what each role can access. Changes apply
              to every user with the role, immediately.
            </p>
          </div>
        </div>

        {/* Mobile role selector */}
        <div className="mb-4 lg:hidden">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setMobileRoles((v) => !v)}
          >
            <span>{activeRole?.label || "Select a role"}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          {mobileRoles && <div className="mt-2">{rolesSidebar}</div>}
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hidden lg:block">{rolesSidebar}</div>

          <div className="min-w-0 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-base font-semibold">
                        {activeRole?.label || "Select a role"}
                      </h2>
                      {activeRole && (
                        <Badge
                          variant={activeRole.builtin ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {activeRole.builtin ? "Built-in" : "Custom"}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {activeRole?.description ||
                        "Choose a role on the left to review its access."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && activeRole?.customised && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setResetOpen(true)}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset to
                        defaults
                      </Button>
                    )}
                    {canEdit && dirty && (
                      <Button
                        size="sm"
                        onClick={() => save.mutate()}
                        disabled={save.isPending}
                      >
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        {save.isPending ? "Saving…" : "Save changes"}
                      </Button>
                    )}
                    {canEdit && activeRole && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!activeRole.builtin && (
                            <DropdownMenuItem
                              onClick={() => {
                                setForm({
                                  code: activeRole.code,
                                  label: activeRole.label,
                                  description: activeRole.description || "",
                                });
                                setEditOpen(true);
                              }}
                            >
                              Edit role
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setDuplicateOf(activeRole.code);
                              setForm({
                                label: `${activeRole.label} (copy)`,
                                code: `${activeRole.code}_copy`,
                                description: activeRole.description || "",
                              });
                              setAddOpen(true);
                            }}
                          >
                            <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate role
                          </DropdownMenuItem>
                          {!activeRole.builtin && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteOpen(true)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete role
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {activeRole?.user_count ?? 0} users
                  </span>
                  <span>
                    <span className="font-semibold text-foreground">
                      {grantedTotal}
                    </span>{" "}
                    of {catalogTotal} permissions granted
                  </span>
                  {modifiedLabel && <span>Modified {modifiedLabel}</span>}
                </div>
                <Progress
                  value={catalogTotal ? (grantedTotal / catalogTotal) * 100 : 0}
                  className="mt-2 h-1.5"
                />
              </CardContent>
            </Card>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search permissions…"
                  className="h-9 pl-8"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {canEdit && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulk("all")}
                  >
                    Select all permissions
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulk("none")}
                  >
                    Clear all
                  </Button>
                </>
              )}
              {dirty && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <ListChecks className="mr-1.5 h-3.5 w-3.5" /> View changes
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-sm font-semibold">
                        Permission changes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {changes.granted.length + changes.revoked.length} total
                        changes
                      </p>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-3 text-xs">
                      {!!changes.granted.length && (
                        <div className="mb-3">
                          <p className="mb-1 font-semibold text-foreground">
                            Granted
                          </p>
                          {changes.granted.map((c) => (
                            <p key={c} className="font-mono text-primary">
                              + {c}
                            </p>
                          ))}
                        </div>
                      )}
                      {!!changes.revoked.length && (
                        <div>
                          <p className="mb-1 font-semibold text-foreground">
                            Revoked
                          </p>
                          {changes.revoked.map((c) => (
                            <p key={c} className="font-mono text-destructive">
                              − {c}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {grantsQ.isError && (
              <Card className="border-destructive/40">
                <CardContent className="flex items-center gap-2 py-4 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Could not load this role’s permissions. Nothing was changed.
                </CardContent>
              </Card>
            )}

            {grantsQ.isLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            )}

            {!grantsQ.isLoading && !grantsQ.isError && selected && (
              <div className="space-y-5">
                {categoryGroups.map((cat) => {
                  const flat = cat.modules.flatMap((m) => m.list);
                  const on = flat.filter((p) => draft.has(p.id)).length;
                  const isCollapsed = collapsed.has(cat.key);
                  return (
                    <div key={cat.key}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleCategory(cat.key)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          {cat.label}
                          <span className="font-normal normal-case">
                            ({on}/{flat.length})
                          </span>
                        </button>
                        {canEdit && !isCollapsed && (
                          <button
                            onClick={() => setMany(flat, on !== flat.length)}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {on === flat.length
                              ? `Clear ${cat.label}`
                              : `Select all ${cat.label}`}
                          </button>
                        )}
                      </div>
                      {!isCollapsed && (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {cat.modules.map(({ module, list }) => {
                            const mOn = list.filter((p) =>
                              draft.has(p.id),
                            ).length;
                            const all = mOn === list.length;
                            return (
                              <Card key={module}>
                                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                                  <p className="truncate text-sm font-semibold">
                                    {moduleLabel(module)}
                                  </p>
                                  <span className="shrink-0 text-[11px] text-muted-foreground">
                                    {mOn} / {list.length}
                                  </span>
                                </div>
                                <CardContent className="p-3">
                                  <button
                                    disabled={!canEdit}
                                    onClick={() => setMany(list, !all)}
                                    className={cn(
                                      "mb-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                                      all
                                        ? "bg-primary/10 text-primary"
                                        : "text-primary hover:bg-primary/10",
                                      !canEdit && "cursor-not-allowed opacity-50",
                                    )}
                                  >
                                    {all && <Check className="h-3 w-3" />}
                                    {all ? "All selected" : "Select all"}
                                  </button>
                                  <Separator className="my-2" />
                                  <div className="space-y-2">
                                    {list.map((p) => (
                                      <label
                                        key={p.id}
                                        className="flex cursor-pointer items-start gap-2"
                                      >
                                        <Checkbox
                                          disabled={!canEdit}
                                          checked={draft.has(p.id)}
                                          onCheckedChange={() => toggle(p.id)}
                                          className="mt-0.5"
                                        />
                                        <span className="min-w-0">
                                          <span className="block text-xs font-medium">
                                            {actionLabel(p.action)}
                                          </span>
                                          <span className="block truncate text-[11px] text-muted-foreground">
                                            {p.description || p.code}
                                          </span>
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!categoryGroups.length && (
                  <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      No permissions match “{search}”.
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      {canEdit && dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-[0_-8px_24px_-16px_hsl(var(--foreground)/0.3)]">
          <div>
            <p className="text-sm font-semibold">Unsaved changes</p>
            <p className="text-xs text-muted-foreground">
              {changes.granted.length} granted · {changes.revoked.length}{" "}
              revoked for {activeRole?.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setDraft(new Set(serverIds))}
              disabled={save.isPending}
            >
              Discard
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              <Save className="mr-1.5 h-4 w-4" />
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Create / duplicate role */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setDuplicateOf(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {duplicateOf ? "Duplicate role" : "New role"}
            </DialogTitle>
            <DialogDescription>
              {duplicateOf
                ? "The new role starts with a copy of this role's permissions, but has its own identity."
                : "Create a school-specific role, then grant it permissions."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Role name</Label>
              <Input
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    label: e.target.value,
                    code:
                      f.code ||
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "_")
                        .replace(/^_|_$/g, ""),
                  }))
                }
                placeholder="e.g. Library Assistant"
              />
            </div>
            <div>
              <Label>Role code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="library_assistant"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What this role is responsible for"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createRole.mutate()}
              disabled={!form.label || !form.code || createRole.isPending}
            >
              {duplicateOf ? "Duplicate role" : "Create role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit custom role */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>
              The role code cannot change — permissions are keyed to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Role name</Label>
              <Input
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateRole.mutate()}
              disabled={!form.label || updateRole.isPending}
            >
              Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reset {activeRole?.label} permissions?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This restores the configured default permissions for this role and
              discards this school’s customisation. It applies immediately to
              every user with the role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetToDefaults.mutate()}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk select/clear confirmation */}
      <AlertDialog open={!!bulk} onOpenChange={(o) => !o && setBulk(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulk === "all"
                ? `Select every permission for ${activeRole?.label}?`
                : `Clear every permission for ${activeRole?.label}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulk === "all"
                ? "This grants this role full access to every module in CHUO. Review before saving."
                : "This revokes all access for this role. Users with only this role will lose access once saved."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyBulk}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete custom role */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{activeRole?.label}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeRole?.user_count
                ? `This role is assigned to ${activeRole.user_count} user(s). Reassign them before deleting it.`
                : "This permanently removes the role and its permission grants."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!activeRole?.user_count}
              onClick={() => activeRole?.id && deleteRole.mutate(activeRole.id)}
            >
              Delete role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

// Both existing routes render the same workspace; /settings/roles/:role simply
// opens with that role preselected. Routes are unchanged.
export const RolesList = RolesWorkspace;
export const RolePermissionsEditor = RolesWorkspace;
export default RolesWorkspace;
