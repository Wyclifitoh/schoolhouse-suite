import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth, AppRole } from "@/contexts/AuthContext";

// ============================================
// PERMISSION CODES (catalog mirrors backend permissions table)
// ============================================

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
  // Classes
  | "classes:create"
  | "classes:read"
  | "classes:update"
  | "classes:delete"
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
  // Expenses
  | "expenses:create"
  | "expenses:read"
  | "expenses:update"
  | "expenses:delete"
  | "expenses:approve"
  | "expenses:import"
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
  // Comms
  | "communication:create"
  | "communication:read"
  // Inventory
  | "inventory:create"
  | "inventory:read"
  | "inventory:update"
  | "inventory:delete"
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
  // Settings / roles
  | "settings:read"
  | "settings:update"
  | "users:manage"
  | "roles:manage";

interface MePermissions {
  permissions: string[]; // ["*"] = admin wildcard
  roles: string[];
}

export function useMyPermissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["me-permissions", user?.id],
    queryFn: async () => {
      try {
        const data = await api.get<MePermissions>("/roles/me/permissions");
        return data || { permissions: [], roles: [] };
      } catch {
        return { permissions: [], roles: [] };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Check if current user has a specific permission.
 * Admins (super_admin / admin) get "*" wildcard.
 */
export function usePermission(permission: PermissionCode): boolean {
  const { hasAnyRole } = useAuth();
  // Admins always have permission (also handled server-side)
  if (hasAnyRole(["super_admin", "admin", "school_admin"])) return true;
  const { data } = useMyPermissions();
  const perms = data?.permissions || [];
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

/**
 * Check multiple permissions at once.
 */
export function usePermissions(
  permissions: PermissionCode[],
): Record<PermissionCode, boolean> {
  const { hasAnyRole } = useAuth();
  const isAdmin = hasAnyRole(["super_admin", "admin", "school_admin"]);
  const { data } = useMyPermissions();
  const set = new Set(data?.permissions || []);
  const out: Record<string, boolean> = {};
  for (const p of permissions) {
    out[p] = isAdmin || set.has("*") || set.has(p);
  }
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
