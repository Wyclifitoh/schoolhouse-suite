import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFeeTemplates, useFeeCategories, useFeeDiscounts,
  useStudentFeesList, useCarryForwards,
} from "@/hooks/useFinance";
import {
  Banknote, Plus, Receipt, FileText, CreditCard, Search, Download,
  Percent, Tags, ListChecks, ArrowUpRight, Wallet, AlertCircle, Users,
} from "lucide-react";

const formatKES = (amount: number) => `KES ${Math.abs(amount).toLocaleString()}`;

const Finance = () => {
  const [collectSearch, setCollectSearch] = useState("");

  const { data: feeTemplates = [], isLoading: templatesLoading } = useFeeTemplates();
  const { data: feeCategories = [], isLoading: categoriesLoading } = useFeeCategories();
  const { data: feeDiscounts = [], isLoading: discountsLoading } = useFeeDiscounts();
  const { data: studentFees = [], isLoading: feesLoading } = useStudentFeesList(collectSearch);
  const { data: carryForwards = [], isLoading: cfLoading } = useCarryForwards();

  return (
    <DashboardLayout title="Finance" subtitle="Complete fee management, discounts & collection">
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="categories" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Fee Categories</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />Templates & Fines</TabsTrigger>
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
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Category</Button>
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
                  feeCategories.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No categories</TableCell></TableRow> :
                  feeCategories.map((c: any) => (
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

        {/* Templates & Fines */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Fee Templates</p>
                {templatesLoading ? <Skeleton className="h-7 w-8" /> : <p className="text-2xl font-bold text-foreground">{feeTemplates.length}</p>}</div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Banknote className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Total Fees Value</p>
                {templatesLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold text-foreground">{formatKES(feeTemplates.reduce((s: number, f: any) => s + (f.amount || 0), 0))}</p>}</div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><AlertCircle className="h-5 w-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">With Fines</p>
                {templatesLoading ? <Skeleton className="h-7 w-8" /> : <p className="text-2xl font-bold text-foreground">{feeTemplates.filter((f: any) => f.fine_type !== "none").length}</p>}</div>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Templates & Fine Configuration</CardTitle>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Create Template</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Fee Name</TableHead><TableHead className="font-semibold">Ledger</TableHead><TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Fine</TableHead><TableHead className="font-semibold">Recurring</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {templatesLoading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                  feeTemplates.map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{f.ledger_type}</Badge></TableCell>
                      <TableCell className="font-semibold">{formatKES(f.amount)}</TableCell>
                      <TableCell>{f.fine_type === "none" ? <span className="text-muted-foreground text-sm">—</span> :
                        <Badge className="bg-warning/10 text-warning border-0">{f.fine_type === "percentage" ? `${f.fine_amount}%` : formatKES(f.fine_amount || 0)} / {f.fine_frequency}</Badge>}</TableCell>
                      <TableCell>{f.is_recurring ? <Badge className="bg-success/10 text-success border-0">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
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
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Discount</Button>
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
                  feeDiscounts.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No discounts configured</TableCell></TableRow> :
                  feeDiscounts.map((d: any) => (
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
                  <TableHead className="font-semibold">Discount</TableHead><TableHead className="font-semibold">Fine</TableHead><TableHead className="font-semibold">Paid</TableHead>
                  <TableHead className="font-semibold">Balance</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {feesLoading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                  studentFees.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No fee records</TableCell></TableRow> :
                  studentFees.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell><div><p className="font-medium text-foreground">{s.student_name}</p><p className="text-xs text-muted-foreground font-mono">{s.admission_no}</p></div></TableCell>
                      <TableCell className="text-muted-foreground">{s.class}</TableCell>
                      <TableCell className="font-semibold">{formatKES(s.total_fee)}</TableCell>
                      <TableCell className="text-success">{s.discount > 0 ? formatKES(s.discount) : "—"}</TableCell>
                      <TableCell className="text-warning">{s.fine > 0 ? formatKES(s.fine) : "—"}</TableCell>
                      <TableCell className="font-semibold text-success">{formatKES(s.paid)}</TableCell>
                      <TableCell className={`font-semibold ${s.balance > 0 ? "text-destructive" : s.balance < 0 ? "text-success" : "text-muted-foreground"}`}>
                        {s.balance === 0 ? "—" : formatKES(s.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          s.status === "paid" ? "bg-success/10 text-success border-0" :
                          s.status === "partial" ? "bg-warning/10 text-warning border-0" :
                          s.status === "overdue" ? "bg-destructive/10 text-destructive border-0" :
                          "bg-info/10 text-info border-0"
                        }>{s.status}</Badge>
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
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Fee Carry Forward & Brought Forward</CardTitle>
            </CardHeader>
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
                      <TableCell><Badge className={cf.type === "arrears" ? "bg-destructive/10 text-destructive border-0" : "bg-success/10 text-success border-0"}>{cf.type.replace("_", " ")}</Badge></TableCell>
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
