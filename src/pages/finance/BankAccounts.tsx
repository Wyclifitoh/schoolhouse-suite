import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EnterpriseGate } from "@/components/enterprise/EnterpriseGate";
import {
  useBankAccounts,
  useBankAccountMutations,
  type BankAccount,
} from "@/hooks/useBankAccounts";
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
import { Plus, Pencil, Trash2, Landmark } from "lucide-react";

interface FormState {
  id?: string;
  name: string;
  bank_name: string;
  branch: string;
  account_number: string;
  currency: string;
  account_type: "bank" | "cash" | "mobile_money";
  opening_balance: string;
  is_default: boolean;
  is_active: boolean;
}

const emptyForm: FormState = {
  name: "",
  bank_name: "",
  branch: "",
  account_number: "",
  currency: "KES",
  account_type: "bank",
  opening_balance: "0",
  is_default: false,
  is_active: true,
};

function BankAccountsInner() {
  const { data = [], isLoading } = useBankAccounts();
  const { create, update, remove } = useBankAccountMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openNew = () => {
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (row: BankAccount) => {
    setForm({
      id: row.id,
      name: row.name,
      bank_name: row.bank_name || "",
      branch: row.branch || "",
      account_number: row.account_number || "",
      currency: row.currency || "KES",
      account_type: row.account_type,
      opening_balance: String(row.opening_balance ?? 0),
      is_default: !!row.is_default,
      is_active: !!row.is_active,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      opening_balance: Number(form.opening_balance || 0),
    };
    if (form.id) await update.mutateAsync({ id: form.id, ...payload });
    else await create.mutateAsync(payload);
    setOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="h-6 w-6" /> Bank Accounts
          </h1>
          <p className="text-muted-foreground">
            Every receipt and payment references a bank or cash account.
            Used for the Cash Book, bank reconciliation, and ledger postings.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> New Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
          <CardDescription>
            Mark one bank/cash account as default for one-click receipting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Bank / Branch</TableHead>
                <TableHead>Account #</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7}>Loading…</TableCell>
                </TableRow>
              )}
              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No bank accounts yet. Add your first one.
                  </TableCell>
                </TableRow>
              )}
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {row.name}
                    {row.is_default ? (
                      <Badge variant="secondary">Default</Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="capitalize">
                    {String(row.account_type).replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    {row.bank_name || "—"}
                    {row.branch ? ` / ${row.branch}` : ""}
                  </TableCell>
                  <TableCell>{row.account_number || "—"}</TableCell>
                  <TableCell>
                    {row.currency} {Number(row.opening_balance || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.is_active ? "default" : "outline"}>
                      {row.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete ${row.name}?`)) remove.mutate(row.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Bank Account" : "New Bank Account"}</DialogTitle>
            <DialogDescription>
              Give the account a clear label (e.g. "Equity Main Account").
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.account_type}
                onValueChange={(v) => setForm({ ...form, account_type: v as FormState["account_type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cash">Cash on Hand</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Branch</Label>
              <Input
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                value={form.account_number}
                onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              />
            </div>
            <div>
              <Label>Opening Balance</Label>
              <Input
                type="number"
                value={form.opening_balance}
                onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 col-span-2">
              <Switch
                checked={form.is_default}
                onCheckedChange={(v) => setForm({ ...form, is_default: v })}
              />
              <Label>Default account for new receipts</Label>
            </div>
            <div className="flex items-center gap-3 col-span-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              {form.id ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BankAccountsPage() {
  return (
    <DashboardLayout>
      <EnterpriseGate>
        <BankAccountsInner />
      </EnterpriseGate>
    </DashboardLayout>
  );
}