/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Wallet, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/date";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

export const PettyCashTab = ({ schoolId }: { schoolId?: string }) => {
  const qc = useQueryClient();
  const [acctOpen, setAcctOpen] = useState(false);
  const [txnOpen, setTxnOpen] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["petty-cash-accounts", schoolId],
    queryFn: () => api.get<any[]>("/expenses/petty-cash/accounts"),
    enabled: !!schoolId,
  });
  const { data: txns = [] } = useQuery({
    queryKey: ["petty-cash-txns", schoolId],
    queryFn: () => api.get<any[]>("/expenses/petty-cash/transactions"),
    enabled: !!schoolId,
  });

  const saveAcct = useMutation({
    mutationFn: (d: any) => api.post("/expenses/petty-cash/accounts", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["petty-cash-accounts"] });
      toast.success("Account created");
      setAcctOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delAcct = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/petty-cash/accounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["petty-cash-accounts"] }),
  });
  const saveTxn = useMutation({
    mutationFn: (d: any) => api.post("/expenses/petty-cash/transactions", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["petty-cash-txns"] });
      qc.invalidateQueries({ queryKey: ["petty-cash-accounts"] });
      toast.success("Transaction recorded");
      setTxnOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalFloat = accounts.reduce((s: number, a: any) => s + Number(a.float_amount || 0), 0);
  const totalBalance = accounts.reduce((s: number, a: any) => s + Number(a.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" /></div>
          <div><p className="text-sm text-muted-foreground">Accounts</p>
            <p className="text-2xl font-bold">{accounts.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Total Float</p>
          <p className="text-2xl font-bold">{formatKES(totalFloat)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold text-success">{formatKES(totalBalance)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Petty Cash Accounts</CardTitle>
            <div className="flex gap-2">
              <Dialog open={txnOpen} onOpenChange={setTxnOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={accounts.length === 0}>
                    <Plus className="h-4 w-4 mr-1.5" />Record Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Record Petty Cash Transaction</DialogTitle></DialogHeader>
                  <TxnForm accounts={accounts} onSave={(d: any) => saveTxn.mutate(d)} onClose={() => setTxnOpen(false)} />
                </DialogContent>
              </Dialog>
              <Dialog open={acctOpen} onOpenChange={setAcctOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New Account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Petty Cash Account</DialogTitle></DialogHeader>
                  <AcctForm onSave={(d: any) => saveAcct.mutate(d)} onClose={() => setAcctOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Name</TableHead><TableHead>Float</TableHead>
              <TableHead>Balance</TableHead><TableHead>Status</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {accounts.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No petty cash accounts yet</TableCell></TableRow>
              )}
              {accounts.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{formatKES(a.float_amount)}</TableCell>
                  <TableCell className={Number(a.balance) < Number(a.float_amount) * 0.2 ? "text-destructive font-semibold" : "font-semibold"}>
                    {formatKES(a.balance)}
                  </TableCell>
                  <TableCell><Badge variant={a.is_active ? "default" : "secondary"}>{a.is_active ? "Active" : "Closed"}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => delAcct.mutate(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Date</TableHead><TableHead>Account</TableHead>
              <TableHead>Type</TableHead><TableHead>Amount</TableHead>
              <TableHead>Description</TableHead><TableHead>Reference</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {txns.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No transactions yet</TableCell></TableRow>
              )}
              {txns.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground">{formatDate(t.txn_date)}</TableCell>
                  <TableCell>{t.account_name || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{t.txn_type}</Badge></TableCell>
                  <TableCell className={t.txn_type === "spend" ? "font-semibold text-destructive" : "font-semibold text-success"}>
                    {t.txn_type === "spend" ? "−" : "+"}{formatKES(t.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.description || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.reference || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const AcctForm = ({ onSave, onClose }: any) => {
  const [name, setName] = useState("");
  const [floatAmount, setFloatAmount] = useState("0");
  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2"><Label>Account Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Office Float" /></div>
      <div className="space-y-2"><Label>Initial Float (KES)</Label>
        <Input type="number" value={floatAmount} onChange={(e) => setFloatAmount(e.target.value)} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => {
          if (!name) { toast.error("Name required"); return; }
          onSave({ name, float_amount: Number(floatAmount) });
        }}>Create</Button>
      </DialogFooter>
    </div>
  );
};

const TxnForm = ({ accounts, onSave, onClose }: any) => {
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [type, setType] = useState("spend");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Account *</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="issue">Issue Voucher</SelectItem>
              <SelectItem value="spend">Spend</SelectItem>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="topup">Top-up</SelectItem>
              <SelectItem value="reconcile">Reconcile (set balance)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Amount (KES) *</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="space-y-2"><Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label>Reference</Label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Voucher / receipt" /></div>
      <div className="space-y-2"><Label>Description</Label>
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => {
          if (!accountId || !amount) { toast.error("Account and amount required"); return; }
          onSave({
            account_id: accountId, txn_type: type, amount: Number(amount),
            description, reference, txn_date: date,
          });
        }}>Record</Button>
      </DialogFooter>
    </div>
  );
};