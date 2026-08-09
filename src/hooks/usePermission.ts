import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth, AppRole } from "@/contexts/AuthContext";

// ============================================
// PERMISSION CODES (catalog mirrors backend permissions table)
// ============================================

/**
 * Every code below exists in the backend `permissions` catalog
 * (see backend/src/utils/rolesBootstrap.js). Keep the two in sync — a code
 * that is not in the catalog can never be granted, so it would silently
 * lock a page out.
 */
export type PermissionCode =
  // Students
  | "students:create"
  | "students:read"
  | "students:update"
  | "students:delete"
  | "students:export"
  | "students:import"
  | "students:promote"
  | "students:transfer"
  // Parents
  | "parents:create"
  | "parents:read"
  | "parents:update"
  | "parents:delete"
  // Staff
  | "staff:create"
  | "staff:read"
  | "staff:update"
  | "staff:delete"
  // Classes / academics
  | "classes:create"
  | "classes:read"
  | "classes:update"
  | "classes:delete"
  | "subjects:read"
  | "subjects:manage"
  | "timetable:read"
  | "timetable:manage"
  | "homework:read"
  | "homework:manage"
  | "lessonplans:read"
  | "lessonplans:manage"
  | "library:read"
  | "library:manage"
  // Finance
  | "finance:fees:read"
  | "finance:fees:create"
  | "finance:fees:update"
  | "finance:fees:delete"
  | "finance:fees:assign"
  | "finance:fees:waive"
  // Payments
  | "payments:create"
  | "payments:read"
  | "payments:update"
  | "payments:delete"
  | "payments:import"
  | "payments:receipt"
  | "payments:reverse"
  // Expenses / income
  | "expenses:create"
  | "expenses:read"
  | "expenses:update"
  | "expenses:delete"
  | "expenses:approve"
  | "expenses:import"
  | "income:create"
  | "income:read"
  | "income:update"
  | "income:delete"
  // Attendance
  | "attendance:create"
  | "attendance:read"
  | "attendance:update"
  | "attendance:delete"
  // Exams
  | "exams:create"
  | "exams:read"
  | "exams:update"
  | "exams:delete"
  | "exams:publish"
  | "assessments:bands:manage"
  // HR
  | "leaves:read"
  | "leaves:create"
  | "leaves:approve"
  | "payroll:read"
  | "payroll:process"
  | "payroll:approve"
  // Comms
  | "communication:create"
  | "communication:read"
  | "communication:update"
  | "communication:delete"
  | "communication:send"
  // Inventory
  | "inventory:create"
  | "inventory:read"
  | "inventory:update"
  | "inventory:delete"
  | "inventory:sell"
  | "inventory:issue"
  | "inventory:return"
  | "inventory:purchase"
  | "inventory:reports"
  | "suppliers:manage"
  // Reports / audit
  | "reports:read"
  | "reports:export"
  | "audit:read"
  // Events
  | "events:create"
  | "events:read"
  | "events:update"
  | "events:delete"
  // Settings / roles / users / billing
  | "settings:read"
  | "settings:update"
  | "apikeys:manage"
  | "billing:read"
  | "billing:manage"
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "users:manage"
  | "roles:read"
  | "roles:create"
  | "roles:update"
  | "roles:delete"
  | "roles:manage"
  | "roles:assign_permissions";

interface MePermissions {
  permissions: string[]; // ["*"] = admin wildcard
  roles: string[];
  auth_version: number;
}

const EMPTY: MePermissions = { permissions: [], roles: [], auth_version: 0 };

/**
 * The caller's effective permissions, resolved SERVER-SIDE.
 *
 * Rules this hook obeys:
 *  - The server is the only authority. No role names are special-cased here;
 *    an admin simply receives ["*"].
 *  - It FAILS CLOSED. A failed request yields no permissions, and `isError`
 *    lets callers show an error instead of a silently empty screen.
 *  - It self-invalidates. The school's `auth_version` is polled cheaply, so a
 *    permission change by an administrator takes effect within seconds
 *    without the user logging out and back in.
 */
export function useMyPermissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["me-permissions", user?.id],
    queryFn: async () => {
      const data = await api.get<MePermissions>("/roles/me/permissions");
      return data || EMPTY;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
    retry: 1,
  });

  // Lightweight change detector: if the school's authorization version moves,
  // drop the cached permission set immediately.
  const version = q.data?.auth_version;
  useQuery({
    queryKey: ["auth-version", user?.id],
    queryFn: async () => {
      const data = await api.get<{ auth_version: number }>(
        "/roles/me/auth-version",
      );
      const next = data?.auth_version ?? 0;
      if (version !== undefined && next !== version) {
        queryClient.invalidateQueries({ queryKey: ["me-permissions"] });
        queryClient.invalidateQueries({ queryKey: ["roles"] });
      }
      return next;
    },
    enabled: !!user && version !== undefined,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  return q;
}

/** Permission set + readiness, the primitive every other helper builds on. */
export function usePermissionSet() {
  const { data, isLoading, isError } = useMyPermissions();
  const permissions = data?.permissions || [];
  const set = new Set(permissions);
  return {
    /** True only once a real answer has arrived from the server. */
    ready: !isLoading && !isError && !!data,
    isLoading,
    isError,
    wildcard: set.has("*"),
    roles: data?.roles || [],
    has: (code: string) => set.has("*") || set.has(code),
  };
}

/**
 * Does the user hold this permission? Server-authoritative and fail-closed:
 * returns false while loading or on error.
 */
export function usePermission(permission: PermissionCode): boolean {
  const { ready, has } = usePermissionSet();
  return ready && has(permission);
}

/** True when the user holds ANY of the given permissions. */
export function useCan(...codes: PermissionCode[]): boolean {
  const { ready, has } = usePermissionSet();
  return ready && codes.some((c) => has(c));
}

/** True when the user holds EVERY given permission. */
export function useCanAll(...codes: PermissionCode[]): boolean {
  const { ready, has } = usePermissionSet();
  return ready && codes.every((c) => has(c));
}

/** Batch lookup, handy for toolbars and menus. */
export function usePermissions(
  permissions: PermissionCode[],
): Record<PermissionCode, boolean> {
  const { ready, has } = usePermissionSet();
  const out: Record<string, boolean> = {};
  for (const p of permissions) out[p] = ready && has(p);
  return out as Record<PermissionCode, boolean>;
}

/**
 * Get the primary dashboard redirect path based on the user's primary role.
 */
export function getDashboardRedirect(primaryRole: AppRole | null): string {
  const redirectMap: Partial<Record<AppRole, string>> = {
    super_admin: "/dashboard",
    school_admin: "/dashboard",
    admin: "/dashboard",
    deputy_admin: "/dashboard",
    manager: "/dashboard",
    finance_officer: "/finance",
    accountant: "/finance",
    front_office: "/payments",
    receptionist: "/payments",
    teacher: "/dashboard",
    transport_officer: "/dashboard",
    store_manager: "/inventory",
    pos_attendant: "/inventory",
    auditor: "/reports",
    parent: "/parent-portal",
    student: "/student-panel",
  };
  return redirectMap[primaryRole || "admin"] || "/dashboard";
}
