import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface ModuleTabItem {
  to: string;
  label: string;
  icon?: any;
  exact?: boolean;
}

/**
 * Second-level (in-workspace) navigation. Visually lighter than the global
 * navigation: a soft inset track with pill items, sitting above page content.
 */
export function ModuleTabs({ items }: { items: ModuleTabItem[] }) {
  const { pathname } = useLocation();
  return (
    <div className="mb-5 -mt-1 overflow-x-auto">
      <div className="inline-flex items-center gap-0.5 rounded-xl border border-border/70 bg-muted/40 p-1 shadow-[inset_0_1px_0_hsl(var(--background))]">
        {items.map((it) => {
          const active = it.exact
            ? pathname === it.to
            : pathname === it.to || pathname.startsWith(it.to + "/");
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.exact}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-background text-primary shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60",
              )}
            >
              {it.icon && <it.icon className="h-3.5 w-3.5 opacity-80" />}
              {it.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
