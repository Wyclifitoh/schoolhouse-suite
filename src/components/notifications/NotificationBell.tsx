import { Bell, Check, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
  type AppNotification,
} from "@/hooks/useNotifications";

const priorityClass: Record<string, string> = {
  urgent: "border-l-destructive",
  high: "border-l-warning",
  normal: "border-l-primary/40",
  low: "border-l-muted",
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { data: notifs = [] } = useNotifications({ limit: 15 });
  const { data: unread } = useUnreadCount();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const count = unread?.count || 0;

  const handleOpen = (n: AppNotification) => {
    if (!n.read_at) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted transition-colors"
          aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {count > 0 ? `${count} unread` : "You're all caught up"}
            </p>
          </div>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[420px]">
          {notifs.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {notifs.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={cn(
                    "border-l-2 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors flex gap-3",
                    priorityClass[n.priority] || priorityClass.normal,
                    !n.read_at && "bg-primary/5",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-snug", !n.read_at && "font-semibold")}>
                        {n.title}
                      </p>
                      {!n.read_at && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      {n.type === "notice" && " · Noticeboard"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t px-2 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => navigate("/communication")}
          >
            View all on Noticeboard
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
