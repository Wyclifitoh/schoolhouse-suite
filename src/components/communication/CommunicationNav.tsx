import { ModuleTabs } from "@/components/layout/ModuleTabs";
import { usePermissionSet } from "@/hooks/usePermission";
import {
  LayoutDashboard, Send, Megaphone, FileText, Zap, Clock, History, Settings2, BellRing,
} from "lucide-react";

/**
 * Tabs are permission-aware: each declares the permission that its page needs,
 * so a user only ever sees the parts of Communication they may actually use.
 */
const items = [
  { to: "/communication", label: "Overview", icon: LayoutDashboard, exact: true, permission: "communication:read" },
  { to: "/communication/send", label: "Send Message", icon: Send, permission: "communication:send" },
  { to: "/communication/campaigns", label: "Campaigns", icon: Megaphone, permission: "communication:read" },
  { to: "/communication/templates", label: "Templates", icon: FileText, permission: "communication:read" },
  { to: "/communication/automations", label: "Automated", icon: Zap, permission: "communication:read" },
  { to: "/communication/scheduled", label: "Scheduled", icon: Clock, permission: "communication:read" },
  { to: "/communication/history", label: "History", icon: History, permission: "communication:read" },
  { to: "/communication/noticeboard", label: "Noticeboard", icon: BellRing, permission: "communication:read" },
  { to: "/communication/settings", label: "Settings", icon: Settings2, permission: "communication:update" },
];

export function CommunicationNav() {
  const { ready, has } = usePermissionSet();
  const visible = items
    .filter((i) => ready && has(i.permission))
    .map(({ permission, ...rest }) => rest);
  return <ModuleTabs items={visible} />;
}
