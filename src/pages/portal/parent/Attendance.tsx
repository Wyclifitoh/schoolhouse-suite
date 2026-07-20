import { PortalShell } from "@/components/portal/PortalShell";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import {
  usePortalAttendanceCalendar,
  usePortalAttendanceRecent,
} from "@/hooks/usePortalApiExtended";
import { usePortalStudentSummary } from "@/hooks/usePortalApi";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/portal/StatCard";
import { CheckCircle2, XCircle, Clock, CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function monthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AttendancePage() {
  return (
    <PortalShell title="Attendance" subtitle="Daily presence & calendar history">
      <Body />
    </PortalShell>
  );
}

function Body() {
  const { selected } = useSelectedChild();
  const { data: summary } = usePortalStudentSummary(selected?.id);
  const [cursor, setCursor] = useState(new Date());
  const month = monthStr(cursor);
  const { data: cal = [] } = usePortalAttendanceCalendar(selected?.id, month);
  const { data: recent = [] } = usePortalAttendanceRecent(selected?.id, 60);

  const att = summary?.attendance;
  const pct = att && att.total_days > 0
    ? Math.round((att.present_days / att.total_days) * 100)
    : 0;

  const calMap = useMemo(() => {
    const m = new Map<string, string>();
    cal.forEach((d) => m.set(d.date.slice(0, 10), d.status));
    return m;
  }, [cal]);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const startWeekday = first.getDay();
  const days: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++)
    days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));

  const toneFor = (s?: string) => {
    switch (s) {
      case "present": return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
      case "absent": return "bg-rose-500/15 text-rose-700 border-rose-500/30";
      case "late": return "bg-amber-500/15 text-amber-700 border-amber-500/30";
      case "excused": return "bg-sky-500/15 text-sky-700 border-sky-500/30";
      default: return "bg-muted/40 text-muted-foreground";
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${pct}%`} icon={CalendarCheck} tone="info" />
        <StatCard label="Present" value={att?.present_days ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="Absent" value={att?.absent_days ?? 0} icon={XCircle} tone="danger" />
        <StatCard label="Late" value={att?.late_days ?? 0} icon={Clock} tone="warning" />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
            <div className="flex gap-1">
              <Button size="icon" variant="outline" className="h-8 w-8"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] uppercase font-bold text-muted-foreground py-1">{d}</div>
            ))}
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = d.toISOString().slice(0, 10);
              const status = calMap.get(key);
              return (
                <div key={i} className={cn(
                  "aspect-square rounded-lg border flex flex-col items-center justify-center text-xs font-semibold",
                  toneFor(status),
                )}>
                  <span className="text-sm font-black">{d.getDate()}</span>
                  {status && <span className="text-[9px] capitalize">{status[0]}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            {[
              ["present", "Present"],
              ["absent", "Absent"],
              ["late", "Late"],
              ["excused", "Excused"],
            ].map(([k, l]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className={cn("h-3 w-3 rounded border", toneFor(k))} />
                <span className="text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-black mb-3">Recent Activity</p>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No records yet.</p>
          ) : (
            <div className="divide-y">
              {recent.slice(0, 25).map((r) => (
                <div key={r.date} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {new Date(r.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <Badge variant="outline" className={cn("capitalize", toneFor(r.status))}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}