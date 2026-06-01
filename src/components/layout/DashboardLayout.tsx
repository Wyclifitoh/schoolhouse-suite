// src/components/layout/DashboardLayout.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Menu,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  School,
  Bell,
  Timer,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { TermSwitcher } from "@/components/layout/TermSwitcher";
import { SessionBanner } from "@/components/layout/SessionBanner";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const { profile, user, roleLabel, hasAnyRole, signOut } = useAuth();
  const { currentSchool } = useSchool();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() ||
      user?.email ||
      "Guest"
    : user?.email || "Guest";
  const displayInitials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() ||
      "?"
    : "?";

  const handleLogout = useCallback(() => {
    signOut();
    localStorage.removeItem("chuo-token");
    localStorage.removeItem("chuo-school-id");
    navigate("/login", { replace: true });
  }, [signOut, navigate]);

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* LEFT SIDEBAR - NEW */}
        <AppSidebar />

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TOP HEADER */}
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-3 px-3 sm:px-6">
              {/* Mobile menu trigger - opens sidebar on mobile */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-9 w-9"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 overflow-hidden">
                  {/* Mobile sidebar content */}
                  <div className="flex items-center gap-3 border-b px-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                      <School className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-widest">CHUO</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {currentSchool?.name || "School Management"}
                      </p>
                    </div>
                  </div>
                  {/* Mobile uses AppSidebar content but simplified */}
                  <div className="overflow-y-auto h-[calc(100vh-140px)] p-3">
                    <p className="text-xs text-muted-foreground px-3 py-2">
                      Use desktop for full sidebar experience
                    </p>
                  </div>
                  <div className="border-t border-border/50 p-3">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-destructive font-semibold rounded-xl hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo - visible on mobile when sidebar is hidden */}
              <div
                className="flex items-center gap-2.5 cursor-pointer lg:hidden"
                onClick={() => navigate("/dashboard")}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <School className="h-4.5 w-4.5" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-black tracking-[0.15em] text-foreground leading-none">
                    CHUO
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                    {currentSchool?.name || "School Management"}
                  </p>
                </div>
              </div>

              <div className="flex-1" />

              {/* Search */}
              <div className="hidden md:block relative w-full max-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="h-8 rounded-lg border-border/60 bg-muted/40 pl-8 text-sm"
                />
              </div>

              {/* Term Switcher */}
              {hasAnyRole(["super_admin", "school_admin"] as any) && (
                <div className="hidden sm:block">
                  <TermSwitcher compact />
                </div>
              )}

              {/* Notifications */}
              <NotificationBell />

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2.5 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                      {displayInitials}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold leading-tight text-foreground">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {roleLabel}
                      </p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <SessionBanner />

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-4 sm:px-6 sm:py-6 max-w-[1600px] mx-auto">
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
              <main>{children}</main>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
