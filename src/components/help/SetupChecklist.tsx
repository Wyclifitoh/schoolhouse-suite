import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { usePermissionSet } from "@/hooks/usePermission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HelpLink } from "@/components/help/HelpPrimitives";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  PartyPopper,
  Rocket,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SMART SETUP WIZARD — completion engine
 * ------------------------------------------------------------------
 * Completion is derived from REAL data, so progress is inherently
 * persistent: leaving and returning re-reads the same records.
 * A step is `done` only when the records exist, `partial` when it is
 * started but missing something important, otherwise `todo`.
 */

const DISMISS_KEY = "chuo.setupChecklist.dismissed";
const COLLAPSE_KEY = "chuo.setupChecklist.collapsed";
const CELEBRATED_KEY = "chuo.setupChecklist.celebrated";
const PROBE_KEY = "setup-probe";

export type StepStatus = "done" | "partial" | "todo" | "unknown";

const listOf = (payload: unknown): any[] => {
  const p = payload as any;
  const raw = Array.isArray(p) ? p : p?.data ?? p?.rows ?? p?.items ?? [];
  return Array.isArray(raw) ? raw : [];
};

/** Any endpoint failure counts as "unknown", never as complete. */
const probe = (path: string) => ({
  queryKey: [PROBE_KEY, path],
  queryFn: async () => {
    try {
      return listOf(await api.get<any>(path));
    } catch {
      return null;
    }
  },
  staleTime: 15 * 1000,
  refetchOnWindowFocus: true,
  retry: 0,
});

/** Call after any setup-affecting save so the percentage updates live. */
export function invalidateSetupProgress(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: [PROBE_KEY] });
}

export interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  to: string;
  status: StepStatus;
  /** kept for backwards compatibility with the onboarding tour */
  done: boolean;
  unknown?: boolean;
  hint?: string;
  required: boolean;
  article?: string;
}

export function useSetupChecklist() {
  const qc = useQueryClient();
  const location = useLocation();

  const profile = useQuery({
    queryKey: [PROBE_KEY, "/schools/profile"],
    queryFn: async () => {
      try {
        const d = await api.get<any>("/schools/profile");
        return (d?.data || d || null) as any;
      } catch {
        return null;
      }
    },
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    retry: 0,
  });
  const terms = useQuery(probe("/schools/terms"));
  const grades = useQuery(probe("/classes/grades"));
  const streams = useQuery(probe("/streams"));
  const subjects = useQuery(probe("/classes/subjects"));
  const staff = useQuery(probe("/staff?limit=1"));
  const students = useQuery(probe("/students?limit=1"));
  const feeStructures = useQuery(probe("/finance/fee-structures"));
  const assessmentTypes = useQuery(probe("/assessments/types"));

  // Re-check whenever the admin navigates — saves happen on other pages.
  useEffect(() => {
    invalidateSetupProgress(qc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const steps: ChecklistStep[] = useMemo(() => {
    const p = profile.data;
    const mk = (
      id: string,
      label: string,
      description: string,
      to: string,
      rows: any[] | null | undefined,
      opts: {
        required?: boolean;
        article?: string;
        partial?: (rows: any[]) => string | null;
      } = {},
    ): ChecklistStep => {
      let status: StepStatus = "unknown";
      let hint: string | undefined;
      if (rows) {
        if (rows.length === 0) status = "todo";
        else {
          const warn = opts.partial?.(rows) || null;
          status = warn ? "partial" : "done";
          hint = warn || undefined;
        }
      }
      return {
        id,
        label,
        description,
        to,
        status,
        done: status === "done",
        unknown: status === "unknown",
        hint,
        required: opts.required !== false,
        article: opts.article,
      };
    };

    const profileMissing: string[] = [];
    if (p) {
      if (!p.email) profileMissing.push("email");
      if (!p.phone) profileMissing.push("phone");
      if (!p.address) profileMissing.push("address");
    }
    const profileStatus: StepStatus = !p
      ? "unknown"
      : !p.name
        ? "todo"
        : profileMissing.length
          ? "partial"
          : "done";

    return [
      {
        id: "profile",
        label: "School information",
        description: "Name, contacts and logo used on receipts and reports.",
        to: "/settings",
        status: profileStatus,
        done: profileStatus === "done",
        unknown: profileStatus === "unknown",
        hint: profileMissing.length
          ? `Missing ${profileMissing.join(", ")}`
          : undefined,
        required: true,
        article: "getting-started",
      },
      mk(
        "terms",
        "Academic year and current term",
        "Sets the default period for fees, marks and reports.",
        "/settings/academics",
        terms.data,
        {
          article: "academic-year-and-terms",
          partial: (rows) =>
            rows.some((r) => r.is_current)
              ? null
              : "No term marked as current",
        },
      ),
      mk(
        "classes",
        "Classes",
        "Grade or form levels students are enrolled into.",
        "/classes",
        grades.data,
        { article: "classes-and-streams" },
      ),
      mk(
        "streams",
        "Streams",
        "Sections within each class, used for registers and mark sheets.",
        "/streams",
        streams.data,
        { article: "classes-and-streams", required: false },
      ),
      mk(
        "subjects",
        "Subjects",
        "What is taught and assessed. Needed before marks entry.",
        "/subjects",
        subjects.data,
        { article: "classes-and-streams" },
      ),
      mk(
        "staff",
        "Teachers and staff",
        "Add people, then give them roles so they can sign in.",
        "/staff-directory",
        staff.data,
        { article: "staff-and-hr" },
      ),
      mk(
        "students",
        "Students",
        "Admit students individually or import your list.",
        "/students",
        students.data,
        { article: "adding-students" },
      ),
      mk(
        "fees",
        "Fee structure",
        "What students are expected to pay this term.",
        "/finance",
        feeStructures.data,
        { article: "fee-structures" },
      ),
      mk(
        "assessment",
        "Assessment setup",
        "Assessment types and grading bands used for results.",
        "/assessments/settings",
        assessmentTypes.data,
        { article: "creating-assessments", required: false },
      ),
    ];
  }, [
    profile.data,
    terms.data,
    grades.data,
    streams.data,
    subjects.data,
    staff.data,
    students.data,
    feeStructures.data,
    assessmentTypes.data,
  ]);

  const required = steps.filter((s) => s.required);
  const done = steps.filter((s) => s.status === "done").length;
  const requiredDone = required.filter((s) => s.status === "done").length;
  const pct = required.length
    ? Math.round((requiredDone / required.length) * 100)
    : 0;
  const remaining = steps.filter((s) => s.status !== "done");
  const nextStep =
    required.find((s) => s.status === "partial" || s.status === "todo") ||
    remaining[0] ||
    null;
  const loading =
    profile.isLoading ||
    terms.isLoading ||
    grades.isLoading ||
    students.isLoading;

  return {
    steps,
    remaining,
    nextStep,
    done,
    total: steps.length,
    requiredDone,
    requiredTotal: required.length,
    pct,
    complete: !loading && required.every((s) => s.status === "done"),
    loading,
    refresh: () => invalidateSetupProgress(qc),
  };
}

export function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done")
    return <Check className="h-4 w-4 text-primary" aria-label="Completed" />;
  if (status === "partial")
    return (
      <TriangleAlert
        className="h-4 w-4 text-warning"
        aria-label="Partially completed"
      />
    );
  return (
    <Circle
      className="h-4 w-4 text-muted-foreground"
      aria-label="Not configured"
    />
  );
}

export function StatusBadge({ status }: { status: StepStatus }) {
  if (status === "done")
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Check className="h-3 w-3" /> Completed
      </Badge>
    );
  if (status === "partial")
    return (
      <Badge
        variant="outline"
        className="gap-1 border-warning/40 text-xs text-warning"
      >
        <TriangleAlert className="h-3 w-3" /> Partial
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Not configured
    </Badge>
  );
}

export function SetupChecklist({ className }: { className?: string }) {
  const { wildcard, has, ready } = usePermissionSet();
  const canConfigure = ready && (wildcard || has("settings:update"));
  const { steps, remaining, pct, requiredDone, requiredTotal, complete, loading } =
    useSetupChecklist();

  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1",
  );
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "1",
  );
  const [showDone, setShowDone] = useState(false);
  const [celebrated, setCelebrated] = useState(
    () => localStorage.getItem(CELEBRATED_KEY) === "1",
  );

  if (!canConfigure || dismissed || loading) return null;

  // 100% — congratulate once, then the card disappears for good.
  if (complete) {
    if (celebrated) return null;
    return (
      <Card className={cn("border-primary/30 bg-primary/5", className)}>
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <PartyPopper className="h-6 w-6 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Setup complete</p>
            <p className="text-xs text-muted-foreground">
              Your Chuo system has been fully configured. You can review or
              change anything from Settings &rsaquo; Setup.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings/setup">Review setup</Link>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCelebrated(true);
              localStorage.setItem(CELEBRATED_KEY, "1");
            }}
          >
            Got it
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = steps.filter((s) => s.status === "done");
  const mostlyDone = requiredTotal - requiredDone <= 2;

  const setCollapsedPersisted = (v: boolean) => {
    setCollapsed(v);
    localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
  };

  return (
    <Card
      className={cn(
        mostlyDone ? "border-border" : "border-primary/30 bg-primary/5",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4 text-primary" aria-hidden="true" />
            Finish setting up Chuo · {pct}%
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {remaining.length} item{remaining.length === 1 ? "" : "s"} left ·
            completed steps are hidden so you only see what still needs you.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={collapsed ? "Expand setup checklist" : "Collapse setup checklist"}
            onClick={() => setCollapsedPersisted(!collapsed)}
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Dismiss setup checklist"
            onClick={() => {
              setDismissed(true);
              localStorage.setItem(DISMISS_KEY, "1");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Progress value={pct} aria-label={`Setup ${pct}% complete`} />
        {!collapsed && (
          <>
            <ul className="divide-y">
              {remaining.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-2 py-2 sm:flex-nowrap"
                >
                  <span className="shrink-0">
                    <StepIcon status={s.status} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
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
                    {s.article && <HelpLink article={s.article} />}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={s.to}>
                        {s.status === "partial" ? "Finish" : "Set up"}
                      </Link>
                    </Button>
                  </span>
                </li>
              ))}
            </ul>

            {completedSteps.length > 0 && (
              <div className="rounded-md border bg-background/60 p-2">
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
                      <li
                        key={s.id}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Check className="h-3.5 w-3.5 text-primary" />
                        <span className="flex-1">{s.label}</span>
                        <Link to={s.to} className="underline">
                          Edit
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Full configuration lives in Settings &rsaquo; Setup.
        </p>
      </CardContent>
    </Card>
  );
}

/** Lets Help re-enable a dismissed checklist. */
export function restoreSetupChecklist() {
  localStorage.removeItem(DISMISS_KEY);
  localStorage.removeItem(CELEBRATED_KEY);
  localStorage.setItem(COLLAPSE_KEY, "0");
}
