import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useIncomeStatement, useBalanceSheet, useSupplierStatement, useApAging,
  useVoucherRegister, useReceiptRegister, usePoRegister, useCapitationReport,
  useBudgetVsActual, useBankReconciliationSummary,
} from "@/hooks/useFinancialReports";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useBudgets } from "@/hooks/useBudgets";
import { useBankAccounts } from "@/hooks/useBankAccounts";

const fmt = (n: number | string | null | undefined) =>
  `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };

function DateRange({ from, to, setFrom, setTo }: any) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
      <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
    </div>
  );
}

function IncomeStatementTab() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const { data, isLoading } = useIncomeStatement({ from, to });
  return (
    <div className="space-y-4">
      <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardHeader><CardDescription>Total Income</CardDescription><CardTitle className="text-2xl">{fmt(data?.totals.income)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Total Expenses</CardDescription><CardTitle className="text-2xl">{fmt(data?.totals.expense)}</CardTitle></CardHeader></Card>
        <Card>
          <CardHeader>
            <CardDescription>Surplus / (Deficit)</CardDescription>
            <CardTitle className={`text-2xl ${Number(data?.totals.surplus) < 0 ? "text-destructive" : "text-emerald-600"}`}>
              {fmt(data?.totals.surplus)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Income</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={2}>Loading…</TableCell></TableRow>
                : (data?.income || []).map((l: any) => (
                  <TableRow key={l.account_id}><TableCell>{l.account_code} — {l.name}</TableCell><TableCell className="text-right">{fmt(l.amount)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {(data?.expense || []).map((l: any) => (
                  <TableRow key={l.account_id}><TableCell>{l.account_code} — {l.name}</TableCell><TableCell className="text-right">{fmt(l.amount)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BalanceSheetTab() {
  const [to, setTo] = useState(today());
  const { data } = useBalanceSheet({ to });
  const Section = ({ title, rows, total }: any) => (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Total: {fmt(total)}</CardDescription></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
          <TableBody>
            {(rows || []).map((r: any) => (
              <TableRow key={r.id}><TableCell>{r.account_code} — {r.name}</TableCell><TableCell className="text-right">{fmt(r.balance)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div><Label>As of</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <Badge variant={data?.totals.balanced ? "default" : "destructive"}>
          {data?.totals.balanced ? "Balanced" : "Not balanced"}
        </Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Assets" rows={data?.assets} total={data?.totals.assets} />
        <Section title="Liabilities" rows={data?.liabilities} total={data?.totals.liabilities} />
        <Card>
          <CardHeader>
            <CardTitle>Equity</CardTitle>
            <CardDescription>Total: {fmt(data?.totals.equity)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {(data?.equity || []).map((r: any) => (
                  <TableRow key={r.id}><TableCell>{r.account_code} — {r.name}</TableCell><TableCell className="text-right">{fmt(r.balance)}</TableCell></TableRow>
                ))}
                <TableRow><TableCell className="font-medium">Retained Earnings (period)</TableCell><TableCell className="text-right">{fmt(data?.retained_earnings)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SupplierStatementTab() {
  const [supplierId, setSupplierId] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: suppliers = [] } = useSuppliers({ active: true });
  const { data } = useSupplierStatement({ supplier_id: supplierId, from, to });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64">
          <Label>Supplier</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger><SelectValue placeholder="Choose supplier" /></SelectTrigger>
            <SelectContent>{(suppliers as any[]).map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
      </div>
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card><CardHeader><CardDescription>Opening</CardDescription><CardTitle>{fmt(data.totals.opening_balance)}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Invoiced</CardDescription><CardTitle>{fmt(data.totals.invoiced)}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Paid</CardDescription><CardTitle>{fmt(data.totals.paid)}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Balance</CardDescription><CardTitle>{fmt(data.totals.balance)}</CardTitle></CardHeader></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Paid</TableHead></TableRow></TableHeader>
                <TableBody>{data.invoices.map((i: any) => (
                  <TableRow key={i.id}><TableCell>{i.invoice_no}</TableCell><TableCell>{i.invoice_date?.slice(0, 10)}</TableCell><TableCell><Badge variant="outline">{i.status}</Badge></TableCell><TableCell className="text-right">{fmt(i.amount)}</TableCell><TableCell className="text-right">{fmt(i.amount_paid)}</TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Vouchers</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>{data.vouchers.map((v: any) => (
                  <TableRow key={v.id}><TableCell>{v.voucher_no}</TableCell><TableCell>{v.voucher_date?.slice(0, 10)}</TableCell><TableCell><Badge variant="outline">{v.status}</Badge></TableCell><TableCell className="text-right">{fmt(v.amount)}</TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ApAgingTab() {
  const [asOf, setAsOf] = useState(today());
  const { data } = useApAging({ as_of: asOf });
  return (
    <div className="space-y-4">
      <div><Label>As of</Label><Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="w-56" /></div>
      <Card>
        <CardHeader><CardTitle>AP Aging by Supplier</CardTitle><CardDescription>Total outstanding: {fmt(data?.totals.total)}</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Supplier</TableHead><TableHead className="text-right">Current</TableHead><TableHead className="text-right">1–30</TableHead><TableHead className="text-right">31–60</TableHead><TableHead className="text-right">61–90</TableHead><TableHead className="text-right">90+</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>{(data?.suppliers || []).map((s: any) => (
              <TableRow key={s.supplier_id}><TableCell>{s.supplier_name}</TableCell><TableCell className="text-right">{fmt(s.current)}</TableCell><TableCell className="text-right">{fmt(s.d1_30)}</TableCell><TableCell className="text-right">{fmt(s.d31_60)}</TableCell><TableCell className="text-right">{fmt(s.d61_90)}</TableCell><TableCell className="text-right text-destructive">{fmt(s.d90_plus)}</TableCell><TableCell className="text-right font-medium">{fmt(s.total)}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function VoucherRegisterTab() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const { data } = useVoucherRegister({ from, to });
  return (
    <div className="space-y-4">
      <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardHeader><CardDescription>Total</CardDescription><CardTitle>{fmt(data?.totals.total)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Paid</CardDescription><CardTitle>{fmt(data?.totals.paid)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Approved</CardDescription><CardTitle>{fmt(data?.totals.approved)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Draft</CardDescription><CardTitle>{fmt(data?.totals.draft)}</CardTitle></CardHeader></Card>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Voucher</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead>Bank</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
          <TableBody>{(data?.rows || []).map((v: any) => (
            <TableRow key={v.id}><TableCell>{v.voucher_no}</TableCell><TableCell>{v.voucher_date?.slice(0, 10)}</TableCell><TableCell>{v.supplier_name}</TableCell><TableCell>{v.bank_account_name || "—"}</TableCell><TableCell><Badge variant="outline">{v.status}</Badge></TableCell><TableCell className="text-right">{fmt(v.amount)}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function ReceiptRegisterTab() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const { data } = useReceiptRegister({ from, to });
  return (
    <div className="space-y-4">
      <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader><CardDescription>Receipts</CardDescription><CardTitle>{data?.totals.count || 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Collected</CardDescription><CardTitle>{fmt(data?.totals.total)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Cancelled</CardDescription><CardTitle>{fmt(data?.totals.cancelled)}</CardTitle></CardHeader></Card>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Receipt #</TableHead><TableHead>Date</TableHead><TableHead>Adm</TableHead><TableHead>Student</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
          <TableBody>{(data?.rows || []).map((r: any) => (
            <TableRow key={r.id}><TableCell>{r.receipt_number}</TableCell><TableCell>{r.receipt_date?.slice(0, 10)}</TableCell><TableCell>{r.admission_number}</TableCell><TableCell>{r.student_name}</TableCell><TableCell>{r.payment_method}</TableCell><TableCell><Badge variant="outline">{r.status || "issued"}</Badge></TableCell><TableCell className="text-right">{fmt(r.amount)}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function PoRegisterTab() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const { data } = usePoRegister({ from, to });
  return (
    <div className="space-y-4">
      <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <div className="grid grid-cols-2 gap-4">
        <Card><CardHeader><CardDescription>Orders</CardDescription><CardTitle>{data?.totals.count || 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Value</CardDescription><CardTitle>{fmt(data?.totals.total)}</CardTitle></CardHeader></Card>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>PO #</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
          <TableBody>{(data?.rows || []).map((p: any) => (
            <TableRow key={p.id}><TableCell>{p.po_number}</TableCell><TableCell>{p.order_date?.slice(0, 10)}</TableCell><TableCell>{p.supplier_name}</TableCell><TableCell><Badge variant="outline">{p.status}</Badge></TableCell><TableCell className="text-right">{fmt(p.total_amount)}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function CapitationTab() {
  const { data } = useCapitationReport({});
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader><CardDescription>Expected</CardDescription><CardTitle>{fmt(data?.totals.expected)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Received</CardDescription><CardTitle>{fmt(data?.totals.received)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Pending</CardDescription><CardTitle>{fmt(data?.totals.pending)}</CardTitle></CardHeader></Card>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Expected</TableHead><TableHead className="text-right">Received</TableHead><TableHead>Tranches</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{(data?.rows || []).map((c: any) => (
            <TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell className="text-right">{fmt(c.expected_amount)}</TableCell><TableCell className="text-right">{fmt(c.received_amount)}</TableCell><TableCell>{c.tranches_received}/{c.tranches_total}</TableCell><TableCell><Badge variant="outline">{c.status}</Badge></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function BudgetVsActualTab() {
  const [budgetId, setBudgetId] = useState<string>("");
  const { data: budgets = [] } = useBudgets();
  const { data } = useBudgetVsActual({ budget_id: budgetId });
  return (
    <div className="space-y-4">
      <div className="min-w-64 max-w-md">
        <Label>Budget</Label>
        <Select value={budgetId} onValueChange={setBudgetId}>
          <SelectTrigger><SelectValue placeholder="Choose budget" /></SelectTrigger>
          <SelectContent>{(budgets as any[]).map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card><CardHeader><CardDescription>Budgeted</CardDescription><CardTitle>{fmt(data.totals.budgeted)}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Actual</CardDescription><CardTitle>{fmt(data.totals.actual)}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Variance</CardDescription><CardTitle className={data.totals.variance < 0 ? "text-destructive" : "text-emerald-600"}>{fmt(data.totals.variance)}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Utilisation</CardDescription><CardTitle>{data.totals.utilisation}%</CardTitle></CardHeader></Card>
          </div>
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Vote Head</TableHead><TableHead className="text-right">Budgeted</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Variance</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
              <TableBody>{data.lines.map((l: any) => (
                <TableRow key={l.id}><TableCell>{l.vote_head_name}</TableCell><TableCell className="text-right">{fmt(l.budgeted)}</TableCell><TableCell className="text-right">{fmt(l.actual)}</TableCell><TableCell className={`text-right ${l.variance < 0 ? "text-destructive" : ""}`}>{fmt(l.variance)}</TableCell><TableCell className="text-right">{l.utilisation}%</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent></Card>
        </>
      )}
    </div>
  );
}

function BankRecTab() {
  const [bankId, setBankId] = useState<string>("");
  const { data: banks = [] } = useBankAccounts();
  const { data } = useBankReconciliationSummary({ bank_account_id: bankId });
  return (
    <div className="space-y-4">
      <div className="min-w-64 max-w-md">
        <Label>Bank account</Label>
        <Select value={bankId} onValueChange={setBankId}>
          <SelectTrigger><SelectValue placeholder="All accounts" /></SelectTrigger>
          <SelectContent>{(banks as any[]).map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Bank</TableHead><TableHead className="text-right">Statement</TableHead><TableHead className="text-right">Book</TableHead><TableHead>Matched</TableHead><TableHead>Unmatched</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{(data?.rows || []).map((r: any) => (
            <TableRow key={r.id}><TableCell>{r.statement_date?.slice(0, 10)}</TableCell><TableCell>{r.bank_account_name}</TableCell><TableCell className="text-right">{fmt(r.statement_balance)}</TableCell><TableCell className="text-right">{fmt(r.book_balance)}</TableCell><TableCell>{r.matched_count}</TableCell><TableCell>{r.unmatched_count}</TableCell><TableCell><Badge variant="outline">{r.status}</Badge></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

export default function FinancialReports() {
  return (
    <DashboardLayout>
      <EnterpriseGate>
        <div className="space-y-4 p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Financial Reports</h1>
            <p className="text-sm text-muted-foreground">
              Income &amp; Expenditure, Balance Sheet, supplier statements, registers, capitation, budget-vs-actual and bank reconciliation — all derived live from the general ledger.
            </p>
          </div>
          <Tabs defaultValue="income" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="income">Income &amp; Expenditure</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="supplier">Supplier Statement</TabsTrigger>
              <TabsTrigger value="aging">AP Aging</TabsTrigger>
              <TabsTrigger value="vouchers">Voucher Register</TabsTrigger>
              <TabsTrigger value="receipts">Receipt Register</TabsTrigger>
              <TabsTrigger value="pos">PO Register</TabsTrigger>
              <TabsTrigger value="capitation">Capitation</TabsTrigger>
              <TabsTrigger value="bva">Budget vs Actual</TabsTrigger>
              <TabsTrigger value="bank">Bank Reconciliation</TabsTrigger>
            </TabsList>
            <TabsContent value="income"><IncomeStatementTab /></TabsContent>
            <TabsContent value="balance"><BalanceSheetTab /></TabsContent>
            <TabsContent value="supplier"><SupplierStatementTab /></TabsContent>
            <TabsContent value="aging"><ApAgingTab /></TabsContent>
            <TabsContent value="vouchers"><VoucherRegisterTab /></TabsContent>
            <TabsContent value="receipts"><ReceiptRegisterTab /></TabsContent>
            <TabsContent value="pos"><PoRegisterTab /></TabsContent>
            <TabsContent value="capitation"><CapitationTab /></TabsContent>
            <TabsContent value="bva"><BudgetVsActualTab /></TabsContent>
            <TabsContent value="bank"><BankRecTab /></TabsContent>
          </Tabs>
        </div>
      </EnterpriseGate>
    </DashboardLayout>
  );
}
