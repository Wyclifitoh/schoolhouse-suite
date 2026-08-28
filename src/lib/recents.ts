import { useCallback, useEffect, useState } from "react";
import type { PermissionCode } from "@/hooks/usePermission";

/**
 * RECENTLY VIEWED
 * ------------------------------------------------------------------
 * A per-user, per-school shortcut list of records the user recently opened.
 * Stored locally (no server round-trip, no extra load) and de-duplicated by
 * route. Each entry remembers the permission needed to open it so items the
 * user can no longer access are never shown.
 */

export type RecentKind =
  | "student"
  | "staff"
  | "parent"
  | "assessment"
  | "payment"
  | "report"
  | "page";

export interface RecentItem {
  /** Route to return to. Also the de-duplication key. */
  to: string;
  title: string;
  kind: RecentKind;
  subtitle?: string;
  /** Permission required to open the item, if any. */
  permission?: PermissionCode;
  at: number;
}

const LIMIT = 12;
const EVENT = "chuo:recents";

const keyFor = (scope: string) => `chuo.recents.${scope || "default"}`;

function read(scope: string): RecentItem[] {
  try {
    const raw = localStorage.getItem(keyFor(scope));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function write(scope: string, items: RecentItem[]) {
  try {
    localStorage.setItem(keyFor(scope), JSON.stringify(items.slice(0, LIMIT)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable — recents are a convenience only */
  }
}

/** Record a visit. Safe to call on every render of a detail page. */
export function pushRecent(scope: string, item: Omit<RecentItem, "at">) {
  if (!item.to || !item.title) return;
  const existing = read(scope).filter((i) => i.to !== item.to);
  write(scope, [{ ...item, at: Date.now() }, ...existing]);
}

export function clearRecents(scope: string) {
  write(scope, []);
}

export function useRecents(scope: string) {
  const [items, setItems] = useState<RecentItem[]>(() => read(scope));

  useEffect(() => {
    const sync = () => setItems(read(scope));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [scope]);

  return {
    items,
    clear: useCallback(() => clearRecents(scope), [scope]),
  };
}
