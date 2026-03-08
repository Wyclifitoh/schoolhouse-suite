import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useSchoolId } from "@/contexts/SchoolContext";

// ============================================
// PERMISSION CODES
// ============================================

export type PermissionCode =
  // Students
  | "students:read" | "students:create" | "students:update"
  | "students:delete" | "students:promote" | "students:transfer"
  // Finance
  | "finance:fees:read" | "finance:fees:create" | "finance:fees:assign"
  | "finance:fees:waive" | "finance:payments:read" | "finance:payments:create"
  | "finance:payments:reverse" | "finance:reports:view" | "finance:reports:export"
  // Transport
  | "transport:routes:manage" | "transport:assignments:manage" | "transport:fees:manage"
  // Inventory & POS
  | "inventory:items:manage" | "inventory:stock:adjust"
  | "pos:sales:create" | "pos:sales:void"
  // Reports
  | "reports:academic:view" | "reports:finance:view" | "reports:audit:view"
  // Settings & Users
  | "settings:school:manage" | "users:manage" | "users:roles:assign";

// ============================================
// HOOKS
// ============================================

/**
 * Check if current user has a specific permission in the current school.
 * Uses the database `has_permission` function for accurate checks.
 */
export function usePermission(permission: PermissionCode): boolean {
  const { user, hasAnyRole } = useAuth();
  const schoolId = useSchoolId();

  // Admins always have permission
  if (hasAnyRole(["super_admin", "school_admin"])) return true;

  const { data } = useQuery({
    queryKey: ["permission", user?.id, schoolId, permission],
    queryFn: async () => {
      if (!user || !schoolId) return false;

      const { data, error } = await supabase.rpc("has_permission", {
        _user_id: user.id,
        _school_id: schoolId,
        _permission_code: permission,
      });

      if (error) {
        console.error("Permission check error:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!user && !!schoolId,
    staleTime: 5 * 60 * 1000, // Cache for 5 min
  });

  return data ?? false;
}

/**
 * Check multiple permissions at once.
 */
export function usePermissions(permissions: PermissionCode[]): Record<PermissionCode, boolean> {
  const results: Record<string, boolean> = {};
  for (const p of permissions) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[p] = usePermission(p);
  }
  return results as Record<PermissionCode, boolean>;
}

/**
 * Get the primary dashboard redirect path based on the user's primary role.
 */
export function getDashboardRedirect(primaryRole: AppRole | null): string {
  const redirectMap: Partial<Record<AppRole, string>> = {
    super_admin: "/dashboard",
    school_admin: "/dashboard",
    deputy_admin: "/dashboard",
    finance_officer: "/finance",
    front_office: "/payments",
    teacher: "/dashboard",
    transport_officer: "/dashboard",
    store_manager: "/inventory",
    pos_attendant: "/inventory",
    auditor: "/reports",
    parent: "/parent-portal",
    student: "/student-panel",
  };

  return redirectMap[primaryRole || "school_admin"] || "/dashboard";
}
