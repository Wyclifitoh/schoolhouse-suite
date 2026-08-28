import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { usePermissionSet } from "@/hooks/usePermission";
import {
  pushRecent,
  useRecents,
  type RecentItem,
} from "@/lib/recents";
import {
  Users,
  Briefcase,
  ClipboardList,
  Receipt,
  FileText,
  History,
  UserSquare2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Recents are scoped per user + school so nothing leaks between accounts. */
export function useRecentScope() {
  const { user } = useAuth();
  return `${user?.id || "anon"}:${api.getSchoolId() || "none"}`;
}

/** Call from a detail page to record the visit. */
export function useTrackRecent(
  item: Omit<RecentItem, "at"> | null,
  deps: unknown[] = [],
) {
  const scope = useRecentScope();
  useEffect(() => {
    if (item?.title && item?.to) pushRecent(scope, item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, item?.to, item?.title, ...deps]);
}

const ICONS = {
  student: Users,
  staff: Briefcase,
  parent: UserSquare2,
  assessment: ClipboardList,
  payment: Receipt,
  report: FileText,
  page: FileText,
} as const;

const KIND_LABEL = {
  student: "Student",
  staff: "Staff",
  parent: "Guardian",
  assessment: "Assessment",
  payment: "Payment",
  report: "Report",
  page: "Page",
} as const;

/**
 * Permission-aware shortcut list. Items whose required permission the user no
 * longer holds are filtered out rather than shown and then denied.
 */
export function RecentlyViewed({
  limit = 6,
  variant = "card",
  className,
}: {
  limit?: number;
  variant?: "card" | "plain";
  className?: string;
}) {
  const scope = useRecentScope();
  const { items, clear } = useRecents(scope);
  const { ready, has } = usePermissionSet();

  const visible = items
    .filter((i) => !i.permission || (ready && has(i.permission)))
    .slice(0, limit);

  if (visible.length === 0) return null;

  const list = (
    <ul className="space-y-1">
      {visible.map((i) => {
        const Icon = ICONS[i.kind] || FileText;
        return (
          <li key={i.to}>
            <Link
              to={i.to}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{i.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {i.subtitle || KIND_LABEL[i.kind]}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (variant === "plain") return <div className={className}>{list}</div>;

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Recently viewed
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={clear}
        >
          Clear
        </Button>
      </CardHeader>
      <CardContent className="pt-0">{list}</CardContent>
    </Card>
  );
}
