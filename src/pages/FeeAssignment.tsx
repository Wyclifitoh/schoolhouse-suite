import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { students, feeTemplates, feeGroups, feeDiscounts, classes } from "@/data/mockData";
import {
  Search, Users, CheckCircle, ListChecks, Filter, Banknote, Percent, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const allGrades = [...new Set(students.map(s => s.grade))].sort();
const allStreams = [...new Set(students.map(s => s.stream))].sort();
const allStatuses = ["active", "inactive"];

const FeeAssignment = () => {
  const [selectedFee, setSelectedFee] = useState<string>("");
  const [selectedFeeGroup, setSelectedFeeGroup] = useState<string>("");
  const [assignMode, setAssignMode] = useState<"template" | "group">("template");

  // Filters
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [streamFilter, setStreamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Discount
  const [selectedDiscount, setSelectedDiscount] = useState<string>("none");

  // Confirm dialog
  const [showConfirm, setShowConfirm] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState<Array<{
    id: string; fee: string; students: number; discount: string; date: string; total: number;
  }>>([
    { id: "ah1", fee: "Tuition Fee", students: 45, discount: "None", date: "2024-03-01", total: 1125000 },
    { id: "ah2", fee: "Class 8 Fees", students: 45, discount: "Staff Child Discount", date: "2024-02-28", total: 1497500 },
    { id: "ah3", fee: "Exam Fee", students: 120, discount: "None", date: "2024-02-15", total: 420000 },
    { id: "ah4", fee: "Transport Fee", students: 28, discount: "Sibling Discount", date: "2024-02-10", total: 190400 },
  ]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (gradeFilter !== "all" && s.grade !== gradeFilter) return false;
      if (streamFilter !== "all" && s.stream !== streamFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return s.full_name.toLowerCase().includes(q) || s.admission_no.toLowerCase().includes(q);
      }
      return true;
    });
  }, [gradeFilter, streamFilter, statusFilter, searchQuery]);

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const selectByGrade = () => {
    const ids = filteredStudents.map(s => s.id);
    setSelectedStudents(new Set(ids));
  };

  const getSelectedFeeInfo = () => {
    if (assignMode === "template") {
      return feeTemplates.find(f => f.id === selectedFee);
    }
    return feeGroups.find(g => g.id === selectedFeeGroup);
  };

  const getDiscountInfo = () => feeDiscounts.find(d => d.id === selectedDiscount);

  const calculateTotal = () => {
    const fee = getSelectedFeeInfo();
    if (!fee) return 0;
    const amount = "amount" in fee ? fee.amount : fee.total;
    const discount = getDiscountInfo();
    let perStudent = amount;
    if (discount) {
      perStudent = discount.type === "percentage"
        ? amount * (1 - discount.value / 100)
        : Math.max(0, amount - discount.value);
    }
    return perStudent * selectedStudents.size;
  };

  const handleAssign = () => {
    const fee = getSelectedFeeInfo();
    if (!fee) return;
    const discount = getDiscountInfo();
    setAssignmentHistory(prev => [{
      id: `ah${Date.now()}`,
      fee: fee.name,
      students: selectedStudents.size,
      discount: discount?.name || "None",
      date: new Date().toISOString().split("T")[0],
      total: calculateTotal(),
    }, ...prev]);
    setShowConfirm(false);
    setSelectedStudents(new Set());
    setSelectedFee("");
    setSelectedFeeGroup("");
    setSelectedDiscount("none");
    toast.success(`Fee assigned to ${selectedStudents.size} student(s) successfully`);
  };

  const feeSelected = assignMode === "template" ? !!selectedFee : !!selectedFeeGroup;

  return (
    <DashboardLayout title="Fee Assignment" subtitle="Select fees and assign to students by class, section, or individually">
      <Tabs defaultValue="assign" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto gap-1">
          <TabsTrigger value="assign" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" />Assign Fees</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><CheckCircle className="h-3.5 w-3.5" />Assignment History</TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-6">
          {/* Step 1: Select Fee */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                Select Fee to Assign
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant={assignMode === "template" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setAssignMode("template"); setSelectedFeeGroup(""); }}
                >
                  <Banknote className="h-4 w-4 mr-1.5" />Single Fee Template
                </Button>
                <Button
                  variant={assignMode === "group" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setAssignMode("group"); setSelectedFee(""); }}
                >
                  <ListChecks className="h-4 w-4 mr-1.5" />Fee Group (Bundle)
                </Button>
              </div>

              {assignMode === "template" ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {feeTemplates.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFee(f.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedFee === f.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">{f.name}</span>
                        <Badge variant="secondary" className="text-[10px] capitalize">{f.ledger_type}</Badge>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatKES(f.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{f.term} · Due: {f.due_date}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {feeGroups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedFeeGroup(g.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedFeeGroup === g.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">{g.name}</span>
                        <Badge variant="secondary">{g.fee_types.length} fees</Badge>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatKES(g.total)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{g.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Apply Discount */}
          <Card className={!feeSelected ? "opacity-50 pointer-events-none" : "border-primary/20"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                Apply Discount (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={() => setSelectedDiscount("none")}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    selectedDiscount === "none" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="font-medium text-foreground text-sm">No Discount</span>
                  <p className="text-xs text-muted-foreground">Full amount applies</p>
                </button>
                {feeDiscounts.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDiscount(d.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      selectedDiscount === d.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-foreground text-sm">{d.name}</span>
                      <Percent className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold text-success">
                      {d.type === "percentage" ? `${d.value}% off` : `${formatKES(d.value)} off`}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Select Students */}
          <Card className={!feeSelected ? "opacity-50 pointer-events-none" : "border-primary/20"}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                  Select Students
                  {selectedStudents.size > 0 && (
                    <Badge className="bg-primary/10 text-primary border-0 ml-2">{selectedStudents.size} selected</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={selectByGrade}>
                    <Users className="h-3.5 w-3.5 mr-1" />Select All Filtered
                  </Button>
                  {selectedStudents.size > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStudents(new Set())} className="text-destructive">
                      Clear Selection
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Grade / Class</Label>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {allGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Stream / Section</Label>
                  <Select value={streamFilter} onValueChange={setStreamFilter}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Streams</SelectItem>
                      {allStreams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {allStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Name or Adm No..." className="pl-8 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Student Table */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Admission No</TableHead>
                      <TableHead className="font-semibold">Grade</TableHead>
                      <TableHead className="font-semibold">Stream</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map(s => (
                      <TableRow
                        key={s.id}
                        className={`cursor-pointer transition-colors ${selectedStudents.has(s.id) ? "bg-primary/5" : ""}`}
                        onClick={() => toggleStudent(s.id)}
                      >
                        <TableCell><Checkbox checked={selectedStudents.has(s.id)} /></TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground text-sm">{s.admission_no}</TableCell>
                        <TableCell>{s.grade}</TableCell>
                        <TableCell>{s.stream}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize text-[10px]">{s.category}</Badge></TableCell>
                        <TableCell className={`font-semibold ${s.balance < 0 ? "text-destructive" : s.balance > 0 ? "text-success" : "text-muted-foreground"}`}>
                          {s.balance === 0 ? "—" : s.balance > 0 ? `+${formatKES(s.balance)}` : `-${formatKES(Math.abs(s.balance))}`}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No students match filters</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary & Assign Button */}
          <AnimatePresence>
            {feeSelected && selectedStudents.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-foreground text-lg">Assignment Summary</h3>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="text-muted-foreground">Fee: <strong className="text-foreground">{getSelectedFeeInfo()?.name}</strong></span>
                          <span className="text-muted-foreground">Students: <strong className="text-foreground">{selectedStudents.size}</strong></span>
                          {selectedDiscount !== "none" && (
                            <span className="text-muted-foreground">Discount: <strong className="text-success">{getDiscountInfo()?.name}</strong></span>
                          )}
                          <span className="text-muted-foreground">Total: <strong className="text-primary text-base">{formatKES(calculateTotal())}</strong></span>
                        </div>
                      </div>
                      <Button size="lg" onClick={() => setShowConfirm(true)} className="shadow-lg">
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Assign Fee to {selectedStudents.size} Student{selectedStudents.size > 1 ? "s" : ""}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Fee Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Fee</TableHead>
                    <TableHead className="font-semibold">Students</TableHead>
                    <TableHead className="font-semibold">Discount</TableHead>
                    <TableHead className="font-semibold">Total Amount</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentHistory.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.fee}</TableCell>
                      <TableCell><Badge variant="secondary">{h.students}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{h.discount}</TableCell>
                      <TableCell className="font-semibold text-primary">{formatKES(h.total)}</TableCell>
                      <TableCell className="text-muted-foreground">{h.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Fee Assignment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-semibold">{getSelectedFeeInfo()?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount per Student</span>
                <span className="font-semibold">
                  {formatKES("amount" in (getSelectedFeeInfo() || {}) ? (getSelectedFeeInfo() as any).amount : (getSelectedFeeInfo() as any)?.total || 0)}
                </span>
              </div>
              {selectedDiscount !== "none" && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-semibold text-success">{getDiscountInfo()?.name} ({getDiscountInfo()?.type === "percentage" ? `${getDiscountInfo()?.value}%` : formatKES(getDiscountInfo()?.value || 0)})</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Students</span>
                <span className="font-semibold">{selectedStudents.size}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span className="text-primary text-base">{formatKES(calculateTotal())}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will create fee records for {selectedStudents.size} student{selectedStudents.size > 1 ? "s" : ""}. Fees with fines will auto-calculate after due date.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleAssign}>
              <CheckCircle className="h-4 w-4 mr-1.5" />Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FeeAssignment;
