import {
  LayoutDashboard, Send, Megaphone, FileText, Zap, Clock, History,
  Settings2, Bell, Calendar, Package, Layers, CreditCard, Users,
  Clipboard, Truck, ShoppingCart, BarChart3, BookOpen,
} from "lucide-react";
import type { ModuleTabItem } from "./ModuleTabs";
import { REPORT_CATEGORIES } from "@/lib/reportCatalog";

export interface WorkspaceDef {
  /** Route prefix that activates this workspace. */
  base: string;
  tabs: ModuleTabItem[];
}

const communication: WorkspaceDef = {
  base: "/communication",
  tabs: [
    { to: "/communication", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/communication/send", label: "Send Message", icon: Send },
    { to: "/communication/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/communication/templates", label: "Templates", icon: FileText },
    { to: "/communication/automations", label: "Automated", icon: Zap },
    { to: "/communication/scheduled", label: "Scheduled", icon: Clock },
    { to: "/communication/history", label: "History", icon: History },
    { to: "/communication/noticeboard", label: "Noticeboard", icon: Bell },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/communication/settings", label: "Settings", icon: Settings2 },
  ],
};

const inventory: WorkspaceDef = {
  base: "/inventory",
  tabs: [
    { to: "/inventory", label: "Overview", icon: Package, exact: true },
    { to: "/inventory/catalog", label: "Catalog", icon: Package },
    { to: "/inventory/categories", label: "Categories", icon: Layers },
    { to: "/inventory/sell", label: "Make Sale", icon: CreditCard },
    { to: "/inventory/assignments", label: "Staff Assignments", icon: Users },
    { to: "/inventory/history", label: "Sales History", icon: Clipboard },
    { to: "/inventory/suppliers", label: "Suppliers", icon: Truck },
    { to: "/inventory/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  ],
};

const library: WorkspaceDef = {
  base: "/library",
  tabs: [
    { to: "/library", label: "Overview", icon: BookOpen, exact: true },
    { to: "/reports/library", label: "Library Reports", icon: BarChart3 },
  ],
};

const reports: WorkspaceDef = {
  base: "/reports",
  tabs: [
    { to: "/reports", label: "Report Center", icon: BarChart3, exact: true },
    ...REPORT_CATEGORIES.map((c) => ({
      to: `/reports/c/${c.id}`,
      label: c.label,
      icon: c.icon,
    })),
  ],
};

export const WORKSPACES: WorkspaceDef[] = [
  communication,
  inventory,
  library,
  reports,
];

/** Returns the workspace tabs for a pathname, or null when not in a workspace. */
export function workspaceTabsFor(pathname: string): ModuleTabItem[] | null {
  const ws = WORKSPACES.find(
    (w) => pathname === w.base || pathname.startsWith(w.base + "/"),
  );
  if (!ws) return null;
  // Communication events page lives outside the /communication prefix.
  return ws.tabs;
}

/** Events route belongs to the Communication workspace. */
export function workspaceTabsForRoute(pathname: string): ModuleTabItem[] | null {
  if (pathname === "/events" || pathname.startsWith("/events/"))
    return communication.tabs;
  return workspaceTabsFor(pathname);
}
