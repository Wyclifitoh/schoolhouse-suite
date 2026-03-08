import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Plus, Download, ShoppingBag, AlertTriangle, XCircle, MoreHorizontal,
  ArrowUpDown, ShoppingCart, TrendingUp, Receipt, Tag, Shirt, BookOpen, Ruler, Package,
} from "lucide-react";
import { students } from "@/data/mockData";

// ===== MOCK DATA =====
const storeCategories = [
  { id: "cat1", name: "Uniforms", icon: Shirt, color: "bg-primary/10 text-primary" },
  { id: "cat2", name: "Books & Stationery", icon: BookOpen, color: "bg-info/10 text-info" },
  { id: "cat3", name: "PE & Sports", icon: Ruler, color: "bg-success/10 text-success" },
  { id: "cat4", name: "School Supplies", icon: Package, color: "bg-warning/10 text-warning" },
];

const storeItems = [
  { id: "si1", name: "School Shirt (White)", category: "Uniforms", sku: "UNI-SHT-W", buying_price: 450, selling_price: 650, quantity: 120, min_stock: 20, sizes: "S, M, L, XL", status: "in_stock" as const, sold_this_term: 85, last_restocked: "2024-02-15" },
  { id: "si2", name: "School Trouser (Navy)", category: "Uniforms", sku: "UNI-TRS-N", buying_price: 600, selling_price: 850, quantity: 95, min_stock: 20, sizes: "S, M, L, XL", status: "in_stock" as const, sold_this_term: 72, last_restocked: "2024-02-15" },
  { id: "si3", name: "School Skirt (Navy)", category: "Uniforms", sku: "UNI-SKT-N", buying_price: 550, selling_price: 800, quantity: 80, min_stock: 15, sizes: "S, M, L, XL", status: "in_stock" as const, sold_this_term: 68, last_restocked: "2024-02-15" },
  { id: "si4", name: "School Sweater (Navy)", category: "Uniforms", sku: "UNI-SWT-N", buying_price: 800, selling_price: 1200, quantity: 45, min_stock: 15, sizes: "S, M, L, XL", status: "in_stock" as const, sold_this_term: 55, last_restocked: "2024-01-20" },
  { id: "si5", name: "PE T-Shirt", category: "PE & Sports", sku: "PE-TSH-01", buying_price: 350, selling_price: 550, quantity: 60, min_stock: 15, sizes: "S, M, L", status: "in_stock" as const, sold_this_term: 40, last_restocked: "2024-02-01" },
  { id: "si6", name: "PE Shorts", category: "PE & Sports", sku: "PE-SHT-01", buying_price: 300, selling_price: 500, quantity: 55, min_stock: 15, sizes: "S, M, L", status: "in_stock" as const, sold_this_term: 38, last_restocked: "2024-02-01" },
  { id: "si7", name: "School Bag (Branded)", category: "School Supplies", sku: "SUP-BAG-01", buying_price: 900, selling_price: 1500, quantity: 8, min_stock: 10, sizes: "-", status: "low_stock" as const, sold_this_term: 42, last_restocked: "2024-01-10" },
  { id: "si8", name: "Exercise Book (96pg)", category: "Books & Stationery", sku: "BK-EX96-01", buying_price: 25, selling_price: 45, quantity: 500, min_stock: 100, sizes: "-", status: "in_stock" as const, sold_this_term: 1200, last_restocked: "2024-03-01" },
  { id: "si9", name: "Exercise Book (200pg)", category: "Books & Stationery", sku: "BK-EX200-01", buying_price: 45, selling_price: 80, quantity: 350, min_stock: 80, sizes: "-", status: "in_stock" as const, sold_this_term: 650, last_restocked: "2024-03-01" },
  { id: "si10", name: "School Tie", category: "Uniforms", sku: "UNI-TIE-01", buying_price: 150, selling_price: 300, quantity: 3, min_stock: 10, sizes: "-", status: "low_stock" as const, sold_this_term: 47, last_restocked: "2024-01-15" },
  { id: "si11", name: "School Socks (Pair)", category: "Uniforms", sku: "UNI-SCK-01", buying_price: 80, selling_price: 150, quantity: 200, min_stock: 40, sizes: "S, M, L", status: "in_stock" as const, sold_this_term: 130, last_restocked: "2024-02-20" },
  { id: "si12", name: "Geometry Set", category: "Books & Stationery", sku: "BK-GEO-01", buying_price: 120, selling_price: 220, quantity: 0, min_stock: 15, sizes: "-", status: "out_of_stock" as const, sold_this_term: 35, last_restocked: "2024-01-05" },
  { id: "si13", name: "School Badge", category: "Uniforms", sku: "UNI-BDG-01", buying_price: 50, selling_price: 100, quantity: 150, min_stock: 30, sizes: "-", status: "in_stock" as const, sold_this_term: 60, last_restocked: "2024-02-10" },
  { id: "si14", name: "Art Supplies Kit", category: "School Supplies", sku: "SUP-ART-01", buying_price: 250, selling_price: 450, quantity: 25, min_stock: 10, sizes: "-", status: "in_stock" as const, sold_this_term: 18, last_restocked: "2024-02-01" },
];

const salesRecords = [
  { id: "sl1", date: "2024-03-18", student_name: "Amina Wanjiku", admission_no: "ADM-2024-001", items: [{ name: "School Shirt (White)", qty: 2, price: 650 }, { name: "School Skirt (Navy)", qty: 1, price: 800 }], total: 2100, payment_method: "Added to Fee Balance", served_by: "Admin" },
  { id: "sl2", date: "2024-03-18", student_name: "Brian Ochieng", admission_no: "ADM-2024-002", items: [{ name: "Exercise Book (96pg)", qty: 10, price: 45 }, { name: "Exercise Book (200pg)", qty: 5, price: 80 }], total: 850, payment_method: "Cash", served_by: "Admin" },
  { id: "sl3", date: "2024-03-17", student_name: "David Kipchoge", admission_no: "ADM-2024-004", items: [{ name: "PE T-Shirt", qty: 1, price: 550 }, { name: "PE Shorts", qty: 1, price: 500 }], total: 1050, payment_method: "M-Pesa", served_by: "Accountant" },
  { id: "sl4", date: "2024-03-17", student_name: "Grace Njeri", admission_no: "ADM-2024-007", items: [{ name: "School Bag (Branded)", qty: 1, price: 1500 }], total: 1500, payment_method: "Added to Fee Balance", served_by: "Admin" },
  { id: "sl5", date: "2024-03-16", student_name: "Hassan Mohamed", admission_no: "ADM-2024-008", items: [{ name: "Geometry Set", qty: 1, price: 220 }, { name: "Art Supplies Kit", qty: 1, price: 450 }], total: 670, payment_method: "Cash", served_by: "Admin" },
  { id: "sl6", date: "2024-03-15", student_name: "Catherine Muthoni", admission_no: "ADM-2024-003", items: [{ name: "School Sweater (Navy)", qty: 1, price: 1200 }, { name: "School Tie", qty: 1, price: 300 }], total: 1500, payment_method: "Added to Fee Balance", served_by: "Accountant" },
];

const statusConfig = {
  in_stock: { label: "In Stock", className: "bg-success/10 text-success border-0" },
  low_stock: { label: "Low Stock", className: "bg-warning/10 text-warning border-0" },
  out_of_stock: { label: "Out of Stock", className: "bg-destructive/10 text-destructive border-0" },
};

const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

// ===== SUB-COMPONENTS =====
const StoreStats = () => {
  const totalItems = storeItems.length;
  const inStock = storeItems.filter(i => i.status === "in_stock").length;
  const lowStock = storeItems.filter(i => i.status === "low_stock").length;
  const totalRevenue = salesRecords.reduce((s, r) => s + r.total, 0);
  const totalProfit = storeItems.reduce((s, i) => s + (i.selling_price - i.buying_price) * i.sold_this_term, 0);

  const stats = [
    { label: "Total Products", value: totalItems, icon: ShoppingBag, color: "bg-primary/10 text-primary" },
    { label: "Revenue This Term", value: formatKES(totalRevenue), icon: TrendingUp, color: "bg-success/10 text-success" },
    { label: "Profit This Term", value: formatKES(totalProfit), icon: Receipt, color: "bg-info/10 text-info" },
    { label: "Low / Out of Stock", value: `${lowStock + storeItems.filter(i => i.status === "out_of_stock").length}`, icon: AlertTriangle, color: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
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

const ProductCatalog = () => {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const categories = [...new Set(storeItems.map(i => i.category))];
  const filtered = storeItems.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Product Catalog</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{storeItems.length} products across {categories.length} categories</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Product</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Product Name</Label><Input placeholder="e.g. School Shirt" /></div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Buying Price</Label><Input type="number" placeholder="0" /></div>
                    <div className="space-y-2"><Label>Selling Price</Label><Input type="number" placeholder="0" /></div>
                    <div className="space-y-2"><Label>Quantity</Label><Input type="number" placeholder="0" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>SKU Code</Label><Input placeholder="e.g. UNI-SHT-W" /></div>
                    <div className="space-y-2"><Label>Sizes (if any)</Label><Input placeholder="S, M, L, XL" /></div>
                  </div>
                  <div className="space-y-2"><Label>Min Stock Level</Label><Input type="number" placeholder="10" /></div>
                </div>
                <DialogFooter><Button className="w-full">Add Product</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products or SKU..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-44 h-9"><Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Buying</TableHead>
                <TableHead className="font-semibold">Selling</TableHead>
                <TableHead className="font-semibold"><span className="flex items-center gap-1">Stock <ArrowUpDown className="h-3 w-3" /></span></TableHead>
                <TableHead className="font-semibold">Sold</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => {
                const cfg = statusConfig[item.status];
                const margin = item.selling_price - item.buying_price;
                return (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}{item.sizes !== "-" && ` · ${item.sizes}`}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="font-normal">{item.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatKES(item.buying_price)}</TableCell>
                    <TableCell className="font-medium text-foreground">{formatKES(item.selling_price)} <span className="text-xs text-success">(+{formatKES(margin)})</span></TableCell>
                    <TableCell className="font-semibold text-foreground">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.sold_this_term}</TableCell>
                    <TableCell><Badge variant="default" className={cfg.className}>{cfg.label}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Restock</DropdownMenuItem>
                          <DropdownMenuItem>Edit Product</DropdownMenuItem>
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
        <p className="text-sm text-muted-foreground mt-3">Showing {filtered.length} of {storeItems.length} products</p>
      </CardContent>
    </Card>
  );
};

const SellToStudent = () => {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [cart, setCart] = useState<{ item: typeof storeItems[0]; qty: number; size?: string }[]>([]);
  const [payMethod, setPayMethod] = useState("fee_balance");

  const addToCart = (item: typeof storeItems[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(c => c.item.id !== itemId));
  const updateQty = (itemId: string, qty: number) => {
    if (qty < 1) return removeFromCart(itemId);
    setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, qty } : c));
  };

  const total = cart.reduce((s, c) => s + c.item.selling_price * c.qty, 0);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Product Grid */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select Student" /></SelectTrigger>
            <SelectContent>
              {students.filter(s => s.status === "active").map(s => (
                <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {storeItems.filter(i => i.status !== "out_of_stock").map(item => {
            const inCart = cart.find(c => c.item.id === item.id);
            return (
              <Card key={item.id} className={`cursor-pointer transition-all hover:shadow-md ${inCart ? "ring-2 ring-primary" : ""}`} onClick={() => addToCart(item)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                    {inCart && <Badge className="bg-primary text-primary-foreground">{inCart.qty}</Badge>}
                  </div>
                  <h4 className="font-medium text-sm text-foreground mb-1">{item.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{item.sizes !== "-" ? `Sizes: ${item.sizes}` : item.sku}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{formatKES(item.selling_price)}</span>
                    <span className="text-xs text-muted-foreground">{item.quantity} left</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div>
        <Card className="sticky top-24">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Click products to add to cart</p>
            ) : (
              <>
                {cart.map(c => (
                  <div key={c.item.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatKES(c.item.selling_price)} each</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); updateQty(c.item.id, c.qty - 1); }}>-</Button>
                      <span className="text-sm font-medium w-6 text-center">{c.qty}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); updateQty(c.item.id, c.qty + 1); }}>+</Button>
                    </div>
                    <p className="text-sm font-semibold text-foreground w-20 text-right">{formatKES(c.item.selling_price * c.qty)}</p>
                  </div>
                ))}

                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between text-lg font-bold text-foreground mb-3">
                    <span>Total</span><span>{formatKES(total)}</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fee_balance">Add to Fee Balance</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" disabled={!selectedStudent}>
                    <Receipt className="h-4 w-4 mr-1.5" />
                    Complete Sale
                  </Button>
                  {!selectedStudent && <p className="text-xs text-destructive mt-1 text-center">Select a student first</p>}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SalesHistory = () => (
  <Card>
    <CardHeader className="pb-4">
      <CardTitle className="text-base font-semibold">Sales History</CardTitle>
      <p className="text-sm text-muted-foreground">Recent transactions from the school store</p>
    </CardHeader>
    <CardContent>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Items</TableHead>
              <TableHead className="font-semibold">Total</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
              <TableHead className="font-semibold">Served By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesRecords.map(sale => (
              <TableRow key={sale.id}>
                <TableCell className="text-muted-foreground">{sale.date}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{sale.student_name}</p>
                    <p className="text-xs text-muted-foreground">{sale.admission_no}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {sale.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-foreground">{item.qty}x {item.name}</p>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-foreground">{formatKES(sale.total)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">{sale.payment_method}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{sale.served_by}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

// ===== CATEGORIES OVERVIEW =====
const CategoriesOverview = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {storeCategories.map(cat => {
      const items = storeItems.filter(i => i.category === cat.name);
      const revenue = items.reduce((s, i) => s + i.selling_price * i.sold_this_term, 0);
      const CatIcon = cat.icon;
      return (
        <Card key={cat.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.color} mb-3`}>
              <CatIcon className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-foreground">{cat.name}</h4>
            <p className="text-sm text-muted-foreground">{items.length} products</p>
            <p className="text-xs text-muted-foreground mt-1">Revenue: {formatKES(revenue)}</p>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

// ===== MAIN PAGE =====
const Inventory = () => (
  <DashboardLayout title="School Store" subtitle="Manage uniforms, books, and supplies sold to students">
    <StoreStats />
    <Tabs defaultValue="catalog" className="space-y-4">
      <TabsList>
        <TabsTrigger value="catalog">Product Catalog</TabsTrigger>
        <TabsTrigger value="sell">Sell to Student</TabsTrigger>
        <TabsTrigger value="history">Sales History</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>
      <TabsContent value="catalog"><ProductCatalog /></TabsContent>
      <TabsContent value="sell"><SellToStudent /></TabsContent>
      <TabsContent value="history"><SalesHistory /></TabsContent>
      <TabsContent value="categories"><CategoriesOverview /></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default Inventory;
