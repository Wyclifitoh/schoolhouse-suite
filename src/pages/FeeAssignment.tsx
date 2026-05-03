import { useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useStudents } from "@/hooks/useStudents";
import { useFeeStructures, useFeeDiscounts, useFeeAssignments, useBulkAssignFee, useBulkUnassignFee } from "@/hooks/useFinance";
import { useClasses, useStreams } from "@/hooks/useClasses";
import { useTerm } from "@/contexts/TermContext";
import {
  Search, Users, CheckCircle, ListChecks, Banknote, Percent, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const FeeAssignment = () => {
  const { selectedTerm, currentAcademicYear } = useTerm();
  const [selectedFee, setSelectedFee] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [streamFilters, setStreamFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [originallyAssigned, setOriginallyAssigned] = useState<Set<string>>(new Set());
  const [paidLocked, setPaidLocked] = useState<Set<string>>(new Set());
  const [selectedDiscount, setSelectedDiscount] = useState("none");
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: feeStructures = [], isLoading: structuresLoading } = useFeeStructures();
  const { data: feeDiscounts = [] } = useFeeDiscounts();
  const { data: classes = [] } = useClasses();
  const { data: streamsAll = [] } = useStreams(gradeFilter || undefined);

  const filtersReady = !!gradeFilter;
  const { data: studentsData = [], isLoading: studentsLoading } = useStudents({
    enabled: filtersReady,
    gradeId: gradeFilter || undefined,
    streamIds: streamFilters.length ? streamFilters : undefined,
    search: searchQuery || undefined,
  });

  const { data: assignments = [] } = useFeeAssignments(selectedFee || undefined, selectedTerm?.id);
  const bulkAssign = useBulkAssignFee();
  const bulkUnassign = useBulkUnassignFee();

  // Sync prefilled selection from existing assignments
  useEffect(() => {
    const assignedIds = new Set(assignments.map((a: any) => a.student_id));
    const paid = new Set(assignments.filter((a: any) => Number(a.amount_paid) > 0).map((a: any) => a.student_id));
    setOriginallyAssigned(assignedIds);
    setPaidLocked(paid);
    setSelected(new Set(assignedIds));
  }, [selectedFee, JSON.stringify(assignments)]);

  const fees: any[] = (Array.isArray(feeStructures) ? feeStructures : []).map((f: any) => ({
    id: f.id, name: f.name, amount: Number(f.amount || 0), ledger_type: f.category_type || "fees",
    due_date: f.due_date, term_id: f.term_id, academic_year_id: f.academic_year_id,
  }));

  const allStudents = (studentsData as any[]).map((s: any) => ({
    id: s.id, full_name: s.full_name || `${s.first_name} ${s.last_name}`,
    admission_no: s.admission_number, grade: s.grade || "", stream: s.stream || "", status: s.status,
  }));

  const toggleStudent = (id: string) => {
    if (paidLocked.has(id)) { toast.error("Cannot unassign a fee with payments"); return; }
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAll = () => {
    const allIds = allStudents.map(s => s.id);
    const allSelected = allIds.every(id => selected.has(id));
    if (allSelected) {
      // Keep paid-locked entries
      const next = new Set<string>();
      paidLocked.forEach(id => next.add(id));
      setSelected(next);
    } else {
      setSelected(new Set(allIds.concat(Array.from(paidLocked))));
    }
  };

  const getSelectedFeeInfo = () => fees.find((f: any) => f.id === selectedFee);
  const getDiscountInfo = () => (feeDiscounts as any[]).find((d: any) => d.id === selectedDiscount);

  const perStudentAmount = useMemo(() => {
    const fee = getSelectedFeeInfo();
    if (!fee) return 0;
    const d = getDiscountInfo();
    if (!d) return fee.amount;
    return d.type === "percentage" ? fee.amount * (1 - d.value / 100) : Math.max(0, fee.amount - d.value);
  }, [selectedFee, selectedDiscount, fees, feeDiscounts]);

  const additions = Array.from(selected).filter(id => !originallyAssigned.has(id));
  const removals = Array.from(originallyAssigned).filter(id => !selected.has(id) && !paidLocked.has(id));

  const handleSubmit = async () => {
    setShowConfirm(false);
    const fee = getSelectedFeeInfo();
    if (!fee) return;
    const discountAmount = getDiscountInfo()
      ? (getDiscountInfo().type === "percentage" ? fee.amount * (getDiscountInfo().value / 100) : getDiscountInfo().value)
      : 0;
    try {
      if (additions.length) {
        await bulkAssign.mutateAsync({
          fee_structure_id: fee.id,
          term_id: selectedTerm?.id || null,
          academic_year_id: currentAcademicYear?.id || null,
          student_ids: additions,
          discount_amount: discountAmount,
        });
      }
      if (removals.length) {
        await bulkUnassign.mutateAsync({
          fee_structure_id: fee.id,
          term_id: selectedTerm?.id || null,
          student_ids: removals,
        });
      }
      toast.success(`Saved: +${additions.length} assigned, -${removals.length} unassigned`);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const feeSelected = !!selectedFee;
  const totalDelta = additions.length - removals.length;
  const toggleStreamFilter = (id: string) =>
    setStreamFilters(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const templatesLoading = structuresLoading;

  return (
    <DashboardLayout title="Fee Assignment" subtitle="Select fees and assign to students by class, section, or individually">
      {selectedTerm && (
        <div className="mb-3 text-xs text-muted-foreground">
          Assigning to current term: <strong className="text-foreground">{selectedTerm.name}</strong>
        </div>
      )}
      <Tabs defaultValue="assign" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto gap-1">
          <TabsTrigger value="assign" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" />Assign Fees</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><CheckCircle className="h-3.5 w-3.5" />Assignment History</TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                Select Fee to Assign
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templatesLoading ? <div className="grid gap-3 sm:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div> :
              fees.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No fee structures configured. Go to Finance → Fee Structures to add one.</p> :
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fees.map((f: any) => (
                  <button key={f.id} onClick={() => setSelectedFee(f.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${selectedFee === f.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">{f.name}</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">{f.ledger_type}</Badge>
                    </div>
                    <p className="text-lg font-bold text-primary">{formatKES(f.amount)}</p>
                  </button>
                ))}
              </div>}
            </CardContent>
          </Card>

          <Card className={!feeSelected ? "opacity-50 pointer-events-none" : "border-primary/20"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                Apply Discount (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button onClick={() => setSelectedDiscount("none")}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${selectedDiscount === "none" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <span className="font-medium text-foreground text-sm">No Discount</span>
                  <p className="text-xs text-muted-foreground">Full amount applies</p>
                </button>
                {(feeDiscounts as any[]).map((d: any) => (
                  <button key={d.id} onClick={() => setSelectedDiscount(d.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${selectedDiscount === d.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <span className="font-medium text-foreground text-sm">{d.name}</span>
                    <p className="text-sm font-bold text-success">{d.type === "percentage" ? `${d.value}% off` : `${formatKES(d.value)} off`}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={!feeSelected ? "opacity-50 pointer-events-none" : "border-primary/20"}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                  Select Students
                  {selected.size > 0 && <Badge className="bg-primary/10 text-primary border-0 ml-2">{selected.size} selected</Badge>}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={toggleAll}><Users className="h-3.5 w-3.5 mr-1" />Select All</Button>
                  {selected.size > 0 && <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(paidLocked))} className="text-destructive">Clear</Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label className="text-xs">Class *</Label>
                  <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setStreamFilters([]); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{(classes as any[]).map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Streams</Label>
                  <div className={`min-h-9 rounded-md border p-2 flex flex-wrap gap-1.5 ${!gradeFilter ? "opacity-50 pointer-events-none bg-muted/30" : ""}`}>
                    {!gradeFilter ? <span className="text-xs text-muted-foreground">Select class first</span> :
                    (streamsAll as any[]).length === 0 ? <span className="text-xs text-muted-foreground">No streams in this class</span> :
                    (streamsAll as any[]).map((s: any) => (
                      <label key={s.id} className="flex items-center gap-1.5 text-xs cursor-pointer rounded border px-2 py-1 hover:bg-muted">
                        <Checkbox checked={streamFilters.includes(s.id)} onCheckedChange={() => toggleStreamFilter(s.id)} />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Name or admission no..." className="pl-8 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="w-10"><Checkbox checked={allStudents.length > 0 && allStudents.every(s => selected.has(s.id))} onCheckedChange={toggleAll} /></TableHead>
                    <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Admission No</TableHead>
                    <TableHead className="font-semibold">Grade</TableHead><TableHead className="font-semibold">Stream</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {!filtersReady ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Select a class to load students</TableCell></TableRow> :
                    studentsLoading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                    allStudents.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students match filters</TableCell></TableRow> :
                    allStudents.map((s: any) => (
                      <TableRow key={s.id} className={`cursor-pointer ${selected.has(s.id) ? "bg-primary/5" : ""} ${paidLocked.has(s.id) ? "opacity-80" : ""}`} onClick={() => toggleStudent(s.id)}>
                        <TableCell><Checkbox checked={selected.has(s.id)} disabled={paidLocked.has(s.id)} /></TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground text-sm">{s.admission_no}</TableCell>
                        <TableCell>{s.grade}</TableCell>
                        <TableCell>{s.stream}{paidLocked.has(s.id) && <Badge variant="secondary" className="ml-2 text-[10px]">paid</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {feeSelected && (additions.length > 0 || removals.length > 0) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-foreground text-lg">Pending Changes</h3>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="text-muted-foreground">Fee: <strong className="text-foreground">{getSelectedFeeInfo()?.name}</strong></span>
                          <span className="text-success">+{additions.length} to assign</span>
                          <span className="text-destructive">-{removals.length} to unassign</span>
                          <span className="text-muted-foreground">Per student: <strong>{formatKES(perStudentAmount)}</strong></span>
                        </div>
                      </div>
                      <Button size="lg" onClick={() => setShowConfirm(true)} className="shadow-lg">
                        <CheckCircle className="h-4 w-4 mr-1.5" />Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Recent Fee Assignments</CardTitle></CardHeader>
            <CardContent><p className="text-center py-8 text-sm text-muted-foreground">Assignment history will load from the backend.</p></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Confirm Changes</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fee</span><span className="font-semibold">{getSelectedFeeInfo()?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Term</span><span className="font-semibold">{selectedTerm?.name || "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-success">Newly assigned</span><span className="font-semibold">{additions.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-destructive">To unassign</span><span className="font-semibold">{removals.length}</span></div>
              <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2"><span>Per student amount</span><span className="text-primary">{formatKES(perStudentAmount)}</span></div>
            </div>
            <p className="text-xs text-muted-foreground">Students with any payment recorded against this fee cannot be unassigned and stay locked.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={bulkAssign.isPending || bulkUnassign.isPending}><CheckCircle className="h-4 w-4 mr-1.5" />Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FeeAssignment;
