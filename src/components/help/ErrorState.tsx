import { ReactNode } from "react";
import { AlertTriangle, RefreshCw, ShieldX, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * SMART ERROR MESSAGES
 * ------------------------------------------------------------------
 * Users see plain language and a way forward. Raw backend text, SQL and
 * stack traces are never rendered; the technical detail is kept behind a
 * disclosure for administrators only.
 */

const TECHNICAL_PATTERNS =
  /(sql|syntax error|econn|fetch|undefined|null|stack|at \w+\.|\bERR_|\d{3} \(|Unexpected token|JSON)/i;

export type ErrorKind = "generic" | "network" | "permission" | "validation";

export function classifyError(error: unknown): ErrorKind {
  const msg = (error instanceof Error ? error.message : String(error || "")).toLowerCase();
  if (/forbidden|permission|unauthor|403/.test(msg)) return "permission";
  if (/network|failed to fetch|timeout|offline|econn/.test(msg)) return "network";
  if (/validation|invalid|required/.test(msg)) return "validation";
  return "generic";
}

/** Safe, human message for any error. Never leaks technical text. */
export function friendlyErrorMessage(
  error: unknown,
  subject = "this information",
): { title: string; body: string } {
  const kind = classifyError(error);
  if (kind === "permission")
    return {
      title: "You don't have permission to do this",
      body: "Contact your school administrator if you believe you should have access.",
    };
  if (kind === "network")
    return {
      title: "We couldn't reach Chuo",
      body: "Check your internet connection and try again.",
    };
  if (kind === "validation") {
    const raw = error instanceof Error ? error.message : String(error || "");
    return {
      title: "Some details need fixing",
      body: TECHNICAL_PATTERNS.test(raw)
        ? "Please review the highlighted fields and try again."
        : raw,
    };
  }
  return {
    title: `We couldn't load ${subject}`,
    body: "There was a temporary problem. Please try again.",
  };
}

export function ErrorState({
  error,
  subject = "this information",
  onRetry,
  onReport,
  showTechnical = false,
  className,
  children,
}: {
  error: unknown;
  /** e.g. "the student list" */
  subject?: string;
  onRetry?: () => void;
  onReport?: () => void;
  /** Only pass true for administrators. */
  showTechnical?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const kind = classifyError(error);
  const { title, body } = friendlyErrorMessage(error, subject);
  const Icon =
    kind === "permission" ? ShieldX : kind === "network" ? WifiOff : AlertTriangle;
  const raw = error instanceof Error ? error.message : String(error || "");

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="h-5 w-5 text-destructive" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {onRetry && kind !== "permission" && (
          <Button size="sm" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" /> Retry
          </Button>
        )}
        {onReport && (
          <Button size="sm" variant="outline" onClick={onReport}>
            Report a problem
          </Button>
        )}
      </div>
      {showTechnical && raw && (
        <details className="mt-4 w-full max-w-md text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Technical details (administrators)
          </summary>
          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-[11px] text-muted-foreground">
            {raw}
          </pre>
        </details>
      )}
      {children}
    </div>
  );
}
