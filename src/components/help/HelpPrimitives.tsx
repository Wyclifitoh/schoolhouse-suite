import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowUpRight, Info, AlertTriangle, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * SHARED GUIDANCE PRIMITIVES
 * ------------------------------------------------------------------
 * One implementation of every help affordance so guidance looks and
 * behaves identically everywhere. Content lives in src/lib/help/content.ts.
 */

/** Short contextual explanation attached to a label, field or action. */
export function HelpTooltip({
  text,
  children,
  side = "top",
  label,
}: {
  text: string;
  /** Optional custom trigger; defaults to a small question mark. */
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /** Accessible name for the default icon trigger. */
  label?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children ? (
          // Custom triggers still get a visible affordance: a dotted underline
          // plus the same question-mark icon, so nobody has to guess that
          // extra guidance is hiding here.
          <span className="inline-flex cursor-help items-center gap-1 underline decoration-dotted decoration-muted-foreground/60 underline-offset-4">
            {children}
            <HelpCircle
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </span>
        ) : (
          <button
            type="button"
            aria-label={label ? `Help: ${label}` : "More information"}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/** A label with its tooltip, for form fields and table headers. */
export function LabelWithHelp({
  children,
  help,
  className,
}: {
  children: ReactNode;
  help: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {children}
      <HelpTooltip text={help} label={typeof children === "string" ? children : undefined} />
    </span>
  );
}

/** Deep link into a Help Center article. */
export function HelpLink({
  article,
  children,
  className,
}: {
  article: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={`/help/a/${article}`}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline",
        className,
      )}
    >
      {children ?? "Learn more"}
      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}

/** Alias kept for readability at call sites. */
export const LearnMore = HelpLink;

/** Small helper text under a form field. */
export function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

/** Contextual, optionally dismissible banner. */
export function InfoBanner({
  title,
  children,
  tone = "info",
  article,
  action,
  onDismiss,
  className,
}: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "warning";
  article?: string;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-sm",
        tone === "warning"
          ? "border-destructive/30 bg-destructive/5"
          : "border-primary/20 bg-primary/5",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "warning" ? "text-destructive" : "text-primary",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium leading-tight">{title}</p>}
        <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {children}
        </div>
        {(action || article) && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {action}
            {article && <HelpLink article={article} />}
          </div>
        )}
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="h-7 w-7 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
