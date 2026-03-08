import { ReactNode } from "react";
import { usePermission, PermissionCode } from "@/hooks/usePermission";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";

// ============================================
// PERMISSION GATE - Hide/show UI based on permissions
// ============================================

interface PermissionGateProps {
  /** Single permission or array (any match = visible) */
  permission?: PermissionCode | PermissionCode[];
  /** Role-based check (any match = visible) */
  role?: AppRole | AppRole[];
  /** What to show when denied */
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  role,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasRole, hasAnyRole } = useAuth();

  // Role check
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!hasAnyRole(roles)) return <>{fallback}</>;
  }

  // Permission check
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    // Check if any permission is granted
    const hasAny = permissions.some(p => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return usePermission(p);
    });
    if (!hasAny) return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// ACCESS DENIED COMPONENT
// ============================================

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Alert variant="destructive" className="max-w-md">
        <ShieldX className="h-5 w-5" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          {message || "You do not have permission to access this resource. Contact your administrator."}
        </AlertDescription>
      </Alert>
    </div>
  );
}
