import { Link } from "react-router-dom";
import { useMemo } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalCard, PortalEmpty, ListSkeleton } from "@/components/portal/ui";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  usePortalReportCards,
  usePortalStudentSummary,
} from "@/hooks/usePortalApi";
import {
  usePortalHomework,
  usePortalEvents,
  usePortalNotices,
  usePortalProfile,
  usePortalAccount,
} from "@/hooks/usePortalApiExtended";
import portalHero from "@/assets/portal-hero.png";

import {
  Banknote,
  CalendarCheck,
  GraduationCap,
  BookOpenCheck,
  FileText,
  Megaphone,
  Download,
  Users,
  CalendarDays,
  Receipt,
  Activity,
  Pin,
  Wallet,
  Clock,
  Mail,
  ArrowRight,
  TrendingUp,
  Minus,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const KES = (n: number) => `KES ${Math.abs(Number(n) || 0).toLocaleString()}`;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function ParentDashboardPage() {
  return (
    <PortalShell bleed>
      <DashboardBody />
    </PortalShell>
  );
}

function DashboardBody() {
  const { selected, children } = useSelectedChild();
  const { account } = usePortalAuth();
  const studentId = selected?.id;

  const { data: summary, isLoading: sLoading } =
    usePortalStudentSummary(studentId);
  const { data: cards = [], isLoading: cLoading } =
    usePortalReportCards(studentId);
  const { data: homework = [], isLoading: hLoading } =
    usePortalHomework(studentId);
  const { data: events = [], isLoading: eLoading } = usePortalEvents(studentId);
  const { data: notices = [], isLoading: nLoading } = usePortalNotices();
  const { data: profile } = usePortalProfile(studentId);
  const { data: portalAccount } = usePortalAccount();

  const att = summary?.attendance;
  const attPct =
    att && att.total_days > 0
      ? Math.round(((att.present_days || 0) / att.total_days) * 100)
      : null;
  const latest = cards[0];
  const previous = cards[1];
  const latestPct =
    latest?.payload?.percentage != null
      ? Number(latest.payload.percentage)
      : null;
  const pending = homework.filter((h) => h.computed_status !== "submitted");
  const fees = summary?.fees;

  // Guardian's own name — never fall back to a learner's name.
  const guardianName = (() => {
    const candidates = [
      profile?.parent_name,
      portalAccount?.identifier,
    ].filter(Boolean) as string[];
    const childNames = children.flatMap((c) => [
      c.first_name?.toLowerCase(),
      `${c.first_name} ${c.last_name}`.toLowerCase(),
    ]);
    const match = candidates.find(
      (n) =>
        !childNames.includes(n.trim().toLowerCase()) &&
        !/^[0-9+ ]+$/.test(n.trim()) &&
        !n.includes("@"),
    );
    return match || "";
  })();
  const parentFirstName = guardianName.split(" ")[0];


  const subjects = latest?.payload?.subjects || [];
  const prevBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    (previous?.payload?.subjects || []).forEach((s) => {
      if (s.score != null)
        map[s.subject_name] = (Number(s.score) / (s.out_of || 100)) * 100;
    });
    return map;
  }, [previous]);

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => new Date(e.starts_at).getTime() >= Date.now() - 864e5)
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))
        .slice(0, 4),
    [events],
  );

  const activity = useMemo(() => {
    const items: {
      id: string;
      title: string;
      meta: string;
      at: number;
      icon: typeof FileText;
      tone: string;
    }[] = [];
    cards.slice(0, 3).forEach((c) =>
      items.push({
        id: `c-${c.id}`,
        title: "New result published",
        meta: `${c.assessment_name} · ${c.payload?.percentage ?? "—"}% overall`,
        at: +new Date(c.published_at),
        icon: FileText,
        tone: "bg-primary/10 text-primary",
      }),
    );
    homework.slice(0, 3).forEach((h) =>
      items.push({
        id: `h-${h.id}`,
        title: "Homework assigned",
        meta: `${h.subject}: ${h.title}`,
        at: +new Date(h.assigned_date),
        icon: BookOpenCheck,
        tone: "bg-info/10 text-info",
      }),
    );
    notices.slice(0, 3).forEach((n) =>
      items.push({
        id: `n-${n.id}`,
        title: n.title,
        meta: "School announcement",
        at: +new Date(n.publish_at || n.created_at),
        icon: Megaphone,
        tone: "bg-warning/10 text-warning",
      }),
    );
    return items.sort((a, b) => b.at - a.at).slice(0, 5);
  }, [cards, homework, notices]);

  if (!children.length) {
    return (
      <PortalCard>
        <PortalEmpty
          icon={Users}
          title="No learners linked to your account"
          description="Contact the school office so they can link your children to this portal account."
        />
      </PortalCard>
    );
  }
  if (!selected) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="space-y-5">
      {/* ---------------- Hero ---------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-info/10 px-6 pb-24 pt-7 sm:px-9 sm:pt-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-primary/10 blur-2xl"
        />
        <div className="relative flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[2rem]">
              {greeting()}
              {parentFirstName ? `, ${parentFirstName}!` : ", Parent!"} 👋
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening with {selected.first_name} today.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-primary/30 bg-card/70 text-xs font-medium text-primary"
              >
                {children.length}{" "}
                {children.length === 1 ? "learner" : "learners"} linked
              </Badge>
              {attPct != null && (
                <Badge
                  variant="outline"
                  className="rounded-full border-success/30 bg-card/70 text-xs font-medium text-success"
                >
                  {attPct}% attendance this term
                </Badge>
              )}
              {pending.length > 0 && (
                <Badge
                  variant="outline"
                  className="rounded-full border-warning/30 bg-card/70 text-xs font-medium text-warning"
                >
                  {pending.length} homework pending
                </Badge>
              )}
            </div>
          </div>
          <img
            src={portalHero}
            alt="Parent and learner using the school portal"
            width={900}
            height={700}
            className="pointer-events-none hidden h-40 w-auto shrink-0 select-none object-contain md:block lg:h-48"
          />
        </div>
      </div>


      {/* ---------------- Learner summary card ---------------- */}
      <div className="-mt-[5.5rem] px-0 sm:px-3">
        <PortalCard className="relative">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
            <div className="flex min-w-[15rem] flex-1 items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-xl font-bold uppercase text-primary">
                {profile?.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={`${selected.first_name} ${selected.last_name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    {selected.first_name[0]}
                    {selected.last_name[0]}
                  </>
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-lg font-bold tracking-tight text-foreground">
                    {selected.first_name} {selected.last_name}
                  </p>
                  <Badge className="bg-success/10 text-success hover:bg-success/10">
                    {profile?.status || "Active"}
                  </Badge>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span>
                    {selected.grade_name || "Class not set"}
                    {selected.stream_name ? ` (${selected.stream_name})` : ""}
                  </span>
                  <span aria-hidden>·</span>
                  <span>Admission No: {selected.admission_number}</span>
                </p>
                {profile?.parent_name && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Guardian:{" "}
                    <span className="font-semibold text-foreground">
                      {profile.parent_name}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-4">
              <HeroStat
                icon={Clock}
                tone="success"
                label="Attendance (Term)"
                value={attPct !== null ? `${attPct}%` : "—"}
                hint={
                  att
                    ? `Present ${att.present_days}/${att.total_days} days`
                    : "Not recorded"
                }
                loading={sLoading}
              />
              <HeroStat
                icon={GraduationCap}
                tone="primary"
                label="Average Performance"
                value={latestPct !== null ? `${latestPct.toFixed(2)}%` : "—"}
                hint={latest?.assessment_name || "No results yet"}
                loading={cLoading}
              />
              <HeroStat
                icon={Wallet}
                tone="warning"
                label="Fee Balance"
                value={fees ? KES(fees.balance) : "—"}
                hint={
                  fees && fees.balance > 0 ? "Outstanding" : "Fully settled"
                }
                hintTone={
                  fees && fees.balance > 0 ? "text-destructive" : "text-success"
                }
                loading={sLoading}
              />
            </div>

            <Button asChild className="shrink-0">
              <Link to="/portal/parent/profile">View Profile</Link>
            </Button>
          </div>
        </PortalCard>
      </div>

      {/* ---------------- Row 1 : academics / fees / upcoming ---------------- */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Academic overview */}
        <PortalCard className="lg:col-span-1">
          <CardHead
            icon={GraduationCap}
            title="Academic Overview"
            right={
              latest?.assessment_name ? (
                <span className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                  {latest.assessment_name}
                </span>
              ) : null
            }
          />
          {cLoading ? (
            <ListSkeleton rows={4} />
          ) : !latest || subjects.length === 0 ? (
            <PortalEmpty
              compact
              icon={FileText}
              title="No published results yet"
              description="Subject scores appear here as soon as the school publishes them."
            />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="pb-2 text-left font-bold">Subject</th>
                    <th className="pb-2 text-right font-bold">Score</th>
                    <th className="pb-2 text-right font-bold">Grade</th>
                    <th className="pb-2 text-right font-bold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.slice(0, 6).map((s) => {
                    const out = s.out_of || 100;
                    const pct =
                      s.score != null ? (Number(s.score) / out) * 100 : null;
                    const prev = prevBySubject[s.subject_name];
                    const up =
                      pct != null && prev != null
                        ? pct - prev > 1
                          ? "up"
                          : prev - pct > 1
                            ? "down"
                            : "flat"
                        : null;
                    return (
                      <tr
                        key={s.subject_name}
                        className="border-t border-border/60"
                      >
                        <td className="max-w-[9rem] truncate py-2.5 font-medium text-foreground">
                          {s.subject_name}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-foreground">
                          {pct != null ? `${Math.round(pct)}%` : "—"}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {s.achievement_level_code || s.band_code || "—"}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex justify-end">
                            {up === "up" ? (
                              <TrendingUp className="h-4 w-4 text-success" />
                            ) : up === "down" ? (
                              <TrendingUp className="h-4 w-4 rotate-180 text-destructive" />
                            ) : (
                              <Minus className="h-4 w-4 text-warning" />
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Link
                to="/portal/parent/academics"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-primary/5 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
              >
                View full report card <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </PortalCard>

        {/* Fees summary */}
        <PortalCard>
          <CardHead
            icon={Receipt}
            title="Fees Summary"
            right={
              <Link
                to="/portal/parent/fees"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                View Statement <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {sLoading ? (
            <ListSkeleton rows={3} />
          ) : !fees ? (
            <PortalEmpty
              compact
              icon={Banknote}
              title="No fee records yet"
              description="Invoices show here once the school bills this term."
            />
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">
                Outstanding Balance
              </p>
              <p
                className={cn(
                  "mt-1 text-3xl font-extrabold tracking-tight",
                  fees.balance > 0 ? "text-destructive" : "text-success",
                )}
              >
                {KES(fees.balance)}
              </p>

              <dl className="mt-5 space-y-0 text-sm">
                <Row label="Paid this term" value={KES(fees.total_paid)} />
                <Row label="Total fees" value={KES(fees.total_billed)} />
                <Row
                  label="Settled"
                  value={
                    fees.total_billed > 0
                      ? `${Math.round((fees.total_paid / fees.total_billed) * 100)}%`
                      : "—"
                  }
                />
              </dl>

              <div className="mt-5 flex gap-2">
                <Button asChild className="flex-1">
                  <Link to="/portal/parent/fees">Make Payment</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/portal/parent/fees">Payment History</Link>
                </Button>
              </div>
            </div>
          )}
        </PortalCard>

        {/* Upcoming */}
        <PortalCard>
          <CardHead
            icon={CalendarDays}
            title="Upcoming"
            right={
              <Link
                to="/portal/parent/calendar"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                View Calendar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {eLoading ? (
            <ListSkeleton rows={4} />
          ) : upcoming.length === 0 ? (
            <PortalEmpty
              compact
              icon={CalendarDays}
              title="Nothing scheduled"
              description="Events, assessments and holidays will show here."
            />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((e) => {
                const d = new Date(e.starts_at);
                return (
                  <li key={e.id} className="flex items-center gap-3">
                    <div className="w-12 shrink-0 rounded-xl bg-primary/8 bg-primary/10 py-1.5 text-center text-primary">
                      <p className="text-[10px] font-bold uppercase">
                        {d.toLocaleDateString(undefined, { month: "short" })}
                      </p>
                      <p className="text-lg font-extrabold leading-none">
                        {d.getDate()}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {e.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {e.all_day
                          ? ""
                          : ` · ${d.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </PortalCard>
      </div>

      {/* ---------------- Row 2 : announcements / activity / quick actions ---------------- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <PortalCard>
          <CardHead
            icon={Megaphone}
            title="School Announcements"
            right={
              <Link
                to="/portal/parent/communication"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {nLoading ? (
            <ListSkeleton rows={2} />
          ) : notices.length === 0 ? (
            <PortalEmpty
              compact
              icon={Megaphone}
              title="No announcements"
              description="Notices published by the school appear here."
            />
          ) : (
            <ul className="space-y-3">
              {notices.slice(0, 3).map((n) => (
                <li
                  key={n.id}
                  className="flex gap-3 rounded-2xl bg-muted/40 p-3.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <Badge
                      variant="outline"
                      className="mb-1.5 text-[10px] capitalize"
                    >
                      {n.priority === "high" || n.priority === "urgent"
                        ? "Important"
                        : "General"}
                    </Badge>
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-foreground">
                      {!!n.pinned && (
                        <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {new Date(
                        n.publish_at || n.created_at,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PortalCard>

        <PortalCard>
          <CardHead icon={Activity} title="Recent Activity" />
          {cLoading || hLoading ? (
            <ListSkeleton rows={3} />
          ) : activity.length === 0 ? (
            <PortalEmpty
              compact
              icon={Activity}
              title="Nothing yet"
              description="Results, homework and payments will be listed here."
            />
          ) : (
            <ul className="space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                      a.tone,
                    )}
                  >
                    <a.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {a.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.meta}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(a.at).toLocaleDateString()} ·{" "}
                      {new Date(a.at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PortalCard>

        <PortalCard>
          <CardHead icon={Zap} title="Quick Actions" />
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
            <QuickAction
              to="/portal/parent/academics"
              icon={FileText}
              label="View Results"
              tone="bg-success/10 text-success"
            />
            <QuickAction
              to="/portal/parent/fees"
              icon={Wallet}
              label="Pay Fees"
              tone="bg-warning/10 text-warning"
            />
            <QuickAction
              to="/portal/parent/attendance"
              icon={CalendarCheck}
              label="Attendance"
              tone="bg-info/10 text-info"
            />
            <QuickAction
              to="/portal/parent/homework"
              icon={BookOpenCheck}
              label="Homework"
              tone="bg-primary/10 text-primary"
            />
            <QuickAction
              to="/portal/parent/timetable"
              icon={Clock}
              label="Timetable"
              tone="bg-destructive/10 text-destructive"
            />
            <QuickAction
              to="/portal/parent/communication"
              icon={Mail}
              label="Messages"
              tone="bg-success/10 text-success"
            />
            <QuickAction
              to="/portal/parent/calendar"
              icon={CalendarDays}
              label="Calendar"
              tone="bg-warning/10 text-warning"
            />
            <QuickAction
              to="/portal/parent/downloads"
              icon={Download}
              label="Downloads"
              tone="bg-primary/10 text-primary"
            />
          </div>
          {pending.length > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-warning" />
              {pending.length} homework task
              {pending.length === 1 ? "" : "s"} still pending.
            </div>
          )}
        </PortalCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Local presentational pieces                                         */
/* ------------------------------------------------------------------ */

function CardHead({
  icon: Icon,
  title,
  right,
}: {
  icon: typeof FileText;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="truncate text-[15px] font-bold tracking-tight text-foreground">
          {title}
        </h3>
      </div>
      {right}
    </header>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  hintTone,
  loading,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint?: string;
  tone: "primary" | "success" | "warning";
  hintTone?: string;
  loading?: boolean;
}) {
  const chip = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }[tone];
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          chip,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-20" />
        ) : (
          <p className="truncate text-xl font-extrabold tracking-tight text-foreground">
            {value}
          </p>
        )}
        {hint && (
          <p className={cn("text-[11px]", hintTone || "text-muted-foreground")}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border/60 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: string;
  icon: typeof FileText;
  label: string;
  tone: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-colors hover:bg-accent"
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl",
          tone,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[11px] font-semibold leading-tight text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
    </Link>
  );
}
