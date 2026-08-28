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
import { ScrollArea } from "@/components/ui/scroll-area";
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
 * Roles & Permissions workspace — a single page: roles on the left, the
 * selected role's grants on the right.
 *
 * This is presentation only. Every read and write goes through the existing
 * RBAC endpoints (`/roles`, `/roles/permissions`, `/roles/:role/permissions`),
 * so the central authorization service, auth_version propagation and audit
 * trail are untouched.
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
    queryFn: async () => unwrap<Role[]>(await api.get<any>("/roles")) || [],
  });
  const permsQ = useQuery({
    queryKey: ["roles", "catalog"],
    queryFn: async () =>
      unwrap<Permission[]>(await api.get<any>("/roles/permissions")) || [],
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
      unwrap<Permission[]>(
        await api.get<any>(`/roles/${selected}/permissions`),
      ) || [],
    enabled: !!selected,
  });

  // Reset the draft whenever the server state for this role arrives.
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

  // Warn on accidental tab close / reload while there are unsaved changes.
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

  /** Catalog grouped into categories → modules, filtered by the search box. */
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
      const added = d.added?.length || 0;
      const removed = d.removed?.length || 0;
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
      // Duplicate: copy the source role's grants through the same endpoint the
      // editor uses, so authorization stays the single write path.
      if (duplicateOf && created?.code) {
        const src =
          unwrap<Permission[]>(
            await api.get<any>(`/roles/${duplicateOf}/permissions`),
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
      <DashboardLayout>
        <Card className="mx-auto mt-10 max-w-md">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">You cannot view Roles & Permissions</p>
            <p className="text-sm text-muted-foreground">
              Ask an administrator for the “Roles &amp; Permissions” access.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const rolesSidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            className="h-7 px-2 text-primary hover:bg-primary/10"
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
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="Search roles…"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>
      {/* The list scrolls itself (header + search stay usable). No max-height
          cap: a Radix ScrollArea inside an `h-fit` card clipped the roles that
          did not fit and hid the scrollbar, which made roles look missing. */}
      <div className="min-h-0 flex-1 overflow-y-auto lg:max-h-[calc(100vh-15rem)]">
        <div className="p-2">
          {loading &&
            [...Array(6)].map((_, i) => (
              <Skeleton key={i} className="mb-2 h-16 w-full" />
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
                  <span
                    className={cn(
                      "truncate text-sm font-medium",
                      active && "text-primary",
                    )}
                  >
                    {r.label}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {r.user_count ?? 0}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {r.code}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                    {r.permission_count}
                    {r.customised && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="mt-2 border-border/70 text-[9px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {r.builtin ? "Built-in" : "Custom"}
                </Badge>
              </button>
            );
          })}
          {!loading && !filteredRoles.length && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No roles match “{roleSearch}”.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Roles &amp; Permissions
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage roles and control what each role can access. Changes apply
              to every user with the role, immediately.
            </p>
          </div>
        </div>

        {/* Mobile role selector */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setMobileRoles((v) => !v)}
          >
            <span className="truncate">
              {activeRole?.label || "Select a role"}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          {mobileRoles && (
            <Card className="mt-2 overflow-hidden">{rolesSidebar}</Card>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[290px_1fr]">
          {/* Roles sidebar (desktop) */}
          <Card className="hidden h-fit overflow-hidden lg:block">
            {rolesSidebar}
          </Card>

          {/* Permissions workspace */}
          <div className="min-w-0 space-y-4">
            {/* Role header */}
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-base font-semibold">
                        {activeRole?.label || "Select a role"}
                      </h2>
                      {activeRole && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground"
                        >
                          {activeRole.builtin ? "Built-in" : "Custom"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activeRole?.description ||
                        "Choose a role on the left to review its access."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && activeRole?.customised && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResetOpen(true)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset to defaults
                      </Button>
                    )}
                    {canEdit && dirty && (
                      <Button
                        size="sm"
                        onClick={() => save.mutate()}
                        disabled={save.isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {save.isPending ? "Saving…" : "Save changes"}
                      </Button>
                    )}
                    {canEdit && activeRole && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="px-2">
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
                            <Copy className="mr-2 h-4 w-4" /> Duplicate role
                          </DropdownMenuItem>
                          {!activeRole.builtin && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteOpen(true)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete role
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {activeRole?.user_count ?? 0} users
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {grantedTotal}
                    </span>{" "}
                    of {catalogTotal} permissions granted
                  </span>
                  {modifiedLabel && (
                    <span className="text-muted-foreground">
                      Modified {modifiedLabel}
                    </span>
                  )}
                </div>
                <Progress
                  value={catalogTotal ? (grantedTotal / catalogTotal) * 100 : 0}
                  className="h-1.5"
                />
              </CardContent>
            </Card>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                    variant="outline"
                    size="sm"
                    onClick={() => setBulk("all")}
                  >
                    Select all permissions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulk("none")}
                  >
                    Clear all
                  </Button>
                </>
              )}
              {dirty && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ListChecks className="mr-2 h-4 w-4" /> View changes
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="border-b px-4 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Permission changes
                      </p>
                      <p className="text-sm">
                        {changes.granted.length + changes.revoked.length} total
                        changes
                      </p>
                    </div>
                    <ScrollArea className="max-h-64">
                      <div className="space-y-3 p-4 text-sm">
                        {!!changes.granted.length && (
                          <div>
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                              Granted
                            </p>
                            {changes.granted.map((c) => (
                              <p
                                key={c}
                                className="font-mono text-xs text-primary"
                              >
                                + {c}
                              </p>
                            ))}
                          </div>
                        )}
                        {!!changes.revoked.length && (
                          <div>
                            <p className="mb-1 text-xs font-medium text-muted-foreground">
                              Revoked
                            </p>
                            {changes.revoked.map((c) => (
                              <p
                                key={c}
                                className="font-mono text-xs text-destructive"
                              >
                                − {c}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {grantsQ.isError && (
              <Card className="border-destructive/40">
                <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Could not load this role’s permissions. Nothing was changed.
                </CardContent>
              </Card>
            )}

            {grantsQ.isLoading && (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            )}

            {/* Category → module cards */}
            {!grantsQ.isLoading && !grantsQ.isError && selected && (
              <div className="space-y-5">
                {categoryGroups.map((cat) => {
                  const flat = cat.modules.flatMap((m) => m.list);
                  const on = flat.filter((p) => draft.has(p.id)).length;
                  const isCollapsed = collapsed.has(cat.key);
                  return (
                    <section key={cat.key}>
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
                          <span className="font-normal normal-case tracking-normal">
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
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {cat.modules.map(({ module, list }) => {
                            const mOn = list.filter((p) =>
                              draft.has(p.id),
                            ).length;
                            const all = mOn === list.length;
                            return (
                              <Card key={module} className="overflow-hidden">
                                <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5">
                                  <p className="truncate text-sm font-semibold">
                                    {moduleLabel(module)}
                                  </p>
                                  <span className="shrink-0 text-xs text-muted-foreground">
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
                                      !canEdit &&
                                        "cursor-not-allowed opacity-50",
                                    )}
                                  >
                                    {all && <Check className="h-3 w-3" />}
                                    {all ? "All selected" : "Select all"}
                                  </button>
                                  <Separator className="my-2" />
                                  <div className="space-y-1.5">
                                    {list.map((p) => (
                                      <label
                                        key={p.id}
                                        className={cn(
                                          "flex items-start gap-2.5 rounded-md px-2 py-1.5",
                                          canEdit
                                            ? "cursor-pointer hover:bg-muted/50"
                                            : "cursor-not-allowed opacity-80",
                                        )}
                                      >
                                        <Checkbox
                                          checked={draft.has(p.id)}
                                          disabled={!canEdit}
                                          onCheckedChange={() => toggle(p.id)}
                                          className="mt-0.5"
                                        />
                                        <span className="min-w-0">
                                          <span className="block text-sm leading-tight">
                                            {actionLabel(p.action)}
                                          </span>
                                          <span className="block truncate text-xs text-muted-foreground">
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
                    </section>
                  );
                })}
                {!categoryGroups.length && (
                  <Card>
                    <CardContent className="p-8 text-center text-sm text-muted-foreground">
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
        <div className="sticky bottom-4 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="text-sm">
            <p className="font-medium">Unsaved changes</p>
            <p className="text-muted-foreground">
              {changes.granted.length} granted · {changes.revoked.length}{" "}
              revoked for {activeRole?.label}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setDraft(new Set(serverIds))}
              disabled={save.isPending}
            >
              Discard
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              <Save className="mr-2 h-4 w-4" />
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
