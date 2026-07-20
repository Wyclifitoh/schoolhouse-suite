import { ReactNode } from "react";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useIsHistoricalView } from "@/hooks/useAcademicContext";

interface Props {
  children: ReactNode;
  /**
   * "hide" removes the UI entirely when viewing historical data.
   * "disable" keeps it visible but blocks interaction and shows a lock tooltip.
   */
  mode?: "hide" | "disable";
  /** Tooltip copy shown on hover in "disable" mode. */
  message?: string;
}

/**
 * Wrap any mutating control (buttons, dialog triggers, forms) with this
 * gate so it disappears/disables when the user is browsing a historical
 * academic session. The backend enforces the same rule; this is the UX
 * layer that keeps the intent obvious.
 */
export function HistoricalReadOnlyGate({
  children,
  mode = "hide",
  message = "Editing is disabled while viewing a historical academic session. Switch back to the current term to make changes.",
}: Props) {
  const isHistorical = useIsHistoricalView();
  if (!isHistorical) return <>{children}</>;
  if (mode === "hide") return null;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-disabled
            className="inline-flex items-center gap-1 opacity-50 pointer-events-none select-none"
          >
            <Lock className="h-3.5 w-3.5" />
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{message}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}