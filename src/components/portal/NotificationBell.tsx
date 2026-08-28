import { useState } from "react";
import { Bell, FileText, Banknote, BookOpenCheck, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  usePortalNotifications,
  useMarkNotificationsSeen,
  PortalNotification,
} from "@/hooks/usePortalApiExtended";
import { formatDistanceToNow } from "date-fns";

const ICON: Record<PortalNotification["type"], any> = {
  result: FileText,
  payment: Banknote,
  homework: BookOpenCheck,
  announcement: Megaphone,
};

const TONE: Record<PortalNotification["type"], string> = {
  result: "text-emerald-600 bg-emerald-500/10",
  payment: "text-amber-600 bg-amber-500/10",
  homework: "text-sky-600 bg-sky-500/10",
  announcement: "text-violet-600 bg-violet-500/10",
};

export function NotificationBell() {
  const { data } = usePortalNotifications();
  const mark = useMarkNotificationsSeen();
  const [open, setOpen] = useState(false);
  const unread = data?.unread_count ?? 0;
  const items = data?.notifications || [];

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && unread > 0) mark.mutate();
      }}
    >
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative h-9 w-9">
          <Bell className="h-[1.05rem] w-[1.05rem]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-[1rem] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-bold">Notifications</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10 px-4">
              You're all caught up.
            </p>
          ) : (
            items.map((n) => {
              const Icon = ICON[n.type] || Megaphone;
              const tone = TONE[n.type];
              return (
                <div
                  key={n.id}
                  className="px-4 py-3 border-b last:border-0 hover:bg-muted/40 flex items-start gap-3"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}