import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required roles (any match = allowed) */
  roles?: AppRole[];
  /** Redirect path when not authenticated */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  roles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyRole, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // For now, allow both legacy mock auth and real Supabase auth
  // Real auth: check isAuthenticated
  // Legacy: check if role is set (always true with mock)
  const isLegacyAuth = !!role;
  const isAuthed = isAuthenticated || isLegacyAuth;

  if (!isAuthed) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Role check (if roles specified and using real auth)
  if (roles && isAuthenticated && !hasAnyRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
