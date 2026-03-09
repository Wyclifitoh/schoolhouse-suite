import { useState } from "react";
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
import { useFeeTemplates, useFeeDiscounts } from "@/hooks/useFinance";
import { useClasses } from "@/hooks/useClasses";
import {
  Search, Users, CheckCircle, ListChecks, Banknote, Percent, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const FeeAssignment = () => {
  const [selectedFee, setSelectedFee] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedDiscount, setSelectedDiscount] = useState("none");
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: feeTemplates = [], isLoading: templatesLoading } = useFeeTemplates();
  const { data: feeDiscounts = [], isLoading: discountsLoading } = useFeeDiscounts();
  const { data: studentsData = [], isLoading: studentsLoading } = useStudents({ search: searchQuery || undefined });
  const { data: classes = [] } = useClasses();

  const allStudents = (studentsData as any[]).map((s: any) => ({
    id: s.id, full_name: s.full_name || `${s.first_name} ${s.last_name}`,
    admission_no: s.admission_number, grade: s.grade || "", stream: s.stream || "",
    status: s.status, balance: 0,
  }));

  const filteredStudents = allStudents.filter((s: any) => {
    if (gradeFilter !== "all" && s.grade !== gradeFilter) return false;
    return true;
  });

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleAll = () => {
    if (selectedStudents.size === filteredStudents.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(filteredStudents.map((s: any) => s.id)));
  };

  const getSelectedFeeInfo = () => (feeTemplates as any[]).find((f: any) => f.id === selectedFee);
  const getDiscountInfo = () => (feeDiscounts as any[]).find((d: any) => d.id === selectedDiscount);

  const calculateTotal = () => {
    const fee = getSelectedFeeInfo();
    if (!fee) return 0;
    const discount = getDiscountInfo();
    let perStudent = fee.amount;
    if (discount) {
      perStudent = discount.type === "percentage" ? fee.amount * (1 - discount.value / 100) : Math.max(0, fee.amount - discount.value);
    }
    return perStudent * selectedStudents.size;
  };

  const handleAssign = () => {
    setShowConfirm(false);
    setSelectedStudents(new Set());
    setSelectedFee("");
    setSelectedDiscount("none");
    toast.success(`Fee assigned to ${selectedStudents.size} student(s) successfully`);
  };

  const feeSelected = !!selectedFee;
  const allGrades = [...new Set(allStudents.map((s: any) => s.grade).filter(Boolean))].sort();

  return (
    <DashboardLayout title="Fee Assignment" subtitle="Select fees and assign to students by class, section, or individually">
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
              (feeTemplates as any[]).length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No fee templates configured.</p> :
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(feeTemplates as any[]).map((f: any) => (
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
                  {selectedStudents.size > 0 && <Badge className="bg-primary/10 text-primary border-0 ml-2">{selectedStudents.size} selected</Badge>}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={toggleAll}><Users className="h-3.5 w-3.5 mr-1" />Select All</Button>
                  {selectedStudents.size > 0 && <Button variant="ghost" size="sm" onClick={() => setSelectedStudents(new Set())} className="text-destructive">Clear</Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Grades" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Grades</SelectItem>{allGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
                <div className="relative col-span-2 sm:col-span-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="w-10"><Checkbox checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length} onCheckedChange={toggleAll} /></TableHead>
                    <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Admission No</TableHead>
                    <TableHead className="font-semibold">Grade</TableHead><TableHead className="font-semibold">Stream</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {studentsLoading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                    filteredStudents.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students match filters</TableCell></TableRow> :
                    filteredStudents.map((s: any) => (
                      <TableRow key={s.id} className={`cursor-pointer ${selectedStudents.has(s.id) ? "bg-primary/5" : ""}`} onClick={() => toggleStudent(s.id)}>
                        <TableCell><Checkbox checked={selectedStudents.has(s.id)} /></TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground text-sm">{s.admission_no}</TableCell>
                        <TableCell>{s.grade}</TableCell>
                        <TableCell>{s.stream}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {feeSelected && selectedStudents.size > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-foreground text-lg">Assignment Summary</h3>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="text-muted-foreground">Fee: <strong className="text-foreground">{getSelectedFeeInfo()?.name}</strong></span>
                          <span className="text-muted-foreground">Students: <strong className="text-foreground">{selectedStudents.size}</strong></span>
                          <span className="text-muted-foreground">Total: <strong className="text-primary text-base">{formatKES(calculateTotal())}</strong></span>
                        </div>
                      </div>
                      <Button size="lg" onClick={() => setShowConfirm(true)} className="shadow-lg">
                        <CheckCircle className="h-4 w-4 mr-1.5" />Assign Fee to {selectedStudents.size} Student{selectedStudents.size > 1 ? "s" : ""}
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Confirm Fee Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fee</span><span className="font-semibold">{getSelectedFeeInfo()?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Students</span><span className="font-semibold">{selectedStudents.size}</span></div>
              <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2"><span>Total</span><span className="text-primary text-base">{formatKES(calculateTotal())}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleAssign}><CheckCircle className="h-4 w-4 mr-1.5" />Confirm Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FeeAssignment;
