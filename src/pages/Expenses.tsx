/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchool } from "@/contexts/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Receipt,
  Plus,
  Download,
  Search,
  TrendingDown,
  Wallet,
  PieChart,
  Edit,
  Trash2,
  FolderOpen,
  CheckCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/utils/date";

const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

const CategoryForm = ({
  category,
  onSave,
  onClose,
}: {
  category?: any;
  onSave: (data: any) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [budget, setBudget] = useState(category?.budget?.toString() || "0");

  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Category Name *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Utilities"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Category description"
        />
      </div>
      <div className="space-y-2">
        <Label>Budget (KES)</Label>
        <Input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="150000"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (!name) {
              toast.error("Name is required");
              return;
            }
            onSave({ name, description, budget: Number(budget) });
          }}
        >
          {category ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </div>
  );
};

// ─── Expense Form ───
const ExpenseForm = ({
  expense,
  categories,
  onSave,
  onClose,
  onAddNewCategory,
}: {
  expense?: any;
  categories: any[];
  onSave: (data: any) => void;
  onClose: () => void;
  onAddNewCategory: () => void;
}) => {
  const [title, setTitle] = useState(expense?.title || "");
  const [categoryId, setCategoryId] = useState(expense?.category_id || "");
  const [amount, setAmount] = useState(expense?.amount?.toString() || "");
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date || new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] = useState(
    expense?.payment_method || "cash",
  );
  const [reference, setReference] = useState(expense?.reference || "");
  const [description, setDescription] = useState(expense?.description || "");
  const [status, setStatus] = useState(expense?.status || "pending");

  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Expense Title *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Electricity Bill - March"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Category</Label>
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={onAddNewCategory}
            >
              + New Category
            </Button>
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Amount (KES) *</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="28500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="bank">Bank</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Reference</Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Receipt/Invoice number"
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details"
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (!title || !amount) {
              toast.error("Title and amount are required");
              return;
            }
            onSave({
              title,
              category_id: categoryId || null,
              amount: Number(amount),
              expense_date: expenseDate,
              payment_method: paymentMethod,
              reference,
              description,
              status,
            });
          }}
        >
          {expense ? "Update" : "Record"}
        </Button>
      </DialogFooter>
    </div>
  );
};

const Expenses = () => {
  const { currentSchool } = useSchool();
  const queryClient = useQueryClient();
  const schoolId = currentSchool?.id;
  const [search, setSearch] = useState("");
  const [expDialogOpen, setExpDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [editingExp, setEditingExp] = useState<any>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  const saveCat = useMutation({
    mutationFn: async (data: any) => {
      if (editingCat) {
        return api.put(`/finance/expense-categories/${editingCat.id}`, data);
      } else {
        return api.post("/finance/expense-categories", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success(editingCat ? "Category updated" : "Category created");
      setCatDialogOpen(false);
      setEditingCat(null);
    },
  });

  const saveExp = useMutation({
    mutationFn: async (data: any) => {
      if (editingExp) {
        return api.put(`/finance/expenses/${editingExp.id}`, data);
      } else {
        return api.post("/finance/expenses", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(editingExp ? "Expense updated" : "Expense recorded");
      setExpDialogOpen(false);
      setEditingExp(null);
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories", schoolId],
    queryFn: () => api.get<any[]>("/finance/expense-categories"), // Clean Express API call
    enabled: !!schoolId,
  });

  const { data: expensesList = [] } = useQuery({
    queryKey: ["expenses", schoolId],
    queryFn: () => api.get<any[]>("/finance/expenses"), // Clean Express API call
    enabled: !!schoolId,
  });

  const totalExpenses = expensesList.reduce(
    (s: number, e: any) => s + Number(e.amount),
    0,
  );
  const totalBudget = categories.reduce(
    (s: number, c: any) => s + Number(c.budget),
    0,
  );

  const filtered = expensesList.filter(
    (e: any) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.expense_categories?.name || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  // Calc spent per category
  const catSpent: Record<string, number> = {};
  expensesList.forEach((e: any) => {
    if (e.category_id)
      catSpent[e.category_id] =
        (catSpent[e.category_id] || 0) + Number(e.amount);
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/finance/expenses/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <DashboardLayout
      title="School Expenses"
      subtitle="Track and manage all school expenditures"
    >
      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="expenses" className="gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* ── Expenses Tab ── */}
        <TabsContent value="expenses" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatKES(totalExpenses)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatKES(totalBudget)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/50">
                  <PieChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget Used</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalBudget > 0
                      ? Math.round((totalExpenses / totalBudget) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget by Category */}
          {categories.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">
                  Budget Utilization by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((c: any) => {
                    const spent = catSpent[c.id] || 0;
                    const pct = c.budget > 0 ? (spent / c.budget) * 100 : 0;
                    return (
                      <div
                        key={c.id}
                        className="p-4 rounded-lg border space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground text-sm">
                            {c.name}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <Progress value={Math.min(pct, 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Spent: {formatKES(spent)}</span>
                          <span>Budget: {formatKES(c.budget)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expense Records */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">
                  Expense Records
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      className="pl-9 h-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1.5" />
                    Export
                  </Button>
                  <Dialog
                    open={expDialogOpen}
                    onOpenChange={(o) => {
                      setExpDialogOpen(o);
                      if (!o) setEditingExp(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingExp ? "Edit Expense" : "Record Expense"}
                        </DialogTitle>
                      </DialogHeader>
                      <ExpenseForm
                        expense={editingExp}
                        categories={categories}
                        onSave={(d) => saveExp.mutate(d)}
                        onClose={() => {
                          setExpDialogOpen(false);
                          setEditingExp(null);
                        }}
                        onAddNewCategory={() => setCatDialogOpen(true)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Method</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold w-24">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No expenses found
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {e.category_name || "—"}{" "}
                          {/* Use category_name from your SQL Join */}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {formatKES(e.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(e.expense_date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {e.payment_method}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            e.status === "paid"
                              ? "bg-success/10 text-success border-0"
                              : e.status === "approved"
                                ? "bg-primary/10 text-primary border-0"
                                : "bg-warning/10 text-warning border-0"
                          }
                        >
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          {/* Quick Status Actions */}
                          {e.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={() =>
                                updateStatus.mutate({
                                  id: e.id,
                                  status: "approved",
                                })
                              }
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {e.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-success"
                              onClick={() =>
                                updateStatus.mutate({
                                  id: e.id,
                                  status: "paid",
                                })
                              }
                            >
                              <Wallet className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* General Actions */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingExp(e);
                              setExpDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete expense?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              {/* <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteExp.mutate(e.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter> */}
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Categories Tab ── */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Expense Categories
                </CardTitle>
                <Dialog
                  open={catDialogOpen}
                  onOpenChange={(o) => {
                    setCatDialogOpen(o);
                    if (!o) setEditingCat(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCat ? "Edit Category" : "Add Category"}
                      </DialogTitle>
                    </DialogHeader>
                    <CategoryForm
                      category={editingCat}
                      onSave={(d) => saveCat.mutate(d)}
                      onClose={() => {
                        setCatDialogOpen(false);
                        setEditingCat(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Budget</TableHead>
                    <TableHead className="font-semibold">Spent</TableHead>
                    <TableHead className="font-semibold">Utilization</TableHead>
                    <TableHead className="font-semibold w-24">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No categories yet
                      </TableCell>
                    </TableRow>
                  )}
                  {categories.map((c: any) => {
                    const spent = catSpent[c.id] || 0;
                    const pct =
                      c.budget > 0 ? Math.round((spent / c.budget) * 100) : 0;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.description || "—"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatKES(c.budget)}
                        </TableCell>
                        <TableCell className="font-semibold text-destructive">
                          {formatKES(spent)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(pct, 100)}
                              className="h-2 w-20"
                            />
                            <span className="text-xs text-muted-foreground">
                              {pct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingCat(c);
                                setCatDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete category?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Expenses linked to this category will be
                                    unlinked.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                {/* <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCat.mutate(c.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter> */}
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Expenses;
