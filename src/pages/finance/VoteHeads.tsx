import { useMemo, useState } from "react";
import { useVoteHeads, useVoteHeadMutations, type VoteHead } from "@/hooks/useVoteHeads";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AllocationRulesCard } from "@/components/finance/AllocationRulesCard";
import { useChartOfAccounts } from "@/hooks/useAccounting";

interface FormState {
  id?: string;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  coa_income_account_id: string;
  coa_expense_account_id: string;
}

const AUTO = "__auto__";

const empty: FormState = {
  code: "",
  name: "",
  description: "",
  is_active: true,
  coa_income_account_id: AUTO,
  coa_expense_account_id: AUTO,
};

function VoteHeadsInner() {
  const { data, isLoading } = useVoteHeads();
  const { create, update, remove } = useVoteHeadMutations();
  const { data: coa } = useChartOfAccounts();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const incomeAccounts = useMemo(
    () => (coa ?? []).filter((a) => a.type === "income" && a.is_active),
    [coa],
  );
  const expenseAccounts = useMemo(
    () => (coa ?? []).filter((a) => a.type === "expense" && a.is_active),
    [coa],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(
      (v) =>
        v.code.toLowerCase().includes(term) ||
        v.name.toLowerCase().includes(term),
    );
  }, [data, q]);

  const startNew = () => {
    setForm(empty);
    setOpen(true);
  };
  const startEdit = (v: VoteHead) => {
    setForm({
      id: v.id,
      code: v.code,
      name: v.name,
      description: v.description ?? "",
      is_active: !!v.is_active,
      coa_income_account_id: v.coa_income_account_id ?? AUTO,
      coa_expense_account_id: v.coa_expense_account_id ?? AUTO,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    const body = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
      coa_income_account_id:
        form.coa_income_account_id === AUTO ? null : form.coa_income_account_id,
      coa_expense_account_id:
        form.coa_expense_account_id === AUTO ? null : form.coa_expense_account_id,
    };
    if (form.id) {
      await update.mutateAsync({ id: form.id, ...body });
    } else {
      await create.mutateAsync(body);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vote Heads</h1>
          <p className="text-sm text-muted-foreground">
            Accounting dimensions used by fee structures, expenses, vouchers,
            capitation and budgets. Deactivate rather than delete once in use.
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="mr-2 h-4 w-4" /> New Vote Head
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>All vote heads</CardTitle>
            <CardDescription>
              {rows.length} total{q ? ` matching "${q}"` : ""}
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search code or name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Income account</TableHead>
                <TableHead>Expense account</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No vote heads yet. Create one to start posting fees against it.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-sm">{v.code}</TableCell>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.description || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {v.income_account_code ? (
                        <span>
                          <span className="font-mono">{v.income_account_code}</span>{" "}
                          <span className="text-muted-foreground">
                            {v.income_account_name}
                          </span>
                        </span>
                      ) : (
                        <Badge variant="outline">Auto on first posting</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {v.expense_account_code ? (
                        <span>
                          <span className="font-mono">{v.expense_account_code}</span>{" "}
                          <span className="text-muted-foreground">
                            {v.expense_account_name}
                          </span>
                        </span>
                      ) : (
                        <Badge variant="outline">Auto on first posting</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(v)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete vote head "${v.name}"?`)) {
                            remove.mutate(v.id);
                          }
                        }}
                        aria-label="Delete"
                        disabled={!!v.is_system}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit vote head" : "New vote head"}</DialogTitle>
            <DialogDescription>
              Vote heads categorise every shilling that flows through the
              school. Code is a short identifier (e.g. TUIT, BOARD, ACT).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="TUIT"
                  maxLength={30}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tuition"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Income account</Label>
                <Select
                  value={form.coa_income_account_id}
                  onValueChange={(v) => setForm({ ...form, coa_income_account_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-create on first posting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO}>Auto-create on first posting</SelectItem>
                    {incomeAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.account_code} — {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expense account</Label>
                <Select
                  value={form.coa_expense_account_id}
                  onValueChange={(v) => setForm({ ...form, coa_expense_account_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-create on first posting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO}>Auto-create on first posting</SelectItem>
                    {expenseAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.account_code} — {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Leave on auto and the system provisions a 41xx income / 51xx expense
                account named after this vote head the first time it is posted.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-muted-foreground">
                  Inactive vote heads are hidden from selectors but stay on historical records.
                </div>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!form.code.trim() || !form.name.trim() || create.isPending || update.isPending}
            >
              {form.id ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AllocationRulesCard />
    </div>
  );
}

export default function VoteHeadsPage() {
  return (
    <DashboardLayout>
      <EnterpriseGate>
        <VoteHeadsInner />
      </EnterpriseGate>
    </DashboardLayout>
  );
}