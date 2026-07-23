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
import {
  Plus, ChevronLeft, Trash2, PlayCircle, Lock, CheckCircle2, Landmark,
} from "lucide-react";
import {
  useCapitations, useCapitation, useCapitationMutations,
  type Capitation, type CapitationTranche,
} from "@/hooks/useCapitation";
import { useVoteHeads } from "@/hooks/useVoteHeads";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useTerm } from "@/contexts/TermContext";

const fmt = (n: number | string) =>
  `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function StatusBadge({ status }: { status: Capitation["status"] }) {
  const v = status === "active" ? "default" : status === "closed" ? "secondary" : "outline";
  return <Badge variant={v as any} className="capitalize">{status}</Badge>;
}

function TrancheBadge({ status }: { status: CapitationTranche["status"] }) {
  const v =
    status === "received" ? "default" : status === "cancelled" ? "destructive" : "outline";
  return <Badge variant={v as any} className="capitalize">{status}</Badge>;
}

/* -------------------------------- LIST -------------------------------- */
function CapitationList({
  onOpen, onNew,
}: { onOpen: (id: string) => void; onNew: () => void }) {
  const { data = [], isLoading } = useCapitations();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Government Capitation</h1>
          <p className="text-sm text-muted-foreground">
            Track per-student grants across the fiscal year. Tranche receipts
            are auto-distributed across vote heads and posted to the ledger.
          </p>
        </div>
        <Button onClick={onNew}><Plus className="mr-2 h-4 w-4" /> New Capitation</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All capitations</CardTitle>
          <CardDescription>{data.length} record(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Per Student</TableHead>
                <TableHead className="text-right">Enrolment</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={9}>Loading…</TableCell></TableRow>
              )}
              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No capitations yet. Create one to start tracking government grants.
                  </TableCell>
                </TableRow>
              )}
              {data.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => onOpen(c.id)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.academic_year_name || "—"}</TableCell>
                  <TableCell>{c.source}</TableCell>
                  <TableCell className="text-right">{fmt(c.per_student_amount)}</TableCell>
                  <TableCell className="text-right">{c.expected_enrolment}</TableCell>
                  <TableCell className="text-right">{fmt(c.expected_total)}</TableCell>
                  <TableCell className="text-right">{fmt(c.total_received || 0)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* --------------------------- NEW DIALOG ------------------------------- */
function NewCapitationDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { academicYears, currentAcademicYear } = useTerm();
  const [name, setName] = useState("");
  const [source, setSource] = useState("Government of Kenya");
  const [yearId, setYearId] = useState<string>(currentAcademicYear?.id || "");
  const [perStudent, setPerStudent] = useState<string>("22244");
  const [enrol, setEnrol] = useState<string>("0");
  const [notes, setNotes] = useState("");
  const { create } = useCapitationMutations();

  const expected = Number(perStudent || 0) * Number(enrol || 0);

  const submit = async () => {
    if (!name || !yearId) return;
    await create.mutateAsync({
      name, source,
      academic_year_id: yearId,
      per_student_amount: Number(perStudent),
      expected_enrolment: Number(enrol),
      notes,
    });
    onOpenChange(false);
    setName(""); setEnrol("0"); setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Capitation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FPE Capitation 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={yearId} onValueChange={setYearId}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {academicYears.map((ay) => (
                    <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Per-student amount (KES)</Label>
              <Input type="number" value={perStudent}
                onChange={(e) => setPerStudent(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Expected enrolment</Label>
              <Input type="number" value={enrol} onChange={(e) => setEnrol(e.target.value)} />
            </div>
          </div>
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            Expected total: <strong>{fmt(expected)}</strong>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name || !yearId || create.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------- RECEIVE DIALOG --------------------------- */
function ReceiveTrancheDialog({
  open, onOpenChange, tranche, capitationId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tranche: CapitationTranche | null;
  capitationId: string;
}) {
  const { data: banks = [] } = useBankAccounts({ activeOnly: true });
  const { receiveTranche } = useCapitationMutations(capitationId);
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");

  useMemo(() => {
    if (open && tranche) {
      setAmount(String(tranche.expected_amount || ""));
      setBankId(tranche.bank_account_id || "");
    }
  }, [open, tranche]);

  if (!tranche) return null;
  const submit = async () => {
    await receiveTranche.mutateAsync({
      tid: tranche.id,
      received_amount: Number(amount),
      received_date: date,
      bank_account_id: bankId,
      reference,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive Tranche: {tranche.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount received (KES)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date received</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bank account</Label>
            <Select value={bankId} onValueChange={setBankId}>
              <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
              <SelectContent>
                {banks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}{b.account_number ? ` — ${b.account_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reference / voucher no.</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TSC/2026/T1/001" />
          </div>
          <p className="text-xs text-muted-foreground">
            This will post a balanced entry to the General Ledger:
            Dr Bank / Cr Income (by vote-head distribution).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={!bankId || !amount || Number(amount) <= 0 || receiveTranche.isPending}
          >
            Receive & Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ DETAIL ------------------------------- */
function CapitationDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, isLoading } = useCapitation(id);
  const { data: voteHeads = [] } = useVoteHeads({ activeOnly: true });
  const { termsForYear } = useTerm();
  const mut = useCapitationMutations(id);

  const [vhId, setVhId] = useState("");
  const [pct, setPct] = useState("");
  const [trName, setTrName] = useState("");
  const [trExpected, setTrExpected] = useState("");
  const [trTermId, setTrTermId] = useState<string>("");
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [activeTranche, setActiveTranche] = useState<CapitationTranche | null>(null);

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading capitation…</div>;
  }

  const totals = data.totals;
  const receivePct = data.expected_total > 0
    ? Math.min(100, (Number(totals.received) / Number(data.expected_total)) * 100)
    : 0;

  const addDist = async () => {
    if (!vhId || !pct) return;
    await mut.upsertDistribution.mutateAsync({
      vote_head_id: vhId, percentage: Number(pct),
    });
    setVhId(""); setPct("");
  };
  const addTranche = async () => {
    if (!trName || !trExpected) return;
    await mut.upsertTranche.mutateAsync({
      name: trName, expected_amount: Number(trExpected),
      term_id: trTermId || null,
    });
    setTrName(""); setTrExpected(""); setTrTermId("");
  };

  const locked = data.status === "closed";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
            <p className="text-sm text-muted-foreground">
              {data.source} · {data.academic_year_name}
            </p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex gap-2">
          {data.status === "draft" && (
            <Button variant="outline"
              onClick={() => mut.activate.mutate(data.id)}
              disabled={mut.activate.isPending}>
              <PlayCircle className="mr-2 h-4 w-4" /> Activate
            </Button>
          )}
          {data.status === "active" && (
            <Button variant="outline"
              onClick={() => mut.close.mutate(data.id)}
              disabled={mut.close.isPending}>
              <Lock className="mr-2 h-4 w-4" /> Close
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Per Student</CardDescription>
          <CardTitle className="text-xl">{fmt(data.per_student_amount)}</CardTitle>
        </CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Enrolment</CardDescription>
          <CardTitle className="text-xl">{data.expected_enrolment}</CardTitle>
        </CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Expected</CardDescription>
          <CardTitle className="text-xl">{fmt(data.expected_total)}</CardTitle>
        </CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Received</CardDescription>
          <CardTitle className="text-xl">{fmt(totals.received)}</CardTitle>
        </CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receipt Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={receivePct} />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{fmt(totals.received)} received</span>
            <span>{fmt(totals.variance)} outstanding</span>
          </div>
        </CardContent>
      </Card>

      {/* Distributions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Vote-Head Distribution</CardTitle>
              <CardDescription>
                Must total 100% before a tranche can be received. Currently{" "}
                <strong>{totals.distribution_pct}%</strong>.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vote Head</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Amount (of expected)</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.distributions.length === 0 && (
                <TableRow><TableCell colSpan={4}
                  className="text-center text-muted-foreground py-4">
                  No distributions yet.
                </TableCell></TableRow>
              )}
              {data.distributions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.vote_head_code} — {d.vote_head_name}</TableCell>
                  <TableCell className="text-right">{Number(d.percentage).toFixed(2)}%</TableCell>
                  <TableCell className="text-right">
                    {fmt((Number(d.percentage) / 100) * Number(data.expected_total))}
                  </TableCell>
                  <TableCell className="text-right">
                    {!locked && (
                      <Button variant="ghost" size="icon"
                        onClick={() => mut.removeDistribution.mutate(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!locked && (
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4">
              <div className="min-w-[220px] flex-1 space-y-2">
                <Label>Vote head</Label>
                <Select value={vhId} onValueChange={setVhId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {voteHeads.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.code} — {v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32 space-y-2">
                <Label>%</Label>
                <Input type="number" value={pct} onChange={(e) => setPct(e.target.value)} />
              </div>
              <Button onClick={addDist} disabled={!vhId || !pct || mut.upsertDistribution.isPending}>
                <Plus className="mr-2 h-4 w-4" /> Add / Update
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tranches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tranches</CardTitle>
          <CardDescription>
            Each tranche is a single receipt. Receiving posts to the ledger by
            the distribution above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Term</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tranches.length === 0 && (
                <TableRow><TableCell colSpan={8}
                  className="text-center text-muted-foreground py-4">
                  No tranches yet.
                </TableCell></TableRow>
              )}
              {data.tranches.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.term_name || "—"}</TableCell>
                  <TableCell className="text-right">{fmt(t.expected_amount)}</TableCell>
                  <TableCell className="text-right">{fmt(t.received_amount)}</TableCell>
                  <TableCell>{t.received_date || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.posting_ref || t.reference || "—"}
                  </TableCell>
                  <TableCell><TrancheBadge status={t.status} /></TableCell>
                  <TableCell className="text-right">
                    {t.status === "pending" && !locked && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm"
                          onClick={() => { setActiveTranche(t); setReceiveOpen(true); }}>
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Receive
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => mut.removeTranche.mutate(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {t.status === "received" && (
                      <Badge variant="outline" className="gap-1">
                        <Landmark className="h-3 w-3" /> Posted
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!locked && (
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label>Tranche name</Label>
                <Input value={trName} onChange={(e) => setTrName(e.target.value)}
                  placeholder="e.g. Term 1 Tranche" />
              </div>
              <div className="w-40 space-y-2">
                <Label>Term (optional)</Label>
                <Select value={trTermId} onValueChange={setTrTermId}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {termsForYear.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40 space-y-2">
                <Label>Expected (KES)</Label>
                <Input type="number" value={trExpected}
                  onChange={(e) => setTrExpected(e.target.value)} />
              </div>
              <Button onClick={addTranche}
                disabled={!trName || !trExpected || mut.upsertTranche.isPending}>
                <Plus className="mr-2 h-4 w-4" /> Add Tranche
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ReceiveTrancheDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        tranche={activeTranche}
        capitationId={id}
      />
    </div>
  );
}

/* ------------------------------- PAGE -------------------------------- */
export default function CapitationPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  return (
    <DashboardLayout>
      <EnterpriseGate>
        {openId ? (
          <CapitationDetailView id={openId} onBack={() => setOpenId(null)} />
        ) : (
          <CapitationList onOpen={setOpenId} onNew={() => setNewOpen(true)} />
        )}
        <NewCapitationDialog open={newOpen} onOpenChange={setNewOpen} />
      </EnterpriseGate>
    </DashboardLayout>
  );
}