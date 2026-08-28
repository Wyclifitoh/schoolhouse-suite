import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useMyPermissions, PermissionCode } from "@/hooks/usePermission";
import { permissionsForPath } from "@/lib/routePermissions";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Legacy role gate (any match = allowed). Prefer the route permission map. */
  roles?: AppRole[];
  /**
   * Required permission codes (any match = allowed). When omitted, they are
   * resolved from the central route→permission map so page access stays
   * database-driven. When both roles and permissions apply, access is granted
   * if EITHER matches — this lets custom DB-defined roles reach pages purely
   * through grants. Admins / super_admins always pass.
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

  // Explicit prop wins; otherwise fall back to the central map for this path.
  const mapped = permissions ?? permissionsForPath(location.pathname);
  const required = mapped && mapped.length ? mapped : undefined;

  const { data: mePerms, isLoading: permsLoading } = useMyPermissions();

  if (isLoading || (required && permsLoading)) {
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

  // Decision order (mirrors the backend authorization service):
  //  1. The server-issued wildcard ("*") passes. It is the ONLY wildcard, and
  //     it is resolved per-school by the backend — no role name grants access.
  //  2. If the route HAS a permission requirement, permissions decide — alone.
  //  3. Only permission-less routes fall back to the legacy `roles` allow-list
  //     (identity pages such as /parent-portal and /student-panel), where the
  //     role list is scoped to the selected school by AuthContext.
  const permList = mePerms?.permissions || [];
  const wildcard = permList.includes("*");

  if (!wildcard) {
    if (required) {
      if (!required.some((p) => permList.includes(p))) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else if (roles && !hasAnyRole(roles)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}


