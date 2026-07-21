import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";

export function PlatformProtectedRoute({ children, role }: { children: ReactNode; role?: "platform_admin" }) {
  const { user, isLoading, isAuthenticated } = usePlatformAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (role === "platform_admin" && user?.role !== "platform_admin")
    return <div className="p-10 text-center text-muted-foreground">Restricted to platform admins.</div>;
  return <>{children}</>;
}