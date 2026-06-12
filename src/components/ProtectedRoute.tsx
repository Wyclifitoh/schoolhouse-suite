import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useMyPermissions, PermissionCode } from "@/hooks/usePermission";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required roles (any match = allowed) */
  roles?: AppRole[];
  /**
   * Required permission codes (any match = allowed). When both `roles` and
   * `permissions` are provided, access is granted if EITHER matches —
   * enabling custom DB-defined roles to reach pages purely through grants.
   * Admins / super_admins always pass.
   */
  permissions?: PermissionCode[];
  /** Redirect path when not authenticated */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  roles,
  permissions,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyRole, mustChangePassword } =
    useAuth();
  const location = useLocation();
  const { data: mePerms, isLoading: permsLoading } = useMyPermissions();

  if (isLoading || (permissions && permsLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Force first-login password change before granting access to any other route
  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Combined role / permission check.
  // - No restrictions provided  -> any authenticated user passes.
  // - Restrictions provided     -> any matching role OR permission grants access.
  // - Admins always pass (handled inside usePermissions / hasAnyRole).
  if (roles || permissions) {
    const adminPass = hasAnyRole([
      "super_admin",
      "admin",
      "school_admin",
    ] as AppRole[]);
    const roleMatch = roles ? hasAnyRole(roles) : false;
    const permList = mePerms?.permissions || [];
    const wildcard = permList.includes("*");
    const permMatch = permissions
      ? wildcard || permissions.some((p) => permList.includes(p))
      : false;
    if (!adminPass && !roleMatch && !permMatch) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
