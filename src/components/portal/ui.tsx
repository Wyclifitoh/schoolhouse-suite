import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/* Surface                                                             */
/* ------------------------------------------------------------------ */

export function PortalCard({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_8px_24px_-16px_hsl(var(--foreground)/0.12)]",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  icon: Icon,
  hint,
  to,
  linkLabel = "View all",
  action,
}: {
  title: string;
  icon?: LucideIcon;
  hint?: string;
  to?: string;
  linkLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            {title}
          </h3>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>
      {action ??
        (to && (
          <Link
            to={to}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Metrics                                                             */
/* ------------------------------------------------------------------ */

const TONES = {
  primary: { chip: "bg-primary/10 text-primary", bar: "bg-primary" },
  success: { chip: "bg-success/10 text-success", bar: "bg-success" },
  warning: { chip: "bg-warning/10 text-warning", bar: "bg-warning" },
  info: { chip: "bg-info/10 text-info", bar: "bg-info" },
  danger: {
    chip: "bg-destructive/10 text-destructive",
    bar: "bg-destructive",
  },
  neutral: {
    chip: "bg-muted text-muted-foreground",
    bar: "bg-muted-foreground",
  },
} as const;

export type PortalTone = keyof typeof TONES;

export function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  loading,
  to,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: PortalTone;
  loading?: boolean;
  to?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            TONES[tone].chip,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="mt-3 truncate text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
      )}
      {hint && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
      )}
    </>
  );

  const cls =
    "rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] transition-shadow";

  return to ? (
    <Link to={to} className={cn(cls, "hover:shadow-md hover:border-primary/40")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function ProgressRow({
  label,
  value,
  max = 100,
  caption,
  tone = "primary",
}: {
  label: string;
  value: number;
  max?: number;
  caption?: string;
  tone?: PortalTone;
}) {
  const pct = Math.max(0, Math.min(100, (value / (max || 100)) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        <p className="shrink-0 text-xs font-bold text-muted-foreground">
          {caption ?? `${Math.round(pct)}%`}
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", TONES[tone].bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Circular score ring built from an SVG stroke, tokenised colours only. */
export function ScoreRing({
  value,
  size = 148,
  label,
  caption,
  tone = "primary",
}: {
  value: number | null;
  size?: number;
  label?: string;
  caption?: string;
  tone?: PortalTone;
}) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const strokeClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
    danger: "text-destructive",
    neutral: "text-muted-foreground",
  }[tone];

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label || "Score"}: ${value == null ? "not available" : `${pct}%`}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-muted"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn("fill-none stroke-current transition-all", strokeClass)}
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {value == null ? "—" : `${Math.round(pct)}%`}
        </span>
        {caption && (
          <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function PortalEmpty({
  icon: Icon,
  title,
  description,
  action,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
      )}
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-bold text-foreground">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PortalError({ message }: { message?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div>
        <p className="text-sm font-bold text-destructive">
          Couldn&apos;t load this section
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {message || "Please check your connection and try again."}
        </p>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function Initials({
  first,
  last,
  className,
}: {
  first?: string;
  last?: string;
  className?: string;
}) {
  return (
    <span className={cn("font-bold uppercase", className)}>
      {(first?.[0] || "") + (last?.[0] || "")}
    </span>
  );
}
