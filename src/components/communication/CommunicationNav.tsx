import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Send, Megaphone, FileText, Zap, Clock, History, Settings2,
} from "lucide-react";

const items = [
  { to: "/communication", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/communication/send", label: "Send Message", icon: Send },
  { to: "/communication/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/communication/templates", label: "Templates", icon: FileText },
  { to: "/communication/automations", label: "Automated", icon: Zap },
  { to: "/communication/scheduled", label: "Scheduled", icon: Clock },
  { to: "/communication/history", label: "History", icon: History },
  { to: "/communication/settings", label: "Settings", icon: Settings2 },
];

export function CommunicationNav() {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-wrap gap-1 border-b pb-2 mb-4 -mt-2">
      {items.map((it) => {
        const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
        return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.exact}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <it.icon className="h-3.5 w-3.5" />
            {it.label}
          </NavLink>
        );
      })}
    </div>
  );
}