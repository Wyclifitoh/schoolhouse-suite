import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { parentNav } from "@/components/portal/portalNav";
import { usePortalAuth, PortalChild } from "@/contexts/PortalAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  CalendarCheck,
  Banknote,
  Eye,
  Users,
} from "lucide-react";
import { usePortalStudentSummary } from "@/hooks/usePortalApi";

const KES = (n: number) =>
  `KES ${Math.abs(Number(n) || 0).toLocaleString()}`;

function ChildCard({ child }: { child: PortalChild }) {
  const { data: summary, isLoading } = usePortalStudentSummary(child.id);
  const fees = summary?.fees;
  const att = summary?.attendance;
  const attPct =
    att && att.total_days > 0
      ? Math.round(((att.present_days || 0) / att.total_days) * 100)
      : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
              {child.first_name[0]}
              {child.last_name[0]}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">
                {child.first_name} {child.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {child.admission_number} • {child.grade_name || "—"}
                {child.stream_name ? ` (${child.stream_name})` : ""}
              </p>
            </div>
          </div>
          {child.relationship && (
            <Badge variant="outline" className="capitalize shrink-0">
              {child.relationship}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-muted/40">
            <div className="flex items-center gap-1 mb-0.5">
              <CalendarCheck className="h-3 w-3 text-info" />
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                Attendance
              </span>
            </div>
            <p className="text-sm font-bold">
              {isLoading ? "…" : attPct !== null ? `${attPct}%` : "—"}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40">
            <div className="flex items-center gap-1 mb-0.5">
              <Banknote className="h-3 w-3 text-warning" />
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                Balance
              </span>
            </div>
            <p
              className={`text-sm font-bold ${
                fees && fees.balance > 0
                  ? "text-destructive"
                  : "text-success"
              }`}
            >
              {isLoading ? "…" : fees ? KES(fees.balance) : "—"}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/40">
            <div className="flex items-center gap-1 mb-0.5">
              <GraduationCap className="h-3 w-3 text-success" />
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                Paid
              </span>
            </div>
            <p className="text-sm font-bold">
              {isLoading ? "…" : fees ? KES(fees.total_paid) : "—"}
            </p>
          </div>
        </div>

        <Button asChild className="w-full" size="sm">
          <Link to={`/portal/parent/children/${child.id}`}>
            <Eye className="h-4 w-4 mr-1.5" /> View Profile & Fees
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

const ParentChildren = () => {
  const { me } = usePortalAuth();
  const children = me?.children || [];

  return (
    <PortalLayout
      title="My Children"
      subtitle="All students linked to your account"
      nav={parentNav}
    >
      {!me ? (
        <Skeleton className="h-40 w-full" />
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            No children linked to your account yet. Please contact the school
            office.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((c) => (
            <ChildCard key={c.id} child={c} />
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default ParentChildren;