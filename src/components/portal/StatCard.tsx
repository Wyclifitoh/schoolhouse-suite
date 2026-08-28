import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = {
  primary: "from-primary/20 to-primary/5 text-primary",
  success: "from-emerald-500/20 to-emerald-500/5 text-emerald-600",
  warning: "from-amber-500/20 to-amber-500/5 text-amber-600",
  info:    "from-sky-500/20    to-sky-500/5    text-sky-600",
  danger:  "from-rose-500/20   to-rose-500/5   text-rose-600",
  neutral: "from-muted-foreground/15 to-muted-foreground/5 text-foreground",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-black mt-1.5 truncate">
              {value}
            </p>
            {hint && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>
            )}
          </div>
          <div
            className={cn(
              "h-11 w-11 rounded-2xl bg-gradient-to-br flex items-center justify-center shrink-0",
              TONES[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-14 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}