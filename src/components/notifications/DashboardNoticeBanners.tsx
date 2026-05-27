import { AlertTriangle, Megaphone, Pin, X, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkRead, type AppNotification } from "@/hooks/useNotifications";

const styleByPriority: Record<string, { icon: any; bar: string; iconBg: string; iconFg: string }> = {
  urgent: { icon: AlertTriangle, bar: "border-l-destructive", iconBg: "bg-destructive/10", iconFg: "text-destructive" },
  high:   { icon: AlertTriangle, bar: "border-l-warning",     iconBg: "bg-warning/10",     iconFg: "text-warning" },
  normal: { icon: Megaphone,     bar: "border-l-primary",     iconBg: "bg-primary/10",     iconFg: "text-primary" },
  low:    { icon: Info,          bar: "border-l-muted",       iconBg: "bg-muted",          iconFg: "text-muted-foreground" },
};

export function DashboardNoticeBanners({ max = 3 }: { max?: number }) {
  const { data: all = [] } = useNotifications({ limit: 25 });
  const markRead = useMarkRead();

  // Surface active, unread, high-signal items (notices + alerts)
  const items = all
    .filter((n) => !n.read_at && (n.type === "notice" || n.type === "alert" || n.priority === "high" || n.priority === "urgent"))
    .slice(0, max);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 mb-5">
      {items.map((n: AppNotification) => {
        const s = styleByPriority[n.priority] || styleByPriority.normal;
        const Icon = s.icon;
        return (
          <Card
            key={n.id}
            className={cn(
              "border-l-4 p-3.5 flex items-start gap-3 shadow-sm",
              s.bar,
            )}
          >
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0", s.iconBg)}>
              <Icon className={cn("h-4 w-4", s.iconFg)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                {n.priority === "urgent" && <Badge variant="destructive" className="h-4 text-[10px]">URGENT</Badge>}
                {n.priority === "high" && <Badge className="h-4 text-[10px] bg-warning text-warning-foreground">HIGH</Badge>}
                {n.type === "notice" && <Badge variant="outline" className="h-4 text-[10px] gap-1"><Pin className="h-2.5 w-2.5" />Notice</Badge>}
              </div>
              {n.body && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={() => markRead.mutate(n.id)}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
