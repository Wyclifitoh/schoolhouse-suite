import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFeeTemplates, useFeeCategories, useFeeStructures, useFeeDiscounts,
  useStudentFeesList, useCarryForwards,
} from "@/hooks/useFinance";
import { useClasses } from "@/hooks/useClasses";
import { useTerm } from "@/contexts/TermContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Banknote, Plus, Receipt, FileText, CreditCard, Search, Download,
  Percent, Tags, ArrowUpRight, Wallet, AlertCircle, MoreHorizontal, Edit, Trash2,
} from "lucide-react";
import { toast } from "sonner";

const formatKES = (amount: number) => `KES ${Math.abs(amount || 0).toLocaleString()}`;

const Finance = () => {
  const qc = useQueryClient();
  const [collectSearch, setCollectSearch] = useState("");

  const { data: feeTemplates = [], isLoading: templatesLoading } = useFeeTemplates();
  const { data: feeCategories = [], isLoading: categoriesLoading } = useFeeCategories();
  const { data: feeStructures = [], isLoading: structuresLoading } = useFeeStructures();
  const { data: feeDiscounts = [], isLoading: discountsLoading } = useFeeDiscounts();
  const { data: studentFees = [], isLoading: feesLoading } = useStudentFeesList(collectSearch);
  const { data: carryForwards = [], isLoading: cfLoading } = useCarryForwards();
  const { data: grades = [] } = useClasses();
  const { terms, academicYears, currentAcademicYear, selectedTerm } = useTerm();

  // --- Fee Category CRUD ---
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", type: "tuition", description: "", gl_code: "", is_optional: false });

  const createCategory = useMutation({
    mutationFn: (data: any) => api.post("/finance/fee-categories", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-categories"] }); toast.success("Fee category created!"); setCatDialogOpen(false); setCatForm({ name: "", type: "tuition", description: "", gl_code: "", is_optional: false }); },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Fee Structure CRUD (renamed from template) ---
  const [structDialogOpen, setStructDialogOpen] = useState(false);
  const [structForm, setStructForm] = useState({ name: "", fee_category_id: "", amount: "", grade_id: "", term_id: "", due_date: "" });

  const createStructure = useMutation({
    mutationFn: (data: any) => api.post("/finance/fee-structures", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-structures"] }); toast.success("Fee structure created!"); setStructDialogOpen(false); setStructForm({ name: "", fee_category_id: "", amount: "", grade_id: "", term_id: "", due_date: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Discount CRUD ---
  const [discDialogOpen, setDiscDialogOpen] = useState(false);
  const [discForm, setDiscForm] = useState({ name: "", type: "percentage", value: "", code: "", description: "", applicable_to: "" });

  const createDiscount = useMutation({
    mutationFn: (data: any) => api.post("/finance/fee-discounts", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-discounts"] }); toast.success("Discount created!"); setDiscDialogOpen(false); setDiscForm({ name: "", type: "percentage", value: "", code: "", description: "", applicable_to: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const templates = Array.isArray(feeTemplates) ? feeTemplates : (feeTemplates as any)?.rows || [];

  return (
    <DashboardLayout title="Finance" subtitle="Complete fee management, structures, discounts & collection">
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="categories" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Fee Categories</TabsTrigger>
          <TabsTrigger value="structures" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />Fee Structures</TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5"><Percent className="h-3.5 w-3.5" />Discounts</TabsTrigger>
          <TabsTrigger value="collect" className="gap-1.5"><Wallet className="h-3.5 w-3.5" />Collect Fees</TabsTrigger>
          <TabsTrigger value="carry-forward" className="gap-1.5"><ArrowUpRight className="h-3.5 w-3.5" />Carry Forward</TabsTrigger>
        </TabsList>

        {/* Fee Categories */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Categories</CardTitle>
                <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Category</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Fee Category</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Name</Label><Input placeholder="e.g. Tuition Fee" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>Type</Label>
                          <Select value={catForm.type} onValueChange={v => setCatForm(f => ({ ...f, type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tuition">Tuition</SelectItem>
                              <SelectItem value="boarding">Boarding</SelectItem>
                              <SelectItem value="transport">Transport</SelectItem>
                              <SelectItem value="activity">Activity</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>GL Code (optional)</Label><Input placeholder="e.g. 4001" value={catForm.gl_code} onChange={e => setCatForm(f => ({ ...f, gl_code: e.target.value }))} /></div>
                        <div className="space-y-2 flex items-end gap-2">
                          <label className="flex items-center gap-2 cursor-pointer text-sm pb-2">
                            <Checkbox checked={catForm.is_optional} onCheckedChange={(v) => setCatForm(f => ({ ...f, is_optional: !!v }))} />
                            Optional Fee
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Description</Label><Input placeholder="Description" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} /></div>
                      <Button className="w-full mt-2" onClick={() => createCategory.mutate(catForm)} disabled={createCategory.isPending || !catForm.name}>
                        {createCategory.isPending ? "Creating..." : "Add Category"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">GL Code</TableHead><TableHead className="font-semibold">Optional</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {categoriesLoading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                  (feeCategories as any[]).length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No categories. Click "Add Category" to create one.</TableCell></TableRow> :
                  (feeCategories as any[]).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{c.type}</Badge></TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{c.gl_code || "—"}</TableCell>
                      <TableCell>{c.is_optional ? <Badge className="bg-info/10 text-info border-0">Optional</Badge> : <Badge variant="secondary">Mandatory</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Structures (renamed from Templates) */}
        <TabsContent value="structures" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Structures</CardTitle>
                <Dialog open={structDialogOpen} onOpenChange={setStructDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Fee Structure</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Add Fee Structure</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Name</Label><Input placeholder="e.g. Term 1 Tuition" value={structForm.name} onChange={e => setStructForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Fee Category</Label>
                          <Select value={structForm.fee_category_id} onValueChange={v => setStructForm(f => ({ ...f, fee_category_id: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                              {(feeCategories as any[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" placeholder="0" value={structForm.amount} onChange={e => setStructForm(f => ({ ...f, amount: e.target.value }))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Grade (optional)</Label>
                          <Select value={structForm.grade_id} onValueChange={v => setStructForm(f => ({ ...f, grade_id: v }))}>
                            <SelectTrigger><SelectValue placeholder="All grades" /></SelectTrigger>
                            <SelectContent>
                              {grades.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Term (optional)</Label>
                          <Select value={structForm.term_id} onValueChange={v => setStructForm(f => ({ ...f, term_id: v }))}>
                            <SelectTrigger><SelectValue placeholder="All terms" /></SelectTrigger>
                            <SelectContent>
                              {terms.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Due Date (optional)</Label><Input type="date" value={structForm.due_date} onChange={e => setStructForm(f => ({ ...f, due_date: e.target.value }))} /></div>
                      <Button className="w-full mt-2" onClick={() => createStructure.mutate({
                        ...structForm,
                        amount: parseFloat(structForm.amount) || 0,
                        academic_year_id: currentAcademicYear?.id,
                        grade_id: structForm.grade_id || undefined,
                        term_id: structForm.term_id || undefined,
                        due_date: structForm.due_date || undefined,
                      })} disabled={createStructure.isPending || !structForm.name || !structForm.fee_category_id || !structForm.amount}>
                        {createStructure.isPending ? "Creating..." : "Add Fee Structure"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead><TableHead className="font-semibold">Grade</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {structuresLoading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                  (feeStructures as any[]).length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fee structures. Add categories first, then create structures.</TableCell></TableRow> :
                  (feeStructures as any[]).map((fs: any) => (
                    <TableRow key={fs.id}>
                      <TableCell className="font-medium">{fs.name}</TableCell>
                      <TableCell><Badge variant="secondary">{fs.category_name || fs.fee_category_id}</Badge></TableCell>
                      <TableCell className="font-semibold">{formatKES(fs.amount)}</TableCell>
                      <TableCell>{fs.grade_name || <span className="text-muted-foreground">All</span>}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{fs.due_date || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discounts */}
        <TabsContent value="discounts" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Discounts</CardTitle>
                <Dialog open={discDialogOpen} onOpenChange={setDiscDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Discount</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Fee Discount</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Discount Name</Label><Input placeholder="e.g. Sibling Discount" value={discForm.name} onChange={e => setDiscForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Type</Label>
                          <Select value={discForm.type} onValueChange={v => setDiscForm(f => ({ ...f, type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Value</Label><Input type="number" placeholder={discForm.type === "percentage" ? "e.g. 10" : "e.g. 5000"} value={discForm.value} onChange={e => setDiscForm(f => ({ ...f, value: e.target.value }))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Code (optional)</Label><Input placeholder="e.g. SIB10" value={discForm.code} onChange={e => setDiscForm(f => ({ ...f, code: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>Applicable To</Label>
                          <Select value={discForm.applicable_to} onValueChange={v => setDiscForm(f => ({ ...f, applicable_to: v }))}>
                            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="tuition">Tuition</SelectItem>
                              <SelectItem value="boarding">Boarding</SelectItem>
                              <SelectItem value="transport">Transport</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Description</Label><Input placeholder="Description" value={discForm.description} onChange={e => setDiscForm(f => ({ ...f, description: e.target.value }))} /></div>
                      <Button className="w-full mt-2" onClick={() => createDiscount.mutate({ ...discForm, value: parseFloat(discForm.value) || 0 })} disabled={createDiscount.isPending || !discForm.name || !discForm.value}>
                        {createDiscount.isPending ? "Creating..." : "Add Discount"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Discount</TableHead><TableHead className="font-semibold">Code</TableHead><TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Value</TableHead><TableHead className="font-semibold">Applicable To</TableHead><TableHead className="font-semibold">Stackable</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {discountsLoading ? [1,2].map(i => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                  (feeDiscounts as any[]).length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No discounts configured</TableCell></TableRow> :
                  (feeDiscounts as any[]).map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-mono">{d.code || "—"}</Badge></TableCell>
                      <TableCell className="capitalize text-muted-foreground">{d.type}</TableCell>
                      <TableCell className="font-semibold text-success">{d.type === "percentage" ? `${d.value}%` : formatKES(d.value)}</TableCell>
                      <TableCell><Badge variant="secondary">{d.applicable_to || "All"}</Badge></TableCell>
                      <TableCell>{d.stackable ? <Badge className="bg-info/10 text-info border-0">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collect Fees */}
        <TabsContent value="collect" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Collect Fees</CardTitle>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search student..." className="pl-9 h-9" value={collectSearch} onChange={e => setCollectSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Total Fee</TableHead>
                  <TableHead className="font-semibold">Paid</TableHead><TableHead className="font-semibold">Balance</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {feesLoading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                  studentFees.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No fee records</TableCell></TableRow> :
                  studentFees.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell><div><p className="font-medium text-foreground">{s.student_name}</p><p className="text-xs text-muted-foreground font-mono">{s.admission_no}</p></div></TableCell>
                      <TableCell className="text-muted-foreground">{s.class}</TableCell>
                      <TableCell className="font-semibold">{formatKES(s.total_fee)}</TableCell>
                      <TableCell className="font-semibold text-success">{formatKES(s.paid)}</TableCell>
                      <TableCell className={`font-semibold ${s.balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>{s.balance === 0 ? "—" : formatKES(s.balance)}</TableCell>
                      <TableCell>
                        <Badge className={s.status === "paid" ? "bg-success/10 text-success border-0" : s.status === "partial" ? "bg-warning/10 text-warning border-0" : "bg-info/10 text-info border-0"}>{s.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carry Forward */}
        <TabsContent value="carry-forward" className="space-y-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base font-semibold">Fee Carry Forward</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">From Term</TableHead><TableHead className="font-semibold">To Term</TableHead>
                  <TableHead className="font-semibold">Type</TableHead><TableHead className="font-semibold">Amount</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {cfLoading ? [1,2].map(i => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                  carryForwards.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No carry forward records</TableCell></TableRow> :
                  carryForwards.map((cf: any) => (
                    <TableRow key={cf.id}>
                      <TableCell className="font-medium">{cf.student_name}</TableCell>
                      <TableCell className="text-muted-foreground">{cf.from_term_name}</TableCell>
                      <TableCell className="text-muted-foreground">{cf.to_term_name}</TableCell>
                      <TableCell><Badge className={cf.type === "arrears" ? "bg-destructive/10 text-destructive border-0" : "bg-success/10 text-success border-0"}>{cf.type}</Badge></TableCell>
                      <TableCell className={`font-semibold ${cf.type === "arrears" ? "text-destructive" : "text-success"}`}>{formatKES(cf.amount)}</TableCell>
                      <TableCell><Badge className="bg-success/10 text-success border-0">{cf.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Finance;
