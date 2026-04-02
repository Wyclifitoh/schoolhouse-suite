import { Bell, BookOpen, Briefcase, Building2, Calendar, ClipboardList, FileText, GraduationCap, Layers, Library, MessageSquare, Package, Receipt, School, Search, Settings, Users, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = ["super_admin", "school_admin", "deputy_admin"] as const;
const FINANCE_ROLES = [...ADMIN_ROLES, "finance_officer"] as const;
const ACADEMIC_ROLES = [...ADMIN_ROLES, "teacher"] as const;
const INVENTORY_ROLES = [...ADMIN_ROLES, "store_manager", "pos_attendant"] as const;

const navigationGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: School, roles: [...ADMIN_ROLES, "finance_officer", "teacher", "front_office"] },
      { title: "Students", url: "/students", icon: GraduationCap, roles: [...ADMIN_ROLES, "teacher", "front_office"] },
      { title: "Parents", url: "/parents", icon: Users, roles: [...ADMIN_ROLES, "front_office"] },
      { title: "Attendance", url: "/attendance", icon: ClipboardList, roles: ACADEMIC_ROLES },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Classes", url: "/classes", icon: School, roles: ACADEMIC_ROLES },
      { title: "Streams", url: "/streams", icon: Layers, roles: ACADEMIC_ROLES },
      { title: "Subjects", url: "/subjects", icon: BookOpen, roles: ACADEMIC_ROLES },
      { title: "Class Timetable", url: "/class-timetable", icon: Calendar, roles: ACADEMIC_ROLES },
      { title: "Teacher Timetable", url: "/teacher-timetable", icon: Calendar, roles: ACADEMIC_ROLES },
      { title: "Examinations", url: "/examinations", icon: FileText, roles: ACADEMIC_ROLES },
      { title: "Communication", url: "/communication", icon: MessageSquare, roles: [...ADMIN_ROLES, "teacher", "front_office"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Finance", url: "/finance", icon: Wallet, roles: FINANCE_ROLES },
      { title: "Fee Assignment", url: "/fee-assignment", icon: Receipt, roles: FINANCE_ROLES },
      { title: "Payments", url: "/payments", icon: Receipt, roles: [...FINANCE_ROLES, "front_office"] },
      { title: "Expenses", url: "/expenses", icon: Wallet, roles: FINANCE_ROLES },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Inventory", url: "/inventory", icon: Package, roles: INVENTORY_ROLES },
      { title: "Library", url: "/library", icon: Library, roles: [...ADMIN_ROLES, "teacher"] },
      { title: "Staff", url: "/staff-directory", icon: Briefcase, roles: ADMIN_ROLES },
      { title: "Departments", url: "/departments", icon: Building2, roles: ADMIN_ROLES },
      { title: "Settings", url: "/settings", icon: Settings, roles: ADMIN_ROLES },
    ],
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { profile, user, roleLabel, hasAnyRole } = useAuth();
  const { currentSchool } = useSchool();

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || user?.email || "Guest"
    : user?.email || "Guest";
  const displayInitials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "?"
    : "?";

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAnyRole(item.roles as any)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <School className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black tracking-[0.18em] text-foreground">CHUO</p>
                <p className="truncate text-[11px] text-muted-foreground">{currentSchool?.name || "School Management System"}</p>
              </div>
            </div>
          </div>

          <div className="hidden md:block relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search modules..." className="h-10 rounded-xl border-border/60 bg-card pl-9" />
          </div>

          <button className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card transition-colors hover:bg-muted md:flex">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2 premium-shadow">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-black">
              {displayInitials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight text-foreground">{displayName}</p>
              <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 bg-card/60 px-4 py-3 sm:px-6">
          <div className="flex gap-6 overflow-x-auto pb-1">
            {visibleGroups.map((group) => (
              <div key={group.label} className="flex min-w-max flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{group.label}</p>
                <div className="flex gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-2 text-sm font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
                        activeClassName={cn("border-primary/30 bg-primary/10 text-primary")}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <main className="overflow-auto">{children}</main>
      </div>
    </div>
  );
}
