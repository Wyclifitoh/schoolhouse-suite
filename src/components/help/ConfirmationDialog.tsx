import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { HelpLink } from "@/components/help/HelpPrimitives";
import { cn } from "@/lib/utils";

/**
 * ONE confirmation dialog for consequential actions.
 * It always answers: what will happen, what is affected, can it be undone,
 * and what to check first.
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  affects,
  reversible = true,
  checkFirst,
  article,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  tone = "default",
  loading,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  /** What else changes as a result. */
  affects?: string[];
  /** false renders a stronger, destructive warning. */
  reversible?: boolean;
  /** "Before you do this" review points. */
  checkFirst?: { label: string; to?: string }[];
  article?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  const danger = tone === "danger" || !reversible;
  const Icon = danger ? ShieldAlert : AlertTriangle;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon
              className={cn(
                "h-4 w-4",
                danger ? "text-destructive" : "text-primary",
              )}
              aria-hidden="true"
            />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 text-sm">
          {affects && affects.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                What this affects
              </p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                {affects.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {checkFirst && checkFirst.length > 0 && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
                <Info className="h-3.5 w-3.5" aria-hidden="true" /> Before you do
                this
              </p>
              <ul className="mt-1.5 space-y-1 text-xs">
                {checkFirst.map((c) =>
                  c.to ? (
                    <li key={c.label}>
                      <Link
                        to={c.to}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={c.label} className="text-muted-foreground">
                      {c.label}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          <p
            className={cn(
              "text-xs",
              danger ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            {reversible
              ? "This action can be changed later if needed."
              : "This action cannot be undone."}
          </p>

          {children}
          {article && <HelpLink article={article} />}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={
              danger
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {loading ? "Working..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Stronger variant for irreversible actions. */
export function WarningDialog(
  props: Omit<React.ComponentProps<typeof ConfirmationDialog>, "tone">,
) {
  return <ConfirmationDialog {...props} tone="danger" reversible={false} />;
}

/**
 * Inline pre-action guidance for consequential operations, shown on the page
 * itself rather than only inside a dialog.
 */
export function BeforeYouDoThis({
  title,
  points,
  action,
  article,
  className,
}: {
  title: string;
  points: string[];
  action?: { label: string; to: string };
  article?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-3",
        className,
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted-foreground">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {(action || article) && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {action && (
            <Button variant="outline" size="sm" asChild>
              <Link to={action.to}>{action.label}</Link>
            </Button>
          )}
          {article && <HelpLink article={article} />}
        </div>
      )}
    </div>
  );
}
