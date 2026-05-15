import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Wallet, Search, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const fmt = (n: number) => `KES ${Math.abs(Number(n) || 0).toLocaleString()}`;

interface ExcessRecord {
  id: string;
  student_id: string;
  amount: number;
  status: string;
  created_at: string;
  ledger_type: string;
  source_payment_id: string | null;
  applied_at: string | null;
  student_name?: string;
  admission_number?: string;
  grade?: string;
}
interface OutstandingFee {
  id: string;
  fee_name: string;
  balance: number;
  amount_due: number;
  amount_paid: number;
  due_date: string | null;
}

export default function ExcessPayments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ExcessRecord | null>(null);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);

  const {
    data: records = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["excess-credits", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      const r = await api.get<ExcessRecord[]>(
        `/finance/excess-credits?${params}`,
      );
      return r || [];
    },
  });

  const { data: fees = [] } = useQuery({
    queryKey: ["student-outstanding", selected?.student_id],
    queryFn: async () =>
      api.get<OutstandingFee[]>(
        `/finance/student-outstanding-fees/${selected!.student_id}`,
      ),
    enabled: !!selected?.student_id && open,
  });

  const applyMut = useMutation({
    mutationFn: (body: { fee_ids: string[] }) =>
      api.post(`/finance/excess-credits/${selected!.id}/apply`, body),
    onSuccess: (res: any) => {
      toast.success(`Applied ${fmt(res.applied || 0)}`);
      qc.invalidateQueries({ queryKey: ["excess-credits"] });
      qc.invalidateQueries({ queryKey: ["student-fees-list"] });
      qc.invalidateQueries({ queryKey: ["fee-assignments"] });
      setOpen(false);
      setSelected(null);
      setSelectedFeeIds([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return records;
    return records.filter(
      (r) =>
        (r.student_name || "").toLowerCase().includes(s) ||
        (r.admission_number || "").toLowerCase().includes(s),
    );
  }, [records, search]);

  const totals = useMemo(() => {
    const pending = records.filter((r) => r.status === "pending");
    return {
      pendingAmount: pending.reduce((s, r) => s + Number(r.amount), 0),
      pendingCount: pending.length,
      total: records.length,
    };
  }, [records]);

  return (
    <DashboardLayout title="Excess Payments">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Excess Payments
            </h1>
            <p className="text-muted-foreground">
              Advance credits from overpayments — apply to outstanding fees.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Pending Credit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{fmt(totals.pendingAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" /> Pending Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totals.pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totals.total}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <CardTitle>Excess Credit Records</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student..."
                    className="pl-8 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Adm No</TableHead>
                  <TableHead>Ledger</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No excess credits found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.student_name || r.student_id}
                      </TableCell>
                      <TableCell>{r.admission_number || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.ledger_type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {fmt(r.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "applied"
                              ? "default"
                              : r.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelected(r);
                              setSelectedFeeIds([]);
                              setOpen(true);
                            }}
                          >
                            Apply
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
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Apply Excess Credit · {fmt(selected?.amount || 0)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select fees to apply this credit to. Leave empty to auto-apply
              (FIFO) to all outstanding fees.
            </p>
            <div className="border rounded-md max-h-72 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No outstanding fees.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fees.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedFeeIds.includes(f.id)}
                            onCheckedChange={(v) => {
                              setSelectedFeeIds((prev) =>
                                v
                                  ? [...prev, f.id]
                                  : prev.filter((x) => x !== f.id),
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell>{f.fee_name}</TableCell>
                        <TableCell>{fmt(f.amount_due)}</TableCell>
                        <TableCell>{fmt(f.amount_paid)}</TableCell>
                        <TableCell className="font-semibold">
                          {fmt(f.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={applyMut.isPending || fees.length === 0}
              onClick={() => applyMut.mutate({ fee_ids: selectedFeeIds })}
            >
              {selectedFeeIds.length
                ? `Apply to ${selectedFeeIds.length} fee(s)`
                : "Auto-apply (FIFO)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
