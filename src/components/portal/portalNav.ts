import { LayoutDashboard, FileText, CalendarCheck, Banknote, User } from "lucide-react";
import { PortalNavItem } from "./PortalLayout";

export const parentNav: PortalNavItem[] = [
  { to: "/portal/parent", label: "Overview", icon: LayoutDashboard },
  { to: "/portal/parent/results", label: "Results", icon: FileText },
  { to: "/portal/parent/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/portal/parent/fees", label: "Fees", icon: Banknote },
  { to: "/portal/parent/profile", label: "Profile", icon: User },
];

export const studentNav: PortalNavItem[] = [
  { to: "/portal/student", label: "Overview", icon: LayoutDashboard },
  { to: "/portal/student/results", label: "Results", icon: FileText },
  { to: "/portal/student/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/portal/student/fees", label: "Fees", icon: Banknote },
  { to: "/portal/student/profile", label: "Profile", icon: User },
];
