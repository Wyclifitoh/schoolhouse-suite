import { useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { parentNav, studentNav } from "@/components/portal/portalNav";
import { usePortalAuth, PortalChild } from "@/contexts/PortalAuthContext";
import {
  usePortalReportCards,
  usePortalStudentSummary,
} from "@/hooks/usePortalApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  ChevronRight,
  CalendarCheck,
  Banknote,
  GraduationCap,
  Phone,
  Mail,
  IdCard,
  Users,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ReportCardViewer } from "./_ReportCardViewer";

const KES = (n: number) => `KES ${Math.abs(Number(n) || 0).toLocaleString()}`;
const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
];

// ---------------- Child selector for parents ----------------
function useChildSelector(children: PortalChild[]) {
  const [childId, setChildId] = useState<string>(children[0]?.id || "");
  const selected = children.find((c) => c.id === childId) || children[0];
  const Selector = () =>
    children.length > 1 ? (
      <Select value={selected?.id} onValueChange={setChildId}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="Select child" />
        </SelectTrigger>
        <SelectContent>
          {children.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.first_name} {c.last_name} — {c.admission_number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;
  return { selected, Selector };
}

// ---------------- Shared Results ----------------
function ResultsView({ studentId }: { studentId?: string }) {
  const { data: cards = [], isLoading } = usePortalReportCards(studentId);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileText className="h-4 w-4 text-success" /> Published Report Cards
        </h3>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : cards.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-10 bg-muted/30 rounded-lg">
            No published results yet.
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => setOpen(c.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition text-left"
              >
                <div>
                  <p className="text-sm font-semibold">{c.assessment_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.published_at).toLocaleDateString()} •{" "}
                    {c.payload?.percentage ?? "—"}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.payload?.overall_band && (
                    <Badge className="bg-primary/10 text-primary border-0">
                      {c.payload.overall_band}
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
        {open && (
          <ReportCardViewer
            card={cards.find((c) => c.id === open)!}
            onClose={() => setOpen(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Shared Attendance ----------------
function AttendanceView({ studentId }: { studentId?: string }) {
  const { data: summary, isLoading } = usePortalStudentSummary(studentId);
  const att = summary?.attendance;
  const pieData = att
    ? [
        { name: "Present", value: att.present_days || 0 },
        { name: "Absent", value: att.absent_days || 0 },
        { name: "Late", value: att.late_days || 0 },
      ].filter((d) => d.value > 0)
    : [];
  const pct =
    att && att.total_days > 0
      ? Math.round(((att.present_days || 0) / att.total_days) * 100)
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-info" /> Attendance Breakdown
          </h3>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              No attendance records yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <div className="space-y-3">
        <StatTile
          label="Attendance Rate"
          value={pct !== null ? `${pct}%` : "—"}
          tone="success"
        />
        <StatTile label="Present" value={String(att?.present_days ?? "—")} />
        <StatTile label="Absent" value={String(att?.absent_days ?? "—")} tone="destructive" />
        <StatTile label="Late" value={String(att?.late_days ?? "—")} tone="warning" />
      </div>
    </div>
  );
}

// ---------------- Shared Fees ----------------
function FeesView({ studentId }: { studentId?: string }) {
  const { data: summary, isLoading } = usePortalStudentSummary(studentId);
  const fees = summary?.fees;
  const barData = fees
    ? [
        { name: "Billed", value: fees.total_billed || 0 },
        { name: "Paid", value: fees.total_paid || 0 },
        { name: "Balance", value: fees.balance || 0 },
      ]
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Banknote className="h-4 w-4 text-warning" /> Fees Statement
          </h3>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !fees ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              No fees data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => KES(v)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <div className="space-y-3">
        <StatTile label="Total Billed" value={fees ? KES(fees.total_billed) : "—"} />
        <StatTile label="Total Paid" value={fees ? KES(fees.total_paid) : "—"} tone="success" />
        <StatTile
          label="Outstanding Balance"
          value={fees ? KES(fees.balance) : "—"}
          tone={fees && fees.balance > 0 ? "destructive" : "success"}
        />
      </div>
    </div>
  );
}

// ---------------- Shared Profile ----------------
function ProfileView({ child }: { child?: PortalChild }) {
  if (!child)
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Profile unavailable.
        </CardContent>
      </Card>
    );
  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary font-extrabold text-xl">
            {child.first_name[0]}
            {child.last_name[0]}
          </div>
          <div>
            <p className="text-lg font-extrabold">
              {child.first_name} {child.last_name}
            </p>
            <p className="text-xs text-muted-foreground">
              Admission: {child.admission_number}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileRow icon={IdCard} label="Admission No." value={child.admission_number} />
          <ProfileRow icon={Users} label="Gender" value={child.gender || "—"} />
          <ProfileRow icon={GraduationCap} label="Grade" value={child.grade_name || "—"} />
          <ProfileRow icon={GraduationCap} label="Stream" value={child.stream_name || "—"} />
          {child.relationship && (
            <ProfileRow icon={Users} label="Relationship" value={child.relationship} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <p className="text-sm font-bold capitalize">{value}</p>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const cls =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <p className={`text-xl font-extrabold mt-1 ${cls}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

// ---------------- PARENT PAGES ----------------
function ParentPageWrapper({
  title,
  subtitle,
  render,
}: {
  title: string;
  subtitle: string;
  render: (child: PortalChild | undefined, Selector: () => React.ReactNode) => React.ReactNode;
}) {
  const { me } = usePortalAuth();
  const children = me?.children || [];
  const { selected, Selector } = useChildSelector(children);
  return (
    <PortalLayout title={title} subtitle={subtitle} nav={parentNav}>
      {children.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No children linked to your account yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Child:
              </span>
              <Selector />
            </div>
          )}
          {render(selected, Selector)}
        </div>
      )}
    </PortalLayout>
  );
}

export const ParentResults = () => (
  <ParentPageWrapper
    title="Results"
    subtitle="Published assessment results"
    render={(child) => <ResultsView studentId={child?.id} />}
  />
);
export const ParentAttendance = () => (
  <ParentPageWrapper
    title="Attendance"
    subtitle="School attendance overview"
    render={(child) => <AttendanceView studentId={child?.id} />}
  />
);
export const ParentFees = () => (
  <ParentPageWrapper
    title="Fees"
    subtitle="Current term fees and balance"
    render={(child) => <FeesView studentId={child?.id} />}
  />
);
export const ParentProfilePage = () => (
  <ParentPageWrapper
    title="Child Profile"
    subtitle="Student bio and class information"
    render={(child) => <ProfileView child={child} />}
  />
);

// ---------------- STUDENT PAGES ----------------
function StudentPageWrapper({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <PortalLayout title={title} subtitle={subtitle} nav={studentNav}>
      {children}
    </PortalLayout>
  );
}

export const StudentResults = () => {
  const { me } = usePortalAuth();
  return (
    <StudentPageWrapper title="My Results" subtitle="Your published assessments">
      <ResultsView studentId={me?.student?.id} />
    </StudentPageWrapper>
  );
};
export const StudentAttendance = () => {
  const { me } = usePortalAuth();
  return (
    <StudentPageWrapper title="My Attendance" subtitle="Your attendance summary">
      <AttendanceView studentId={me?.student?.id} />
    </StudentPageWrapper>
  );
};
export const StudentFees = () => {
  const { me } = usePortalAuth();
  return (
    <StudentPageWrapper title="My Fees" subtitle="Current fees statement">
      <FeesView studentId={me?.student?.id} />
    </StudentPageWrapper>
  );
};
export const StudentProfilePage = () => {
  const { me } = usePortalAuth();
  return (
    <StudentPageWrapper title="My Profile" subtitle="Bio and class information">
      <ProfileView child={me?.student} />
    </StudentPageWrapper>
  );
};
