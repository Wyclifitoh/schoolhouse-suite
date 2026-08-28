import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { parentNav } from "@/components/portal/portalNav";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  usePortalStudentSummary,
  usePortalFeeItems,
  usePortalPayments,
  usePortalReportCards,
} from "@/hooks/usePortalApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  GraduationCap,
  IdCard,
  Users,
  Banknote,
  CreditCard,
  FileText,
  CalendarCheck,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ReportCardViewer } from "./_ReportCardViewer";

const KES = (n: number) => `KES ${Math.abs(Number(n) || 0).toLocaleString()}`;

const STATUS_TONES: Record<string, string> = {
  paid: "bg-success/10 text-success border-success/20",
  partial: "bg-warning/10 text-warning border-warning/20",
  pending: "bg-muted text-muted-foreground border-border",
  waived: "bg-info/10 text-info border-info/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

const ParentChildDetail = () => {
  const { childId } = useParams<{ childId: string }>();
  const { me } = usePortalAuth();
  const child = me?.children?.find((c) => c.id === childId);

  const { data: summary, isLoading: sLoading } =
    usePortalStudentSummary(childId);
  const { data: feeItems = [], isLoading: fLoading } =
    usePortalFeeItems(childId);
  const { data: payments = [], isLoading: pLoading } =
    usePortalPayments(childId);
  const { data: cards = [], isLoading: cLoading } =
    usePortalReportCards(childId);
  const [openCard, setOpenCard] = useState<string | null>(null);

  // Guard: parent must own this child
  if (me && childId && !child) {
    return <Navigate to="/portal/parent/children" replace />;
  }

  const fees = summary?.fees;
  const att = summary?.attendance;
  const attPct =
    att && att.total_days > 0
      ? Math.round(((att.present_days || 0) / att.total_days) * 100)
      : null;

  return (
    <PortalLayout
      title={child ? `${child.first_name} ${child.last_name}` : "Student"}
      subtitle="View-only profile, fees, payments and results"
      nav={parentNav}
    >
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/portal/parent/children">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Children
          </Link>
        </Button>
      </div>

      {/* Header card */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary font-extrabold text-xl shrink-0">
              {child?.first_name?.[0]}
              {child?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-extrabold truncate">
                {child?.first_name} {child?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {child?.admission_number} • {child?.grade_name || "—"}
                {child?.stream_name ? ` (${child.stream_name})` : ""}
              </p>
            </div>
            {child?.relationship && (
              <Badge variant="outline" className="capitalize">
                {child.relationship}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
        <KPI
          label="Total Billed"
          value={fees ? KES(fees.total_billed) : "—"}
          icon={<Banknote className="h-4 w-4" />}
          loading={sLoading}
        />
        <KPI
          label="Total Paid"
          value={fees ? KES(fees.total_paid) : "—"}
          icon={<TrendingUp className="h-4 w-4 text-success" />}
          loading={sLoading}
          tone="success"
        />
        <KPI
          label="Balance"
          value={fees ? KES(fees.balance) : "—"}
          icon={<TrendingDown className="h-4 w-4" />}
          loading={sLoading}
          tone={fees && fees.balance > 0 ? "destructive" : "success"}
        />
        <KPI
          label="Attendance"
          value={attPct !== null ? `${attPct}%` : "—"}
          icon={<CalendarCheck className="h-4 w-4 text-info" />}
          loading={sLoading}
        />
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="profile" className="text-xs sm:text-sm py-2">
            <Users className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="fees" className="text-xs sm:text-sm py-2">
            <Banknote className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm py-2">
            <CreditCard className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="results" className="text-xs sm:text-sm py-2">
            <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <Card>
            <CardContent className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Row
                  icon={IdCard}
                  label="Admission Number"
                  value={child?.admission_number || "—"}
                />
                <Row icon={Users} label="Gender" value={child?.gender || "—"} />
                <Row
                  icon={GraduationCap}
                  label="Grade / Class"
                  value={child?.grade_name || "—"}
                />
                <Row
                  icon={GraduationCap}
                  label="Stream"
                  value={child?.stream_name || "—"}
                />
                {child?.relationship && (
                  <Row
                    icon={Users}
                    label="Your Relationship"
                    value={child.relationship}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEES */}
        <TabsContent value="fees">
          <Card>
            <CardContent className="p-0">
              {fLoading ? (
                <div className="p-5">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : feeItems.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No fee assignments yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Item</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead className="text-right">Billed</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeItems.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>
                            <div className="font-semibold text-sm">
                              {f.fee_name || (
                                <span className="capitalize">
                                  {f.ledger_type}
                                </span>
                              )}
                            </div>
                            {f.fee_category && (
                              <div className="text-[10px] text-muted-foreground capitalize">
                                {f.fee_category}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {f.term_name || "—"}
                            {f.year_name ? (
                              <div className="text-[10px] text-muted-foreground">
                                {f.year_name}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {KES(f.amount_due)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-success">
                            {KES(f.amount_paid)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm font-bold ${
                              Number(f.balance) > 0
                                ? "text-destructive"
                                : "text-success"
                            }`}
                          >
                            {KES(f.balance)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`capitalize text-[10px] ${
                                STATUS_TONES[f.status] || ""
                              }`}
                            >
                              {f.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {fmtDate(f.due_date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              {pLoading ? (
                <div className="p-5">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : payments.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs">
                            {fmtDate(p.received_at || p.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase"
                            >
                              {p.payment_method?.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {p.mpesa_receipt || p.reference_number || "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-bold text-success">
                            {KES(p.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="capitalize text-[10px]"
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESULTS */}
        <TabsContent value="results">
          <Card>
            <CardContent className="p-5">
              {cLoading ? (
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
                      onClick={() => setOpenCard(c.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {c.assessment_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(c.published_at)} •{" "}
                          {c.payload?.percentage ?? "—"}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.payload?.overall_band && (
                          <Badge className="bg-primary/10 text-primary border-0">
                            {c.payload.overall_band}
                          </Badge>
                        )}
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {openCard && (
                <ReportCardViewer
                  card={cards.find((c) => c.id === openCard)!}
                  onClose={() => setOpenCard(null)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PortalLayout>
  );
};

function KPI({
  label,
  value,
  icon,
  loading,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
  tone?: "default" | "success" | "destructive";
}) {
  const toneCls =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
          {icon}
          <span className="text-[10px] uppercase tracking-wide font-semibold">
            {label}
          </span>
        </div>
        {loading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <p className={`text-base sm:text-lg font-extrabold ${toneCls}`}>
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
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
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <p className="text-sm font-bold capitalize truncate">{value}</p>
      </div>
    </div>
  );
}

export default ParentChildDetail;
