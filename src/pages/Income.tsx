/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchool } from "@/contexts/SchoolContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatDate } from "@/utils/date";
import { Plus, TrendingUp, Wallet, BarChart3, Trash2, FolderOpen, Receipt } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

const IncomeForm = ({ categories, onSave, onClose }: any) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [source, setSource] = useState("");
  const [payer, setPayer] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hall rental fees" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount (KES) *</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Source</Label>
          <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Donation, Rental" /></div>
        <div className="space-y-2"><Label>Payer</Label>
          <Input value={payer} onChange={(e) => setPayer(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="space-y-2"><Label>Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="bank">Bank</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Reference</Label>
          <Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label>Notes</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => {
          if (!title || !amount) { toast.error("Title and amount required"); return; }
          onSave({
            title, amount: Number(amount), category_id: categoryId || null,
            source, payer_name: payer, payment_method: method, reference,
            income_date: date, notes,
          });
        }}>Record</Button>
      </DialogFooter>
    </div>
  );
};

const CategoryForm = ({ onSave, onClose }: any) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2"><Label>Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-2"><Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => {
          if (!name) { toast.error("Name required"); return; }
          onSave({ name, description });
        }}>Create</Button>
      </DialogFooter>
    </div>
  );
};

const Income = () => {
  const { currentSchool } = useSchool();
  const qc = useQueryClient();
  const schoolId = currentSchool?.id;
  const [entryOpen, setEntryOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const { data: entries = [] } = useQuery({
    queryKey: ["income-entries", schoolId],
    queryFn: () => api.get<any[]>("/income"),
    enabled: !!schoolId,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["income-categories", schoolId],
    queryFn: () => api.get<any[]>("/income/categories"),
    enabled: !!schoolId,
  });
  const { data: report } = useQuery({
    queryKey: ["income-report", schoolId],
    queryFn: () => api.get<any>("/income/reports"),
    enabled: !!schoolId,
  });

  const saveEntry = useMutation({
    mutationFn: (d: any) => api.post("/income", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income-entries"] });
      qc.invalidateQueries({ queryKey: ["income-report"] });
      toast.success("Income recorded");
      setEntryOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delEntry = useMutation({
    mutationFn: (id: string) => api.delete(`/income/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income-entries"] });
      qc.invalidateQueries({ queryKey: ["income-report"] });
      toast.success("Deleted");
    },
  });
  const saveCat = useMutation({
    mutationFn: (d: any) => api.post("/income/categories", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income-categories"] });
      toast.success("Category created");
      setCatOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delCat = useMutation({
    mutationFn: (id: string) => api.delete(`/income/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income-categories"] }),
  });

  const totals = report?.totals || { income: 0, expenses: 0, net: 0, fees: 0 };
  const chartData = (report?.by_category || []).map((r: any) => ({ name: r.category, total: Number(r.total) }));
  const ieData = [
    { name: "Income", value: totals.income },
    { name: "Expenses", value: totals.expenses },
    { name: "Net", value: totals.net },
  ];

  return (
    <DashboardLayout title="Income Management" subtitle="Record and analyse all non-fee income streams">
      <Tabs defaultValue="entries" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="entries" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />Income</TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5"><FolderOpen className="h-3.5 w-3.5" />Categories</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold">{formatKES(totals.income)}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Fees Collected</p>
                <p className="text-2xl font-bold">{formatKES(totals.fees)}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/50">
                <BarChart3 className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Net (Income − Expenses)</p>
                <p className="text-2xl font-bold">{formatKES(totals.net)}</p></div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Income Records</CardTitle>
                <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Income</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Record Income</DialogTitle></DialogHeader>
                    <IncomeForm categories={categories} onSave={(d: any) => saveEntry.mutate(d)} onClose={() => setEntryOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead>Title</TableHead><TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead><TableHead>Date</TableHead>
                  <TableHead>Method</TableHead><TableHead>Reference</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {entries.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No income recorded</TableCell></TableRow>
                  )}
                  {entries.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell><Badge variant="secondary">{e.category_name || "—"}</Badge></TableCell>
                      <TableCell className="font-semibold text-success">{formatKES(e.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(e.income_date)}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{e.payment_method}</TableCell>
                      <TableCell className="text-muted-foreground">{e.reference || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => delEntry.mutate(e.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Income Categories</CardTitle>
                <Dialog open={catOpen} onOpenChange={setCatOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Category</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Income Category</DialogTitle></DialogHeader>
                    <CategoryForm onSave={(d: any) => saveCat.mutate(d)} onClose={() => setCatOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead><TableHead>Description</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {categories.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No categories yet</TableCell></TableRow>
                  )}
                  {categories.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.description || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => delCat.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">Income by Category</CardTitle></CardHeader>
              <CardContent style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(v: any) => formatKES(Number(v))} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle></CardHeader>
              <CardContent style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ieData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(v: any) => formatKES(Number(v))} />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Income;