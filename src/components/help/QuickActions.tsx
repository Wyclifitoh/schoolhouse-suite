import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpLink } from "@/components/help/HelpPrimitives";
import { cn } from "@/lib/utils";

export interface QuickAction {
  label: string;
  icon?: LucideIcon;
  to?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary";
  /** Hide when the user lacks the permission for it. */
  hidden?: boolean;
  /** Native title used as an affordance hint. */
  hint?: string;
}

/**
 * MODULE QUICK ACTIONS
 * ------------------------------------------------------------------
 * One consistent action area per module. Every entry is permission
 * aware — pass `hidden` from the caller's permission checks and the
 * button disappears instead of failing on click.
 */
export function QuickActions({
  actions,
  article,
  className,
}: {
  actions: QuickAction[];
  /** Help Center article behind "Need help? Learn how". */
  article?: string;
  className?: string;
}) {
  const visible = actions.filter((a) => !a.hidden);
  if (visible.length === 0 && !article) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2",
        className,
      )}
    >
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Quick actions
      </span>
      {visible.map((a) => {
        const Icon = a.icon;
        const inner = (
          <span className="inline-flex items-center">
            {Icon && <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />}
            {a.label}
          </span>
        );
        if (a.to && !a.onClick) {
          return (
            <Button
              key={a.label}
              size="sm"
              variant={a.variant || "outline"}
              title={a.hint}
              asChild
            >
              <Link to={a.to}>{inner}</Link>
            </Button>
          );
        }
        return (
          <Button
            key={a.label}
            size="sm"
            variant={a.variant || "outline"}
            title={a.hint}
            onClick={a.onClick}
          >
            {inner}
          </Button>
        );
      })}
      {article && (
        <span className="ml-auto text-xs text-muted-foreground">
          Need help? <HelpLink article={article}>Learn how</HelpLink>
        </span>
      )}
    </div>
  );
}
