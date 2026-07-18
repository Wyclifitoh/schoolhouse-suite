import { ReactNode } from "react";
import { useEntitlements, ModuleCode } from "@/hooks/useBilling";
import { UpgradePrompt } from "./UpgradePrompt";
import { Loader2 } from "lucide-react";

interface Props {
  module: ModuleCode;
  children: ReactNode;
}

export function EntitlementGate({ module, children }: Props) {
  const { data, isLoading } = useEntitlements();
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  const allowed = data?.active && data.modules?.includes(module);
  if (!allowed) {
    const reason =
      data?.status === "locked"
        ? "Your trial has ended. Renew your subscription to continue using this module."
        : data?.status === "past_due"
        ? "Your subscription period has ended. Renew to continue."
        : undefined;
    return <UpgradePrompt module={module} reason={reason} />;
  }
  return <>{children}</>;
}
