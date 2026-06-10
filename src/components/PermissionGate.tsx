import { ReactNode } from "react";
import { usePermissions, PermissionCode } from "@/hooks/usePermission";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";

interface PermissionGateProps {
  /** Single permission or array (any match = visible) */
  permission?: PermissionCode | PermissionCode[];
  /** Role-based check (any match = visible) */
  role?: AppRole | AppRole[];
  /** What to show when denied */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Hide/show UI based on permission codes or roles.
 * Admin and super_admin always pass.
 */
export function PermissionGate({
  permission,
  role,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasAnyRole } = useAuth();
  const permList: PermissionCode[] = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : [];
  const permMap = usePermissions(permList);

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!hasAnyRole(roles)) return <>{fallback}</>;
  }

  if (permList.length) {
    const granted = permList.some((p) => permMap[p]);
    if (!granted) return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Alert variant="destructive" className="max-w-md">
        <ShieldX className="h-5 w-5" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          {message ||
            "You do not have permission to access this resource. Contact your administrator."}
        </AlertDescription>
      </Alert>
    </div>
  );
}
