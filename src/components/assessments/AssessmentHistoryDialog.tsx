import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { STATUS_META, type LifecycleStatus } from "@/lib/assessmentLifecycle";

interface HistoryEntry {
  id: string;
  action: string;
  label: string;
  permission: string | null;
  from_status: string | null;
  to_status: string | null;
  reason: string | null;
  user_name: string;
  created_at: string;
}

const badge = (s?: string | null) => {
  const meta = STATUS_META[(s || "") as LifecycleStatus];
  return meta ? (
    <Badge variant="outline" className={meta.badgeClass}>
      {meta.label}
    </Badge>
  ) : (
    <Badge variant="outline">{s || "—"}</Badge>
  );
};

/** Full audit trail of every lifecycle change on one assessment. */
export function AssessmentHistoryDialog({
  assessmentId,
  name,
  open,
  onOpenChange,
}: {
  assessmentId: string;
  name?: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["assessment-history", assessmentId],
    queryFn: async () =>
      (await api.get<HistoryEntry[]>(`/assessments/${assessmentId}/history`)) || [],
    enabled: open && !!assessmentId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Status history{name ? ` — ${name}` : ""}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="py-6 text-sm text-muted-foreground">Loading…</p>
        ) : isError ? (
          <p className="py-6 text-sm text-muted-foreground">
            History is not available on this server yet.
          </p>
        ) : !data.length ? (
          <p className="py-6 text-sm text-muted-foreground">
            No status changes recorded yet.
          </p>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {data.map((h) => (
              <div key={h.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold">{h.label}</span>
                  {badge(h.from_status)}
                  <span className="text-muted-foreground">→</span>
                  {badge(h.to_status)}
                  {h.permission && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {h.permission}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {h.user_name} · {new Date(h.created_at).toLocaleString()}
                  {h.reason ? ` · ${h.reason}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
