import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePermissionSet } from "@/hooks/usePermission";
import {
  StepIcon,
  useSetupChecklist,
} from "@/components/help/SetupChecklist";
import { ArrowRight, ChevronDown, ChevronUp, Rocket, X } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDE_KEY = "chuo.setupFab.hidden";

/**
 * Floating "Continue setup" button.
 * Always reachable while the admin works, shows live completion percentage
 * and jumps straight to the next incomplete item.
 */
export function SetupProgressFab() {
  const { wildcard, has, ready } = usePermissionSet();
  const canConfigure = ready && (wildcard || has("settings:update"));
  const { steps, remaining, nextStep, pct, complete, loading } =
    useSetupChecklist();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [hidden, setHidden] = useState(
    () => localStorage.getItem(HIDE_KEY) === "1",
  );

  if (!canConfigure || loading || complete || hidden || !nextStep) return null;

  const completedSteps = steps.filter((s) => s.status === "done");

  return (
    <div className="fixed bottom-4 right-4 z-40 print:hidden">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="h-12 gap-2 rounded-full pl-4 pr-3 shadow-lg"
            aria-label={`Continue setup, ${pct}% complete`}
          >
            <Rocket className="h-4 w-4" aria-hidden="true" />
            <span className="font-semibold">Complete setup</span>
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-bold">
              {pct}%
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="top"
          className="w-[22rem] p-0"
          collisionPadding={12}
        >
          <div className="flex items-start justify-between gap-2 border-b p-4 pb-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Setup progress: {pct}%</p>
              <p className="text-xs text-muted-foreground">
                {remaining.length} item{remaining.length === 1 ? "" : "s"}{" "}
                remaining
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-1 h-7 w-7"
              aria-label="Hide setup button"
              onClick={() => {
                setHidden(true);
                localStorage.setItem(HIDE_KEY, "1");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3 p-4 pt-3">
            <Progress value={pct} aria-label={`Setup ${pct}% complete`} />

            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {remaining.map((s) => (
                <li key={s.id}>
                  <Link
                    to={s.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                      s.id === nextStep.id && "bg-muted",
                    )}
                  >
                    <span className="mt-0.5 shrink-0">
                      <StepIcon status={s.status} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{s.label}</span>
                      {s.hint && (
                        <span className="block text-xs text-warning">
                          {s.hint}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {completedSteps.length > 0 && (
              <div className="rounded-md border p-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground"
                  onClick={() => setShowDone((v) => !v)}
                >
                  <span>{completedSteps.length} completed</span>
                  {showDone ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
                {showDone && (
                  <ul className="mt-2 space-y-1">
                    {completedSteps.map((s) => (
                      <li key={s.id}>
                        <Link
                          to={s.to}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded px-1 py-1 text-xs text-muted-foreground hover:bg-muted"
                        >
                          <StepIcon status={s.status} />
                          <span className="flex-1">{s.label}</span>
                          <span className="underline">Edit</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                className="flex-1 gap-2"
                onClick={() => {
                  setOpen(false);
                  nav(nextStep.to);
                }}
              >
                Continue setup <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" asChild onClick={() => setOpen(false)}>
                <Link to="/settings/setup">All steps</Link>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Lets Settings re-enable a hidden floating button. */
export function restoreSetupFab() {
  localStorage.removeItem(HIDE_KEY);
}
