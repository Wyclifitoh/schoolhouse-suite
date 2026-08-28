/**
 * CHUO OFFICIAL ASSESSMENT LIFECYCLE — frontend mirror.
 *
 *   DRAFT → OPEN → COMPLETED → PUBLISHED → LOCKED → ARCHIVED
 *
 * The backend (`backend/src/modules/assessments/lifecycle.js`) is authoritative:
 * it sends `lifecycle_status` and `available_actions` on every assessment row.
 * This file only supplies the LANGUAGE and STYLING for those values, so the
 * words school users are trained on are identical everywhere in the UI.
 *
 * Non-negotiable meanings:
 *   COMPLETED ≠ PUBLISHED — publishing results is a deliberate business action.
 *   LOCKED    ≠ UNPUBLISHED — locking only freezes editing; published results
 *                             stay visible to parents and students.
 *   100% marks entered  ≠  published.
 */

export type LifecycleStatus =
  | "draft"
  | "open"
  | "completed"
  | "published"
  | "locked"
  | "archived";

export type LifecycleAction =
  | "open"
  | "complete"
  | "reopen"
  | "publish"
  | "unpublish"
  | "lock"
  | "unlock"
  | "archive"
  | "unarchive";

export interface StatusMeta {
  label: string;
  /** One-line explanation shown in tooltips and empty states. */
  meaning: string;
  badgeClass: string;
}

export const LIFECYCLE_ORDER: LifecycleStatus[] = [
  "draft",
  "open",
  "completed",
  "published",
  "locked",
  "archived",
];

export const STATUS_META: Record<LifecycleStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    meaning: "Being set up. No mark entry yet and nothing is visible to staff.",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
  open: {
    label: "Open for marks",
    meaning: "Teachers can enter and edit marks for this assessment.",
    badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  },
  completed: {
    label: "Completed",
    meaning:
      "All expected marks are in and awaiting review. Results are NOT released yet.",
    badgeClass: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  },
  published: {
    label: "Published",
    meaning:
      "Results have been released to parents and students in the portal.",
    badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  },
  locked: {
    label: "Locked",
    meaning:
      "Marks are frozen. If results were published they remain published.",
    badgeClass: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  },
  archived: {
    label: "Archived",
    meaning:
      "Removed from the active workflow. All data and results are retained.",
    badgeClass: "bg-zinc-500/15 text-zinc-600 border-zinc-500/30",
  },
};

export interface ActionMeta {
  label: string;
  /** Required permission code — mirrors the backend action catalogue. */
  permission: string;
  /** Shown in the confirmation prompt; omit for non-consequential actions. */
  confirm?: string;
  destructive?: boolean;
}

export const ACTION_META: Record<LifecycleAction, ActionMeta> = {
  open: {
    label: "Open for mark entry",
    permission: "exams:update",
  },
  complete: {
    label: "Mark as completed",
    permission: "exams:update",
    confirm:
      "Mark this assessment as completed? Teachers will no longer be able to edit marks until it is reopened.",
  },
  reopen: {
    label: "Reopen for marks",
    permission: "exams:update",
    confirm: "Reopen this assessment so teachers can edit marks again?",
  },
  publish: {
    label: "Publish results",
    permission: "exams:publish",
    confirm:
      "Publish results? Parents and students will immediately see these results in the portal.",
  },
  unpublish: {
    label: "Unpublish results",
    permission: "exams:publish",
    confirm:
      "Unpublish results? Parents and students will lose access to these results.",
    destructive: true,
  },
  lock: {
    label: "Lock",
    permission: "exams:publish",
    confirm:
      "Lock this assessment? Marks are frozen. Any published results stay published.",
  },
  unlock: {
    label: "Unlock",
    permission: "exams:publish",
  },
  archive: {
    label: "Archive",
    permission: "exams:delete",
    confirm:
      "Archive this assessment? It leaves the active workflow but all data is kept.",
  },
  unarchive: {
    label: "Restore from archive",
    permission: "exams:delete",
  },
};

/** Every permission code the lifecycle can require — for a single useCan batch. */
export const LIFECYCLE_PERMISSIONS = [
  "exams:update",
  "exams:publish",
  "exams:delete",
] as const;

/** Row shape the UI needs; the backend decorates every assessment with this. */
export interface LifecycleRow {
  id?: string;
  name?: string | null;
  status?: string | null;
  lifecycle_status?: string | null;
  results_published?: boolean;
  available_actions?: string[];
  task_count?: number;
  task_done?: number;
  progress_pct?: number;
}

/**
 * Read the canonical status off a row. Falls back to a conservative reading of
 * the legacy `status` column so old cached payloads never render blank.
 */
export function statusOf(row: LifecycleRow): LifecycleStatus {
  const s = String(row.lifecycle_status || "").toLowerCase();
  if (LIFECYCLE_ORDER.includes(s as LifecycleStatus)) return s as LifecycleStatus;
  const legacy = String(row.status || "draft").toLowerCase();
  if (legacy === "locked") return "locked";
  if (legacy === "archived") return "archived";
  if (legacy === "completed") return "completed";
  if (legacy === "draft") return "draft";
  // Legacy `published` meant "open for mark entry".
  return "open";
}

export function statusMeta(row: LifecycleRow): StatusMeta {
  return STATUS_META[statusOf(row)];
}

/** Marks progress, always reported separately from workflow status. */
export function progressOf(row: LifecycleRow) {
  const total = Number(row.task_count || 0);
  const done = Number(row.task_done || 0);
  const pct =
    row.progress_pct !== undefined && row.progress_pct !== null
      ? Number(row.progress_pct)
      : total
        ? Math.round((100 * done) / total)
        : 0;
  return { done, total, pct, complete: total > 0 && done >= total };
}

/**
 * Client mirror of the backend action catalogue. Used ONLY as a fallback when
 * a row arrives without `available_actions` (older backend build or a cached
 * payload) — otherwise the action buttons would silently disappear even for a
 * user who holds every permission. Permissions are still the gate, and the
 * backend re-validates every transition.
 */
const ACTION_RULES: Record<
  LifecycleAction,
  { from: LifecycleStatus[]; requiresFullProgress?: boolean }
> = {
  open: { from: ["draft"] },
  complete: { from: ["open"], requiresFullProgress: true },
  reopen: { from: ["completed", "open"] },
  publish: { from: ["completed"] },
  unpublish: { from: ["published"] },
  lock: { from: ["published", "completed"] },
  unlock: { from: ["locked"] },
  archive: { from: ["draft", "open", "completed", "published", "locked"] },
  unarchive: { from: ["archived"] },
};

/** Actions that make sense for a row, derived locally from its status. */
export function possibleActions(row: LifecycleRow): LifecycleAction[] {
  const status = statusOf(row);
  const progress = progressOf(row);
  return (Object.keys(ACTION_RULES) as LifecycleAction[]).filter((a) => {
    const rule = ACTION_RULES[a];
    if (!rule.from.includes(status)) return false;
    if (rule.requiresFullProgress && !progress.complete) return false;
    return true;
  });
}

/** Server-offered actions, filtered to the ones the user is permitted to run. */
export function permittedActions(
  row: LifecycleRow,
  can: Record<string, boolean>,
): LifecycleAction[] {
  const offered = row.available_actions?.length
    ? (row.available_actions as LifecycleAction[])
    : possibleActions(row);
  return offered.filter((a) => ACTION_META[a] && can[ACTION_META[a].permission]);
}

/**
 * Actions this row's stage allows but the user may NOT run, with the exact
 * permission that is missing. Powers the "why is this hidden?" indicator so
 * staff can tell a workflow rule apart from a permission gap.
 */
export function blockedActions(
  row: LifecycleRow,
  can: Record<string, boolean>,
): { action: LifecycleAction; label: string; permission: string }[] {
  const offered = row.available_actions?.length
    ? (row.available_actions as LifecycleAction[])
    : possibleActions(row);
  return offered
    .filter((a) => ACTION_META[a] && !can[ACTION_META[a].permission])
    .map((a) => ({
      action: a,
      label: ACTION_META[a].label,
      permission: ACTION_META[a].permission,
    }));
}

/** Actions allowed at each stage — used by the in-app status legend. */
export const ACTIONS_BY_STATUS: Record<LifecycleStatus, LifecycleAction[]> = {
  draft: ["open", "archive"],
  open: ["complete", "archive"],
  completed: ["publish", "reopen", "lock", "archive"],
  published: ["unpublish", "lock", "archive"],
  locked: ["unlock", "archive"],
  archived: ["unarchive"],
};

