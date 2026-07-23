import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, ChevronLeft, Trash2, PlayCircle, Lock } from "lucide-react";
import {
  useBudgets, useBudget, useBudgetMutations, type Budget,
} from "@/hooks/useBudgets";
import { useVoteHeads } from "@/hooks/useVoteHeads";
import { useTerm } from "@/contexts/TermContext";

const fmt = (n: number) =>
  `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function StatusBadge({ status }: { status: Budget["status"] }) {
  const v = status === "active" ? "default" : status === "closed" ? "secondary" : "outline";
  return <Badge variant={v as any} className="capitalize">{status}</Badge>;
}

function BudgetList({ onOpen, onNew }: { onOpen: (id: string) => void; onNew: () => void }) {
  const { data = [], isLoading } = useBudgets();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Set targets per vote head per academic year/term. Actuals stream in
            live from the general ledger; overspend policy is enforced at
            posting time.
          </p>
        </div>
        <Button onClick={onNew}><Plus className="mr-2 h-4 w-4" /> New Budget</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All budgets</CardTitle>
          <CardDescription>{data.length} budget(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Year / Term</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Budgeted</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No budgets yet.</TableCell></TableRow>
              ) : data.map((b) => (
                <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onOpen(b.id)}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-sm">
                    {b.academic_year_name || "—"}
                    {b.term_name ? ` · ${b.term_name}` : " · Annual"}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{b.overspend_policy}</Badge></TableCell>
                  <TableCell className="text-right">{b.line_count || 0}</TableCell>
                  <TableCell className="text-right">{fmt(Number(b.total_budgeted || 0))}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NewBudgetDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (id: string) => void;
}) {
  const { academicYears, termsForYear, currentAcademicYear } = useTerm();
  const [yearId, setYearId] = useState<string>(currentAcademicYear?.id || "");
  const [termId, setTermId] = useState<string>("");
  const [name, setName] = useState("");
  const [policy, setPolicy] = useState<"warn" | "block">("warn");
  const [notes, setNotes] = useState("");
  const { create } = useBudgetMutations();

  const submit = async () => {
    if (!name.trim() || !yearId) return;
    const b = await create.mutateAsync({
      name: name.trim(),
      academic_year_id: yearId,
      term_id: termId || null,
      overspend_policy: policy,
      notes: notes.trim() || null,
    } as any);
    onCreated((b as any).id);
    setName(""); setNotes(""); setTermId("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Budget</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Term 1 Operating Budget" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Select value={yearId} onValueChange={setYearId}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Term (optional)</Label>
              <Select value={termId || "annual"} onValueChange={(v) => setTermId(v === "annual" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Annual" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual (all terms)</SelectItem>
                  {termsForYear.filter((t) => t.academic_year_id === yearId).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Overspend Policy</Label>
            <Select value={policy} onValueChange={(v: "warn" | "block") => setPolicy(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="warn">Warn — allow posting, flag overspend</SelectItem>
                <SelectItem value="block">Block — reject overspending postings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || !yearId || create.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BudgetDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, isLoading } = useBudget(id);
  const { data: voteHeads = [] } = useVoteHeads({ activeOnly: true });
  const { upsertLine, removeLine, activate, close, remove } = useBudgetMutations(id);
  const [addOpen, setAddOpen] = useState(false);
  const [vhId, setVhId] = useState("");
  const [amount, setAmount] = useState("");
  const readonly = data?.status !== "draft";

  const availableVoteHeads = useMemo(() => {
    const used = new Set((data?.lines || []).map((l) => l.vote_head_id));
    return voteHeads.filter((v) => !used.has(v.id));
  }, [voteHeads, data]);

  const submitLine = async () => {
    if (!vhId || !amount) return;
    await upsertLine.mutateAsync({ vote_head_id: vhId, budgeted_amount: Number(amount) });
    setVhId(""); setAmount(""); setAddOpen(false);
  };

  if (isLoading || !data) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ChevronLeft className="mr-1 h-4 w-4" /> All budgets
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
            <StatusBadge status={data.status} />
            <Badge variant="outline" className="capitalize">{data.overspend_policy}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.academic_year_name || "—"} {data.term_name ? `· ${data.term_name}` : "· Annual"}
          </p>
        </div>
        <div className="flex gap-2">
          {data.status === "draft" && (
            <>
              <Button variant="outline" onClick={() => { if (confirm("Delete this draft budget?")) remove.mutate(id, { onSuccess: onBack }); }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
              <Button onClick={() => activate.mutate(id)}>
                <PlayCircle className="mr-2 h-4 w-4" /> Activate
              </Button>
            </>
          )}
          {data.status === "active" && (
            <Button variant="outline" onClick={() => { if (confirm("Close this budget? Lines will become read-only.")) close.mutate(id); }}>
              <Lock className="mr-2 h-4 w-4" /> Close
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Budgeted</div><div className="text-2xl font-semibold">{fmt(data.totals.budgeted)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Actual (net Dr)</div><div className="text-2xl font-semibold">{fmt(data.totals.actual)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Variance</div><div className={`text-2xl font-semibold ${data.totals.variance < 0 ? "text-destructive" : "text-success"}`}>{fmt(data.totals.variance)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Utilisation</div><div className="text-2xl font-semibold">{data.totals.utilisation_pct.toFixed(1)}%</div><Progress value={Math.min(100, data.totals.utilisation_pct)} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Budget vs Actual</CardTitle>
            <CardDescription>Per vote head — actuals derived from posted GL entries in this period</CardDescription>
          </div>
          {!readonly && (
            <Button size="sm" onClick={() => setAddOpen(true)} disabled={availableVoteHeads.length === 0}>
              <Plus className="mr-1 h-4 w-4" /> Add line
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vote Head</TableHead>
                <TableHead className="text-right">Budgeted</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="w-40">Utilisation</TableHead>
                {!readonly && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lines.length === 0 ? (
                <TableRow><TableCell colSpan={readonly ? 5 : 6} className="text-center py-10 text-muted-foreground">No lines yet. Add vote heads to allocate budgets.</TableCell></TableRow>
              ) : data.lines.map((l) => {
                const util = Math.min(100, l.utilisation_pct);
                return (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="font-medium">{l.vote_head_name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{l.vote_head_code}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {readonly ? fmt(l.budgeted_amount) : (
                        <Input
                          type="number"
                          value={l.budgeted_amount}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== Number(l.budgeted_amount)) {
                              upsertLine.mutate({ vote_head_id: l.vote_head_id, budgeted_amount: val });
                            }
                          }}
                          onChange={() => {}}
                          defaultValue={l.budgeted_amount}
                          className="h-8 text-right w-32 ml-auto"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">{fmt(l.actual_amount)}</TableCell>
                    <TableCell className={`text-right ${l.variance < 0 ? "text-destructive font-medium" : ""}`}>
                      {fmt(l.variance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={util} className={`h-1.5 flex-1 ${l.utilisation_pct > 100 ? "[&>div]:bg-destructive" : ""}`} />
                        <span className="text-xs text-muted-foreground w-12 text-right">{l.utilisation_pct.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    {!readonly && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => removeLine.mutate(l.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add budget line</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Vote Head</Label>
              <Select value={vhId} onValueChange={setVhId}>
                <SelectTrigger><SelectValue placeholder="Select vote head" /></SelectTrigger>
                <SelectContent>
                  {availableVoteHeads.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.code} — {v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Budgeted amount (KES)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={submitLine} disabled={!vhId || !amount || upsertLine.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetsInner() {
  const [selected, setSelected] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  return (
    <div className="p-6">
      {selected ? (
        <BudgetDetail id={selected} onBack={() => setSelected(null)} />
      ) : (
        <BudgetList onOpen={setSelected} onNew={() => setNewOpen(true)} />
      )}
      <NewBudgetDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => { setNewOpen(false); setSelected(id); }}
      />
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <DashboardLayout>
      <EnterpriseGate>
        <BudgetsInner />
      </EnterpriseGate>
    </DashboardLayout>
  );
}