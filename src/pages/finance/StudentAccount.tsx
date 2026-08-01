import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { useStudents } from "@/hooks/useStudents";
import { useStudentAccountV2 } from "@/hooks/useStudentAccount";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Download, FileText, User } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const fmt = (n: number) =>
  "KES " + Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function AccountInner() {
  const { viewingTerm, viewingYear } = useAcademicContext();
  const [q, setQ] = useState("");
  const [studentId, setStudentId] = useState<string | undefined>();
  const [allHistory, setAllHistory] = useState(false);

  const { data: students = [], isLoading: searching } = useStudents({
    search: q,
    enabled: q.trim().length >= 2,
  });

  const { data: statement, isLoading, error, refetch } = useStudentAccountV2(
    studentId,
    {
      termId: viewingTerm?.id,
      academicYearId: viewingYear?.id,
      allHistory,
    },
  );

  const openPdf = () => {
    if (!studentId) return;
    const params = new URLSearchParams();
    if (viewingTerm?.id) params.set("term_id", viewingTerm.id);
    if (viewingYear?.id) params.set("academic_year_id", viewingYear.id);
    const qs = params.toString();
    api
      .openFile(
        `/finance/student-fees/${studentId}/statement${qs ? `?${qs}` : ""}`,
        `statement-${statement?.student?.admission_number || studentId}.pdf`,
      )
      .catch((e: Error) =>
        toast({
          title: "Could not download statement",
          description: e.message,
          variant: "destructive",
        }),
      );
  };

  const totals = statement?.totals;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student Fee Account</h1>
          <p className="text-sm text-muted-foreground">
            Unified statement — opening, charges, payments, arrears, closing.
          </p>
        </div>
        {statement && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
            <Button onClick={openPdf}><Download className="h-4 w-4 mr-2" />Download PDF</Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Student</CardTitle>
          <CardDescription>Search by name or admission number</CardDescription>
        </CardHeader>
        <CardContent>
          <Command shouldFilter={false} className="border rounded-md">
            <CommandInput
              value={q}
              onValueChange={setQ}
              placeholder="Type name or admission #..."
            />
            <CommandList>
              {q.trim().length < 2 ? null : searching ? (
                <div className="p-3 text-sm text-muted-foreground">Searching…</div>
              ) : students.length === 0 ? (
                <CommandEmpty>No students found</CommandEmpty>
              ) : (
                students.slice(0, 15).map((s: any) => (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => { setStudentId(s.id); setQ(""); }}
                    className="cursor-pointer"
                  >
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{s.full_name || `${s.first_name} ${s.last_name}`}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {s.admission_number} • {s.grade || "—"} {s.stream || ""}
                    </span>
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
        </CardContent>
      </Card>

      {!studentId ? null : isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error ? (
        <Card><CardContent className="p-6 text-sm text-destructive">
          {(error as Error).message || "Failed to load statement"}
        </CardContent></Card>
      ) : !statement ? null : (
        <>
          {/* Header card */}
          <Card>
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">{statement.student.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  Adm. {statement.student.admission_number} · {statement.student.grade || "—"} {statement.student.stream || ""}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {statement.term?.name || "All Terms"}
                  {statement.academic_year?.name ? ` · ${statement.academic_year.name}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Net Owing</div>
                <div className={`text-2xl font-bold ${totals!.net_owing > 0 ? "text-destructive" : "text-emerald-600"}`}>
                  {fmt(totals!.net_owing)}
                </div>
                {totals!.excess_credit > 0 && (
                  <Badge variant="secondary" className="mt-1">
                    Credit: {fmt(totals!.excess_credit)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Opening Balance", value: totals!.opening_balance },
              { label: "Charges", value: totals!.charges },
              { label: "Discounts", value: totals!.discounts, neg: true },
              { label: "Payments", value: totals!.payments, pos: true },
              { label: "Closing Balance", value: totals!.closing_balance, strong: true },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className={`text-lg font-semibold ${
                    s.strong ? (s.value > 0 ? "text-destructive" : "text-emerald-600") :
                    s.pos ? "text-emerald-600" :
                    s.neg ? "text-amber-600" : ""
                  }`}>
                    {fmt(s.value)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charges by vote head */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Charges by Vote Head
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Vote Head / Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Waived</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statement.charges.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No charges in this period</TableCell></TableRow>
                  ) : statement.charges.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{c.code || "—"}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-right">{fmt(c.amount)}</TableCell>
                      <TableCell className="text-right text-amber-600">{fmt(c.discount)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmt(c.waived)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(c.net)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Arrears */}
          {statement.arrears.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Arrears (Prior Terms)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {statement.arrears.map((a) => (
                      <TableRow key={a.term_id}>
                        <TableCell>{a.term_name}</TableCell>
                        <TableCell className="text-right text-destructive font-medium">{fmt(a.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Payments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">
                {allHistory ? "All Payments" : "Payments in Period"}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllHistory((v) => !v)}
              >
                {allHistory ? "Show current term only" : "Show full history"}
              </Button>
            </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Allocated To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {statement.payments.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {allHistory ? "No payments recorded for this student" : "No payments in this period — try \u201cShow full history\u201d"}
                      </TableCell></TableRow>
                  ) : statement.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.received_at ? new Date(p.received_at).toLocaleDateString("en-GB") : "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{p.receipt_number || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{(p.payment_method || "").toUpperCase()}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.reference_number || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.allocations && p.allocations.length > 0
                          ? p.allocations.map((a) => `${a.bucket} ${fmt(a.amount)}`).join(", ")
                          : "Unallocated"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">{fmt(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-8 border-t pt-3 mt-3 text-sm">
                <div>
                  <span className="text-muted-foreground mr-2">Total Paid</span>
                  <span className="font-semibold text-emerald-600">
                    {fmt(statement.payments.reduce((s2, p) => s2 + Number(p.amount || 0), 0))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-2">Balance</span>
                  <span className={`font-semibold ${totals!.net_owing > 0 ? "text-destructive" : "text-emerald-600"}`}>
                    {fmt(totals!.net_owing)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function StudentAccountPage() {
  return (
    <DashboardLayout>
      <EnterpriseGate>
        <AccountInner />
      </EnterpriseGate>
    </DashboardLayout>
  );
}