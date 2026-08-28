import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { groupIntoSections } from "./navSections";

export interface ShellNavItem {
  title: string;
  url: string;
  icon: any;
}

export interface ShellNavGroup {
  label: string;
  icon: any;
  items: ShellNavItem[];
}

const MORE_RESERVED = 104;

/** Rough width estimate so the bar never wraps to a second row. */
function estimateWidth(group: ShellNavGroup) {
  const iconAndPadding = 24 + 22;
  const chevron = group.items.length > 1 ? 14 : 0;
  return Math.round(group.label.length * 7.1) + iconAndPadding + chevron + 4;
}

function DropdownPanel({
  group,
  anchor,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: {
  group: ShellNavGroup;
  anchor: { top: number; left: number; right?: boolean };
  onNavigate: (url: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { pathname } = useLocation();
  const sections = useMemo(() => groupIntoSections(group.items), [group.items]);
  const twoCols = group.items.length > 8;

  /**
   * Balance the sections across two columns by item count (each section header
   * counts as one row) so neither column ends with a block of dead whitespace.
   */
  const columns = useMemo(() => {
    if (!twoCols) return [sections];
    const weight = (s: (typeof sections)[number]) => s[1].length + 1;
    const total = sections.reduce((sum, s) => sum + weight(s), 0);
    const target = total / 2;
    const left: typeof sections = [];
    const right: typeof sections = [];
    let used = 0;
    sections.forEach((s) => {
      const w = weight(s);
      // keep filling the left column while doing so stays closest to balance
      if (used < target && Math.abs(used + w - target) <= Math.abs(used - target)) {
        left.push(s);
        used += w;
      } else if (left.length === 0) {
        left.push(s);
        used += w;
      } else {
        right.push(s);
      }
    });
    return right.length ? [left, right] : [left];
  }, [sections, twoCols]);

  const renderSection = ([section, items]: (typeof sections)[number]) => (
    <div key={section} className="mb-1 last:mb-0">
      <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground/70">
        {section}
      </p>
      {items.map((item) => {
        const active =
          pathname === item.url || pathname.startsWith(item.url + "/");
        return (
          <button
            key={item.url}
            role="menuitem"
            onClick={() => onNavigate(item.url)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
              active
                ? "bg-primary/10 font-semibold text-primary"
                : "text-foreground/80 hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0 opacity-70" />
            <span className="truncate text-left">{item.title}</span>
          </button>
        );
      })}
    </div>
  );

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="menu"
      className={cn(
        "fixed z-[9999] rounded-xl border border-border bg-popover p-2 shadow-[0_16px_40px_-12px_hsl(var(--foreground)/0.18)]",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-100",
        twoCols ? "w-[520px]" : "w-[264px]",
      )}
      style={{ top: anchor.top, left: anchor.left }}
    >
      <div className={cn("flex gap-2", !twoCols && "flex-col")}>
        {columns.map((col, i) => (
          <div
            key={i}
            className={cn(
              "min-w-0 flex-1",
              twoCols && i === 1 && "border-l border-border/60 pl-2",
            )}
          >
            {col.map(renderSection)}
          </div>
        ))}
      </div>

    </div>,
    document.body,
  );
}

export function PrimaryNav({ groups }: { groups: ShellNavGroup[] }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(groups.length);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const widths = useMemo(() => groups.map(estimateWidth), [groups]);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const available = el.clientWidth - 8;
    let used = 0;
    let count = 0;
    for (let i = 0; i < widths.length; i++) {
      used += widths[i] + 2;
      if (used > available) break;
      count++;
    }
    if (count < groups.length) {
      // reserve space for the "More" trigger
      let used2 = 0;
      count = 0;
      for (let i = 0; i < widths.length; i++) {
        used2 += widths[i] + 2;
        if (used2 > available - MORE_RESERVED) break;
        count++;
      }
    }
    setVisibleCount(Math.max(1, count));
  }, [widths, groups.length]);

  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // close on escape / outside click / scroll
  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenKey(null);
    const close = () => setOpenKey(null);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openKey]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const open = (key: string, el: HTMLElement, width: number) => {
    clearTimeout(closeTimer.current);
    const rect = el.getBoundingClientRect();
    let left = rect.left;
    if (left + width > window.innerWidth - 12)
      left = Math.max(12, window.innerWidth - width - 12);
    setAnchor({ top: rect.bottom + 6, left });
    setOpenKey(key);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenKey(null), 150);
  };

  const go = (url: string) => {
    setOpenKey(null);
    navigate(url);
  };

  const visible = groups.slice(0, visibleCount);
  const overflow = groups.slice(visibleCount);
  const moreGroup: ShellNavGroup | null = overflow.length
    ? {
        label: "More",
        icon: MoreHorizontal,
        items: overflow.flatMap((g) => g.items),
      }
    : null;

  const isGroupActive = (g: ShellNavGroup) =>
    g.items.some(
      (i) => pathname === i.url || pathname.startsWith(i.url + "/"),
    );

  const renderTrigger = (g: ShellNavGroup, key: string) => {
    const single = g.items.length === 1;
    const active = isGroupActive(g);
    const isOpen = openKey === key;
    const panelWidth = g.items.length > 8 ? 520 : 264;
    return (
      <div
        key={key}
        className="shrink-0"
        onMouseEnter={(e) =>
          !single && open(key, e.currentTarget as HTMLElement, panelWidth)
        }
        onMouseLeave={() => !single && scheduleClose()}
      >
        <button
          aria-haspopup={single ? undefined : "menu"}
          aria-expanded={single ? undefined : isOpen}
          onClick={(e) => {
            if (single) return go(g.items[0].url);
            if (isOpen) setOpenKey(null);
            else
              open(
                key,
                (e.currentTarget.parentElement as HTMLElement) ??
                  e.currentTarget,
                panelWidth,
              );
          }}
          className={cn(
            "relative flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium transition-colors",
            active
              ? "bg-primary/[0.07] text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <g.icon className="h-4 w-4 opacity-80" />
          <span>{g.label}</span>
          {!single && (
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 opacity-60 transition-transform duration-150",
                isOpen && "rotate-180",
              )}
            />
          )}
          {active && (
            <span className="absolute -bottom-[7px] left-2.5 right-2.5 h-[2px] rounded-full bg-primary" />
          )}
        </button>
      </div>
    );
  };

  const openGroup =
    openKey === "__more__"
      ? moreGroup
      : groups.find((g) => g.label === openKey) || null;

  return (
    <div
      ref={containerRef}
      className="mx-auto flex h-[52px] w-full max-w-[1600px] items-center gap-0.5 overflow-hidden px-4"
    >
      {visible.map((g) => renderTrigger(g, g.label))}
      {moreGroup && renderTrigger(moreGroup, "__more__")}
      {openGroup && (
        <DropdownPanel
          group={openGroup}
          anchor={anchor}
          onNavigate={go}
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          onMouseLeave={scheduleClose}
        />
      )}
    </div>
  );
}
