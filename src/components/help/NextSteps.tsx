import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HelpLink } from "@/components/help/HelpPrimitives";
import { cn } from "@/lib/utils";

export interface NextStep {
  label: string;
  description?: string;
  to?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  /** Hide steps the user has no permission for. */
  hidden?: boolean;
}

/**
 * "What happens next?" — a calm success card listing the logical next
 * actions after an important workflow completes. Never a popup.
 */
export function NextSteps({
  title = "Done",
  message,
  steps,
  article,
  className,
  children,
}: {
  title?: string;
  message?: string;
  steps: NextStep[];
  article?: string;
  className?: string;
  children?: ReactNode;
}) {
  const visible = steps.filter((s) => !s.hidden);
  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-tight">{title}</p>
            {message && (
              <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
            )}
            {visible.length > 0 && (
              <>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Next recommended steps
                </p>
                <ul className="mt-1.5 space-y-1">
                  {visible.map((s) => {
                    const Icon = s.icon || ArrowRight;
                    const inner = (
                      <>
                        <Icon
                          className="h-3.5 w-3.5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="font-medium">{s.label}</span>
                        {s.description && (
                          <span className="text-muted-foreground">
                            — {s.description}
                          </span>
                        )}
                      </>
                    );
                    return (
                      <li key={s.label} className="text-xs">
                        {s.to ? (
                          <Link
                            to={s.to}
                            className="inline-flex items-center gap-2 rounded px-1 py-0.5 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {inner}
                          </Link>
                        ) : s.onClick ? (
                          <button
                            type="button"
                            onClick={s.onClick}
                            className="inline-flex items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {inner}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-1 py-0.5">
                            {inner}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {article && (
              <div className="mt-2">
                <HelpLink article={article} />
              </div>
            )}
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
