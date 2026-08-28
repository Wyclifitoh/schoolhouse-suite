import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, ArrowRight } from "lucide-react";
import {
  ACTION_META,
  ACTIONS_BY_STATUS,
  LIFECYCLE_ORDER,
  STATUS_META,
} from "@/lib/assessmentLifecycle";

/**
 * In-app explanation of the official CHUO assessment lifecycle: what each stage
 * means, whether marks can be edited, whether parents can see results, and
 * exactly which actions are allowed from that stage. Same wording as staff
 * training material.
 */
export function AssessmentStatusLegend({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" /> Status guide
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assessment lifecycle</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1 text-xs">
            {LIFECYCLE_ORDER.map((s, i) => (
              <span key={s} className="inline-flex items-center gap-1">
                <Badge variant="outline" className={STATUS_META[s].badgeClass}>
                  {STATUS_META[s].label}
                </Badge>
                {i < LIFECYCLE_ORDER.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            ))}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {LIFECYCLE_ORDER.map((s) => {
            const meta = STATUS_META[s];
            const marksEditable = s === "open";
            const parentsSee = s === "published" || s === "locked";
            return (
              <div key={s} className="rounded-lg border p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={meta.badgeClass}>
                    {meta.label}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    Marks {marksEditable ? "editable" : "locked"}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {parentsSee ? "Visible to parents" : "Hidden from parents"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{meta.meaning}</p>
                <p className="mt-2 text-xs">
                  <span className="text-muted-foreground">Allowed next: </span>
                  {ACTIONS_BY_STATUS[s].length
                    ? ACTIONS_BY_STATUS[s]
                        .map(
                          (a) =>
                            `${ACTION_META[a].label} (${ACTION_META[a].permission})`,
                        )
                        .join(" · ")
                    : "—"}
                </p>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Reaching 100% marks entry never publishes anything, and locking a
            published assessment never hides results — only editing is frozen.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
