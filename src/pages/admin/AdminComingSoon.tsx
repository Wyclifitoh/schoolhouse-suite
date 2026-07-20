import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Sparkles } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  features: string[];
  eta?: string;
}

export default function AdminComingSoon({
  title,
  subtitle,
  icon: Icon,
  features,
  eta = "Phase 2",
}: Props) {
  return (
    <div className="max-w-5xl">
      <div className="rounded-2xl border bg-gradient-to-br from-white via-white to-primary/5 p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
              >
                <Sparkles className="h-3 w-3 mr-1" /> Coming in {eta}
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {features.map((f) => (
          <Card key={f} className="border-dashed">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div className="text-sm font-medium text-foreground/90">{f}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        This module is scaffolded in the new Operations Center IA. Backend
        endpoints and data flows will be wired in the next phase.
      </p>
    </div>
  );
}
