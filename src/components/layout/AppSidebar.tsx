import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  TrendingUp,
  Banknote,
  Wallet,
  Receipt,
  Percent,
  Scale,
  Bell,
  Briefcase,
  Building2,
  UserCheck,
  Clock,
  DollarSign,
  Star,
  MessageSquare,
  BellRing,
  Mail,
  Library,
  Package,
  Truck,
  ShoppingCart,
  Archive,
  FileText,
  ChevronDown,
  BarChart3,
  ClipboardList,
  Settings,
  ArchiveIcon,
  LogOut,
  School,
  BookOpen,
  BookOpenCheck,
  PenTool,
  Layers,
  UserCog,
  TableProperties,
  FileBadge,
  CheckSquare,
  ListChecks,
  Sparkles,
  Shield,
  Activity,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { TermSwitcher } from "@/components/layout/TermSwitcher";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Role-based access helpers - IMPLEMENTED
const SUPER_ADMIN_ROLES: AppRole[] = ["super_admin"];
const ADMIN_ROLES: AppRole[] = ["super_admin", "admin"];
const MANAGER_ROLES: AppRole[] = ["super_admin", "admin", "manager"];
const TEACHER_ROLES: AppRole[] = ["super_admin", "admin", "teacher"];
const ACCOUNTANT_ROLES: AppRole[] = ["super_admin", "admin", "accountant"];
const RECEPTIONIST_ROLES: AppRole[] = ["super_admin", "admin", "receptionist"];
const LIBRARIAN_ROLES: AppRole[] = ["super_admin", "admin", "librarian"];

// Combined role helpers for common access patterns
const ALL_STAFF_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "manager",
  "teacher",
  "accountant",
  "receptionist",
  "librarian",
];
const ACADEMIC_STAFF_ROLES: AppRole[] = ["super_admin", "admin", "teacher"];
const FINANCE_STAFF_ROLES: AppRole[] = ["super_admin", "admin", "accountant"];
const HR_STAFF_ROLES: AppRole[] = ["super_admin", "admin", "manager"];

// Future modules (commented out until implemented)
// const TRANSPORT_ROLES: AppRole[] = ["super_admin", "admin", "transport_manager"];
// const HOSTEL_ROLES: AppRole[] = ["super_admin", "admin", "hostel_manager"];
// const CLINIC_ROLES: AppRole[] = ["super_admin", "admin", "nurse"];
// const DISCIPLINE_ROLES: AppRole[] = ["super_admin", "admin", "discipline_officer"];
// const VISITOR_ROLES: AppRole[] = ["super_admin", "admin", "security"];
// const ALUMNI_ROLES: AppRole[] = ["super_admin", "admin", "alumni_officer"];

const navConfig = {
  dashboard: {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        roles: ALL_STAFF_ROLES,
      },
    ],
  },

  studentManagement: {
    label: "Student Management",
    icon: GraduationCap,
    items: [
      {
        title: "Students",
        url: "/students",
        icon: GraduationCap,
        roles: [
          ...ADMIN_ROLES,
          ...TEACHER_ROLES,
          ...RECEPTIONIST_ROLES,
        ] as AppRole[],
      },
      {
        title: "Parents",
        url: "/parents",
        icon: Users,
        roles: [...ADMIN_ROLES, ...RECEPTIONIST_ROLES] as AppRole[],
      },
      {
        title: "Attendance",
        url: "/attendance",
        icon: Calendar,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Promotion",
        url: "/promotion",
        icon: TrendingUp,
        roles: ADMIN_ROLES,
      },
    ],
  },

  academics: {
    label: "Academics",
    icon: BookOpen,
    items: [
      {
        title: "Classes",
        url: "/classes",
        icon: School,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Subjects",
        url: "/subjects",
        icon: BookOpen,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Subject Allocation",
        url: "/subject-allocation",
        icon: Layers,
        roles: ADMIN_ROLES,
      },
      {
        title: "Teacher Allocation",
        url: "/teacher-allocation",
        icon: UserCog,
        roles: ADMIN_ROLES,
      },
      {
        title: "Assign Class Teacher",
        url: "/assign-class-teacher",
        icon: UserCheck,
        roles: ADMIN_ROLES,
      },
      {
        title: "Class Timetable",
        url: "/class-timetable",
        icon: TableProperties,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Teacher Timetable",
        url: "/teacher-timetable",
        icon: Clock,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Lesson Plans (CBE)",
        url: "/lesson-plans",
        icon: BookOpenCheck,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Homework",
        url: "/homework",
        icon: PenTool,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Clubs & Societies",
        url: "/clubs",
        icon: Sparkles,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
    ],
  },

  assessmentsReports: {
    label: "Assessments & Reports",
    icon: FileBadge,
    items: [
      {
        title: "Assessments",
        url: "/assessments",
        icon: ClipboardList,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Assessment Tasks",
        url: "/assessment-tasks",
        icon: ListChecks,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Results",
        url: "/results",
        icon: CheckSquare,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Report Cards",
        url: "/report-cards",
        icon: FileBadge,
        roles: [...ADMIN_ROLES, ...TEACHER_ROLES] as AppRole[],
      },
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
        roles: [
          ...ADMIN_ROLES,
          ...TEACHER_ROLES,
          ...MANAGER_ROLES,
        ] as AppRole[],
      },
    ],
  },

  finance: {
    label: "Finance",
    icon: Banknote,
    items: [
      {
        title: "Finance Dashboard",
        url: "/finance/dashboard",
        icon: Banknote,
        roles: [...ADMIN_ROLES, ...ACCOUNTANT_ROLES] as AppRole[],
      },
      {
        title: "Fee Assignment",
        url: "/fee-assignment",
        icon: Receipt,
        roles: [...ADMIN_ROLES, ...ACCOUNTANT_ROLES] as AppRole[],
      },
      {
        title: "Payments",
        url: "/payments",
        icon: Wallet,
        roles: [
          ...ADMIN_ROLES,
          ...ACCOUNTANT_ROLES,
          ...RECEPTIONIST_ROLES,
        ] as AppRole[],
      },
      {
        title: "Fee Discounts",
        url: "/fee-discounts",
        icon: Percent,
        roles: [...ADMIN_ROLES, ...ACCOUNTANT_ROLES] as AppRole[],
      },
      {
        title: "Excess Payments",
        url: "/excess-payments",
        icon: TrendingUp,
        roles: [...ADMIN_ROLES, ...ACCOUNTANT_ROLES] as AppRole[],
      },
      {
        title: "Unallocated Payments",
        url: "/unallocated-payments",
        icon: Archive,
        roles: [...ADMIN_ROLES, ...ACCOUNTANT_ROLES] as AppRole[],
      },
      {
        title: "Fee Adjustments",
        url: "/fee-adjustments",
        icon: Scale,
        roles: [...ADMIN_ROLES, ...ACCOUNTANT_ROLES] as AppRole[],
      },
      {
        title: "Fee Reminders",
        url: "/fee-reminders",
        icon: Bell,
        roles: [...ADMIN_ROLES, ...ACCOUNTANT_ROLES] as AppRole[],
      },
      {
        title: "Expenses",
        url: "/expenses",
        icon: Wallet,
        roles: [...ADMIN_ROLES, ...ACCOUNTANT_ROLES] as AppRole[],
      },
    ],
  },

  humanResources: {
    label: "Human Resources",
    icon: Briefcase,
    items: [
      {
        title: "Staff Directory",
        url: "/staff-directory",
        icon: Users,
        roles: [...ADMIN_ROLES, ...MANAGER_ROLES] as AppRole[],
      },
      {
        title: "Departments",
        url: "/departments",
        icon: Building2,
        roles: [...ADMIN_ROLES, ...MANAGER_ROLES] as AppRole[],
      },
      {
        title: "Designations",
        url: "/designations",
        icon: UserCog,
        roles: ADMIN_ROLES,
      },
      {
        title: "Staff Attendance",
        url: "/staff-attendance",
        icon: Calendar,
        roles: [...ADMIN_ROLES, ...MANAGER_ROLES] as AppRole[],
      },
      {
        title: "Leave Management",
        url: "/leave-management",
        icon: Clock,
        roles: [...ADMIN_ROLES, ...MANAGER_ROLES] as AppRole[],
      },
      {
        title: "Payroll",
        url: "/payroll",
        icon: DollarSign,
        roles: ADMIN_ROLES,
      },
      {
        title: "Staff Ratings",
        url: "/staff-ratings",
        icon: Star,
        roles: [...ADMIN_ROLES, ...MANAGER_ROLES] as AppRole[],
      },
    ],
  },

  communication: {
    label: "Communication",
    icon: MessageSquare,
    items: [
      {
        title: "Communication",
        url: "/communication",
        icon: MessageSquare,
        roles: [
          ...ADMIN_ROLES,
          ...TEACHER_ROLES,
          ...RECEPTIONIST_ROLES,
        ] as AppRole[],
      },
      {
        title: "Notices",
        url: "/notices",
        icon: BellRing,
        roles: [
          ...ADMIN_ROLES,
          ...TEACHER_ROLES,
          ...RECEPTIONIST_ROLES,
        ] as AppRole[],
      },
      {
        title: "SMS",
        url: "/sms",
        icon: MessageSquare,
        roles: [
          ...ADMIN_ROLES,
          ...TEACHER_ROLES,
          ...RECEPTIONIST_ROLES,
        ] as AppRole[],
      },
      {
        title: "Email",
        url: "/email",
        icon: Mail,
        roles: [
          ...ADMIN_ROLES,
          ...TEACHER_ROLES,
          ...RECEPTIONIST_ROLES,
        ] as AppRole[],
      },
    ],
  },

  library: {
    label: "Library",
    icon: Library,
    items: [
      {
        title: "Library",
        url: "/library",
        icon: Library,
        roles: [...ADMIN_ROLES, ...LIBRARIAN_ROLES] as AppRole[],
      },
    ],
  },

  inventoryStore: {
    label: "Inventory & Store",
    icon: Package,
    items: [
      {
        title: "Inventory",
        url: "/inventory",
        icon: Package,
        roles: ADMIN_ROLES,
      },
      {
        title: "Suppliers",
        url: "/suppliers",
        icon: Truck,
        roles: ADMIN_ROLES,
      },
      {
        title: "Purchase Orders",
        url: "/purchase-orders",
        icon: ShoppingCart,
        roles: ADMIN_ROLES,
      },
      {
        title: "Stock Movements",
        url: "/stock-movements",
        icon: Archive,
        roles: ADMIN_ROLES,
      },
    ],
  },

  reports: {
    label: "Reports",
    icon: BarChart3,
    items: [
      {
        title: "Student Reports",
        url: "/reports/students",
        icon: GraduationCap,
        roles: [
          ...ADMIN_ROLES,
          ...TEACHER_ROLES,
          ...MANAGER_ROLES,
        ] as AppRole[],
      },
      {
        title: "Assessment Reports",
        url: "/reports/assessments",
        icon: FileBadge,
        roles: [
          ...ADMIN_ROLES,
          ...TEACHER_ROLES,
          ...MANAGER_ROLES,
        ] as AppRole[],
      },
      {
        title: "Finance Reports",
        url: "/reports/finance",
        icon: Banknote,
        roles: [
          ...ADMIN_ROLES,
          ...ACCOUNTANT_ROLES,
          ...MANAGER_ROLES,
        ] as AppRole[],
      },
      {
        title: "Attendance Reports",
        url: "/reports/attendance",
        icon: Calendar,
        roles: [
          ...ADMIN_ROLES,
          ...TEACHER_ROLES,
          ...MANAGER_ROLES,
        ] as AppRole[],
      },
      {
        title: "HR Reports",
        url: "/reports/hr",
        icon: Briefcase,
        roles: [...ADMIN_ROLES, ...MANAGER_ROLES] as AppRole[],
      },
      {
        title: "Library Reports",
        url: "/reports/library",
        icon: Library,
        roles: [...ADMIN_ROLES, ...LIBRARIAN_ROLES] as AppRole[],
      },
      {
        title: "Audit Trail",
        url: "/audit-trail",
        icon: Shield,
        roles: ADMIN_ROLES,
      },
      {
        title: "User Logs",
        url: "/user-logs",
        icon: Activity,
        roles: ADMIN_ROLES,
      },
    ],
  },

  administration: {
    label: "Administration",
    icon: Settings,
    items: [
      {
        title: "Academic Settings",
        url: "/settings/academic",
        icon: BookOpen,
        roles: ADMIN_ROLES,
      },
      {
        title: "Archives",
        url: "/archives",
        icon: ArchiveIcon,
        roles: ADMIN_ROLES,
      },
      {
        title: "System Settings",
        url: "/settings/system",
        icon: Settings,
        roles: SUPER_ADMIN_ROLES,
      },
    ],
  },

  // Future modules (commented out - will be shown only when implemented)
  // transport: {
  //   label: "Transport",
  //   icon: Bus,
  //   items: [
  //     { title: "Routes", url: "/transport/routes", icon: Map, roles: TRANSPORT_ROLES },
  //     { title: "Vehicles", url: "/transport/vehicles", icon: Bus, roles: TRANSPORT_ROLES },
  //     { title: "Stops", url: "/transport/stops", icon: MapPin, roles: TRANSPORT_ROLES },
  //     { title: "Tracking", url: "/transport/tracking", icon: Activity, roles: TRANSPORT_ROLES },
  //   ],
  // },
  // hostel: {
  //   label: "Hostel/Boarding",
  //   icon: Building2,
  //   items: [
  //     { title: "Rooms", url: "/hostel/rooms", icon: DoorOpen, roles: HOSTEL_ROLES },
  //     { title: "Residents", url: "/hostel/residents", icon: Users, roles: HOSTEL_ROLES },
  //     { title: "Attendance", url: "/hostel/attendance", icon: Calendar, roles: HOSTEL_ROLES },
  //   ],
  // },
  // clinic: {
  //   label: "Clinic/Nurse",
  //   icon: Heart,
  //   items: [
  //     { title: "Visits", url: "/clinic/visits", icon: Stethoscope, roles: CLINIC_ROLES },
  //     { title: "Records", url: "/clinic/records", icon: FileText, roles: CLINIC_ROLES },
  //     { title: "Medications", url: "/clinic/medications", icon: Pill, roles: CLINIC_ROLES },
  //   ],
  // },
  // discipline: {
  //   label: "Discipline",
  //   icon: Shield,
  //   items: [
  //     { title: "Incidents", url: "/discipline/incidents", icon: AlertTriangle, roles: DISCIPLINE_ROLES },
  //     { title: "Merits", url: "/discipline/merits", icon: Star, roles: DISCIPLINE_ROLES },
  //   ],
  // },
  // visitorManagement: {
  //   label: "Visitor Management",
  //   icon: DoorOpen,
  //   items: [
  //     { title: "Visitors", url: "/visitors", icon: User, roles: VISITOR_ROLES },
  //     { title: "Passes", url: "/visitor-passes", icon: Ticket, roles: VISITOR_ROLES },
  //   ],
  // },
  // procurement: {
  //   label: "Procurement",
  //   icon: ShoppingCart,
  //   items: [
  //     { title: "RFQs", url: "/procurement/rfqs", icon: FileQuestion, roles: ADMIN_ROLES },
  //     { title: "Vendors", url: "/procurement/vendors", icon: Truck, roles: ADMIN_ROLES },
  //     { title: "Contracts", url: "/procurement/contracts", icon: FileSignature, roles: ADMIN_ROLES },
  //   ],
  // },
  // alumni: {
  //   label: "Alumni",
  //   icon: Users,
  //   items: [
  //     { title: "Directory", url: "/alumni/directory", icon: Users, roles: ALUMNI_ROLES },
  //     { title: "Events", url: "/alumni/events", icon: Calendar, roles: ALUMNI_ROLES },
  //     { title: "Donations", url: "/alumni/donations", icon: Heart, roles: ALUMNI_ROLES },
  //   ],
  // },
  // certificates: {
  //   label: "Certificates & Documents",
  //   icon: FileText,
  //   items: [
  //     { title: "Templates", url: "/certificates/templates", icon: FileCode, roles: ADMIN_ROLES },
  //     { title: "Issuance", url: "/certificates/issuance", icon: Award, roles: ADMIN_ROLES },
  //     { title: "Requests", url: "/certificates/requests", icon: Inbox, roles: ADMIN_ROLES },
  //   ],
  // },
};

type SectionKey = keyof typeof navConfig;

const NavSection = ({
  sectionKey,
  isOpen,
  onToggle,
}: {
  sectionKey: SectionKey;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const { hasAnyRole } = useAuth();
  const location = useLocation();
  const section = navConfig[sectionKey];

  const visibleItems = section.items.filter((item) => hasAnyRole(item.roles));
  if (visibleItems.length === 0) return null;

  const hasActiveChild = visibleItems.some(
    (item) =>
      location.pathname === item.url ||
      location.pathname.startsWith(item.url + "/"),
  );
  const SectionIcon = section.icon;

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200",
          hasActiveChild
            ? "text-sidebar-primary bg-sidebar-primary/5"
            : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
        )}
      >
        <SectionIcon className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">{section.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
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
              {visibleItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                    "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60",
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
  const { user, profile, primaryRole, getRoleLabel, signOut } = useAuth();
  const { currentSchool, schools, switchSchool } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() ||
      user?.email ||
      "User"
    : user?.email || "Guest";
  const displayInitials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() ||
      "?"
    : "?";
  const displayRole = primaryRole ? getRoleLabel(primaryRole) : "User";

  const getInitialOpen = (): Record<SectionKey, boolean> => {
    const state: Record<string, boolean> = {};
    for (const [key, section] of Object.entries(navConfig)) {
      state[key] = section.items.some(
        (item) =>
          location.pathname === item.url ||
          location.pathname.startsWith(item.url + "/"),
      );
    }
    // Default open dashboard if nothing is active
    if (!Object.values(state).some(Boolean)) state.dashboard = true;
    return state as Record<SectionKey, boolean>;
  };

  const [openSections, setOpenSections] =
    useState<Record<SectionKey, boolean>>(getInitialOpen);

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await signOut();
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

      {schools.length > 1 && (
        <div className="mx-4 mb-2 px-1">
          <Select value={currentSchool?.id || ""} onValueChange={switchSchool}>
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent/50 border-sidebar-border/50 text-sidebar-accent-foreground rounded-lg">
              <Building2 className="h-3 w-3 mr-1.5" />
              <SelectValue placeholder="Select School" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <TermSwitcher />

      <div className="mx-4 mb-3 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

      <SidebarContent className="px-3 py-1 scrollbar-thin">
        {(Object.keys(navConfig) as SectionKey[]).map((key) => (
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
        <div className="flex items-center gap-3 px-1 py-2.5 rounded-xl bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors cursor-default">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/60 text-sidebar-primary-foreground text-xs font-bold shadow-sm">
            {displayInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-sidebar-foreground/60 truncate">
              {displayRole}
            </p>
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
