import {
  LayoutDashboard, GraduationCap, Users, Banknote, ClipboardList,
  Package, Settings, LogOut, School, BookOpen, Calendar, Receipt,
  MessageSquare, BarChart3, Wallet, ArrowUpRight, UserCircle, Library,
  ChevronDown, ShoppingBag, Sparkles, ListChecks, Building2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, ROLE_LABELS, UserRole } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const allNav = {
  overview: {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin","accountant","teacher","librarian"] as UserRole[] },
      { title: "Students", url: "/students", icon: GraduationCap, roles: ["admin","teacher"] as UserRole[] },
      { title: "Parents", url: "/parents", icon: Users, roles: ["admin"] as UserRole[] },
      { title: "Classes", url: "/classes", icon: School, roles: ["admin","teacher"] as UserRole[] },
      { title: "Attendance", url: "/attendance", icon: ClipboardList, roles: ["admin","teacher"] as UserRole[] },
      { title: "Promotion", url: "/promotion", icon: ArrowUpRight, roles: ["admin"] as UserRole[] },
    ],
  },
  academic: {
    label: "Academic",
    icon: BookOpen,
    items: [
      { title: "Examinations", url: "/examinations", icon: BookOpen, roles: ["admin","teacher"] as UserRole[] },
      { title: "Communication", url: "/communication", icon: MessageSquare, roles: ["admin","teacher","librarian"] as UserRole[] },
    ],
  },
  finance: {
    label: "Finance",
    icon: Banknote,
    items: [
      { title: "Finance", url: "/finance", icon: Banknote, roles: ["admin","accountant"] as UserRole[] },
      { title: "Fee Assignment", url: "/fee-assignment", icon: ListChecks, roles: ["admin","accountant"] as UserRole[] },
      { title: "Student Fees", url: "/student-fees", icon: UserCircle, roles: ["admin","accountant"] as UserRole[] },
      { title: "Payments", url: "/payments", icon: Receipt, roles: ["admin","accountant"] as UserRole[] },
      { title: "Expenses", url: "/expenses", icon: Wallet, roles: ["admin","accountant"] as UserRole[] },
    ],
  },
  admin: {
    label: "Admin",
    icon: Settings,
    items: [
      { title: "Reports", url: "/reports", icon: BarChart3, roles: ["admin","accountant"] as UserRole[] },
      { title: "Library", url: "/library", icon: Library, roles: ["admin","librarian","teacher"] as UserRole[] },
      { title: "School Store", url: "/inventory", icon: ShoppingBag, roles: ["admin","accountant"] as UserRole[] },
      { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] as UserRole[] },
    ],
  },
  portal: {
    label: "My Portal",
    icon: UserCircle,
    items: [
      { title: "Parent Portal", url: "/parent-portal", icon: Users, roles: ["parent"] as UserRole[] },
      { title: "Student Panel", url: "/student-panel", icon: UserCircle, roles: ["student"] as UserRole[] },
    ],
  },
};

type SectionKey = keyof typeof allNav;

const NavSection = ({ sectionKey, isOpen, onToggle }: { sectionKey: SectionKey; isOpen: boolean; onToggle: () => void }) => {
  const { role } = useAuth();
  const location = useLocation();
  const section = allNav[sectionKey];
  const visible = section.items.filter(i => i.roles.includes(role));
  if (visible.length === 0) return null;

  const hasActiveChild = visible.some(i => location.pathname === i.url);
  const SectionIcon = section.icon;

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200",
          hasActiveChild
            ? "text-sidebar-primary bg-sidebar-primary/5"
            : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
        )}
      >
        <SectionIcon className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">{section.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-2 mt-0.5 space-y-0.5 border-l border-sidebar-border/50 pl-3">
              {visible.map(item => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                    "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
                  )}
                  activeClassName="bg-sidebar-primary/10 text-sidebar-primary font-medium shadow-[inset_2px_0_0_0_hsl(var(--sidebar-primary))] -ml-[13px] pl-[25px] border-l-0"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function AppSidebar() {
  const { user, profile, role, roleLabel, switchRole, logout, signOut } = useAuth();
  const { currentSchool, schools, switchSchool } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();

  // Display helpers
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || user?.email || "User"
    : user?.email || "Guest";
  const displayInitials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "?"
    : "?";

  // Auto-open sections that contain the active route
  const getInitialOpen = (): Record<SectionKey, boolean> => {
    const state: Record<string, boolean> = {};
    for (const [key, section] of Object.entries(allNav)) {
      state[key] = section.items.some(i => location.pathname === i.url);
    }
    if (!Object.values(state).some(Boolean)) state.overview = true;
    return state as Record<SectionKey, boolean>;
  };

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(getInitialOpen);

  const toggleSection = (key: SectionKey) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    signOut();
    logout();
    navigate("/login");
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 shadow-lg shadow-sidebar-primary/20">
              <School className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-sidebar-background" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-sidebar-accent-foreground flex items-center gap-1.5">
              CHUO
              <Sparkles className="h-3.5 w-3.5 text-sidebar-primary/80" />
            </h2>
            <p className="text-[11px] text-sidebar-foreground/60">
              {currentSchool?.name || "School Management"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* School Switcher */}
      {schools.length > 1 && (
        <div className="mx-4 mb-2 px-1">
          <Select value={currentSchool?.id || ""} onValueChange={switchSchool}>
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent/50 border-sidebar-border/50 text-sidebar-accent-foreground rounded-lg">
              <Building2 className="h-3 w-3 mr-1.5" />
              <SelectValue placeholder="Select School" />
            </SelectTrigger>
            <SelectContent>
              {schools.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mx-4 mb-3 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

      <SidebarContent className="px-3 py-1 scrollbar-thin">
        {(Object.keys(allNav) as SectionKey[]).map(key => (
          <NavSection
            key={key}
            sectionKey={key}
            isOpen={openSections[key]}
            onToggle={() => toggleSection(key)}
          />
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 space-y-3">
        <div className="mx-1 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

        {/* Role Switcher (dev mode) */}
        <div className="px-1">
          <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 mb-1.5">Switch Role</p>
          <Select value={role} onValueChange={(v) => { switchRole(v as UserRole); navigate("/dashboard"); }}>
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent/50 border-sidebar-border/50 text-sidebar-accent-foreground rounded-lg hover:bg-sidebar-accent transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as string[]).filter(r => ["admin","accountant","teacher","librarian","parent","student"].includes(r)).map(r => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-1 py-2.5 rounded-xl bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors cursor-default">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/60 text-sidebar-primary-foreground text-xs font-bold shadow-sm">
            {displayInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
            <p className="text-[11px] text-sidebar-foreground/60 truncate">{roleLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
