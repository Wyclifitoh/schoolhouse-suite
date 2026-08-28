import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  EyeOff,
  Lock,
  LockOpen,
  PlayCircle,
  RotateCcw,
  Send,
} from "lucide-react";
import { useState } from "react";
import { History, ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/usePermission";
import { AssessmentHistoryDialog } from "./AssessmentHistoryDialog";
import {
  ACTION_META,
  blockedActions,
  LIFECYCLE_PERMISSIONS,
  permittedActions,
  statusMeta,
  statusOf,
  type LifecycleAction,
  type LifecycleRow,
} from "@/lib/assessmentLifecycle";

const ICONS: Record<LifecycleAction, typeof Lock> = {
  open: PlayCircle,
  complete: CheckCircle2,
  reopen: RotateCcw,
  publish: Send,
  unpublish: EyeOff,
  lock: Lock,
  unlock: LockOpen,
  archive: Archive,
  unarchive: ArchiveRestore,
};

/**
 * Status badge for an assessment. The label always comes from the canonical
 * lifecycle so staff see the same word in every screen, and a published
 * assessment that was later locked still reads as published.
 */
export function AssessmentStatusBadge({
  row,
  className,
}: {
  row: LifecycleRow;
  className?: string;
}) {
  const meta = statusMeta(row);
  const status = statusOf(row);
  const published = !!row.results_published;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex flex-wrap items-center gap-1">
            <Badge variant="outline" className={`${meta.badgeClass} ${className || ""}`}>
              {meta.label}
            </Badge>
            {/* Locking never un-publishes: say so explicitly. */}
            {status === "locked" && published && (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              >
                Results published
              </Badge>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px]">{meta.meaning}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Which action deserves the solid primary button on a row. */
const PRIORITY: LifecycleAction[] = [
  "open",
  "complete",
  "publish",
  "reopen",
  "unlock",
  "lock",
  "unpublish",
  "unarchive",
  "archive",
];

/**
 * Lifecycle action buttons. Which actions exist comes from the backend
 * (`available_actions`, with a local fallback); whether the user may run them
 * comes from the central permission system. No role names, ever.
 *
 * Presentation: the single most relevant next step is a solid button, and
 * everything else lives in a tidy overflow menu so rows stay calm.
 */
export function AssessmentLifecycleActions({
  row,
  onAction,
  size = "sm",
  pending,
}: {
  row: LifecycleRow;
  onAction: (action: LifecycleAction) => void;
  size?: "sm" | "default";
  pending?: boolean;
}) {
  const can = usePermissions([...LIFECYCLE_PERMISSIONS]);
  const actions = permittedActions(row, can);
  const blocked = blockedActions(row, can);
  const [historyOpen, setHistoryOpen] = useState(false);

  const historyItem = row.id ? (
    <DropdownMenuItem className="cursor-pointer" onClick={() => setHistoryOpen(true)}>
      <History className="h-4 w-4 mr-2" /> View status history
    </DropdownMenuItem>
  ) : null;

  const historyDialog = row.id ? (
    <AssessmentHistoryDialog
      assessmentId={row.id}
      name={row.name}
      open={historyOpen}
      onOpenChange={setHistoryOpen}
    />
  ) : null;

  // Nothing runnable: say WHY — a permission gap, not a broken screen.
  if (!actions.length) {
    if (!blocked.length) return historyDialog;
    return (
      <TooltipProvider>
        <div className="inline-flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                <ShieldAlert className="h-3 w-3" /> No permission
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] text-xs">
              This assessment allows {blocked.map((b) => b.label).join(", ")}, but
              you are missing:{" "}
              <span className="font-mono">
                {[...new Set(blocked.map((b) => b.permission))].join(", ")}
              </span>
              . Ask an administrator to grant it on your role.
            </TooltipContent>
          </Tooltip>
          {row.id && (
            <Button size="icon" variant="ghost" className="h-8 w-8"
              aria-label="View status history" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4" />
            </Button>
          )}
          {historyDialog}
        </div>
      </TooltipProvider>
    );
  }

  const run = (action: LifecycleAction) => {
    const meta = ACTION_META[action];
    if (meta.confirm && !window.confirm(meta.confirm)) return;
    onAction(action);
  };

  const primary =
    PRIORITY.find((a) => actions.includes(a) && !ACTION_META[a].destructive) ||
    actions[0];
  const rest = actions.filter((a) => a !== primary);
  const PrimaryIcon = ICONS[primary];

  return (
    <div className="inline-flex items-center gap-1.5">
      <Button
        size={size}
        disabled={pending}
        onClick={() => run(primary)}
        className="shadow-sm"
      >
        <PrimaryIcon className="h-3.5 w-3.5 mr-1.5" />
        {ACTION_META[primary].label}
      </Button>

      {(rest.length > 0 || historyItem) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              disabled={pending}
              className="h-8 w-8"
              aria-label="More assessment actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {rest.map((action) => {
              const meta = ACTION_META[action];
              const Icon = ICONS[action];
              return (
                <DropdownMenuItem
                  key={action}
                  onClick={() => run(action)}
                  className={
                    meta.destructive
                      ? "cursor-pointer text-destructive focus:text-destructive"
                      : "cursor-pointer"
                  }
                >
                  <Icon className="h-4 w-4 mr-2" /> {meta.label}
                </DropdownMenuItem>
              );
            })}
            {historyItem}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {historyDialog}
    </div>
  );
}

