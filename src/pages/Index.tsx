import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRedirect } from "@/hooks/usePermission";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, primaryRole } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      const redirect = getDashboardRedirect(primaryRole);
      navigate(redirect, { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, primaryRole, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
};

export default Index;
