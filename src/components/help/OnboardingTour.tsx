import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HelpLink } from "@/components/help/HelpPrimitives";
import { usePermissionSet } from "@/hooks/usePermission";
import { useSetupChecklist } from "@/components/help/SetupChecklist";
import { Check, Compass, Circle } from "lucide-react";

/**
 * ROLE-BASED ONBOARDING TOUR
 * ------------------------------------------------------------------
 * A short guided walkthrough of the pages a new user actually needs.
 * Steps are filtered by the user's server-resolved permissions, so an
 * accountant never sees "add students" and a teacher never sees
 * "school profile". Completion state is per-user, stored locally.
 */

const KEY = "chuo.onboardingTour.done";

interface TourStop {
  id: string;
  title: string;
  body: string;
  to: string;
  cta: string;
  article?: string;
  /** Any one of these permissions is enough to see the stop. */
  any?: string[];
}

const STOPS: TourStop[] = [
  {
    id: "orientation",
    title: "Welcome to Chuo",
    body: "The top bar holds search, your school and current term. The row beneath it holds your workspaces — each workspace opens with its own tabs for the tasks inside it.",
    to: "/dashboard",
    cta: "Open dashboard",
    article: "getting-started",
  },
  {
    id: "school",
    title: "Set up the school",
    body: "School profile, academic year and terms decide what appears on receipts, mark sheets and reports. Do this first.",
    to: "/settings",
    cta: "Open settings",
    article: "academic-year-and-terms",
    any: ["settings:update", "settings:read"],
  },
  {
    id: "structure",
    title: "Classes, streams and subjects",
    body: "Create the class levels, the streams inside them, then the subjects taught. Marks entry needs all three.",
    to: "/classes",
    cta: "Open classes",
    article: "classes-and-streams",
    any: ["classes:read", "classes:create", "subjects:manage"],
  },
  {
    id: "people",
    title: "Staff and roles",
    body: "Add staff, then give each person roles. Roles decide what they can see and do — nothing is hidden by guesswork.",
    to: "/staff-directory",
    cta: "Open staff",
    article: "staff-and-hr",
    any: ["staff:read", "staff:create", "users:manage", "roles:manage"],
  },
  {
    id: "students",
    title: "Students",
    body: "Admit students one by one or import your existing list from Excel. Every fee, mark and message follows the student record.",
    to: "/students",
    cta: "Open students",
    article: "adding-students",
    any: ["students:read", "students:create", "students:import"],
  },
  {
    id: "finance",
    title: "Fees and payments",
    body: "Build the fee structure, assign it to classes, then record payments. Balances are always derived from recorded payments.",
    to: "/finance",
    cta: "Open finance",
    article: "fee-structures",
    any: ["finance:fees:read", "payments:create", "payments:read"],
  },
  {
    id: "assessments",
    title: "Assessments",
    body: "Create an assessment, teachers enter marks, you review, then publish results to parents.",
    to: "/assessments",
    cta: "Open assessments",
    article: "creating-assessments",
    any: ["exams:read", "exams:create"],
  },
  {
    id: "help",
    title: "Help whenever you need it",
    body: "Every page links to a guide. The Help Center also holds troubleshooting, a glossary of terms and a way to report a problem.",
    to: "/help",
    cta: "Open Help Center",
    article: "getting-started",
  },
];

export function useOnboardingTour() {
  const { ready, has } = usePermissionSet();
  const stops = useMemo(
    () => STOPS.filter((s) => !s.any || s.any.some((p) => has(p))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready],
  );
  return { stops, ready };
}

export function OnboardingTour({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { stops } = useOnboardingTour();
  const { steps } = useSetupChecklist();
  const [i, setI] = useState(0);

  const stop = stops[Math.min(i, stops.length - 1)];
  if (!stop) return null;
  const pct = Math.round(((i + 1) / stops.length) * 100);

  const relatedDone = steps.some(
    (s) => stop.to.startsWith(s.to) && s.done,
  );

  const finish = () => {
    localStorage.setItem(KEY, "1");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
            {stop.title}
            {relatedDone && (
              <Badge variant="secondary" className="ml-1 gap-1 text-xs">
                <Check className="h-3 w-3" /> Done
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {stop.body}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Progress value={pct} aria-label={`Tour ${pct}% complete`} />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {stops.map((s, idx) => (
              <span key={s.id} aria-hidden="true">
                {idx <= i ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </span>
            ))}
            <span className="ml-1">
              Step {i + 1} of {stops.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" asChild onClick={() => onOpenChange(false)}>
              <Link to={stop.to}>{stop.cta}</Link>
            </Button>
            {stop.article && <HelpLink article={stop.article}>Learn how</HelpLink>}
          </div>
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip tour
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={i === 0}
              onClick={() => setI((v) => Math.max(0, v - 1))}
            >
              Back
            </Button>
            {i < stops.length - 1 ? (
              <Button size="sm" onClick={() => setI((v) => v + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={finish}>
                Finish
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Auto-shows once per user, and can be reopened from Help. */
export function OnboardingTourLauncher() {
  const { ready } = usePermissionSet();
  const [open, setOpen] = useState(
    () => localStorage.getItem(KEY) !== "1",
  );
  if (!ready) return null;
  return <OnboardingTour open={open} onOpenChange={setOpen} />;
}

export function restartOnboardingTour() {
  localStorage.removeItem(KEY);
}
