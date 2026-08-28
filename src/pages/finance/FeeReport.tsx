import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTerm } from "@/contexts/TermContext";
import { useSeo } from "@/hooks/useSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { StudentLink } from "@/components/students/StudentLink";
import { ExcessAppliedBadge } from "@/components/finance/ExcessAppliedBadge";


interface FeeReportRow {
  student_id: string;
  admission_number: string;
  full_name: string;
  grade: string;
  stream: string;
  brought_forward: number;
  billed: number;
  discounts: number;
  paid: number;
  paid_total?: number;
  balance: number;
  excess_cf: number;
  excess: number;
  /** Signed: arrears positive, prior-term excess negative. */
  bf_net?: number;
  /** Signed: balance positive, excess negative. */
  balance_cf?: number;
  from_excess_amount?: number;
  status: string;
}

const money = (v: number | string) =>
  Number(v || 0).toLocaleString("en-KE", { maximumFractionDigits: 2 });

/** Signed money: excess/credit shows as a negative value. */
const signedMoney = (v?: number | string) => {
  const n = Number(v || 0);
  return `${n < 0 ? "-" : ""}${money(Math.abs(n))}`;
};

const signedClass = (v?: number | string) => {
  const n = Number(v || 0);
  return `text-right ${n < 0 ? "text-success" : ""}`;
};


const STATUS_LABEL: Record<string, string> = {
  no_fees: "No fees",
  paid: "Cleared",
  partial: "Partially paid",
  pending: "Unpaid",
  credit: "In credit",
};

export default function FeeReport() {
  useSeo(
    "Fee Report",
    "Filterable fee report with brought-forward balances, billing, payments, outstanding balances and excess credit per student.",
  );

  const {
    currentTerm,
    selectedTerm,
    terms,
    academicYears,
    selectedAcademicYear,
  } = useTerm() as any;
  const [search, setSearch] = useState("");
  const [gradeId, setGradeId] = useState("all");
  const [streamId, setStreamId] = useState("all");
  const [termId, setTermId] = useState<string>(selectedTerm?.id || currentTerm?.id || "");
  const [yearId, setYearId] = useState<string>(selectedAcademicYear?.id || "");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  const asList = (d: any): any[] =>
    Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
  const { data: gradesRaw } = useQuery({
    queryKey: ["grades-list"],
    queryFn: () => api.get<any>("/classes/grades"),
  });
  const { data: streamsRaw } = useQuery({
    queryKey: ["streams-list"],
    queryFn: () => api.get<any>("/classes/streams"),
  });
  const grades = asList(gradesRaw);
  const streams = asList(streamsRaw);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (gradeId !== "all") p.set("grade_id", gradeId);
    if (streamId !== "all") p.set("stream_id", streamId);
    if (termId) p.set("term_id", termId);
    if (yearId) p.set("academic_year_id", yearId);
    if (status !== "all") p.set("status", status);
    return p;
  }, [search, gradeId, streamId, termId, yearId, status]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["fee-report", params.toString(), page],
    queryFn: () => {
      const q = new URLSearchParams(params);
      q.set("page", String(page));
      q.set("limit", String(limit));
      return api.get<any>(`/finance/fee-report?${q.toString()}`);
    },
  });

  const rows: FeeReportRow[] = data?.data || data?.rows || [];
  const totals = data?.totals;
  const total = data?.total || 0;

  const download = async () => {
    const id = toast.loading("Generating fee report...");
    try {
      const token = api.getToken();
      const schoolId = localStorage.getItem("chuo-school-id") || "";
      const base =
        (import.meta as any).env?.VITE_API_URL ||
        "https://chuoapi.wikiteq.co.ke/api/v1";
      const res = await fetch(
        `${base}/finance/fee-report/export.xlsx?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-School-ID": schoolId,
          },
        },
      );
      if (!res.ok) throw new Error("Failed to generate report");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fee-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fee report downloaded", { id });
    } catch (e: any) {
      toast.error(e?.message || "Download failed", { id });
    }
  };

  return (
    <DashboardLayout
      title="Fee Report"
      subtitle="Brought-forward, billing, payments and outstanding balances for the selected year and term. Excess B/F is credit brought in from prior terms; Excess is credit generated this term. Neither is mixed into the balance."
    >
      <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
        <Button size="sm" onClick={download}>
          <Download className="mr-1.5 h-4 w-4" />
          Download Excel
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search name or admission number"
              className="pl-8"
            />
          </div>
          <Select
            value={yearId}
            onValueChange={(v) => {
              setPage(1);
              setYearId(v);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {(academicYears || []).map((y: any) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name || y.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={termId}
            onValueChange={(v) => {
              setPage(1);
              setTermId(v);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All terms</SelectItem>
              {(terms || []).map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={gradeId}
            onValueChange={(v) => {
              setPage(1);
              setGradeId(v);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {grades.map((g: any) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={streamId}
            onValueChange={(v) => {
              setPage(1);
              setStreamId(v);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Stream" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All streams</SelectItem>
              {streams
                .filter(
                  (s: any) => gradeId === "all" || s.grade_id === gradeId,
                )
                .map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Unpaid</SelectItem>
              <SelectItem value="partial">Partially paid</SelectItem>
              <SelectItem value="paid">Cleared</SelectItem>
              <SelectItem value="credit">In credit</SelectItem>
              <SelectItem value="no_fees">No fees</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adm No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">B/F</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Discounts</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Balance (c/f)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No students match these filters.
                    </TableCell>
                  </TableRow>
                ) : (

                  rows.map((r) => (
                    <TableRow key={r.student_id}>
                      <TableCell className="font-mono text-xs">
                        {r.admission_number}
                      </TableCell>
                      <TableCell>
                        <StudentLink
                          studentId={r.student_id}
                          name={r.full_name}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.grade || "—"}
                        {r.stream ? (
                          <span className="text-muted-foreground">
                            {" "}
                            ({r.stream})
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className={signedClass(r.bf_net)}>
                        <div className="flex items-center justify-end gap-1.5">
                          {signedMoney(r.bf_net)}
                          <ExcessAppliedBadge amount={r.from_excess_amount} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {money(r.billed)}
                      </TableCell>
                      <TableCell className="text-right">
                        {money(r.discounts)}
                      </TableCell>
                      <TableCell className="text-right">
                        {money(r.paid_total ?? r.paid)}
                      </TableCell>

                      <TableCell
                        className={`font-semibold ${signedClass(r.balance_cf)}`}
                      >
                        {signedMoney(r.balance_cf)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "paid"
                              ? "default"
                              : r.status === "pending"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {STATUS_LABEL[r.status] || r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {totals && rows.length > 0 && (
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={3}>Totals (this page)</TableCell>
                    <TableCell className={signedClass(totals.bf_net)}>
                      {signedMoney(totals.bf_net)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money(totals.billed)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money(totals.discounts)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money(totals.paid_total ?? totals.paid)}
                    </TableCell>
                    <TableCell className={signedClass(totals.balance_cf)}>
                      {signedMoney(totals.balance_cf)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}


              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} student{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span>Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
