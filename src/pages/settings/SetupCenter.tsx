import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HelpLink } from "@/components/help/HelpPrimitives";
import {
  StatusBadge,
  StepIcon,
  restoreSetupChecklist,
  useSetupChecklist,
} from "@/components/help/SetupChecklist";
import { restoreSetupFab } from "@/components/help/SetupProgressFab";
import { useSeo } from "@/hooks/useSeo";
import { toast } from "sonner";
import { ArrowRight, PartyPopper, RefreshCw, Settings2 } from "lucide-react";

export default function SetupCenter() {
  useSeo(
    "Setup & configuration — Chuo",
    "Review your school's configuration, see what is still missing and finish setting up Chuo.",
  );
  const {
    steps,
    remaining,
    nextStep,
    pct,
    requiredDone,
    requiredTotal,
    complete,
    loading,
    refresh,
  } = useSetupChecklist();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Settings2 className="h-6 w-6 text-primary" aria-hidden="true" />
              Setup &amp; configuration
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chuo checks your real records, so this always reflects what has
              actually been configured. Completed items stay here for editing.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
            <RefreshCw className="h-4 w-4" /> Re-check
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {complete ? "Setup complete" : `Setup progress: ${pct}%`}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Checking your configuration…"
                : `${requiredDone} of ${requiredTotal} required steps done`}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={pct} aria-label={`Setup ${pct}% complete`} />
            {complete ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <PartyPopper className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold">Nothing left to do.</span>{" "}
                  Your Chuo system has been fully configured — edit any section
                  below whenever things change.
                </p>
              </div>
            ) : (
              nextStep && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Next step
                    </p>
                    <p className="text-sm font-semibold">{nextStep.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {nextStep.hint || nextStep.description}
                    </p>
                  </div>
                  <Button asChild className="gap-2">
                    <Link to={nextStep.to}>
                      Continue setup <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )
            )}
            {!complete && (
              <p className="text-xs text-muted-foreground">
                {remaining.length} item{remaining.length === 1 ? "" : "s"} still
                need attention.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All configuration areas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {steps.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap"
                >
                  <span className="shrink-0">
                    <StepIcon status={s.status} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {s.label}
                      {!s.required && (
                        <Badge variant="outline" className="text-[10px]">
                          Optional
                        </Badge>
                      )}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {s.hint || s.description}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={s.status} />
                    {s.article && <HelpLink article={s.article} />}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={s.to}>
                        {s.status === "done" ? "Review" : "Set up"}
                      </Link>
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              Hidden the dashboard setup card or the floating button? Bring them
              back here.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                restoreSetupChecklist();
                restoreSetupFab();
                toast.success("Setup guidance restored");
                refresh();
              }}
            >
              Restore setup guidance
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
