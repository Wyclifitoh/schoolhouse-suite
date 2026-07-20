import { Link } from "react-router-dom";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useEntitlements } from "@/hooks/useBilling";

export function TrialBanner() {
  const { data } = useEntitlements();
  if (!data) return null;

  if (data.status === "locked" || data.status === "past_due") {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {data.status === "locked"
            ? "Your free trial has ended. Advanced modules are locked."
            : "Your subscription expired. Advanced modules are locked."}
        </span>
        <Link to="/settings/billing" className="font-semibold underline whitespace-nowrap">
          Renew now
        </Link>
      </div>
    );
  }

  if (data.status === "trial" && data.trialDaysLeft <= 7) {
    return (
      <div className="bg-warning/15 text-warning-foreground px-4 py-2 text-sm flex items-center justify-between gap-3 border-b border-warning/30">
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-warning shrink-0" />
          Your free trial ends in <strong>{data.trialDaysLeft}</strong> day{data.trialDaysLeft === 1 ? "" : "s"}. Choose a plan to keep all features.
        </span>
        <Link to="/settings/billing" className="font-semibold underline whitespace-nowrap">
          Choose plan
        </Link>
      </div>
    );
  }
  return null;
}
