import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell, BookOpen, Briefcase, Building2, Calendar, ChevronDown, ChevronRight, ClipboardList,
  Download, FileText, GraduationCap, Home, Layers, Library, LogOut, Menu,
  MessageSquare, Package, Receipt, School, Search, Settings, Truck, Users,
  Wallet, X, Award, BarChart3, Clock, CreditCard, UserCheck, Clipboard,
  Bus, ScrollText, Archive, User, Shield, Timer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { TermSwitcher } from "@/components/layout/TermSwitcher";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { createPortal } from "react-dom";

const ADMIN_ROLES = ["super_admin", "school_admin", "deputy_admin"] as const;
const FINANCE_ROLES = [...ADMIN_ROLES, "finance_officer"] as const;
const ACADEMIC_ROLES = [...ADMIN_ROLES, "teacher"] as const;
const INVENTORY_ROLES = [...ADMIN_ROLES, "store_manager", "pos_attendant"] as const;
const ALL_ROLES = [...ADMIN_ROLES, "finance_officer", "teacher", "front_office", "store_manager", "pos_attendant"] as const;

interface NavItem { title: string; url: string; icon: any; roles: readonly string[]; }
interface NavGroup { label: string; icon: any; items: NavItem[]; }

const navigationGroups: NavGroup[] = [
  {
    label: "Dashboard", icon: Home,
    items: [{ title: "Dashboard", url: "/dashboard", icon: Home, roles: ALL_ROLES }],
  },
  {
    label: "Student Info", icon: GraduationCap,
    items: [
      { title: "All Students", url: "/students", icon: GraduationCap, roles: [...ADMIN_ROLES, "teacher", "front_office"] },
      { title: "Parents / Guardians", url: "/parents", icon: Users, roles: [...ADMIN_ROLES, "front_office"] },
      { title: "Student Promotion", url: "/promotion", icon: UserCheck, roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Fee Collection", icon: Wallet,
    items: [
      { title: "Fee Dashboard", url: "/finance", icon: Wallet, roles: FINANCE_ROLES },
      { title: "Fee Assignment", url: "/fee-assignment", icon: Receipt, roles: FINANCE_ROLES },
      { title: "Collect Payment", url: "/payments", icon: CreditCard, roles: [...FINANCE_ROLES, "front_office"] },
      { title: "Excess Payments", url: "/excess-payments", icon: Wallet, roles: FINANCE_ROLES },
      { title: "Fee Reminders", url: "/fee-reminders", icon: Bell, roles: FINANCE_ROLES },
    ],
  },
  {
    label: "Academics", icon: BookOpen,
    items: [
      { title: "Classes", url: "/classes", icon: School, roles: ACADEMIC_ROLES },
      { title: "Streams", url: "/streams", icon: Layers, roles: ACADEMIC_ROLES },
      { title: "Subjects", url: "/subjects", icon: BookOpen, roles: ACADEMIC_ROLES },
      { title: "Timetable", url: "/class-timetable", icon: Calendar, roles: ACADEMIC_ROLES },
      { title: "Teacher Timetable", url: "/teacher-timetable", icon: Calendar, roles: ACADEMIC_ROLES },
      { title: "Assign Class Teacher", url: "/assign-class-teacher", icon: UserCheck, roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Examinations", icon: ClipboardList,
    items: [{ title: "Exam Management", url: "/examinations", icon: ClipboardList, roles: ACADEMIC_ROLES }],
  },
  {
    label: "Attendance", icon: Clipboard,
    items: [
      { title: "Student Attendance", url: "/attendance", icon: ClipboardList, roles: ACADEMIC_ROLES },
      { title: "Staff Attendance", url: "/staff-attendance", icon: Clipboard, roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Human Resource", icon: Briefcase,
    items: [
      { title: "Staff Directory", url: "/staff-directory", icon: Briefcase, roles: ADMIN_ROLES },
      { title: "Departments", url: "/departments", icon: Building2, roles: ADMIN_ROLES },
      { title: "Leave Management", url: "/leave-management", icon: Calendar, roles: ADMIN_ROLES },
      { title: "Payroll", url: "/payroll", icon: Wallet, roles: FINANCE_ROLES },
    ],
  },
  {
    label: "Expense", icon: Receipt,
    items: [{ title: "Expenses", url: "/expenses", icon: Receipt, roles: FINANCE_ROLES }],
  },
  {
    label: "Communication", icon: MessageSquare,
    items: [{ title: "Notice Board", url: "/communication", icon: MessageSquare, roles: [...ADMIN_ROLES, "teacher", "front_office"] }],
  },
  {
    label: "Homework", icon: FileText,
    items: [{ title: "Homework", url: "/homework", icon: FileText, roles: ACADEMIC_ROLES }],
  },
  {
    label: "Library", icon: Library,
    items: [{ title: "Library", url: "/library", icon: Library, roles: [...ADMIN_ROLES, "teacher"] }],
  },
  {
    label: "Inventory", icon: Package,
    items: [{ title: "Store & POS", url: "/inventory", icon: Package, roles: INVENTORY_ROLES }],
  },
  {
    label: "Reports", icon: BarChart3,
    items: [
      { title: "Finance Reports", url: "/reports/finance", icon: Wallet, roles: FINANCE_ROLES },
      { title: "Student Reports", url: "/reports/students", icon: GraduationCap, roles: ACADEMIC_ROLES },
      { title: "Attendance Reports", url: "/reports/attendance", icon: ClipboardList, roles: ACADEMIC_ROLES },
      { title: "Exam Reports", url: "/reports/examinations", icon: Award, roles: ACADEMIC_ROLES },
      { title: "HR Reports", url: "/reports/hr", icon: Briefcase, roles: ADMIN_ROLES },
      { title: "Library Reports", url: "/reports/library", icon: Library, roles: ADMIN_ROLES },
      { title: "Audit Trail", url: "/reports/audit-trail", icon: ScrollText, roles: ADMIN_ROLES },
      { title: "User Logs", url: "/reports/user-logs", icon: Clock, roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Settings", icon: Settings,
    items: [{ title: "Settings", url: "/settings", icon: Settings, roles: ADMIN_ROLES }],
  },
];

/* ── Session Timeout Hook ── */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min
const IDLE_WARNING_MS = 25 * 60 * 1000; // show warning at 25 min
const COUNTDOWN_SECONDS = 5 * 60; // 5 min countdown

function useSessionTimeout(onLogout: () => void, onRefresh: () => void) {
  const [showDialog, setShowDialog] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const lastActivityRef = useRef(Date.now());
  const warningTimerRef = useRef<ReturnType<typeof setInterval>>();

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showDialog) return; // don't auto-dismiss warning
  }, [showDialog]);

  // Track user activity
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, resetActivity));
  }, [resetActivity]);

  // Check for idle every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= SESSION_TIMEOUT_MS) {
        // Fully timed out
        clearInterval(interval);
        setShowDialog(false);
        onLogout();
      } else if (idle >= IDLE_WARNING_MS && !showDialog) {
        // User is idle, show warning
        setShowDialog(true);
        setCountdown(Math.ceil((SESSION_TIMEOUT_MS - idle) / 1000));
      } else if (idle < IDLE_WARNING_MS && !showDialog) {
        // User is active, silently refresh
        onRefresh();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [showDialog, onLogout, onRefresh]);

  // Countdown timer for dialog
  useEffect(() => {
    if (!showDialog) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    warningTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [showDialog, onLogout]);

  const extendSession = useCallback(() => {
    setShowDialog(false);
    lastActivityRef.current = Date.now();
    onRefresh();
    setCountdown(COUNTDOWN_SECONDS);
  }, [onRefresh]);

  const logoutNow = useCallback(() => {
    setShowDialog(false);
    onLogout();
  }, [onLogout]);

  return { showDialog, countdown, extendSession, logoutNow };
}

/* ── Portal-based Desktop Nav Dropdown ── */
function DesktopNavItem({ group }: { group: NavGroup & { items: NavItem[] } }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();
  const location = useLocation();
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const isActive = group.items.some(item => location.pathname === item.url || location.pathname.startsWith(item.url + "/"));
  const isSingle = group.items.length === 1;

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 220;
      let left = rect.left;
      // Prevent overflow on right
      if (left + dropdownWidth > window.innerWidth - 8) {
        left = window.innerWidth - dropdownWidth - 8;
      }
      setPos({ top: rect.bottom + 4, left });
    }
  }, []);

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    updatePos();
    setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

  if (isSingle) {
    const item = group.items[0];
    return (
      <button
        onClick={() => navigate(item.url)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0",
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )}
      >
        <group.icon className="h-3.5 w-3.5" />
        <span>{group.label}</span>
      </button>
    );
  }

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      onMouseEnter={() => clearTimeout(timeoutRef.current)}
      onMouseLeave={handleLeave}
      className="fixed z-[9999] min-w-[220px] rounded-xl border border-border/60 bg-popover p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
      style={{ top: pos.top, left: pos.left }}
    >
      {group.items.map(item => (
        <button
          key={item.url}
          onClick={() => { navigate(item.url); setOpen(false); }}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg transition-all",
            location.pathname === item.url
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="shrink-0"
    >
      <button
        ref={triggerRef}
        onClick={() => { if (!open) { updatePos(); setOpen(true); } else { setOpen(false); } }}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )}
      >
        <group.icon className="h-3.5 w-3.5" />
        <span>{group.label}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {dropdown}
    </div>
  );
}

/* ── Mobile Nav Group ── */
function MobileNavGroup({ group, onNavigate }: { group: NavGroup & { items: NavItem[] }; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = group.items.some(item => location.pathname === item.url);
  const isSingle = group.items.length === 1;

  if (isSingle) {
    const item = group.items[0];
    return (
      <button
        onClick={() => { navigate(item.url); onNavigate(); }}
        className={cn(
          "flex items-center gap-2.5 w-full px-3 py-3 text-sm font-semibold rounded-xl transition-all",
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <group.icon className="h-4 w-4" />
        <span>{group.label}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-3 text-sm font-semibold rounded-xl transition-all",
          isActive ? "bg-primary/5 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <span className="flex items-center gap-2.5"><group.icon className="h-4 w-4" />{group.label}</span>
        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-90")} />
      </button>
      {open && (
        <div className="ml-5 mt-1 mb-1 space-y-0.5 border-l-2 border-primary/20 pl-4">
          {group.items.map(item => (
            <button
              key={item.url}
              onClick={() => { navigate(item.url); onNavigate(); }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg transition-all",
                location.pathname === item.url ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Session Timeout Dialog ── */
function SessionTimeoutDialog({ open, countdown, onExtend, onLogout }: {
  open: boolean; countdown: number; onExtend: () => void; onLogout: () => void;
}) {
  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-warning" />
            Session Expiring
          </DialogTitle>
          <DialogDescription>
            Your session will expire due to inactivity. You will be logged out automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-6">
          <div className="text-center">
            <div className="text-4xl font-black text-destructive tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Time remaining</p>
          </div>
        </div>
        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={onLogout} className="flex-1">
            <LogOut className="mr-2 h-4 w-4" />Logout
          </Button>
          <Button onClick={onExtend} className="flex-1">
            Extend Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DashboardLayoutProps { children: React.ReactNode; title: string; subtitle?: string; }

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { profile, user, roleLabel, hasAnyRole, signOut } = useAuth();
  const { currentSchool } = useSchool();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = profile ? `${profile.first_name} ${profile.last_name}`.trim() || user?.email || "Guest" : user?.email || "Guest";
  const displayInitials = profile ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "?" : "?";

  const visibleGroups = navigationGroups
    .map(g => ({ ...g, items: g.items.filter(item => hasAnyRole(item.roles as any)) }))
    .filter(g => g.items.length > 0);

  const handleLogout = useCallback(() => {
    signOut();
    localStorage.removeItem("chuo-token");
    localStorage.removeItem("chuo-school-id");
    navigate("/login", { replace: true });
  }, [signOut, navigate]);

  const handleSessionRefresh = useCallback(() => {
    // Silently refresh - the token is still valid for 30 min from last activity
    // In production, call /auth/refresh endpoint here
  }, []);

  const { showDialog, countdown, extendSession, logoutNow } = useSessionTimeout(handleLogout, handleSessionRefresh);

  return (
    <div className="min-h-screen bg-background">
      {/* Session Timeout Dialog */}
      <SessionTimeoutDialog open={showDialog} countdown={countdown} onExtend={extendSession} onLogout={logoutNow} />

      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 overflow-hidden">
              <div className="flex items-center gap-3 border-b px-4 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-widest">CHUO</p>
                  <p className="text-[11px] text-muted-foreground truncate">{currentSchool?.name || "School Management"}</p>
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(100vh-140px)] p-3 space-y-0.5">
                {visibleGroups.map(g => (
                  <MobileNavGroup key={g.label} group={g} onNavigate={() => setMobileOpen(false)} />
                ))}
              </div>
              <div className="border-t border-border/50 p-3">
                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-destructive font-semibold rounded-xl hover:bg-destructive/10 transition-colors">
                  <LogOut className="h-4 w-4" />Sign Out
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <School className="h-4.5 w-4.5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-black tracking-[0.15em] text-foreground leading-none">CHUO</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{currentSchool?.name || "School Management"}</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden md:block relative w-full max-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="h-8 rounded-lg border-border/60 bg-muted/40 pl-8 text-sm" />
          </div>

          {/* Term Switcher (admin / super_admin only) */}
          {hasAnyRole(["super_admin", "school_admin"] as any) && (
            <div className="hidden sm:block">
              <TermSwitcher compact />
            </div>
          )}

          {/* Notifications */}
          <button className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2.5 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                  {displayInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-tight text-foreground">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Navigation — NO overflow-x-auto, dropdowns use portals */}
        <nav className="hidden lg:block border-t border-border/40 bg-card/50 px-4">
          <div className="flex items-center gap-0.5 py-1.5 flex-wrap">
            {visibleGroups.map(g => (
              <DesktopNavItem key={g.label} group={g} />
            ))}
          </div>
        </nav>
      </header>

      {/* Page Content */}
      <div className="px-3 py-4 sm:px-6 sm:py-6 max-w-[1600px] mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
