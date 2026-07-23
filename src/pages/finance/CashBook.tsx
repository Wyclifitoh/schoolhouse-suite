import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCashBook } from "@/hooks/useAccounting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BookOpen, Download } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function CashBook() {
  const { data: accounts = [] } = useBankAccounts();
  const [bankId, setBankId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const effectiveBankId = bankId || accounts[0]?.id || "";
  const { data, isLoading } = useCashBook({
    bank_account_id: effectiveBankId || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const rows = data?.entries || [];
  const totalsBadge = useMemo(
    () => (data ? `Opening ${fmt(data.opening_balance)} • Closing ${fmt(data.closing_balance)}` : ""),
    [data],
  );

  const exportCsv = () => {
    if (!data) return;
    const header = ["Date", "Ref", "Narration", "Counter Account", "Debit", "Credit", "Balance"];
    const lines = [header.join(",")].concat(
      rows.map((r) =>
        [r.entry_date, r.posting_ref, JSON.stringify(r.narration || ""), JSON.stringify(r.counter_account || ""), r.debit, r.credit, r.balance].join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cashbook-${data.account.name || "account"}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <EnterpriseGate>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6" /> Cash Book
              </h1>
              <p className="text-sm text-muted-foreground">
                Chronological Dr/Cr movement per bank / cash account with running balance.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>{totalsBadge}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label>Bank Account</Label>
                <Select value={effectiveBankId} onValueChange={setBankId}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}{a.bank_name ? ` — ${a.bank_name}` : ""}
                      </SelectItem>
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
              <div className="flex items-end">
                <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>Reset dates</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {data?.account.name || "Cash Book"}
              </CardTitle>
              <CardDescription>
                {data?.account.account_code ? `A/C ${data.account.account_code}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!effectiveBankId ? (
                <p className="text-sm text-muted-foreground">Add a bank account to start.</p>
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
                    <TableRow>
                      <TableCell colSpan={6} className="font-medium">Opening balance</TableCell>
                      <TableCell className="text-right font-medium">{fmt(data?.opening_balance || 0)}</TableCell>
                    </TableRow>
                    {rows.map((r) => (
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
                    {rows.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No transactions in range</TableCell></TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={4} className="font-semibold">Totals</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(data?.totals.debit || 0)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(data?.totals.credit || 0)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(data?.closing_balance || 0)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </EnterpriseGate>
    </DashboardLayout>
  );
}