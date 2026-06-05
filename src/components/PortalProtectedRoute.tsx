import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Loader2 } from "lucide-react";

export function PortalProtectedRoute({
  children,
  allow,
}: {
  children: ReactNode;
  allow?: ("parent" | "student")[];
}) {
  const { isAuthenticated, isLoading, account } = usePortalAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated || !account) {
    return <Navigate to="/userLogin" state={{ from: location }} replace />;
  }
  if (allow && !allow.includes(account.type)) {
    return (
      <Navigate
        to={account.type === "parent" ? "/portal/parent" : "/portal/student"}
        replace
      />
    );
  }
  return <>{children}</>;
}
