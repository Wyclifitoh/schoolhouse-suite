import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CreditCard,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Settings,
  Wallet,
} from "lucide-react";
import {
  useExternalTopupSms,
  useRetrySms,
  useSetSmsAccount,
  useSmsMessages,
  useSmsOverview,
  useSmsSchoolBalances,
  type SmsSchoolBalance,
} from "@/hooks/usePlatform";
import { toast } from "@/hooks/use-toast";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString();

export default function AdminSmsOps() {
  const overview = useSmsOverview();
  const [search, setSearch] = useState("");
  const balances = useSmsSchoolBalances(search);
  const [selected, setSelected] = useState<SmsSchoolBalance | null>(null);
  const [failedOnly, setFailedOnly] = useState(true);
  const messages = useSmsMessages({
    status: failedOnly ? "failed" : undefined,
  });

  const [accountOpen, setAccountOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);

  const retry = useRetrySms();
  const setAccount = useSetSmsAccount();
  const externalTopup = useExternalTopupSms();

  const stats = overview.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary">
            Platform
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight mt-1 flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" />
            SMS Operations
          </h1>
          <p className="text-muted-foreground mt-1">
            Live balances from the external gateway (wikiteq.co.ke · sender ID{" "}
            <span className="font-mono">CHUOFLOW</span>), per-school top-ups and
            failed-queue control.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            overview.refetch();
            balances.refetch();
          }}
          disabled={overview.isFetching || balances.isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${
              overview.isFetching || balances.isFetching ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total balance"
          value={fmt(stats?.totals.total_balance)}
          hint={`${fmt(stats?.totals.schools_tracked)} schools tracked live`}
        />
        <KpiCard
          icon={<Send className="h-4 w-4" />}
          label="Sent · 24h"
          value={fmt(stats?.messages.sent_24h)}
          hint={`${fmt(stats?.messages.sent_30d)} in last 30d`}
          tone="success"
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Failed · 24h"
          value={fmt(stats?.messages.failed_24h)}
          hint={`${fmt(stats?.messages.failed_total)} total unresolved`}
          tone="danger"
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Low-balance schools"
          value={fmt(stats?.totals.low_balance_schools)}
          hint="below 50 credits"
          tone="warning"
        />
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Delivery trend · last 14 days
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {overview.isLoading ? (
            <div className="h-full grid place-items-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="d" tickFormatter={(v) => String(v).slice(5)} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="failed">Failed queue</TabsTrigger>
          <TabsTrigger value="low">Low balance</TabsTrigger>
        </TabsList>

        {/* BALANCES */}
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">
                  School balances (live)
                </CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search schools…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Gateway account</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Sent 30d</TableHead>
                    <TableHead className="text-right">Failed 30d</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : !balances.data?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No schools found
                      </TableCell>
                    </TableRow>
                  ) : (
                    balances.data.map((r) => (
                      <TableRow key={r.school_id}>
                        <TableCell>
                          <div className="font-medium">{r.name}</div>
                          {r.code && (
                            <div className="text-xs text-muted-foreground">
                              {r.code}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-mono">
                            uid:{" "}
                            {r.sms_user_id ? (
                              r.sms_user_id
                            ) : (
                              <span className="text-destructive">unset</span>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            paybill acct: {r.sms_paybill_account || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {r.balance_available === false || !r.sms_user_id ? (
                            <span className="text-muted-foreground text-xs">
                              n/a
                            </span>
                          ) : (
                            <span
                              className={
                                r.balance < 50
                                  ? "text-destructive"
                                  : r.balance < 200
                                    ? "text-amber-600"
                                    : ""
                              }
                            >
                              {fmt(r.balance)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {fmt(r.sent_30d)}
                        </TableCell>
                        <TableCell className="text-right">
                          {fmt(r.failed_30d)}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(r);
                              setAccountOpen(true);
                            }}
                          >
                            <Settings className="h-3.5 w-3.5 mr-1" /> Account
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelected(r);
                              setTopupOpen(true);
                            }}
                            disabled={!r.sms_user_id}
                            title={
                              r.sms_user_id ? "" : "Set gateway userId first"
                            }
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" /> Top-up
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAILED QUEUE */}
        <TabsContent value="failed">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent messages</CardTitle>
                <Select
                  value={failedOnly ? "failed" : "all"}
                  onValueChange={(v) => setFailedOnly(v === "failed")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="failed">Failed only</SelectItem>
                    <SelectItem value="all">All statuses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : !messages.data?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nothing to show
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages.data.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(m.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.school_name}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{m.to_phone}</div>
                          {m.recipient_name && (
                            <div className="text-xs text-muted-foreground">
                              {m.recipient_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              m.status === "sent"
                                ? "default"
                                : m.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {m.error_message || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.status === "failed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={retry.isPending}
                              onClick={() =>
                                retry.mutate(m.id, {
                                  onSuccess: () =>
                                    toast({ title: "Message re-queued" }),
                                  onError: (e: any) =>
                                    toast({
                                      title: "Retry failed",
                                      description: e?.message,
                                      variant: "destructive",
                                    }),
                                })
                              }
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOW BALANCE */}
        <TabsContent value="low">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Low-balance schools</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!stats?.lowBalance?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No low-balance schools
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.lowBalance.map((r) => {
                      const bal = balances.data?.find(
                        (b) => b.school_id === r.school_id,
                      );
                      return (
                        <TableRow key={r.school_id}>
                          <TableCell className="font-medium">
                            {r.name}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-destructive">
                            {fmt(r.balance)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (bal) {
                                  setSelected(bal);
                                  setTopupOpen(true);
                                }
                              }}
                              disabled={!bal?.sms_user_id}
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1" /> Top up
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AccountDialog
        open={accountOpen}
        school={selected}
        pending={setAccount.isPending}
        onClose={() => setAccountOpen(false)}
        onSubmit={(sms_user_id, sms_paybill_account) => {
          if (!selected) return;
          setAccount.mutate(
            { id: selected.school_id, sms_user_id, sms_paybill_account },
            {
              onSuccess: () => {
                toast({ title: "SMS account updated" });
                setAccountOpen(false);
              },
              onError: (e: any) =>
                toast({
                  title: "Update failed",
                  description: e?.message,
                  variant: "destructive",
                }),
            },
          );
        }}
      />

      <ExternalTopupDialog
        open={topupOpen}
        school={selected}
        pending={externalTopup.isPending}
        onClose={() => setTopupOpen(false)}
        onSubmit={(amount, reference, note) => {
          if (!selected) return;
          externalTopup.mutate(
            { id: selected.school_id, amount, reference, note },
            {
              onSuccess: () => {
                toast({ title: `Top-up sent: +${amount} credits` });
                setTopupOpen(false);
              },
              onError: (e: any) =>
                toast({
                  title: "Top-up failed",
                  description: e?.message,
                  variant: "destructive",
                }),
            },
          );
        }}
      />
    </div>
  );
}

function AccountDialog({
  open,
  school,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  school: SmsSchoolBalance | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (sms_user_id: string, sms_paybill_account: string | null) => void;
}) {
  const [userId, setUserId] = useState("");
  const [account, setAccount] = useState("");
  useEffect(() => {
    if (open && school) {
      setUserId(school.sms_user_id || "");
      setAccount(school.sms_paybill_account || "");
    }
  }, [open, school]);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure SMS account</DialogTitle>
          <DialogDescription>
            External SMS gateway credentials for <b>{school?.name}</b>. Sender
            ID is shared (<span className="font-mono">CHUOFLOW</span>); the
            userId identifies this school's account at wikiteq.co.ke. The
            paybill account is what parents type when topping up via M-Pesa
            paybill 4116251.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>External userId</Label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 4"
            />
          </div>
          <div>
            <Label>Paybill account number</Label>
            <Input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="e.g. EAGLES"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(userId.trim(), account.trim() || null)}
            disabled={pending}
          >
            {pending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExternalTopupDialog({
  open,
  school,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  school: SmsSchoolBalance | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (amount: number, reference: string, note: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (open) {
      setAmount("");
      setReference("");
      setNote("");
    }
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>External SMS top-up</DialogTitle>
          <DialogDescription>
            Credit <b>{school?.name}</b>'s external SMS account (userId{" "}
            <span className="font-mono">{school?.sms_user_id}</span>). This
            calls the wikiteq gateway directly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount (credits)</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
            />
          </div>
          <div>
            <Label>Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="M-Pesa code / invoice #"
            />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit(Number(amount), reference.trim(), note.trim())
            }
            disabled={pending || !Number(amount)}
          >
            {pending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            Top up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "success" | "danger" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "danger"
        ? "text-destructive"
        : tone === "warning"
          ? "text-amber-600"
          : "text-primary";
  return (
    <Card>
      <CardContent className="p-5">
        <div
          className={`flex items-center gap-2 text-xs font-medium ${toneClass}`}
        >
          {icon}
          <span className="uppercase tracking-wide">{label}</span>
        </div>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
        {hint && (
          <div className="text-xs text-muted-foreground mt-1">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}
