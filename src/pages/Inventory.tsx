/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import {
  Search,
  Plus,
  Download,
  ShoppingBag,
  AlertTriangle,
  MoreHorizontal,
  ArrowUpDown,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Tag,
  Shirt,
  BookOpen,
  Ruler,
  Package,
  Truck,
  FileText,
  ClipboardList,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import { useSchool } from "@/contexts/SchoolContext";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { toast } from "@/hooks/use-toast";
import PurchaseOrders from "@/components/inventory/PurchaseOrders";
import { useStudents } from "@/hooks/useStudents";

const statusConfig = {
  in_stock: {
    label: "In Stock",
    className: "bg-success/10 text-success border-0",
  },

  low_stock: {
    label: "Low Stock",
    className: "bg-warning/10 text-warning border-0",
  },

  out_of_stock: {
    label: "Out of Stock",
    className: "bg-destructive/10 text-destructive border-0",
  },
};

const poStatusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-0",
  },

  in_transit: {
    label: "In Transit",
    icon: Truck,
    className: "bg-info/10 text-info border-0",
  },

  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    className: "bg-success/10 text-success border-0",
  },

  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-0",
  },
};

const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

// ===== STATS =====

export const StoreStats = () => {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;

  const { data: items = [] } = useQuery({
    queryKey: ["inventory-items", schoolId],
    queryFn: () => api.get<any[]>("/inventory/items"),
    enabled: !!schoolId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["inventory-transactions", schoolId],
    queryFn: () => api.get<any[]>("/inventory/transactions"),
    enabled: !!schoolId,
  });

  const totalRevenue = transactions
    .filter((t) => t.type === "sale")
    .reduce((sum, t) => sum + Number(t.total_amount), 0);

  const lowCount = items.filter(
    (i) => i.quantity_in_stock <= i.reorder_level,
  ).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {[
        {
          label: "Total Products",
          value: items.length,
          icon: ShoppingBag,
          color: "bg-primary/10 text-primary",
        },
        {
          label: "Total Revenue",
          value: formatKES(totalRevenue),
          icon: TrendingUp,
          color: "bg-success/10 text-success",
        },
        {
          label: "Low Stock Items",
          value: lowCount,
          icon: AlertTriangle,
          color: "bg-warning/10 text-warning",
        },
      ].map((s) => (
        <Card key={s.label} className="stat-card">
          <CardContent className="flex items-center gap-4 p-5 relative">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ===== PRODUCT CATALOG =====

export const ProductCatalog = () => {
  const { currentSchool } = useSchool();

  const schoolId = currentSchool?.id;
  const [catFilter, setCatFilter] = useState("all");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    category_id: "",
    cost_price: 0,
    selling_price: 0,
    quantity_in_stock: 0,
    sku: "",
    unit: "",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory-items", schoolId],

    queryFn: () => api.get<any[]>("/inventory/items"),

    enabled: !!schoolId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["inventory-categories", schoolId],

    queryFn: () => api.get<any[]>("/inventory/categories"),

    enabled: !!schoolId,
  });

  const addProductMutation = useMutation({
    mutationFn: () =>
      api.post("/inventory/items", { ...productForm, school_id: schoolId }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });

      toast({ title: "Product added" });
    },
  });

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card className="glass-card-hover">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-bold">
            Product Catalog ({items.length})
          </CardTitle>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Product
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New Product</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Category</Label>

                    <Select
                      onValueChange={(v) =>
                        setProductForm({ ...productForm, category_id: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>

                      <SelectContent>
                        {categories.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      value={productForm.cost_price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          cost_price: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Selling</Label>
                    <Input
                      type="number"
                      value={productForm.selling_price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          selling_price: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={productForm.quantity_in_stock}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          quantity_in_stock: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>SKU</Label>
                  <Input
                    value={productForm.sku}
                    onChange={(e) =>
                      setProductForm({ ...productForm, sku: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => addProductMutation.mutate()}
                  className="w-full"
                >
                  Save Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search products..."
              className="pl-9 h-9 rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-44 h-9 rounded-lg">
              <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="table-modern">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold">Product</TableHead>

                <TableHead className="font-semibold">Category</TableHead>

                <TableHead className="font-semibold">Buying</TableHead>

                <TableHead className="font-semibold">Selling</TableHead>

                <TableHead className="font-semibold">
                  <span className="flex items-center gap-1">
                    Stock <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>

                <TableHead className="font-semibold">Sold</TableHead>

                <TableHead className="font-semibold">Status</TableHead>

                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((item) => {
                const status =
                  item.quantity_in_stock <= 0
                    ? "out_of_stock"
                    : item.quantity_in_stock <= item.reorder_level
                      ? "low_stock"
                      : "in_stock";
                const cfg = statusConfig[status];
                const margin = item.selling_price - item.cost_price;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs font-mono">{item.sku}</p>
                    </TableCell>
                    <TableCell>
                      {item.category_name || "Uncategorized"}
                    </TableCell>
                    <TableCell>{formatKES(item.cost_price)}</TableCell>
                    <TableCell>{formatKES(item.selling_price)}</TableCell>
                    <TableCell className="font-bold">
                      {item.quantity_in_stock}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {item.sold_this_term}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="default"
                        className={cfg.className + " rounded-lg"}
                      >
                        {cfg.label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Restock</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Price History</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// ===== SELL TO STUDENT =====

export const SellToStudent = () => {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const [selectedStudent, setSelectedStudent] = useState("");
  const [cart, setCart] = useState<{ item: any; qty: number }[]>([]);
  const [payMethod, setPayMethod] = useState("fee_balance");
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["inventory-items", schoolId],
    queryFn: () => api.get<any[]>("/inventory/items"),
    enabled: !!schoolId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["inventory-categories", schoolId],
    queryFn: () => api.get<any[]>("/inventory/categories"),
    enabled: !!schoolId,
  });

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        if (existing.qty >= item.quantity_in_stock) {
          toast({ title: "Out of stock", variant: "destructive" });
          return prev;
        }
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (id: string, qty: number, stock: number) => {
    if (qty < 1) {
      setCart((prev) => prev.filter((c) => c.item.id !== id));
      return;
    }
    if (qty > stock) {
      toast({ title: "Max stock reached", variant: "destructive" });
      return;
    }
    setCart((prev) => prev.map((c) => (c.item.id === id ? { ...c, qty } : c)));
  };

  const total = cart.reduce((s, c) => s + c.item.selling_price * c.qty, 0);

  const sellMutation = useMutation({
    mutationFn: () =>
      api.post("/inventory/transactions", {
        school_id: schoolId,
        type: "sale",
        items: cart.map((c) => ({
          item_id: c.item.id,
          quantity: c.qty,
          unit_price: c.item.selling_price,
          total_amount: c.item.selling_price * c.qty,
        })),
        payment_method: payMethod,
        student_id: selectedStudent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      setCart([]);
      toast({ title: "Sale completed successfully" });
    },
  });

  const [searchTerm, setSearchTerm] = useState("");

  const { data: studentsData, isLoading } = useStudents({
    search: searchTerm,
    enabled: true,
  });

  const studentList = Array.isArray(studentsData) ? studentsData : [];

  const displayedStudents = studentList.slice(0, 10);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a student or walk-in" />
          </SelectTrigger>

          <SelectContent>
            <div className="p-2 sticky top-0 bg-popover z-10 border-b border-border">
              <input
                type="text"
                className="w-full px-2 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <SelectItem
              value="walk-in"
              className="font-medium text-muted-foreground"
            >
              Walk-in Customer
            </SelectItem>

            {isLoading ? (
              <div className="p-2 text-xs text-center text-muted-foreground">
                Loading...
              </div>
            ) : displayedStudents.length === 0 && searchTerm ? (
              <div className="p-2 text-xs text-center text-muted-foreground">
                No students found
              </div>
            ) : (
              displayedStudents.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                  {student.admission_number
                    ? ` (${student.admission_number})`
                    : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items
            .filter((i: any) => i.quantity_in_stock > 0)
            .map((item: any) => {
              const inCart = cart.find((c) => c.item.id === item.id);
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md glass-card ${inCart ? "ring-2 ring-primary" : ""}`}
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] rounded-md"
                      >
                        {item.category_name || "General"}
                      </Badge>
                      {inCart && (
                        <Badge className="bg-primary rounded-full h-6 w-6 p-0 flex items-center justify-center text-xs">
                          {inCart.qty}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.sku}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">
                        {formatKES(item.selling_price)}
                      </span>
                      <span
                        className={`text-xs ${item.quantity_in_stock < 10 ? "text-red-500 font-bold" : "text-muted-foreground"}`}
                      >
                        {item.quantity_in_stock} left
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      <div>
        <Card className="sticky top-24 glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click products to add
              </p>
            ) : (
              <>
                {cart.map((c) => (
                  <div
                    key={c.item.id}
                    className="flex items-center justify-between gap-2 py-2 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {c.item.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQty(
                            c.item.id,
                            c.qty - 1,
                            c.item.quantity_in_stock,
                          )
                        }
                      >
                        -
                      </Button>
                      <span className="text-sm font-medium w-4 text-center">
                        {c.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQty(
                            c.item.id,
                            c.qty + 1,
                            c.item.quantity_in_stock,
                          )
                        }
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-sm font-bold w-20 text-right">
                      {formatKES(c.item.selling_price * c.qty)}
                    </p>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-lg font-bold mb-3">
                    <span>Total</span>
                    <span>{formatKES(total)}</span>
                  </div>
                  <Label className="text-xs">Payment Method</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger className="mb-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fee_balance">
                        Add to Fee Balance
                      </SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full"
                    disabled={!selectedStudent || sellMutation.isPending}
                    onClick={() => sellMutation.mutate()}
                  >
                    {sellMutation.isPending ? "Processing..." : "Complete Sale"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ===== SALES HISTORY =====

export const SalesHistory = () => {
  const { currentSchool } = useSchool();

  const schoolId = currentSchool?.id;

  const { data: transactions = [] } = useQuery({
    queryKey: ["inventory-transactions", schoolId],

    queryFn: () => api.get<any[]>("/inventory/transactions"),

    enabled: !!schoolId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Transactions</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>

              <TableHead>Item</TableHead>

              <TableHead>Type</TableHead>

              <TableHead>Qty</TableHead>

              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString()}
                </TableCell>

                <TableCell className="font-medium">
                  {t.item_name || "Item"}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {t.type}
                  </Badge>
                </TableCell>

                <TableCell>{t.quantity}</TableCell>

                <TableCell className="font-bold">
                  KES {t.total_amount?.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ===== SUPPLIERS =====
export const SupplierManagement = () => {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    tax_pin: "",
  });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["inventory-suppliers", schoolId],
    queryFn: () => api.get<any[]>("/inventory/suppliers"),
    enabled: !!schoolId,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api.post("/inventory/suppliers", { ...form, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] });
      setIsAddOpen(false);
      toast({ title: "Supplier added" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Suppliers</CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Company Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Contact Person"
                value={form.contact_person}
                onChange={(e) =>
                  setForm({ ...form, contact_person: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <Input
                placeholder="Tax PIN (e.g. KRA PIN)"
                value={form.tax_pin}
                onChange={(e) => setForm({ ...form, tax_pin: e.target.value })}
              />
              <Button className="w-full" onClick={() => addMutation.mutate()}>
                Save Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Tax PIN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.contact_person}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell className="font-mono text-xs">
                  {s.tax_pin || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ===== CATEGORIES =====
export const CategoriesOverview = () => {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", description: "" });

  // Add category mutation
  const addCatMutation = useMutation({
    mutationFn: () =>
      api.post("/inventory/categories", { ...catForm, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      setIsCatOpen(false);
      setCatForm({ name: "", description: "" });
      toast({ title: "Category added successfully" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  // Update category mutation
  const updateCatMutation = useMutation({
    mutationFn: () =>
      api.put(`/inventory/categories/${selectedCategory?.id}`, {
        name: catForm.name,
        description: catForm.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      setIsEditOpen(false);
      setSelectedCategory(null);
      setCatForm({ name: "", description: "" });
      toast({ title: "Category updated successfully" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  // Delete category mutation
  const deleteCatMutation = useMutation({
    mutationFn: () =>
      api.delete(`/inventory/categories/${selectedCategory?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });
      setIsDeleteOpen(false);
      setSelectedCategory(null);
      toast({ title: "Category deleted successfully" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["inventory-categories", schoolId],
    queryFn: () => api.get<any[]>("/inventory/categories"),
    enabled: !!schoolId,
  });

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setCatForm({
      name: category.name,
      description: category.description || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (category: any) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Categories</h2>
        <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Category Name"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm({ ...catForm, name: e.target.value })
                }
              />
              <Input
                placeholder="Description"
                value={catForm.description}
                onChange={(e) =>
                  setCatForm({ ...catForm, description: e.target.value })
                }
              />
              <Button
                className="w-full"
                onClick={() => addCatMutation.mutate()}
                disabled={addCatMutation.isPending || !catForm.name}
              >
                {addCatMutation.isPending ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Add category card */}
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted p-6 cursor-pointer hover:bg-accent transition-colors min-h-[180px]"
          onClick={() => setIsCatOpen(true)}
        >
          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Add New Category</p>
        </div>

        {/* Categories list */}
        {categories.map((cat: any) => (
          <Card key={cat.id} className="glass-card-hover group relative">
            <CardContent className="p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <Tag className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-foreground text-lg">{cat.name}</h4>
              <p className="text-sm text-muted-foreground">
                {cat.description || "No description"}
              </p>

              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(cat)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(cat)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Category Name"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={catForm.description}
              onChange={(e) =>
                setCatForm({ ...catForm, description: e.target.value })
              }
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => updateCatMutation.mutate()}
                disabled={updateCatMutation.isPending || !catForm.name}
              >
                {updateCatMutation.isPending
                  ? "Updating..."
                  : "Update Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This
              action cannot be undone. Items in this category will become
              uncategorized.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteCatMutation.mutate()}
              disabled={deleteCatMutation.isPending}
            >
              {deleteCatMutation.isPending ? "Deleting..." : "Delete Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
// ===== MAIN =====

const Inventory = () => {
  const { currentSchool } = useSchool();

  const schoolId = currentSchool?.id;

  const queryClient = useQueryClient();

  const [isCatOpen, setIsCatOpen] = useState(false);

  const [catForm, setCatForm] = useState({ name: "", description: "" });

  const addCatMutation = useMutation({
    mutationFn: () =>
      api.post("/inventory/categories", { ...catForm, school_id: schoolId }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });

      setIsCatOpen(false);

      setCatForm({ name: "", description: "" });

      toast({ title: "Category added successfully" });
    },

    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  return (
    <DashboardLayout
      title="School Store"
      subtitle="Overview — manage catalog, sales, suppliers, and orders from dedicated pages"
    >
      <StoreStats />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {[
          {
            title: "Catalog",
            desc: "Browse and manage products",
            icon: ShoppingBag,
            to: "/inventory/catalog",
          },
          {
            title: "Sell",
            desc: "Sell items to a student",
            icon: ShoppingCart,
            to: "/inventory/sell",
          },
          {
            title: "Sales History",
            desc: "View past sales",
            icon: Receipt,
            to: "/inventory/history",
          },
          {
            title: "Suppliers",
            desc: "Manage suppliers",
            icon: Truck,
            to: "/inventory/suppliers",
          },
          {
            title: "Purchase Orders",
            desc: "Create & track POs",
            icon: FileText,
            to: "/inventory/purchase-orders",
          },
          {
            title: "Categories",
            desc: "Organise product categories",
            icon: Tag,
            to: "/inventory/categories",
          },
        ].map((c) => (
          <a
            key={c.to}
            href={c.to}
            className="rounded-xl border bg-card p-4 hover:bg-accent transition-colors flex items-start gap-3"
          >
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{c.title}</p>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
