import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyPermissions, PermissionCode } from "@/hooks/usePermission";
import { permissionsForPath } from "@/lib/routePermissions";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Legacy prop. Roles NEVER grant access on their own any more — page access
   * is decided purely by permission codes so that a role's grants in
   * Settings → Roles are the single source of truth.
   */
  roles?: string[];
  /**
   * Permission codes required to open the page (any match = allowed).
   * When omitted, the codes are looked up in ROUTE_PERMISSIONS for the current
   * path. A route that is neither listed nor annotated is open to any
   * authenticated member of the school.
   */
  permissions?: PermissionCode[];
  /** Redirect path when not authenticated */
  redirectTo?: string;
}

/**
 * DENY BY DEFAULT route guard.
 *
 * The server is the only authority: `useMyPermissions()` returns the caller's
 * effective codes (["*"] for admins). While the answer is loading we render a
 * spinner; if it fails we send the user to /unauthorized rather than letting
 * the page through.
 */
export function ProtectedRoute({
  children,
  permissions,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();
  const location = useLocation();
  const {
    data: mePerms,
    isLoading: permsLoading,
    isError: permsError,
  } = useMyPermissions();

  const required = permissions ?? permissionsForPath(location.pathname);
  const needsCheck = !!required && required.length > 0;

  if (isLoading || (needsCheck && permsLoading)) {
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

  if (needsCheck) {
    if (permsError || !mePerms) return <Navigate to="/unauthorized" replace />;
    const held = mePerms.permissions || [];
    const allowed =
      held.includes("*") || required!.some((p) => held.includes(p));
    if (!allowed) return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
