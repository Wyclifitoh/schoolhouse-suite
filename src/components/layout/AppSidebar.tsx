import {
  LayoutDashboard, GraduationCap, Users, Banknote, ClipboardList,
  Package, Settings, LogOut, School, BookOpen, Calendar, Receipt,
  MessageSquare, BarChart3, Wallet, ArrowUpRight, UserCircle, Library,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, ROLE_LABELS, UserRole } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const allNav = {
  overview: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin","accountant","teacher","librarian"] as UserRole[] },
    { title: "Students", url: "/students", icon: GraduationCap, roles: ["admin","teacher"] as UserRole[] },
    { title: "Parents", url: "/parents", icon: Users, roles: ["admin"] as UserRole[] },
    { title: "Classes", url: "/classes", icon: School, roles: ["admin","teacher"] as UserRole[] },
    { title: "Attendance", url: "/attendance", icon: ClipboardList, roles: ["admin","teacher"] as UserRole[] },
    { title: "Promotion", url: "/promotion", icon: ArrowUpRight, roles: ["admin"] as UserRole[] },
  ],
  academic: [
    { title: "Examinations", url: "/examinations", icon: BookOpen, roles: ["admin","teacher"] as UserRole[] },
    { title: "Communication", url: "/communication", icon: MessageSquare, roles: ["admin","teacher","librarian"] as UserRole[] },
  ],
  finance: [
    { title: "Finance", url: "/finance", icon: Banknote, roles: ["admin","accountant"] as UserRole[] },
    { title: "Payments", url: "/payments", icon: Receipt, roles: ["admin","accountant"] as UserRole[] },
    { title: "Expenses", url: "/expenses", icon: Wallet, roles: ["admin","accountant"] as UserRole[] },
  ],
  admin: [
    { title: "Reports", url: "/reports", icon: BarChart3, roles: ["admin","accountant"] as UserRole[] },
    { title: "Inventory", url: "/inventory", icon: Package, roles: ["admin","librarian"] as UserRole[] },
    { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] as UserRole[] },
  ],
  portal: [
    { title: "Parent Portal", url: "/parent-portal", icon: Users, roles: ["parent"] as UserRole[] },
    { title: "Student Panel", url: "/student-panel", icon: UserCircle, roles: ["student"] as UserRole[] },
  ],
};

const navLinkClass = "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const activeClass = "bg-sidebar-accent text-sidebar-primary font-medium";

const NavSection = ({ label, items }: { label: string; items: typeof allNav.overview }) => {
  const { role } = useAuth();
  const visible = items.filter(i => i.roles.includes(role));
  if (visible.length === 0) return null;
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-sidebar-foreground/50 px-3 mb-1">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end className={navLinkClass} activeClassName={activeClass}>
                  <item.icon className="h-4 w-4" /><span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export function AppSidebar() {
  const { user, role, roleLabel, switchRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <School className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-sidebar-accent-foreground">CHUO</h2>
            <p className="text-xs text-sidebar-foreground">School Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <NavSection label="Overview" items={allNav.overview} />
        <NavSection label="Academic" items={allNav.academic} />
        <NavSection label="Finance" items={allNav.finance} />
        <NavSection label="Admin" items={allNav.admin} />
        <NavSection label="My Portal" items={allNav.portal} />
      </SidebarContent>

      <SidebarFooter className="px-3 py-4 border-t border-sidebar-border space-y-3">
        {/* Role Switcher (demo) */}
        <div className="px-3">
          <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 mb-1">Switch Role (Demo)</p>
          <Select value={role} onValueChange={(v) => { switchRole(v as UserRole); navigate("/dashboard"); }}>
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
            {user?.avatar ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user?.name ?? "Guest"}</p>
            <p className="text-xs text-sidebar-foreground truncate">{roleLabel}</p>
          </div>
          <button onClick={handleLogout} className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
