import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock, Ban, Loader2 } from "lucide-react";

const map: Record<string, { cls: string; Icon: any; label?: string }> = {
  sent:      { cls: "bg-success/10 text-success border-0", Icon: CheckCircle2 },
  delivered: { cls: "bg-success/10 text-success border-0", Icon: CheckCircle2 },
  failed:    { cls: "bg-destructive/10 text-destructive border-0", Icon: XCircle },
  pending:   { cls: "bg-warning/10 text-warning border-0", Icon: Clock },
  queued:    { cls: "bg-warning/10 text-warning border-0", Icon: Clock },
  running:   { cls: "bg-primary/10 text-primary border-0", Icon: Loader2 },
  draft:     { cls: "bg-muted text-muted-foreground border-0", Icon: AlertCircle },
  scheduled: { cls: "bg-blue-500/10 text-blue-600 border-0", Icon: Clock },
  completed: { cls: "bg-success/10 text-success border-0", Icon: CheckCircle2 },
  cancelled: { cls: "bg-muted text-muted-foreground border-0", Icon: Ban },
};

export function StatusPill({ status }: { status: string }) {
  const m = map[status] || map.pending;
  return (
    <Badge className={`${m.cls} gap-1 text-[10px] font-medium`}>
      <m.Icon className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />
      {status}
    </Badge>
  );
}