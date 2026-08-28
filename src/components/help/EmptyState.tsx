import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpLink } from "@/components/help/HelpPrimitives";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  to?: string;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary";
  /** Hide the action when the user lacks the permission for it. */
  hidden?: boolean;
}

/**
 * Explains what a page is for, why it is empty, and what to do next.
 * Replaces bare "No data found" messages across the app.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actions = [],
  article,
  className,
  compact,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  /** Help Center article slug for the Learn more link. */
  article?: string;
  className?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  const visible = actions.filter((a) => !a.hidden);
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 px-6 text-center",
        compact ? "py-8" : "py-14",
        className,
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {(visible.length > 0 || article) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {visible.map((a) => {
            const ActionIcon = a.icon;
            const inner = (
              <span className="inline-flex items-center">
                {ActionIcon && (
                  <ActionIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                )}
                {a.label}
              </span>
            );
            if (a.to && !a.onClick) {
              return (
                <Button key={a.label} variant={a.variant || "default"} size="sm" asChild>
                  <Link to={a.to}>{inner}</Link>
                </Button>
              );
            }
            return (
              <Button
                key={a.label}
                variant={a.variant || "default"}
                size="sm"
                onClick={a.onClick}
              >
                {inner}
              </Button>
            );
          })}
          {article && <HelpLink article={article}>Learn more</HelpLink>}
        </div>
      )}
      {children}
    </div>
  );
}
