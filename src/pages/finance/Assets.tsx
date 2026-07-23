import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, ChevronLeft, Trash2, Package, TrendingDown, MoveRight, XCircle, Landmark,
} from "lucide-react";
import {
  useAssets, useAsset, useAssetMutations, useAssetCategories, useAssetSummary,
  type Asset, type AssetCategory, type AssetStatus, type DepMethod,
} from "@/hooks/useAssets";
import { useBankAccounts } from "@/hooks/useBankAccounts";

const fmt = (n: number | string) =>
  `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function StatusBadge({ status }: { status: AssetStatus }) {
  const map: Record<AssetStatus, any> = {
    active: "default", disposed: "secondary",
    written_off: "destructive", under_repair: "outline",
  };
  return <Badge variant={map[status]} className="capitalize">{status.replace("_", " ")}</Badge>;
}

/* ============================ LIST ============================ */
function AssetList({
  onOpen, onNew, onManageCategories,
}: {
  onOpen: (id: string) => void;
  onNew: () => void;
  onManageCategories: () => void;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const params = useMemo(() => {
    const p: Record<string, string> = { limit: "100" };
    if (q) p.q = q;
    if (status) p.status = status;
    if (categoryId) p.category_id = categoryId;
    return p;
  }, [q, status, categoryId]);
  const { data, isLoading } = useAssets(params);
  const { data: summary } = useAssetSummary();
  const { data: cats = [] } = useAssetCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Asset Register</h1>
          <p className="text-sm text-muted-foreground">
            Track school property, run depreciation and record disposals. Postings
            flow to the General Ledger when categories are linked to Chart-of-Accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onManageCategories}>
            <Package className="mr-2 h-4 w-4" /> Categories
          </Button>
          <Button onClick={onNew}><Plus className="mr-2 h-4 w-4" /> New Asset</Button>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardDescription>Total Assets</CardDescription>
            <CardTitle className="text-xl">{summary.totals.total_assets}</CardTitle>
          </CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Cost</CardDescription>
            <CardTitle className="text-xl">{fmt(summary.totals.total_cost)}</CardTitle>
          </CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Accum. Depreciation</CardDescription>
            <CardTitle className="text-xl">{fmt(summary.totals.total_accumulated)}</CardTitle>
          </CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Book Value</CardDescription>
            <CardTitle className="text-xl">{fmt(summary.totals.total_book_value)}</CardTitle>
          </CardHeader></Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">Search</Label>
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Name, tag or serial…" />
            </div>
            <div className="w-40">
              <Label className="text-xs">Status</Label>
              <Select value={status || "__all"} onValueChange={(v) => setStatus(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_repair">Under repair</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                  <SelectItem value="written_off">Written off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <Label className="text-xs">Category</Label>
              <Select value={categoryId || "__all"} onValueChange={(v) => setCategoryId(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  {cats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Acquired</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Accum. Dep</TableHead>
                <TableHead className="text-right">Book Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={8}>Loading…</TableCell></TableRow>
              )}
              {!isLoading && (data?.data || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No assets yet. Add your first item to start the register.
                  </TableCell>
                </TableRow>
              )}
              {(data?.data || []).map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => onOpen(a.id)}>
                  <TableCell className="font-mono text-xs">{a.tag_number}</TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.category_name || "—"}</TableCell>
                  <TableCell>{a.acquisition_date}</TableCell>
                  <TableCell className="text-right">{fmt(a.cost)}</TableCell>
                  <TableCell className="text-right">{fmt(a.accumulated_depreciation)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(a.book_value)}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================= NEW / EDIT ========================= */
function AssetFormDialog({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Asset | null;
  onSaved?: (id: string) => void;
}) {
  const { data: cats = [] } = useAssetCategories();
  const { createAsset, updateAsset } = useAssetMutations(editing?.id);
  const [form, setForm] = useState<Partial<Asset>>({});

  useEffect(() => {
    if (open) {
      setForm(editing ? { ...editing } : {
        tag_number: "", name: "", cost: 0, salvage_value: 0,
        acquisition_date: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, editing]);

  const set = (k: keyof Asset, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.tag_number || !form.name || !form.cost) return;
    if (editing) {
      await updateAsset.mutateAsync({ ...form, id: editing.id } as any);
      onOpenChange(false);
    } else {
      const row = await createAsset.mutateAsync(form);
      onOpenChange(false);
      onSaved?.(row.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Asset" : "New Asset"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tag / Asset No.</Label>
            <Input value={form.tag_number || ""} onChange={(e) => set("tag_number", e.target.value)}
              placeholder="e.g. LAB/COMP/001" />
          </div>
          <div className="space-y-2">
            <Label>Serial Number</Label>
            <Input value={form.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Asset Name</Label>
            <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Dell OptiPlex 3080 Desktop" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category_id || ""} onValueChange={(v) => set("category_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Acquisition Date</Label>
            <Input type="date" value={form.acquisition_date || ""}
              onChange={(e) => set("acquisition_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cost (KES)</Label>
            <Input type="number" value={form.cost ?? ""} onChange={(e) => set("cost", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Salvage Value (KES)</Label>
            <Input type="number" value={form.salvage_value ?? ""}
              onChange={(e) => set("salvage_value", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Useful Life (years, optional)</Label>
            <Input type="number" value={form.useful_life_years ?? ""}
              onChange={(e) => set("useful_life_years", e.target.value ? Number(e.target.value) : null)}
              placeholder="Overrides category default" />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={form.location || ""} onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Computer Lab" />
          </div>
          <div className="space-y-2">
            <Label>Purchase Ref</Label>
            <Input value={form.purchase_ref || ""} onChange={(e) => set("purchase_ref", e.target.value)}
              placeholder="LPO / Invoice no." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}
            disabled={!form.tag_number || !form.name || !form.cost || createAsset.isPending || updateAsset.isPending}>
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================== CATEGORIES =========================== */
function CategoriesDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: cats = [] } = useAssetCategories();
  const { createCategory, updateCategory, removeCategory } = useAssetMutations();
  const empty: Partial<AssetCategory> = {
    name: "", useful_life_years: 5, depreciation_method: "straight_line",
  };
  const [form, setForm] = useState<Partial<AssetCategory>>(empty);
  const editing = !!form.id;

  const submit = async () => {
    if (!form.name) return;
    if (editing) await updateCategory.mutateAsync(form as any);
    else await createCategory.mutateAsync(form);
    setForm(empty);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Asset Categories</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-medium">
              {editing ? "Edit category" : "New category"}
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. ICT Equipment" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Useful Life (years)</Label>
                <Input type="number" value={form.useful_life_years ?? 5}
                  onChange={(e) => setForm({ ...form, useful_life_years: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={form.depreciation_method || "straight_line"}
                  onValueChange={(v) => setForm({ ...form, depreciation_method: v as DepMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight_line">Straight Line</SelectItem>
                    <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                    <SelectItem value="none">No Depreciation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.depreciation_method === "reducing_balance" && (
              <div className="space-y-2">
                <Label>Rate (% per year)</Label>
                <Input type="number" value={form.depreciation_rate ?? ""}
                  onChange={(e) => setForm({ ...form, depreciation_rate: Number(e.target.value) })}
                  placeholder="e.g. 20" />
              </div>
            )}
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 mb-1 font-medium text-foreground">
                <Landmark className="h-3.5 w-3.5" /> Chart of Accounts (optional)
              </div>
              Link this category to COA accounts to enable automatic ledger posting
              on depreciation and disposal. Configure account IDs later via the
              Chart of Accounts module.
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={!form.name}>
                {editing ? "Save" : "Add"}
              </Button>
              {editing && (
                <Button variant="ghost" onClick={() => setForm(empty)}>Cancel</Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Existing categories</div>
            <div className="max-h-[400px] overflow-auto rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Life</TableHead>
                    <TableHead className="text-right">Assets</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                        No categories yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {cats.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="capitalize">
                        {c.depreciation_method.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-right">{c.useful_life_years}</TableCell>
                      <TableCell className="text-right">{c.asset_count ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setForm(c)}>Edit</Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => removeCategory.mutate(c.id)}
                          disabled={(c.asset_count ?? 0) > 0}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================ DETAIL ============================ */
function DepreciateDialog({
  open, onOpenChange, assetId,
}: { open: boolean; onOpenChange: (v: boolean) => void; assetId: string }) {
  const { depreciate } = useAssetMutations(assetId);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [manual, setManual] = useState("");
  useEffect(() => {
    if (open) {
      const today = new Date();
      const first = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
      setStart(first); setEnd(last); setManual("");
    }
  }, [open]);
  const submit = async () => {
    await depreciate.mutateAsync({
      period_start: start, period_end: end,
      amount: manual ? Number(manual) : undefined,
    });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Run Depreciation</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Period start</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Period end</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Manual amount (leave blank to auto-compute)</Label>
            <Input type="number" value={manual} onChange={(e) => setManual(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            If the category has COA links, this posts Dr Depreciation Expense /
            Cr Accumulated Depreciation to the General Ledger.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!start || !end || depreciate.isPending}>Post</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MoveDialog({
  open, onOpenChange, assetId,
}: { open: boolean; onOpenChange: (v: boolean) => void; assetId: string }) {
  const { addMovement } = useAssetMutations(assetId);
  const [loc, setLoc] = useState("");
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) { setLoc(""); setReason(""); } }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Movement</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>New Location</Label>
            <Input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. Staffroom" />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            await addMovement.mutateAsync({ to_location: loc, reason });
            onOpenChange(false);
          }} disabled={!loc || addMovement.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DisposeDialog({
  open, onOpenChange, assetId,
}: { open: boolean; onOpenChange: (v: boolean) => void; assetId: string }) {
  const { dispose } = useAssetMutations(assetId);
  const { data: banks = [] } = useBankAccounts({ activeOnly: true });
  const [method, setMethod] = useState("sale");
  const [proceeds, setProceeds] = useState("0");
  const [bankId, setBankId] = useState("");
  const [buyer, setBuyer] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  useEffect(() => {
    if (open) {
      setMethod("sale"); setProceeds("0"); setBankId("");
      setBuyer(""); setReason("");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Dispose Asset</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="write_off">Write-off</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                  <SelectItem value="lost">Lost / Stolen</SelectItem>
                  <SelectItem value="trade_in">Trade-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {method === "sale" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Proceeds (KES)</Label>
                  <Input type="number" value={proceeds}
                    onChange={(e) => setProceeds(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bank account</Label>
                  <Select value={bankId} onValueChange={setBankId}>
                    <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                    <SelectContent>
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Buyer</Label>
                <Input value={buyer} onChange={(e) => setBuyer(e.target.value)} />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Reason / notes</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Any gain/loss vs. book value is auto-calculated. If the category has
            gain/loss COA links, a full disposal entry is posted to the ledger.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={async () => {
            await dispose.mutateAsync({
              method, disposal_date: date,
              proceeds: Number(proceeds || 0),
              bank_account_id: method === "sale" ? bankId : undefined,
              buyer, reason,
            });
            onOpenChange(false);
          }} disabled={dispose.isPending}>Dispose</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssetDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, isLoading } = useAsset(id);
  const { removeAsset } = useAssetMutations(id);
  const [editOpen, setEditOpen] = useState(false);
  const [depOpen, setDepOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [dispOpen, setDispOpen] = useState(false);

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading asset…</div>;
  }

  const disposed = data.status !== "active";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
              <StatusBadge status={data.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {data.tag_number} · {data.category_name || "Uncategorised"}
              {data.location ? ` · ${data.location}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)} disabled={disposed}>Edit</Button>
          <Button variant="outline" onClick={() => setMoveOpen(true)} disabled={disposed}>
            <MoveRight className="mr-2 h-4 w-4" /> Move
          </Button>
          <Button variant="outline" onClick={() => setDepOpen(true)} disabled={disposed}>
            <TrendingDown className="mr-2 h-4 w-4" /> Depreciate
          </Button>
          <Button variant="destructive" onClick={() => setDispOpen(true)} disabled={disposed}>
            <XCircle className="mr-2 h-4 w-4" /> Dispose
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Cost</CardDescription>
          <CardTitle className="text-xl">{fmt(data.cost)}</CardTitle>
        </CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Accum. Dep</CardDescription>
          <CardTitle className="text-xl">{fmt(data.accumulated_depreciation)}</CardTitle>
        </CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Book Value</CardDescription>
          <CardTitle className="text-xl">{fmt(data.book_value)}</CardTitle>
        </CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Acquired</CardDescription>
          <CardTitle className="text-xl">{data.acquisition_date}</CardTitle>
        </CardHeader></Card>
      </div>

      <Tabs defaultValue="depreciation">
        <TabsList>
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="disposal">Disposal</TabsTrigger>
        </TabsList>
        <TabsContent value="depreciation">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Ledger Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.depreciations.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    No depreciation runs yet.
                  </TableCell></TableRow>
                )}
                {data.depreciations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.period_start} → {d.period_end}</TableCell>
                    <TableCell className="capitalize">{d.method.replace("_", " ")}</TableCell>
                    <TableCell className="text-right">{fmt(d.amount)}</TableCell>
                    <TableCell className="font-mono text-xs">{d.posting_ref || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="movements">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.movements.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    No movements recorded.
                  </TableCell></TableRow>
                )}
                {data.movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.movement_date}</TableCell>
                    <TableCell>{m.from_location || "—"}</TableCell>
                    <TableCell>{m.to_location || "—"}</TableCell>
                    <TableCell>{m.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="disposal">
          <Card><CardContent className="pt-6">
            {!data.disposal && (
              <p className="text-sm text-muted-foreground">No disposal recorded.</p>
            )}
            {data.disposal && (
              <dl className="grid gap-3 md:grid-cols-2 text-sm">
                <div><dt className="text-muted-foreground">Date</dt>
                  <dd className="font-medium">{data.disposal.disposal_date}</dd></div>
                <div><dt className="text-muted-foreground">Method</dt>
                  <dd className="font-medium capitalize">{data.disposal.method.replace("_", " ")}</dd></div>
                <div><dt className="text-muted-foreground">Proceeds</dt>
                  <dd className="font-medium">{fmt(data.disposal.proceeds)}</dd></div>
                <div><dt className="text-muted-foreground">Gain / Loss</dt>
                  <dd className={`font-medium ${data.disposal.gain_loss >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {fmt(data.disposal.gain_loss)}
                  </dd></div>
                <div><dt className="text-muted-foreground">Bank</dt>
                  <dd className="font-medium">{data.disposal.bank_account_name || "—"}</dd></div>
                <div><dt className="text-muted-foreground">Buyer</dt>
                  <dd className="font-medium">{data.disposal.buyer || "—"}</dd></div>
                <div className="md:col-span-2">
                  <dt className="text-muted-foreground">Ledger Ref</dt>
                  <dd className="font-mono text-xs">{data.disposal.posting_ref || "(not posted — configure category COA)"}</dd>
                </div>
              </dl>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <AssetFormDialog open={editOpen} onOpenChange={setEditOpen} editing={data as any} />
      <DepreciateDialog open={depOpen} onOpenChange={setDepOpen} assetId={id} />
      <MoveDialog open={moveOpen} onOpenChange={setMoveOpen} assetId={id} />
      <DisposeDialog open={dispOpen} onOpenChange={setDispOpen} assetId={id} />
    </div>
  );
}

/* ============================ SHELL ============================ */
function AssetsInner() {
  const [selected, setSelected] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  return (
    <div className="p-6">
      {selected ? (
        <AssetDetail id={selected} onBack={() => setSelected(null)} />
      ) : (
        <AssetList
          onOpen={setSelected}
          onNew={() => setNewOpen(true)}
          onManageCategories={() => setCatsOpen(true)}
        />
      )}
      <AssetFormDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onSaved={(id) => setSelected(id)}
      />
      <CategoriesDialog open={catsOpen} onOpenChange={setCatsOpen} />
    </div>
  );
}

export default function AssetsPage() {
  return (
    <DashboardLayout>
      <EnterpriseGate>
        <AssetsInner />
      </EnterpriseGate>
    </DashboardLayout>
  );
}