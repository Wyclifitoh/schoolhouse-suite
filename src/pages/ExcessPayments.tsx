import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, Search, ArrowRight, CheckCircle, Clock, Banknote,
  RefreshCw, AlertCircle, User, ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

const formatKES = (amount: number) => `KES ${Math.abs(amount).toLocaleString()}`;

interface ExcessRecord {
  id: string;
  student_id: string;
  school_id: string;
  ledger_type: string;
  from_term_id: string | null;
  to_term_id: string | null;
  amount: number;
  type: string;
  status: string;
  source_payment_id: string | null;
  applied_at: string | null;
  created_at: string;
  student_name?: string;
  admission_number?: string;
  grade?: string;
}

interface OutstandingFee {
  id: string;
  fee_name: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  status: string;
  ledger_type: string;
  due_date: string | null;
}

const ExcessPayments = () => {
  const { user } = useAuth();
  const { currentSchool } = useSchool();
  const [loading, setLoading] = useState(true);
  const [excessRecords, setExcessRecords] = useState<ExcessRecord[]>([]);
  const [search, setSearch] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Allocation dialog
  const [allocateDialog, setAllocateDialog] = useState(false);
  const [selectedExcess, setSelectedExcess] = useState<ExcessRecord | null>(null);
  const [outstandingFees, setOutstandingFees] = useState<OutstandingFee[]>([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [allocating, setAllocating] = useState(false);
  const [allocMode, setAllocMode] = useState<"auto" | "manual">("auto");

  const schoolId = currentSchool?.id;

  const fetchExcessRecords = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fee_carry_forwards")
        .select("*")
        .eq("school_id", schoolId)
        .eq("type", "advance_credit")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch student names
      const studentIds = [...new Set((data || []).map(d => d.student_id))];
      let studentsMap: Record<string, { full_name: string | null; admission_number: string; current_grade_id: string | null }> = {};
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("id, full_name, admission_number, current_grade_id")
          .in("id", studentIds);
        students?.forEach(s => { studentsMap[s.id] = s; });
      }

      const enriched: ExcessRecord[] = (data || []).map(d => ({
        ...d,
        student_name: studentsMap[d.student_id]?.full_name || "Unknown",
        admission_number: studentsMap[d.student_id]?.admission_number || "",
        grade: studentsMap[d.student_id]?.current_grade_id || "",
      }));

      setExcessRecords(enriched);
    } catch (err: any) {
      toast.error("Failed to load excess payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExcessRecords(); }, [schoolId]);

  const filtered = useMemo(() => {
    return excessRecords.filter(r => {
      const matchesSearch = !search ||
        r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.admission_number?.toLowerCase().includes(search.toLowerCase());
      const matchesLedger = ledgerFilter === "all" || r.ledger_type === ledgerFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesLedger && matchesStatus;
    });
  }, [excessRecords, search, ledgerFilter, statusFilter]);

  const totalPending = useMemo(
    () => filtered.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0),
    [filtered]
  );
  const totalApplied = useMemo(
    () => filtered.filter(r => r.status === "applied").reduce((s, r) => s + r.amount, 0),
    [filtered]
  );
  const pendingCount = filtered.filter(r => r.status === "pending").length;
  const appliedCount = filtered.filter(r => r.status === "applied").length;

  const openAllocateDialog = async (record: ExcessRecord) => {
    setSelectedExcess(record);
    setSelectedFeeIds([]);
    setAllocMode("auto");

    // Fetch outstanding fees for this student
    try {
      const { data, error } = await supabase
        .from("student_fees")
        .select("id, amount_due, amount_paid, balance, status, ledger_type, due_date, fee_template_id")
        .eq("student_id", record.student_id)
        .eq("school_id", schoolId!)
        .gt("balance", 0)
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Get fee names
      const templateIds = [...new Set((data || []).map(d => d.fee_template_id))];
      let templateMap: Record<string, string> = {};
      if (templateIds.length > 0) {
        const { data: templates } = await supabase
          .from("fee_templates")
          .select("id, name")
          .in("id", templateIds);
        templates?.forEach(t => { templateMap[t.id] = t.name; });
      }

      setOutstandingFees((data || []).map(f => ({
        ...f,
        fee_name: templateMap[f.fee_template_id] || "Unknown Fee",
      })));
    } catch {
      toast.error("Failed to load outstanding fees");
      setOutstandingFees([]);
    }

    setAllocateDialog(true);
  };

  const handleAllocate = async () => {
    if (!selectedExcess || !schoolId || !user) return;
    setAllocating(true);

    try {
      const feesToAllocate = allocMode === "auto"
        ? outstandingFees
        : outstandingFees.filter(f => selectedFeeIds.includes(f.id));

      if (feesToAllocate.length === 0) {
        toast.error("No fees selected for allocation");
        setAllocating(false);
        return;
      }

      let remaining = selectedExcess.amount;
      const allocations: { fee_id: string; amount: number }[] = [];

      for (const fee of feesToAllocate) {
        if (remaining <= 0) break;
        const allocAmount = Math.min(remaining, fee.balance);
        allocations.push({ fee_id: fee.id, amount: allocAmount });
        remaining -= allocAmount;
      }

      // Apply each allocation via increment_fee_payment RPC
      for (const alloc of allocations) {
        await supabase.rpc("increment_fee_payment", {
          fee_id: alloc.fee_id,
          payment_amount: alloc.amount,
        });
      }

      // Update carry forward status
      if (remaining <= 0) {
        // Fully consumed
        await supabase
          .from("fee_carry_forwards")
          .update({ status: "applied", applied_at: new Date().toISOString() })
          .eq("id", selectedExcess.id);
      } else {
        // Partially consumed — update amount to remainder
        await supabase
          .from("fee_carry_forwards")
          .update({ amount: remaining })
          .eq("id", selectedExcess.id);
      }

      // Audit log
      await supabase.from("finance_audit_logs").insert({
        school_id: schoolId,
        action: "ADVANCE_CREDIT_CREATED",
        entity_type: "carry_forward",
        entity_id: selectedExcess.id,
        student_id: selectedExcess.student_id,
        amount_affected: selectedExcess.amount - remaining,
        performed_by: user.id,
        metadata: {
          allocations,
          remaining_excess: remaining,
          mode: allocMode,
        },
      });

      toast.success(`Allocated ${formatKES(selectedExcess.amount - remaining)} from excess to fees`);
      setAllocateDialog(false);
      fetchExcessRecords();
    } catch (err: any) {
      toast.error(err.message || "Allocation failed");
    } finally {
      setAllocating(false);
    }
  };

  const toggleFeeSelection = (feeId: string) => {
    setSelectedFeeIds(prev =>
      prev.includes(feeId) ? prev.filter(id => id !== feeId) : [...prev, feeId]
    );
  };

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge className="bg-warning/10 text-warning border-0"><Clock className="h-3 w-3 mr-1" />Available</Badge>;
    if (status === "applied") return <Badge className="bg-success/10 text-success border-0"><CheckCircle className="h-3 w-3 mr-1" />Applied</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <DashboardLayout title="Excess Payments" subtitle="Manage advance credits and overpayments across all ledgers">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Wallet className="h-5 w-5 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Available Excess</p><p className="text-2xl font-bold text-foreground">{formatKES(totalPending)}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Applied</p><p className="text-2xl font-bold text-foreground">{formatKES(totalApplied)}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Clock className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Pending Records</p><p className="text-2xl font-bold text-foreground">{pendingCount}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Banknote className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="text-sm text-muted-foreground">Applied Records</p><p className="text-2xl font-bold text-foreground">{appliedCount}</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-primary" />Excess Payment Records
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search student..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={ledgerFilter} onValueChange={setLedgerFilter}>
                  <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ledgers</SelectItem>
                    <SelectItem value="fees">Fees</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Available</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchExcessRecords}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs">Student</TableHead>
                    <TableHead className="font-semibold text-xs">Admission No.</TableHead>
                    <TableHead className="font-semibold text-xs">Ledger</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Excess Amount</TableHead>
                    <TableHead className="font-semibold text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-xs">Date</TableHead>
                    <TableHead className="font-semibold text-xs w-32">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading excess payments...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Wallet className="h-8 w-8 mx-auto mb-2 opacity-40" />No excess payment records found
                    </TableCell></TableRow>
                  ) : filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.student_name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.admission_number}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{r.ledger_type}</Badge></TableCell>
                      <TableCell className="text-right font-bold text-success">{formatKES(r.amount)}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openAllocateDialog(r)}>
                            <ArrowRight className="h-3 w-3 mr-1" />Allocate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Allocation Dialog */}
      <Dialog open={allocateDialog} onOpenChange={setAllocateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Allocate Excess to Fees
            </DialogTitle>
          </DialogHeader>

          {selectedExcess && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{selectedExcess.student_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedExcess.admission_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Available Excess</p>
                  <p className="text-lg font-bold text-success">{formatKES(selectedExcess.amount)}</p>
                </div>
              </div>

              {/* Allocation Mode */}
              <Tabs value={allocMode} onValueChange={v => setAllocMode(v as "auto" | "manual")}>
                <TabsList className="w-full">
                  <TabsTrigger value="auto" className="flex-1">FIFO Auto-Allocate</TabsTrigger>
                  <TabsTrigger value="manual" className="flex-1">Manual Select</TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="mt-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    The excess will be applied to outstanding fees automatically, oldest fees first (FIFO).
                  </p>
                </TabsContent>

                <TabsContent value="manual" className="mt-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Select specific fees to apply the excess to:
                  </p>
                </TabsContent>
              </Tabs>

              {/* Outstanding Fees List */}
              {outstandingFees.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No outstanding fees for this student</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        {allocMode === "manual" && <TableHead className="w-8" />}
                        <TableHead className="font-semibold text-xs">Fee</TableHead>
                        <TableHead className="font-semibold text-xs">Ledger</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstandingFees.map(f => (
                        <TableRow
                          key={f.id}
                          className={allocMode === "manual" ? "cursor-pointer hover:bg-muted/50" : ""}
                          onClick={() => allocMode === "manual" && toggleFeeSelection(f.id)}
                        >
                          {allocMode === "manual" && (
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedFeeIds.includes(f.id)}
                                onChange={() => toggleFeeSelection(f.id)}
                                className="rounded"
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-sm">{f.fee_name}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize text-[10px]">{f.ledger_type}</Badge></TableCell>
                          <TableCell className="text-right font-semibold text-destructive">{formatKES(f.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Allocation Preview */}
              {outstandingFees.length > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Excess Available</span>
                    <span className="font-semibold text-success">{formatKES(selectedExcess.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Outstanding</span>
                    <span className="font-semibold text-destructive">
                      {formatKES(
                        (allocMode === "auto"
                          ? outstandingFees
                          : outstandingFees.filter(f => selectedFeeIds.includes(f.id))
                        ).reduce((s, f) => s + f.balance, 0)
                      )}
                    </span>
                  </div>
                  {(() => {
                    const targetFees = allocMode === "auto"
                      ? outstandingFees
                      : outstandingFees.filter(f => selectedFeeIds.includes(f.id));
                    const totalTarget = targetFees.reduce((s, f) => s + f.balance, 0);
                    const willApply = Math.min(selectedExcess.amount, totalTarget);
                    const newExcess = selectedExcess.amount - willApply;
                    return (
                      <>
                        <div className="flex justify-between border-t pt-1 mt-1">
                          <span className="font-semibold">Will Apply</span>
                          <span className="font-bold text-primary">{formatKES(willApply)}</span>
                        </div>
                        {newExcess > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining Excess</span>
                            <span className="font-semibold text-success">{formatKES(newExcess)}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocateDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAllocate}
              disabled={allocating || outstandingFees.length === 0 || (allocMode === "manual" && selectedFeeIds.length === 0)}
            >
              {allocating ? "Allocating..." : "Apply Excess to Fees"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ExcessPayments;
