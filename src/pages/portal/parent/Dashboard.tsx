import { Link } from "react-router-dom";
import { PortalShell } from "@/components/portal/PortalShell";
import { StatCard, EmptyState } from "@/components/portal/StatCard";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import {
  usePortalReportCards,
  usePortalStudentSummary,
} from "@/hooks/usePortalApi";
import { usePortalHomework, usePortalEvents } from "@/hooks/usePortalApiExtended";
import {
  Banknote,
  CalendarCheck,
  GraduationCap,
  BookOpenCheck,
  FileText,
  Megaphone,
  Download,
  ArrowRight,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const KES = (n: number) => `KES ${Math.abs(Number(n) || 0).toLocaleString()}`;

export default function ParentDashboardPage() {
  return (
    <PortalShell>
      <DashboardBody />
    </PortalShell>
  );
}

function DashboardBody() {
  const { selected, children } = useSelectedChild();

  if (!children.length) {
    return (
      <EmptyState
        icon={Users}
        title="No children linked"
        description="Please contact the school office to link your children to this account."
      />
    );
  }
  if (!selected) return <Skeleton className="h-40 w-full" />;

  const { data: summary } = usePortalStudentSummary(selected.id);
  const { data: cards = [] } = usePortalReportCards(selected.id);
  const { data: homework = [] } = usePortalHomework(selected.id);
  const { data: events = [] } = usePortalEvents(selected.id);

  const att = summary?.attendance;
  const attPct = att && att.total_days > 0
    ? Math.round(((att.present_days || 0) / att.total_days) * 100)
    : null;
  const latest = cards[0];
  const pending = homework.filter((h) => h.computed_status !== "submitted").length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden border-border/60">
        <div className="h-24 bg-gradient-to-br from-primary via-primary/80 to-primary/40" />
        <CardContent className="p-5 sm:p-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-card ring-4 ring-card flex items-center justify-center shadow-lg text-2xl sm:text-3xl font-black text-primary">
              {selected.first_name[0]}{selected.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Welcome back
              </p>
              <h2 className="text-xl sm:text-2xl font-black truncate">
                {selected.first_name} {selected.last_name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selected.admission_number} · {selected.grade_name || "—"}
                {selected.stream_name ? ` (${selected.stream_name})` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/portal/parent/academics"><FileText className="h-4 w-4 mr-1.5" />Results</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/portal/parent/fees"><Banknote className="h-4 w-4 mr-1.5" />Fees</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fee Balance"
          value={summary?.fees ? KES(summary.fees.balance) : "—"}
          hint={summary?.fees ? `Paid ${KES(summary.fees.total_paid)}` : undefined}
          icon={Banknote}
          tone={summary?.fees && summary.fees.balance > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Attendance"
          value={attPct !== null ? `${attPct}%` : "—"}
          hint={att ? `${att.present_days}/${att.total_days} days` : undefined}
          icon={CalendarCheck}
          tone="info"
        />
        <StatCard
          label="Latest Average"
          value={latest?.payload?.percentage != null ? `${latest.payload.percentage}%` : "—"}
          hint={latest?.assessment_name}
          icon={GraduationCap}
          tone="primary"
        />
        <StatCard
          label="Homework Pending"
          value={pending}
          hint={homework.length ? `${homework.length} total` : "No homework"}
          icon={BookOpenCheck}
          tone={pending > 0 ? "danger" : "success"}
        />
      </div>

      {/* Quick rows */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black">Recent Report Cards</h3>
              <Link to="/portal/parent/academics" className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {cards.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
                No published results yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {cards.slice(0, 4).map((c) => (
                  <li key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{c.assessment_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.published_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-bold">
                      {c.payload?.percentage ?? "—"}%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-violet-500" /> Announcements
              </h3>
              <Link to="/portal/parent/communication" className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
                No announcements yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {events.slice(0, 4).map((e) => (
                  <li key={e.id} className="p-3 rounded-lg bg-muted/40">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate">{e.title}</p>
                      {e.category && (
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {e.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(e.starts_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { to: "/portal/parent/homework", label: "Homework", icon: BookOpenCheck },
          { to: "/portal/parent/attendance", label: "Attendance", icon: CalendarCheck },
          { to: "/portal/parent/timetable", label: "Timetable", icon: GraduationCap },
          { to: "/portal/parent/downloads", label: "Downloads", icon: Download },
        ].map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="rounded-2xl border bg-card p-4 hover:bg-muted/40 transition flex flex-col items-start gap-2"
          >
            <q.icon className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}