import { useLocation, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TermSwitcher } from "@/components/layout/TermSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/contexts/AuthContext";
import {
  ClipboardCheck,
  FileText,
  FileBadge,
  Layers,
  BarChart3,
  CheckSquare,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  /** If set, the tab is only shown when user has at least one of these roles */
  roles?: AppRole[];
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/assessments",
    label: "Assessments",
    icon: ClipboardCheck,
    exact: true,
  },
  {
    to: "/assessments/tasks",
    label: "Tasks",
    icon: FileText,
  },
  {
    to: "/assessments/results",
    label: "Results",
    icon: CheckSquare,
    roles: ["super_admin", "school_admin", "admin", "deputy_admin", "teacher"],
  },
  {
    to: "/assessments/report-cards",
    label: "Report Cards",
    icon: FileBadge,
    roles: ["super_admin", "school_admin", "admin", "deputy_admin", "teacher"],
  },
  {
    to: "/assessments/summative",
    label: "Summative",
    icon: Layers,
  },
  {
    to: "/assessments/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
];

/**
 * Shared navigation bar for the assessment module.
 * Renders module-level tabs + a global term switcher that calls switchTerm()
 * so changing the term on any page propagates across the whole module.
 */
export function AssessmentNav() {
  const { pathname } = useLocation();
  const { hasAnyRole } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || hasAnyRole(item.roles),
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 -mt-1">
      {/* Module tabs */}
      <div className="overflow-x-auto">
        <div className="inline-flex items-center gap-0.5 rounded-xl border border-border/70 bg-muted/40 p-1 shadow-[inset_0_1px_0_hsl(var(--background))]">
          {visibleItems.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-background text-primary shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                )}
              >
                <item.icon className="h-3.5 w-3.5 opacity-80" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Global term selector — calls switchTerm() so it propagates everywhere */}
      <div className="shrink-0">
        <TermSwitcher compact showSwitchButton={false} />
      </div>
    </div>
  );
}
