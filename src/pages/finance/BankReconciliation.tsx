import { useMemo, useState } from "react";
import {
  useReconciliation,
  useReconciliationMutations,
  useReconciliations,
  type ReconciliationDetail,
  type ReconciliationLine,
} from "@/hooks/useBankReconciliation";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useChartOfAccounts } from "@/hooks/useAccounting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { toast } from "sonner";

const money = (n: number | string) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function BankReconciliation() {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [newOpen, setNewOpen] = useState(false);
  const { data: recs = [], isLoading } = useReconciliations();

  return (
    <EnterpriseGate>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bank Reconciliation</h1>
            <p className="text-sm text-muted-foreground">
              Match imported bank statements against the general ledger and
              post adjustments.
            </p>
          </div>
          <Button onClick={() => setNewOpen(true)}>New Reconciliation</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Reconciliations</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank Account</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Stmt Closing</TableHead>
                  <TableHead className="text-right">Ledger Closing</TableHead>
                  <TableHead className="text-right">Diff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center">Loading…</TableCell></TableRow>
                ) : recs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No reconciliations yet.
                    </TableCell>
                  </TableRow>
                ) : recs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.bank_account_name}</TableCell>
                    <TableCell>
                      {r.period_from?.slice(0, 10)} → {r.period_to?.slice(0, 10)}
                    </TableCell>
                    <TableCell className="text-right">{money(r.statement_closing)}</TableCell>
                    <TableCell className="text-right">{money(r.ledger_closing)}</TableCell>
                    <TableCell className={`text-right ${Math.abs(Number(r.difference)) > 0.01 ? "text-destructive font-medium" : ""}`}>
                      {money(r.difference)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(r.id)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <NewReconciliationDialog open={newOpen} onOpenChange={setNewOpen} onCreated={setSelectedId} />
        <ReconciliationDetailDialog
          id={selectedId}
          onClose={() => setSelectedId(undefined)}
        />
      </div>
    </EnterpriseGate>
  );
}

function NewReconciliationDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const { data: banks = [] } = useBankAccounts({ activeOnly: true });
  const { create } = useReconciliationMutations();
  const [form, setForm] = useState({
    bank_account_id: "",
    period_from: "",
    period_to: "",
    statement_opening: "",
    statement_closing: "",
    notes: "",
  });

  const submit = () => {
    if (!form.bank_account_id || !form.period_from || !form.period_to) {
      toast.error("Bank account and period are required");
      return;
    }
    create.mutate(
      {
        ...form,
        statement_opening: Number(form.statement_opening || 0),
        statement_closing: Number(form.statement_closing || 0),
      },
      {
        onSuccess: (r: any) => {
          toast.success("Reconciliation created");
          onOpenChange(false);
          setForm({ bank_account_id: "", period_from: "", period_to: "", statement_opening: "", statement_closing: "", notes: "" });
          if (r?.id) onCreated(r.id);
        },
        onError: (e: any) => toast.error(e?.message || "Failed"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Reconciliation</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Bank Account</Label>
            <Select value={form.bank_account_id} onValueChange={(v) => setForm({ ...form, bank_account_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
              <SelectContent>
                {banks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} {b.account_number ? `(${b.account_number})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Period From</Label>
              <Input type="date" value={form.period_from} onChange={(e) => setForm({ ...form, period_from: e.target.value })} />
            </div>
            <div>
              <Label>Period To</Label>
              <Input type="date" value={form.period_to} onChange={(e) => setForm({ ...form, period_to: e.target.value })} />
            </div>
            <div>
              <Label>Statement Opening</Label>
              <Input type="number" step="0.01" value={form.statement_opening} onChange={(e) => setForm({ ...form, statement_opening: e.target.value })} />
            </div>
            <div>
              <Label>Statement Closing</Label>
              <Input type="number" step="0.01" value={form.statement_closing} onChange={(e) => setForm({ ...form, statement_closing: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReconciliationDetailDialog({ id, onClose }: { id?: string; onClose: () => void }) {
  const { data: rec } = useReconciliation(id);
  const m = useReconciliationMutations(id);
  const [importOpen, setImportOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState<{ line?: ReconciliationLine } | null>(null);
  const [matchFor, setMatchFor] = useState<ReconciliationLine | null>(null);

  const balanced = rec ? Math.abs(Number(rec.difference)) <= 0.01 : false;

  return (
    <Dialog open={!!id} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rec ? `${rec.bank_account_name} • ${rec.period_from?.slice(0,10)} → ${rec.period_to?.slice(0,10)}` : "Reconciliation"}
          </DialogTitle>
        </DialogHeader>

        {!rec ? <div className="p-6 text-center">Loading…</div> : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-sm">
              <Stat label="Statement Opening" value={money(rec.statement_opening)} />
              <Stat label="Statement Closing" value={money(rec.statement_closing)} />
              <Stat label="Ledger Closing" value={money(rec.ledger_closing)} />
              <Stat
                label="Difference"
                value={money(rec.difference)}
                variant={balanced ? "ok" : "warn"}
              />
            </div>

            {rec.status === "draft" && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setImportOpen(true)}>Import Lines</Button>
                <Button size="sm" variant="outline"
                  onClick={() => m.autoMatch.mutate({}, {
                    onSuccess: (r: any) => toast.success(`Matched ${r?.matched ?? 0} of ${r?.scanned ?? 0}`),
                    onError: (e: any) => toast.error(e?.message || "Failed"),
                  })}>
                  Auto-Match
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAdjustOpen({})}>
                  Post Adjustment
                </Button>
                <div className="flex-1" />
                <Button size="sm" disabled={!balanced}
                  onClick={() => m.complete.mutate(undefined as any, {
                    onSuccess: () => toast.success("Reconciliation completed"),
                    onError: (e: any) => toast.error(e?.message || "Failed"),
                  })}>
                  Complete
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Statement Lines ({rec.lines.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Dr</TableHead>
                        <TableHead className="text-right">Cr</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rec.lines.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>{l.txn_date?.slice(0,10)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{l.description || l.reference || "—"}</TableCell>
                          <TableCell className="text-right">{Number(l.debit) ? money(l.debit) : "—"}</TableCell>
                          <TableCell className="text-right">{Number(l.credit) ? money(l.credit) : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={l.status === "matched" ? "default" : l.status === "unmatched" ? "secondary" : "outline"}>
                              {l.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {rec.status === "draft" && l.status === "unmatched" && (
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="ghost" onClick={() => setMatchFor(l)}>Match</Button>
                                <Button size="sm" variant="ghost" onClick={() => setAdjustOpen({ line: l })}>Adjust</Button>
                              </div>
                            )}
                            {rec.status === "draft" && l.status === "matched" && (
                              <Button size="sm" variant="ghost"
                                onClick={() => m.unmatch.mutate(l.id)}>Unmatch</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Ledger Entries ({rec.gl_entries.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Ref</TableHead>
                        <TableHead className="text-right">Dr</TableHead>
                        <TableHead className="text-right">Cr</TableHead>
                        <TableHead>Match</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rec.gl_entries.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell>{g.entry_date?.slice(0,10)}</TableCell>
                          <TableCell className="font-mono text-xs">{g.posting_ref}</TableCell>
                          <TableCell className="text-right">{Number(g.debit) ? money(g.debit) : "—"}</TableCell>
                          <TableCell className="text-right">{Number(g.credit) ? money(g.credit) : "—"}</TableCell>
                          <TableCell>
                            {g.matched_line_id
                              ? <Badge variant="default">matched</Badge>
                              : <Badge variant="secondary">open</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {rec.adjustments.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Adjustments</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Narration</TableHead>
                        <TableHead>Posting Ref</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rec.adjustments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.adjustment_date?.slice(0,10)}</TableCell>
                          <TableCell>{a.direction === "debit" ? "Dr Bank" : "Cr Bank"}</TableCell>
                          <TableCell className="text-right">{money(a.amount)}</TableCell>
                          <TableCell>{a.narration || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{a.posting_ref}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {rec && <ImportDialog open={importOpen} onOpenChange={setImportOpen} m={m} />}
        {rec && <AdjustmentDialog open={!!adjustOpen} onOpenChange={(v) => !v && setAdjustOpen(null)} m={m} line={adjustOpen?.line} />}
        {rec && matchFor && <MatchDialog line={matchFor} rec={rec} onClose={() => setMatchFor(null)} m={m} />}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, variant }: { label: string; value: string; variant?: "ok" | "warn" }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${variant === "warn" ? "text-destructive" : variant === "ok" ? "text-green-600" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function ImportDialog({ open, onOpenChange, m }: any) {
  const [raw, setRaw] = useState("");
  const parsed = useMemo(() => parseCsv(raw), [raw]);

  const submit = () => {
    if (parsed.length === 0) { toast.error("No rows detected"); return; }
    m.importLines.mutate(
      { lines: parsed },
      {
        onSuccess: (r: any) => {
          toast.success(`Imported ${r?.imported ?? parsed.length} lines`);
          onOpenChange(false);
          setRaw("");
        },
        onError: (e: any) => toast.error(e?.message || "Failed"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Import Statement Lines</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Paste CSV: <code>date,description,reference,debit,credit</code>. Header row optional.
          </p>
          <Textarea rows={10} value={raw} onChange={(e) => setRaw(e.target.value)}
            placeholder="2026-08-01,Fee receipt,MPESA123,0,15000&#10;2026-08-02,Bank charges,,250,0" />
          <p className="text-xs">{parsed.length} row(s) detected</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={m.importLines.isPending}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function parseCsv(text: string) {
  const rows: any[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 2) continue;
    if (/^date$/i.test(cols[0])) continue;
    const [date, description = "", reference = "", debit = "0", credit = "0"] = cols;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    rows.push({
      txn_date: date, description, reference,
      debit: Number(debit) || 0, credit: Number(credit) || 0,
    });
  }
  return rows;
}

function AdjustmentDialog({ open, onOpenChange, m, line }: any) {
  const { data: coa = [] } = useChartOfAccounts();
  const [form, setForm] = useState({
    adjustment_date: new Date().toISOString().slice(0, 10),
    direction: "credit" as "debit" | "credit",
    amount: "",
    counter_account_id: "",
    narration: "",
  });

  // Preload from line if provided (bank statement debit = cash out = credit bank)
  useMemo(() => {
    if (!line) return;
    setForm((f) => ({
      ...f,
      adjustment_date: line.txn_date?.slice(0, 10) || f.adjustment_date,
      amount: String(Number(line.debit) || Number(line.credit) || ""),
      direction: Number(line.credit) > 0 ? "debit" : "credit",
      narration: line.description || f.narration,
    }));
  }, [line?.id]);

  const submit = () => {
    if (!form.counter_account_id || !form.amount) {
      toast.error("Counter account and amount required"); return;
    }
    m.adjust.mutate(
      { ...form, amount: Number(form.amount), line_id: line?.id },
      {
        onSuccess: () => { toast.success("Adjustment posted"); onOpenChange(false); },
        onError: (e: any) => toast.error(e?.message || "Failed"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Post Adjustment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.adjustment_date}
                onChange={(e) => setForm({ ...form, adjustment_date: e.target.value })} />
            </div>
            <div>
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={(v: any) => setForm({ ...form, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Dr Bank (money in)</SelectItem>
                  <SelectItem value="credit">Cr Bank (money out)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <Label>Counter Account</Label>
            <Select value={form.counter_account_id} onValueChange={(v) => setForm({ ...form, counter_account_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {coa.filter((a) => a.is_active).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.account_code} — {a.name} ({a.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Narration</Label>
            <Textarea rows={2} value={form.narration}
              onChange={(e) => setForm({ ...form, narration: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={m.adjust.isPending}>Post</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MatchDialog({ line, rec, onClose, m }: { line: ReconciliationLine; rec: ReconciliationDetail; onClose: () => void; m: any }) {
  const candidates = rec.gl_entries.filter((g) => !g.matched_line_id);
  const [glId, setGlId] = useState("");

  const submit = () => {
    if (!glId) { toast.error("Pick a ledger entry"); return; }
    m.match.mutate(
      { line_id: line.id, gl_id: glId },
      {
        onSuccess: () => { toast.success("Matched"); onClose(); },
        onError: (e: any) => toast.error(e?.message || "Failed"),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Match line — {line.txn_date?.slice(0,10)} • {Number(line.debit) ? `Dr ${money(line.debit)}` : `Cr ${money(line.credit)}`}
          </DialogTitle>
        </DialogHeader>
        <div>
          <Label>Ledger Entry</Label>
          <Select value={glId} onValueChange={setGlId}>
            <SelectTrigger><SelectValue placeholder="Select entry" /></SelectTrigger>
            <SelectContent>
              {candidates.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.entry_date?.slice(0,10)} • {g.posting_ref} • {Number(g.debit) ? `Dr ${money(g.debit)}` : `Cr ${money(g.credit)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={m.match.isPending}>Match</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}