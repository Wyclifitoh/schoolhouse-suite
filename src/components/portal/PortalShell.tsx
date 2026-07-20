import { ReactNode, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  School,
  LogOut,
  LayoutDashboard,
  User,
  GraduationCap,
  CalendarCheck,
  BookOpenCheck,
  Banknote,
  Clock,
  Megaphone,
  CalendarDays,
  BookMarked,
  Bus,
  Download,
  Settings,
  Menu,
  X,
  LucideIcon,
} from "lucide-react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  SelectedChildProvider,
  useSelectedChild,
} from "@/contexts/SelectedChildContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const PARENT_NAV: NavItem[] = [
  { to: "/portal/parent", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/parent/profile", label: "Profile", icon: User },
  { to: "/portal/parent/academics", label: "Academics", icon: GraduationCap },
  { to: "/portal/parent/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/portal/parent/homework", label: "Homework", icon: BookOpenCheck },
  { to: "/portal/parent/fees", label: "Finance", icon: Banknote },
  { to: "/portal/parent/timetable", label: "Timetable", icon: Clock },
  { to: "/portal/parent/communication", label: "Communication", icon: Megaphone },
  { to: "/portal/parent/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/portal/parent/library", label: "Library", icon: BookMarked },
  { to: "/portal/parent/transport", label: "Transport", icon: Bus },
  { to: "/portal/parent/downloads", label: "Downloads", icon: Download },
  { to: "/portal/parent/settings", label: "Settings", icon: Settings },
];

function ChildSwitcher() {
  const { children, selectedId, setSelectedId } = useSelectedChild();
  if (children.length <= 1) return null;
  return (
    <Select value={selectedId || ""} onValueChange={setSelectedId}>
      <SelectTrigger className="w-44 sm:w-60 h-9 text-xs font-semibold">
        <SelectValue placeholder="Select child" />
      </SelectTrigger>
      <SelectContent>
        {children.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.first_name} {c.last_name}
            <span className="text-muted-foreground"> · {c.grade_name || "—"}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { account, logout } = usePortalAuth();
  return (
    <div className="flex flex-col h-full">
      <Link
        to="/portal/parent"
        className="flex items-center gap-2.5 h-16 px-5 border-b border-border/60"
        onClick={onNavigate}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-md">
          <School className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-black tracking-tight truncate max-w-[10rem]">
            {account?.school_name || "CHUO"}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Parent Portal
          </p>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {PARENT_NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/portal/parent"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <n.icon className="h-[1.05rem] w-[1.05rem]" />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border/60">
        <button
          onClick={() => {
            logout();
            window.location.href = "/userLogin";
          }}
          className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function Shell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-border/60 bg-card flex-col fixed inset-y-0 left-0">
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarBody onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border/60 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <ChildSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-8 max-w-7xl w-full mx-auto">
          {(title || actions) && (
            <div className="flex items-start justify-between gap-3 mb-5 sm:mb-7">
              <div>
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export function PortalShell(props: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <SelectedChildProvider>
      <Shell {...props} />
    </SelectedChildProvider>
  );
}