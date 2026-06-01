import { useState } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

const formatKES = (n: number) =>
  `KES ${Math.abs(Number(n) || 0).toLocaleString()}`;

const StudentDashboard = () => {
  const { me } = usePortalAuth();
  const student = me?.student;
  const { data: summary } = usePortalStudentSummary(student?.id);
  const { data: cards = [], isLoading } = usePortalReportCards(student?.id);
  const [openCard, setOpenCard] = useState<string | null>(null);

  const attendancePct =
    summary?.attendance && summary.attendance.total_days > 0
      ? Math.round(
          ((summary.attendance.present_days || 0) /
            summary.attendance.total_days) *
            100,
        )
      : null;

  return (
    <PortalLayout
      title={
        student
          ? `Hello, ${student.first_name} ${student.last_name}`
          : "Student Dashboard"
      }
      subtitle="Your academic results, attendance and fees"
    >
      {!student ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <KpiCard
              icon={<GraduationCap className="h-4 w-4 text-primary" />}
              label="Class"
              value={`${student.grade_name || "—"}${student.stream_name ? ` ${student.stream_name}` : ""}`}
            />
            <KpiCard
              icon={<CalendarCheck className="h-4 w-4 text-info" />}
              label="Attendance"
              value={attendancePct !== null ? `${attendancePct}%` : "—"}
            />
            <KpiCard
              icon={<Banknote className="h-4 w-4 text-warning" />}
              label="Fee Balance"
              value={summary?.fees ? formatKES(summary.fees.balance) : "—"}
            />
            <KpiCard
              icon={<FileText className="h-4 w-4 text-success" />}
              label="Report Cards"
              value={String(cards.length)}
            />
          </div>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">
                My Published Report Cards
              </h3>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : cards.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
                  No published report cards yet. Check back after your teacher
                  publishes your assessment.
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
            </CardContent>
          </Card>
        </div>
      )}

      {openCard && (
        <ReportCardViewer
          card={cards.find((c) => c.id === openCard)!}
          onClose={() => setOpenCard(null)}
        />
      )}
    </PortalLayout>
  );
};

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          {icon}
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {label}
          </span>
        </div>
        <p className="text-base font-bold text-foreground truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

export default StudentDashboard;
