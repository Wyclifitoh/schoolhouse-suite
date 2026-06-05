import { useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth, PortalChild } from "@/contexts/PortalAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  CalendarCheck,
  Banknote,
  FileText,
  ChevronRight,
} from "lucide-react";
import {
  usePortalReportCards,
  usePortalStudentSummary,
} from "@/hooks/usePortalApi";
import { ReportCardViewer } from "./_ReportCardViewer";

const formatKES = (n: number) => `KES ${Math.abs(Number(n) || 0).toLocaleString()}`;

function ChildPanel({ child }: { child: PortalChild }) {
  const { data: summary, isLoading: sLoading } = usePortalStudentSummary(child.id);
  const { data: cards = [], isLoading: cLoading } = usePortalReportCards(child.id);
  const [openCard, setOpenCard] = useState<string | null>(null);

  const att = summary?.attendance;
  const attendancePct =
    att && att.total_days > 0
      ? Math.round(((att.present_days || 0) / att.total_days) * 100)
      : null;

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
              {child.first_name[0]}
              {child.last_name[0]}
            </div>
            <div>
              <p className="font-bold text-foreground">
                {child.first_name} {child.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {child.admission_number} • {child.grade_name || "—"}
                {child.stream_name ? ` (${child.stream_name})` : ""}
              </p>
            </div>
          </div>
          {child.relationship && (
            <Badge variant="outline" className="capitalize">
              {child.relationship}
            </Badge>
          )}
        </div>

        <div className="grid gap-3 grid-cols-3">
          <Stat
            icon={<CalendarCheck className="h-4 w-4 text-info" />}
            label="Attendance"
            value={
              sLoading
                ? "—"
                : attendancePct !== null
                  ? `${attendancePct}%`
                  : "—"
            }
          />
          <Stat
            icon={<Banknote className="h-4 w-4 text-warning" />}
            label="Fee Balance"
            value={
              sLoading
                ? "—"
                : summary?.fees
                  ? formatKES(summary.fees.balance)
                  : "—"
            }
          />
          <Stat
            icon={<FileText className="h-4 w-4 text-success" />}
            label="Report Cards"
            value={cLoading ? "—" : String(cards.length)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-foreground">
              Published Report Cards
            </h4>
          </div>
          {cLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : cards.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
              No published report cards yet.
            </div>
          ) : (
            <div className="space-y-2">
              {cards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setOpenCard(c.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {c.assessment_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Published{" "}
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
        </div>

        {openCard && (
          <ReportCardViewer
            card={cards.find((c) => c.id === openCard)!}
            onClose={() => setOpenCard(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/40">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          {label}
        </span>
      </div>
      <p className="text-base font-bold text-foreground">{value}</p>
    </div>
  );
}

const ParentDashboard = () => {
  const { me } = usePortalAuth();
  const children = me?.children || [];

  return (
    <PortalLayout
      title="Parent Dashboard"
      subtitle="View your children's academic progress, fees and attendance"
    >
      {!me ? (
        <Skeleton className="h-40 w-full" />
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-50" />
            No children linked to your account yet. Please contact the school
            office.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {children.map((c) => (
            <ChildPanel key={c.id} child={c} />
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default ParentDashboard;
