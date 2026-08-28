import { ReactNode } from "react";
import { usePermissions, PermissionCode } from "@/hooks/usePermission";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";

interface PermissionGateProps {
  /** Single permission or array (any match = visible) */
  permission: PermissionCode | PermissionCode[];
  /** What to show when denied */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Show/hide UI based on PERMISSION CODES only.
 *
 * Role-name gating was removed (2026-08-08): a role name never grants access.
 * The permission set is resolved server-side per school, and admins simply
 * hold the wildcard ("*"), which `usePermissions` already honours. Gates fail
 * closed while the permission set is still loading.
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const permList: PermissionCode[] = Array.isArray(permission)
    ? permission
    : [permission];
  const permMap = usePermissions(permList);

  if (!permList.some((p) => permMap[p])) return <>{fallback}</>;

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
