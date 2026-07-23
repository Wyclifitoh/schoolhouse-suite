import { ReactNode } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { Lock } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  silent?: boolean;
}

export function EnterpriseGate({ children, fallback, silent }: Props) {
  const { currentSchool } = useSchool();
  const edition = (currentSchool as { edition?: string } | null)?.edition;
  if (edition === "enterprise") return <>{children}</>;
  if (silent) return null;
  if (fallback) return <>{fallback}</>;
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
      <div className="rounded-full bg-primary/10 p-3">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">CHUO Flow Enterprise</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          This module is part of CHUO Flow — our Enterprise edition for
          secondary and public schools. Contact us to enable it for your school.
        </p>
      </div>
    </div>
  );
}

export function useIsEnterprise(): boolean {
  const { currentSchool } = useSchool();
  return (
    (currentSchool as { edition?: string } | null)?.edition === "enterprise"
  );
}