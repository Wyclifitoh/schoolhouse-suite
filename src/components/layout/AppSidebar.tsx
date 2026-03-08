import {
  LayoutDashboard, GraduationCap, Users, Banknote, ClipboardList,
  Package, Settings, LogOut, School, BookOpen, Calendar, Receipt,
  MessageSquare, BarChart3, Wallet,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: GraduationCap },
  { title: "Parents", url: "/parents", icon: Users },
  { title: "Classes", url: "/classes", icon: School },
  { title: "Attendance", url: "/attendance", icon: ClipboardList },
];

const academicNav = [
  { title: "Examinations", url: "/examinations", icon: BookOpen },
  { title: "Communication", url: "/communication", icon: MessageSquare },
];

const financeNav = [
  { title: "Finance", url: "/finance", icon: Banknote },
  { title: "Payments", url: "/payments", icon: Receipt },
  { title: "Expenses", url: "/expenses", icon: Wallet },
];

const adminNav = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Settings", url: "/settings", icon: Settings },
];

const navLinkClass = "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const activeClass = "bg-sidebar-accent text-sidebar-primary font-medium";

const NavSection = ({ label, items }: { label: string; items: typeof mainNav }) => (
  <SidebarGroup>
    <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-sidebar-foreground/50 px-3 mb-1">{label}</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
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

export function AppSidebar() {
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
        <NavSection label="Overview" items={mainNav} />
        <NavSection label="Academic" items={academicNav} />
        <NavSection label="Finance" items={financeNav} />
        <NavSection label="Admin" items={adminNav} />
      </SidebarContent>

      <SidebarFooter className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">JK</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">Jane Kamau</p>
            <p className="text-xs text-sidebar-foreground truncate">School Admin</p>
          </div>
          <button className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"><LogOut className="h-4 w-4" /></button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
