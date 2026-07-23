import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldAlert, RefreshCw, Lock } from "lucide-react";
import {
  useAuditTrail, useAuditEntry, useAuditSummary, useVerifyChain, useSealChain,
  type AuditEntry,
} from "@/hooks/useAuditTrail";

function DiffTable({ before, after }: { before: any; after: any }) {
  const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  if (keys.length === 0) {
    return <div className="text-sm text-muted-foreground">No structured changes recorded.</div>;
  }
  const render = (v: unknown) =>
    v === null || v === undefined
      ? <span className="text-muted-foreground">—</span>
      : typeof v === "object"
        ? <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(v, null, 2)}</pre>
        : String(v);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Before</TableHead>
          <TableHead>After</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((k) => {
          const b = before?.[k], a = after?.[k];
          const changed = JSON.stringify(b) !== JSON.stringify(a);
          return (
            <TableRow key={k} className={changed ? "bg-amber-50/40" : ""}>
              <TableCell className="font-mono text-xs">{k}</TableCell>
              <TableCell className="text-xs">{render(b)}</TableCell>
              <TableCell className="text-xs">{render(a)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function AuditTrailPage() {
  const [filters, setFilters] = useState<{
    action?: string; entity_type?: string; from?: string; to?: string; page: number;
  }>({ page: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list    = useAuditTrail({ ...filters, limit: 50 });
  const summary = useAuditSummary();
  const verify  = useVerifyChain();
  const seal    = useSealChain();
  const entry   = useAuditEntry(selectedId);

  const totalPages = useMemo(() => {
    const t = list.data?.total || 0;
    return Math.max(1, Math.ceil(t / (list.data?.limit || 50)));
  }, [list.data]);

  const handleSeal = async () => {
    try {
      const r = await seal.mutateAsync();
      toast({ title: "Audit chain sealed", description: `${r.sealed} entries chained.` });
    } catch (e: any) {
      toast({ title: "Seal failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <EnterpriseGate>
        <div className="space-y-6 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Audit Trail</h1>
              <p className="text-sm text-muted-foreground">
                Every financial change, cryptographically chained for tamper evidence.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => verify.refetch()} disabled={verify.isFetching}>
                <RefreshCw className={`mr-2 h-4 w-4 ${verify.isFetching ? "animate-spin" : ""}`} />
                Verify chain
              </Button>
              <Button onClick={handleSeal} disabled={seal.isPending}>
                <Lock className="mr-2 h-4 w-4" />
                Seal new entries
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total entries</CardDescription>
                <CardTitle className="text-2xl">{summary.data?.total ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Today</CardDescription>
                <CardTitle className="text-2xl">{summary.data?.today ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Chained</CardDescription>
                <CardTitle className="text-2xl text-emerald-600">{summary.data?.sealed ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Unsealed</CardDescription>
                <CardTitle className={`text-2xl ${(summary.data?.unsealed || 0) > 0 ? "text-amber-600" : ""}`}>
                  {summary.data?.unsealed ?? "—"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {verify.data?.ok
                  ? <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Chain verified</>
                  : verify.data && !verify.data.ok
                    ? <><ShieldAlert className="h-5 w-5 text-destructive" /> Chain broken</>
                    : "Chain status"}
              </CardTitle>
              <CardDescription>
                {verify.isFetching
                  ? "Recomputing SHA-256 chain…"
                  : verify.data?.ok
                    ? `${verify.data.checked} sealed entries verified. Last hash: ${verify.data.last_hash?.slice(0, 16)}…`
                    : verify.data && !verify.data.ok
                      ? `Break detected at sequence #${verify.data.broken_at_sequence} (id ${verify.data.broken_at_id}). Investigate immediately.`
                      : "Click Verify chain to recompute."}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
              <div>
                <Label>Action contains</Label>
                <Input value={filters.action || ""}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
                  placeholder="e.g. PAYMENT_CREATE" />
              </div>
              <div>
                <Label>Entity type</Label>
                <Input value={filters.entity_type || ""}
                  onChange={(e) => setFilters({ ...filters, entity_type: e.target.value, page: 1 })}
                  placeholder="payments, expenses…" />
              </div>
              <div>
                <Label>From</Label>
                <Input type="date" value={filters.from || ""}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })} />
              </div>
              <div>
                <Label>To</Label>
                <Input type="date" value={filters.to || ""}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })} />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setFilters({ page: 1 })}>Reset</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Entries</CardTitle></CardHeader>
            <CardContent>
              {list.isLoading ? <Skeleton className="h-64" /> : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>When</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Chain</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(list.data?.items || []).map((r: AuditEntry) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.sequence ?? "—"}</TableCell>
                          <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                          <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                          <TableCell className="text-xs">
                            {r.entity_type}
                            {r.entity_id ? <span className="text-muted-foreground"> · {r.entity_id.slice(0, 8)}</span> : null}
                          </TableCell>
                          <TableCell>
                            {r.entry_hash
                              ? <span className="font-mono text-xs text-emerald-600">{r.entry_hash.slice(0, 10)}…</span>
                              : <Badge variant="secondary">unsealed</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedId(r.id)}>View</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {list.data?.total || 0} entries · page {filters.page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={filters.page <= 1}
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Prev</Button>
                      <Button variant="outline" size="sm" disabled={filters.page >= totalPages}
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Audit entry</DialogTitle></DialogHeader>
              {entry.isLoading || !entry.data ? <Skeleton className="h-64" /> : (
                <div className="space-y-4">
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div><span className="text-muted-foreground">Action:</span> <Badge variant="outline">{entry.data.action}</Badge></div>
                    <div><span className="text-muted-foreground">Entity:</span> {entry.data.entity_type} · {entry.data.entity_id}</div>
                    <div><span className="text-muted-foreground">When:</span> {new Date(entry.data.created_at).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">User:</span> {entry.data.first_name || entry.data.email || entry.data.user_id || "system"}</div>
                    <div><span className="text-muted-foreground">IP:</span> {entry.data.ip_address || "—"}</div>
                    <div><span className="text-muted-foreground">Sequence:</span> {entry.data.sequence ?? "—"}</div>
                    <div className="md:col-span-2 font-mono text-xs">
                      <div><span className="text-muted-foreground">prev:</span> {entry.data.prev_hash || "—"}</div>
                      <div><span className="text-muted-foreground">hash:</span> {entry.data.entry_hash || "—"}</div>
                    </div>
                  </div>
                  <DiffTable before={entry.data.old_values} after={entry.data.new_values} />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </EnterpriseGate>
    </DashboardLayout>
  );
}