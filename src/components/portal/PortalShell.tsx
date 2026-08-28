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
  Download,
  Settings,
  Menu,
  ChevronDown,
  LifeBuoy,
  Check,
  Smartphone,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Flat primary navigation, exactly like the reference design. */
const NAV: NavItem[] = [
  { to: "/portal/parent", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/parent/profile", label: "Profile", icon: User },
  { to: "/portal/parent/academics", label: "Academics", icon: GraduationCap },
  { to: "/portal/parent/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/portal/parent/homework", label: "Homework", icon: BookOpenCheck },
  { to: "/portal/parent/fees", label: "Finance", icon: Banknote },
  { to: "/portal/parent/timetable", label: "Timetable", icon: Clock },
  {
    to: "/portal/parent/communication",
    label: "Communication",
    icon: Megaphone,
  },
  { to: "/portal/parent/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/portal/parent/library", label: "Library", icon: BookMarked },
  { to: "/portal/parent/downloads", label: "Downloads", icon: Download },
];

const FOOTER_NAV: NavItem[] = [
  { to: "/portal/parent/settings", label: "Settings", icon: Settings },
];

/* ------------------------------------------------------------------ */
/* Child selector                                                      */
/* ------------------------------------------------------------------ */

function ChildSwitcher() {
  const { children, selectedId, setSelectedId, selected } = useSelectedChild();
  if (!children.length) return null;

  const label = selected
    ? `${selected.first_name} ${selected.last_name}`
    : "—";
  const sub = [selected?.grade_name, selected?.stream_name]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-w-0">

      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={children.length < 2}>
          <button className="flex w-full min-w-0 items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 sm:w-[19rem]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold uppercase text-primary">
              {(selected?.first_name?.[0] || "") +
                (selected?.last_name?.[0] || "")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {label}
                {sub ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    — {sub}
                  </span>
                ) : null}
              </span>
            </span>
            {children.length > 1 && (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[19rem]">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Your children
          </DropdownMenuLabel>
          {children.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className="gap-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-bold uppercase">
                {c.first_name[0]}
                {c.last_name[0]}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-semibold">
                  {c.first_name} {c.last_name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {c.admission_number} · {c.grade_name || "—"}
                </span>
              </span>
              {c.id === selectedId && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { account, logout } = usePortalAuth();

  const item = ({ isActive }: { isActive: boolean }) =>
    cn(
      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
      isActive
        ? "bg-primary/10 font-semibold text-primary"
        : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <Link
        to="/portal/parent"
        className="flex h-[4.5rem] shrink-0 items-center gap-3 px-5"
        onClick={onNavigate}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <School className="h-5 w-5" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[13px] font-extrabold uppercase tracking-tight text-foreground">
            {account?.school_name || "CHUO"}
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Parent Portal
          </span>
        </span>
      </Link>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/portal/parent"}
              onClick={onNavigate}
              className={item}
            >
              <n.icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
              {n.label}
            </NavLink>
          ))}
        </div>

        <div className="my-3 border-t border-border/70" />

        <div className="space-y-0.5">
          {FOOTER_NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={item}
            >
              <n.icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
              {n.label}
            </NavLink>
          ))}
          <NavLink
            to="/portal/parent/communication"
            onClick={onNavigate}
            className={item}
          >
            <LifeBuoy className="h-[1.05rem] w-[1.05rem] shrink-0" />
            Help &amp; support
          </NavLink>
          <button
            onClick={() => {
              logout();
              window.location.href = "/userLogin";
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[1.05rem] w-[1.05rem] shrink-0" />
            Sign out
          </button>
        </div>
      </nav>

      <div className="shrink-0 p-3">
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
              <Smartphone className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-foreground">
                Stay in the loop
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                Turn on notifications to never miss results or fee updates.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="mt-3 w-full bg-card text-xs"
          >
            <Link to="/portal/parent/settings" onClick={onNavigate}>
              Notification settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header + shell                                                      */
/* ------------------------------------------------------------------ */

function AccountMenu() {
  const { account, logout } = usePortalAuth();
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-accent">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </span>
          <span className="hidden min-w-0 text-left leading-tight sm:block">
            <span className="block truncate text-[13px] font-semibold text-foreground">
              {account?.school_name ? "Parent account" : "Parent"}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Parent
            </span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="leading-tight">
          <span className="block text-sm font-semibold">Parent account</span>
          <span className="block truncate text-[11px] font-normal text-muted-foreground">
            {account?.school_name || "CHUO"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/portal/parent/profile")}>
          <User className="mr-2 h-4 w-4" /> My profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/portal/parent/settings")}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => {
            logout();
            window.location.href = "/userLogin";
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Shell({
  children,
  title,
  subtitle,
  breadcrumb,
  actions,
  bleed,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
  actions?: ReactNode;
  bleed?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-[16.5rem] shrink-0 flex-col border-r border-border/70 lg:flex">
        <SidebarBody />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarBody onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[16.5rem]">
        <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between gap-3 border-b border-border/70 bg-card px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <ChildSwitcher />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>

        <main
          className={cn(
            "mx-auto w-full max-w-[1440px] flex-1",
            bleed
              ? "px-4 py-5 sm:px-6 lg:px-8"
              : "px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
          )}
        >
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                {breadcrumb && (
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {breadcrumb}
                  </p>
                )}
                {title && (
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}
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
  breadcrumb?: string;
  actions?: ReactNode;
  bleed?: boolean;
}) {
  return (
    <SelectedChildProvider>
      <Shell {...props} />
    </SelectedChildProvider>
  );
}
