import { ReactNode, useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
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
  Sparkles,
  X,
} from "lucide-react";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/schools", label: "Schools", icon: Building2 },
  { to: "/admin/billing", label: "Billing & Revenue", icon: Receipt },
  { to: "/admin/plans", label: "Plans", icon: Package },
  { to: "/admin/users", label: "Users", icon: Users },
  {
    to: "/admin/staff",
    label: "Platform Staff",
    icon: Shield,
    adminOnly: true,
  },
  { to: "/admin/audit", label: "Audit Log", icon: History },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = usePlatformAuth();
  const nav = useNavigate();
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              CHUO
            </div>
            <div className="font-black text-base leading-tight">
              Platform Console
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.filter((i) => !i.adminOnly || user?.role === "platform_admin").map(
          (i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-primary/90 to-primary/60 text-white shadow-md shadow-primary/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <i.icon
                    className={cn(
                      "h-4 w-4 transition",
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-white",
                    )}
                  />
                  <span className="flex-1">{i.label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </>
              )}
            </NavLink>
          ),
        )}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.full_name
              ?.split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("") || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate text-white">
              {user?.full_name}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-primary/90">
              {user?.role?.replace("_", " ")}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-transparent border-white/10 text-slate-200 hover:bg-white/10 hover:text-white"
          onClick={() => {
            signOut();
            nav("/admin/login");
          }}
        >
          <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-muted/50 via-background to-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0 border-r border-white/10">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-slate-950 text-white border-b border-white/10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400 leading-none">
                CHUO
              </div>
              <div className="font-black text-sm leading-tight">
                Platform Console
              </div>
            </div>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-0">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-auto">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
