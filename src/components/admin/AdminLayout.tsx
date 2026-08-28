import { ReactNode, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Package,
  Users,
  Shield,
  History,
  LogOut,
  Menu,
  MessageSquare,
  ToggleRight,
  LifeBuoy,
  BarChart3,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  adminOnly?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/schools", label: "Schools", icon: Building2 },
      { to: "/admin/billing", label: "Billing & Revenue", icon: Receipt },
      { to: "/admin/plans", label: "Plans", icon: Package, adminOnly: true },
      { to: "/admin/sms", label: "SMS Operations", icon: MessageSquare },
      { to: "/admin/features", label: "Feature Flags", icon: ToggleRight },
    ],
  },
  {
    label: "Reliability",
    items: [{ to: "/admin/support", label: "Support Tickets", icon: LifeBuoy }],
  },
  {
    label: "Access",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      {
        to: "/admin/staff",
        label: "Platform Staff",
        icon: Shield,
        adminOnly: true,
      },
      { to: "/admin/audit", label: "Audit Log", icon: History },
    ],
  },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
        <span className="text-white font-black text-sm tracking-tight">C</span>
      </div>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          CHUO Cloud
        </div>
        <div className="font-bold text-sm text-foreground">
          Operations Center
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = usePlatformAuth();
  return (
    <div className="flex flex-col h-full bg-white border-r border-border">
      <div className="p-5 border-b">
        <Brand />
      </div>
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(
            (i) => !i.adminOnly || user?.role === "platform_admin",
          );
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground/80">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {items.map((i) => (
                  <NavLink
                    key={i.to}
                    to={i.to}
                    end={i.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <i.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <span className="flex-1 truncate">{i.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <div className="rounded-lg border bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed">
          <div className="font-semibold text-foreground text-xs mb-0.5">
            Multi-tenant view
          </div>
          You are managing every CHUO school from one console.
        </div>
      </div>
    </div>
  );
}

function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, signOut } = usePlatformAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const initials =
    user?.full_name
      ?.split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const crumb = (() => {
    if (pathname === "/admin") return "Dashboard";
    const seg = pathname.split("/").filter(Boolean).slice(1)[0] || "";
    return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
  })();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-border">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-14">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Platform</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-semibold text-foreground">{crumb}</span>
        </div>
        <div className="flex-1 max-w-md ml-auto lg:ml-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools, invoices, users…"
            className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:bg-white"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-muted transition">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold leading-tight">
                  {user?.full_name || "Signed in"}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {user?.role?.replace("_", " ") || "staff"}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-semibold">{user?.full_name}</div>
              <div className="text-xs text-muted-foreground font-normal">
                {user?.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                signOut();
                nav("/admin/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      <aside className="hidden lg:flex w-64 flex-col shrink-0">
        <SidebarContent />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72 border-0">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
