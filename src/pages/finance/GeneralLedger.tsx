import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import {
  useChartOfAccounts,
  useGeneralLedger,
  useTrialBalance,
  useAccountingPeriods,
} from "@/hooks/useAccounting";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Landmark } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

function LedgerTab() {
  const { data: coa = [] } = useChartOfAccounts();
  const [accountId, setAccountId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const { data, isLoading } = useGeneralLedger({
    account_id: accountId || undefined,
    from: from || undefined,
    to: to || undefined,
  });
  const grouped = useMemo(() => {
    const map: Record<string, typeof coa> = {};
    coa.forEach((a) => { (map[a.type] ||= []).push(a); });
    return map;
  }, [coa]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1 md:col-span-2">
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {Object.entries(grouped).map(([type, list]) => (
                  <div key={type}>
                    <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground">{type}</div>
                    {list.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.account_code} — {a.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data?.account.name || "Select an account"}
          </CardTitle>
          {data && (
            <CardDescription>
              Opening {fmt(data.opening_balance)} • Closing {fmt(data.closing_balance)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {!accountId ? (
            <p className="text-sm text-muted-foreground">Pick an account to view its ledger.</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead>Counter A/C</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.entries.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.entry_date}</TableCell>
                    <TableCell className="font-mono text-xs">{r.posting_ref}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{r.narration || "—"}</TableCell>
                    <TableCell className="text-xs">{r.counter_account || "—"}</TableCell>
                    <TableCell className="text-right">{r.debit ? fmt(r.debit) : ""}</TableCell>
                    <TableCell className="text-right">{r.credit ? fmt(r.credit) : ""}</TableCell>
                    <TableCell className="text-right">{fmt(r.balance)}</TableCell>
                  </TableRow>
                ))}
                {(!data || data.entries.length === 0) && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No postings</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrialBalanceTab() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const { data, isLoading } = useTrialBalance({ from: from || undefined, to: to || undefined });
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Range</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end md:col-span-2">
            {data && (
              <Badge variant={data.totals.balanced ? "default" : "destructive"}>
                {data.totals.balanced ? "Balanced" : "Out of balance"} — Dr {fmt(data.totals.debit)} / Cr {fmt(data.totals.credit)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Trial Balance</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.lines.map((l) => (
                  <TableRow key={l.account_id}>
                    <TableCell className="font-mono text-xs">{l.account_code}</TableCell>
                    <TableCell>{l.name}</TableCell>
                    <TableCell className="text-xs capitalize">{l.type}</TableCell>
                    <TableCell className="text-right">{l.dr_balance ? fmt(l.dr_balance) : ""}</TableCell>
                    <TableCell className="text-right">{l.cr_balance ? fmt(l.cr_balance) : ""}</TableCell>
                  </TableRow>
                ))}
                {(!data || data.lines.length === 0) && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No postings</TableCell></TableRow>
                )}
                {data && data.lines.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">Totals</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(data.totals.debit)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(data.totals.credit)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PeriodsTab() {
  const { data: periods = [], isLoading } = useAccountingPeriods();
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["accounting", "periods"] });
    qc.invalidateQueries({ queryKey: ["accounting", "trial-balance"] });
  };
  const closeMut = useMutation({
    mutationFn: (v: { year: number; month: number }) =>
      api.post("/accounting/periods/close", v),
    onSuccess: () => {
      toast({ title: "Period closed" });
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: "Cannot close period", description: e.message, variant: "destructive" }),
  });
  const reopenMut = useMutation({
    mutationFn: (v: { year: number; month: number }) =>
      api.post("/accounting/periods/reopen", v),
    onSuccess: () => {
      toast({ title: "Period reopened" });
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: "Cannot reopen", description: e.message, variant: "destructive" }),
  });
  const monthName = (m: number) =>
    new Date(2000, m - 1, 1).toLocaleString("en", { month: "long" });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Accounting Periods</CardTitle>
        <CardDescription>
          Closing a period locks all postings in it. The trial balance must be balanced before the period will close.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Entries</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((p) => {
                const balanced = Number(p.debit_total) === Number(p.credit_total);
                return (
                  <TableRow key={p.id}>
                    <TableCell>{monthName(p.month)} {p.year}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "open" ? "outline" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{p.entry_count}</TableCell>
                    <TableCell className="text-right">{fmt(Number(p.debit_total))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(p.credit_total))}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.closed_at ? new Date(p.closed_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "open" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!balanced || closeMut.isPending}
                          onClick={() => closeMut.mutate({ year: p.year, month: p.month })}
                          title={!balanced ? "Trial balance not balanced" : "Close period"}
                        >
                          <Lock className="h-3.5 w-3.5 mr-1" /> Close
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={reopenMut.isPending}
                          onClick={() => reopenMut.mutate({ year: p.year, month: p.month })}
                        >
                          <Unlock className="h-3.5 w-3.5 mr-1" /> Reopen
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {periods.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No periods yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function GeneralLedger() {
  return (
    <DashboardLayout>
      <EnterpriseGate>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Landmark className="h-6 w-6" /> General Ledger
            </h1>
            <p className="text-sm text-muted-foreground">
              Per-account postings and trial balance across the Chart of Accounts.
            </p>
          </div>
          <Tabs defaultValue="ledger">
            <TabsList>
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
              <TabsTrigger value="trial">Trial Balance</TabsTrigger>
              <TabsTrigger value="periods">Periods</TabsTrigger>
            </TabsList>
            <TabsContent value="ledger" className="mt-4"><LedgerTab /></TabsContent>
            <TabsContent value="trial" className="mt-4"><TrialBalanceTab /></TabsContent>
            <TabsContent value="periods" className="mt-4"><PeriodsTab /></TabsContent>
          </Tabs>
        </div>
      </EnterpriseGate>
    </DashboardLayout>
  );
}