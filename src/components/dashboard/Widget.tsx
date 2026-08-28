import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared dashboard widget shell: consistent header, independent skeleton,
 * isolated error state with retry, and a professional empty state.
 * A widget the user is not authorized to see is never rendered at all —
 * that decision lives with the permission-filtered payload, not here.
 */
export function Widget({
  title,
  subtitle,
  icon: Icon,
  action,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyMessage = "No data available for this period.",
  className,
  bodyClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "border-border/70 bg-card shadow-[0_1px_2px_hsl(220_43%_11%_/_0.04)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-primary" />}
            <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <CardContent className={cn("p-5", bodyClassName)}>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <AlertCircle className="h-6 w-6 text-destructive/70" />
            <p className="text-sm text-muted-foreground">
              Unable to load this information.
            </p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Retry
              </Button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Inbox className="h-6 w-6 text-muted-foreground/50" />
            <p className="max-w-[260px] text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/** Compact KPI tile. Rendered only when the domain is authorized. */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  loading,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  tone?: "primary" | "success" | "warning" | "destructive" | "muted";
  loading?: boolean;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="border-border/70 bg-card shadow-[0_1px_2px_hsl(220_43%_11%_/_0.04)]">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            tones[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
