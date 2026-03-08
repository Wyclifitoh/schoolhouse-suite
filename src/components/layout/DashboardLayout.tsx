import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { profile, user, roleLabel } = useAuth();

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || user?.email || "Guest"
    : user?.email || "Guest";
  const displayInitials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "?"
    : "?";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6">
            <SidebarTrigger className="-ml-2 hover:bg-muted rounded-lg transition-colors" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground tracking-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search anything..."
                  className="pl-9 w-64 h-9 bg-muted/50 border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                />
              </div>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
              </button>
              <div className="h-6 w-px bg-border/50 mx-1" />
              <div className="flex items-center gap-2.5 pl-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold shadow-sm">
                  {displayInitials}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
