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
  Search, Plus, Download, ShoppingBag, AlertTriangle, MoreHorizontal,
  ArrowUpDown, ShoppingCart, TrendingUp, Receipt, Tag, Shirt, BookOpen, Ruler, Package,
  Truck, FileText, ClipboardList, Phone, Mail, MapPin, Calendar, CheckCircle, Clock, XCircle,
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

const suppliers = [
  { id: "sup1", name: "Nairobi Uniforms Ltd", contact: "James Kamau", phone: "0722 111 222", email: "sales@nairobiuniforms.co.ke", location: "Industrial Area, Nairobi", category: "Uniforms", rating: 4.5, total_orders: 24, total_spent: 485000, status: "active" as const },
  { id: "sup2", name: "Longhorn Publishers", contact: "Mary Omondi", phone: "0733 222 333", email: "orders@longhorn.co.ke", location: "Funzi Road, Nairobi", category: "Books & Stationery", rating: 4.8, total_orders: 18, total_spent: 320000, status: "active" as const },
  { id: "sup3", name: "Bata Kenya", contact: "Peter Mwangi", phone: "0711 333 444", email: "institutional@bata.co.ke", location: "Limuru Road, Nairobi", category: "Uniforms", rating: 4.2, total_orders: 8, total_spent: 96000, status: "active" as const },
  { id: "sup4", name: "Sports Direct EA", contact: "Sarah Wanjiku", phone: "0744 444 555", email: "info@sportsdirect.co.ke", location: "Mombasa Road, Nairobi", category: "PE & Sports", rating: 3.9, total_orders: 12, total_spent: 156000, status: "active" as const },
  { id: "sup5", name: "Office King Supplies", contact: "Ali Hassan", phone: "0755 555 666", email: "sales@officeking.co.ke", location: "Tom Mboya St, Nairobi", category: "School Supplies", rating: 4.0, total_orders: 15, total_spent: 178000, status: "inactive" as const },
];

const purchaseOrders = [
  { id: "PO-2024-001", date: "2024-03-15", supplier: "Nairobi Uniforms Ltd", items: [{ name: "School Shirt (White)", qty: 200, unit_price: 450 }, { name: "School Trouser (Navy)", qty: 150, unit_price: 600 }], total: 180000, status: "delivered" as const, expected_date: "2024-03-20", delivered_date: "2024-03-19", payment_status: "paid" as const },
  { id: "PO-2024-002", date: "2024-03-10", supplier: "Longhorn Publishers", items: [{ name: "Exercise Book (96pg)", qty: 1000, unit_price: 25 }, { name: "Exercise Book (200pg)", qty: 500, unit_price: 45 }], total: 47500, status: "delivered" as const, expected_date: "2024-03-14", delivered_date: "2024-03-13", payment_status: "paid" as const },
  { id: "PO-2024-003", date: "2024-03-18", supplier: "Sports Direct EA", items: [{ name: "PE T-Shirt", qty: 100, unit_price: 350 }, { name: "PE Shorts", qty: 100, unit_price: 300 }], total: 65000, status: "in_transit" as const, expected_date: "2024-03-25", delivered_date: "", payment_status: "pending" as const },
  { id: "PO-2024-004", date: "2024-03-20", supplier: "Nairobi Uniforms Ltd", items: [{ name: "School Tie", qty: 50, unit_price: 150 }, { name: "School Badge", qty: 100, unit_price: 50 }], total: 12500, status: "pending" as const, expected_date: "2024-03-28", delivered_date: "", payment_status: "pending" as const },
  { id: "PO-2024-005", date: "2024-03-05", supplier: "Office King Supplies", items: [{ name: "School Bag (Branded)", qty: 30, unit_price: 900 }, { name: "Art Supplies Kit", qty: 20, unit_price: 250 }], total: 32000, status: "delivered" as const, expected_date: "2024-03-12", delivered_date: "2024-03-11", payment_status: "paid" as const },
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

const poStatusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-muted text-muted-foreground border-0" },
  in_transit: { label: "In Transit", icon: Truck, className: "bg-info/10 text-info border-0" },
  delivered: { label: "Delivered", icon: CheckCircle, className: "bg-success/10 text-success border-0" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-destructive/10 text-destructive border-0" },
};

const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

// ===== STATS =====
const StoreStats = () => {
  const totalProfit = storeItems.reduce((s, i) => s + (i.selling_price - i.buying_price) * i.sold_this_term, 0);
  const totalRevenue = salesRecords.reduce((s, r) => s + r.total, 0);
  const lowCount = storeItems.filter(i => i.status !== "in_stock").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {[
        { label: "Total Products", value: storeItems.length, icon: ShoppingBag, color: "bg-primary/10 text-primary" },
        { label: "Revenue This Term", value: formatKES(totalRevenue), icon: TrendingUp, color: "bg-success/10 text-success" },
        { label: "Profit This Term", value: formatKES(totalProfit), icon: Receipt, color: "bg-info/10 text-info" },
        { label: "Low / Out of Stock", value: lowCount, icon: AlertTriangle, color: "bg-warning/10 text-warning" },
      ].map(s => (
        <Card key={s.label} className="stat-card">
          <CardContent className="flex items-center gap-4 p-5 relative">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
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
const ProductCatalog = () => {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const categories = [...new Set(storeItems.map(i => i.category))];
  const filtered = storeItems.filter(i => {
    const m1 = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const m2 = catFilter === "all" || i.category === catFilter;
    return m1 && m2;
  });

  return (
    <Card className="glass-card-hover">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold">Product Catalog</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{storeItems.length} products</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-lg"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            <Dialog>
              <DialogTrigger asChild><Button size="sm" className="rounded-lg"><Plus className="h-4 w-4 mr-1.5" />Add Product</Button></DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Product Name</Label><Input placeholder="e.g. School Shirt" /></div>
                    <div className="space-y-2"><Label>Category</Label>
                      <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select></div>
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
                </div>
                <DialogFooter><Button className="w-full">Add Product</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-9 h-9 rounded-lg" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-44 h-9 rounded-lg"><Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="table-modern">
          <Table>
            <TableHeader><TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Buying</TableHead>
              <TableHead className="font-semibold">Selling</TableHead>
              <TableHead className="font-semibold"><span className="flex items-center gap-1">Stock <ArrowUpDown className="h-3 w-3" /></span></TableHead>
              <TableHead className="font-semibold">Sold</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(item => {
                const cfg = statusConfig[item.status];
                const margin = item.selling_price - item.buying_price;
                return (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell><div><p className="font-medium text-foreground">{item.name}</p><p className="text-xs text-muted-foreground font-mono">{item.sku}{item.sizes !== "-" && ` · ${item.sizes}`}</p></div></TableCell>
                    <TableCell><Badge variant="secondary" className="font-normal rounded-lg">{item.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatKES(item.buying_price)}</TableCell>
                    <TableCell><span className="font-medium text-foreground">{formatKES(item.selling_price)}</span> <span className="text-xs text-success">(+{formatKES(margin)})</span></TableCell>
                    <TableCell className="font-bold text-foreground">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.sold_this_term}</TableCell>
                    <TableCell><Badge variant="default" className={cfg.className + " rounded-lg"}>{cfg.label}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu><DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end"><DropdownMenuItem>Restock</DropdownMenuItem><DropdownMenuItem>Edit</DropdownMenuItem><DropdownMenuItem>Price History</DropdownMenuItem></DropdownMenuContent>
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
const SellToStudent = () => {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [cart, setCart] = useState<{ item: typeof storeItems[0]; qty: number }[]>([]);
  const [payMethod, setPayMethod] = useState("fee_balance");

  const addToCart = (item: typeof storeItems[0]) => {
    setCart(prev => {
      const ex = prev.find(c => c.item.id === item.id);
      if (ex) return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.item.id !== id));
  const updateQty = (id: string, qty: number) => { if (qty < 1) return removeFromCart(id); setCart(prev => prev.map(c => c.item.id === id ? { ...c, qty } : c)); };
  const total = cart.reduce((s, c) => s + c.item.selling_price * c.qty, 0);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="max-w-xs rounded-lg"><SelectValue placeholder="Select Student" /></SelectTrigger>
          <SelectContent>{students.filter(s => s.status === "active").map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</SelectItem>)}</SelectContent>
        </Select>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {storeItems.filter(i => i.status !== "out_of_stock").map(item => {
            const inCart = cart.find(c => c.item.id === item.id);
            return (
              <Card key={item.id} className={`cursor-pointer transition-all duration-200 hover:shadow-md glass-card ${inCart ? "ring-2 ring-primary shadow-md" : ""}`} onClick={() => addToCart(item)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-[10px] rounded-md">{item.category}</Badge>
                    {inCart && <Badge className="bg-primary text-primary-foreground rounded-full h-6 w-6 p-0 flex items-center justify-center text-xs">{inCart.qty}</Badge>}
                  </div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">{item.name}</h4>
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
      <div>
        <Card className="sticky top-24 glass-card">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Click products to add</p> : (
              <>
                {cart.map(c => (
                  <div key={c.item.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{c.item.name}</p><p className="text-xs text-muted-foreground">{formatKES(c.item.selling_price)} each</p></div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={e => { e.stopPropagation(); updateQty(c.item.id, c.qty - 1); }}>-</Button>
                      <span className="text-sm font-medium w-6 text-center">{c.qty}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={e => { e.stopPropagation(); updateQty(c.item.id, c.qty + 1); }}>+</Button>
                    </div>
                    <p className="text-sm font-bold w-20 text-right">{formatKES(c.item.selling_price * c.qty)}</p>
                  </div>
                ))}
                <div className="pt-3 border-t border-border/50">
                  <div className="flex justify-between text-lg font-bold mb-3"><span>Total</span><span>{formatKES(total)}</span></div>
                  <div className="space-y-2 mb-3">
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="fee_balance">Add to Fee Balance</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="mpesa">M-Pesa</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full rounded-lg" disabled={!selectedStudent}><Receipt className="h-4 w-4 mr-1.5" />Complete Sale</Button>
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

// ===== SALES HISTORY =====
const SalesHistory = () => (
  <Card className="glass-card-hover">
    <CardHeader className="pb-4">
      <CardTitle className="text-base font-bold">Sales History</CardTitle>
      <p className="text-sm text-muted-foreground">Recent store transactions</p>
    </CardHeader>
    <CardContent>
      <div className="table-modern">
        <Table>
          <TableHeader><TableRow className="bg-muted/40">
            <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Student</TableHead>
            <TableHead className="font-semibold">Items</TableHead><TableHead className="font-semibold">Total</TableHead>
            <TableHead className="font-semibold">Payment</TableHead><TableHead className="font-semibold">Served By</TableHead>
          </TableRow></TableHeader>
          <TableBody>{salesRecords.map(s => (
            <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="text-muted-foreground">{s.date}</TableCell>
              <TableCell><p className="font-medium">{s.student_name}</p><p className="text-xs text-muted-foreground font-mono">{s.admission_no}</p></TableCell>
              <TableCell><div className="space-y-0.5">{s.items.map((it, i) => <p key={i} className="text-sm">{it.qty}x {it.name}</p>)}</div></TableCell>
              <TableCell className="font-bold">{formatKES(s.total)}</TableCell>
              <TableCell><Badge variant="secondary" className="rounded-lg font-normal">{s.payment_method}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{s.served_by}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

// ===== SUPPLIERS =====
const SupplierManagement = () => {
  const [search, setSearch] = useState("");
  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active Suppliers", value: suppliers.filter(s => s.status === "active").length, icon: Truck, color: "bg-primary/10 text-primary" },
          { label: "Total Orders", value: suppliers.reduce((s, sp) => s + sp.total_orders, 0), icon: ClipboardList, color: "bg-info/10 text-info" },
          { label: "Total Spent", value: formatKES(suppliers.reduce((s, sp) => s + sp.total_spent, 0)), icon: Receipt, color: "bg-success/10 text-success" },
        ].map(s => (
          <Card key={s.label} className="stat-card">
            <CardContent className="flex items-center gap-4 p-5 relative">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card-hover">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-bold">Suppliers</CardTitle>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search suppliers..." className="pl-9 h-9 w-56 rounded-lg" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <Dialog>
                <DialogTrigger asChild><Button size="sm" className="rounded-lg"><Plus className="h-4 w-4 mr-1.5" />Add Supplier</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Supplier</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Company Name</Label><Input placeholder="Company name" /></div>
                      <div className="space-y-2"><Label>Contact Person</Label><Input placeholder="Full name" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Phone</Label><Input placeholder="0722 xxx xxx" /></div>
                      <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@company.co.ke" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Category</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{storeCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                        </Select></div>
                      <div className="space-y-2"><Label>Location</Label><Input placeholder="Address" /></div>
                    </div>
                    <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." rows={2} /></div>
                  </div>
                  <DialogFooter><Button className="w-full">Add Supplier</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map(sup => (
              <Card key={sup.id} className="glass-card hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-foreground">{sup.name}</h4>
                      <Badge variant="secondary" className="mt-1 rounded-lg font-normal text-xs">{sup.category}</Badge>
                    </div>
                    <Badge className={sup.status === "active" ? "bg-success/10 text-success border-0 rounded-lg" : "bg-muted text-muted-foreground border-0 rounded-lg"}>
                      {sup.status}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{sup.phone}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{sup.email}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{sup.location}</div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div><p className="text-xs text-muted-foreground">Orders</p><p className="font-bold">{sup.total_orders}</p></div>
                    <div><p className="text-xs text-muted-foreground">Spent</p><p className="font-bold">{formatKES(sup.total_spent)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Rating</p><p className="font-bold">⭐ {sup.rating}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ===== PURCHASE ORDERS =====
const PurchaseOrders = () => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-4">
      {[
        { label: "Total Orders", value: purchaseOrders.length, icon: FileText, color: "bg-primary/10 text-primary" },
        { label: "Pending", value: purchaseOrders.filter(p => p.status === "pending").length, icon: Clock, color: "bg-warning/10 text-warning" },
        { label: "In Transit", value: purchaseOrders.filter(p => p.status === "in_transit").length, icon: Truck, color: "bg-info/10 text-info" },
        { label: "Delivered", value: purchaseOrders.filter(p => p.status === "delivered").length, icon: CheckCircle, color: "bg-success/10 text-success" },
      ].map(s => (
        <Card key={s.label} className="stat-card">
          <CardContent className="flex items-center gap-4 p-5 relative">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card className="glass-card-hover">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">Purchase Orders</CardTitle>
          <Dialog>
            <DialogTrigger asChild><Button size="sm" className="rounded-lg"><Plus className="h-4 w-4 mr-1.5" />Create PO</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2"><Label>Supplier</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>{suppliers.filter(s => s.status === "active").map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Product</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{storeItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" placeholder="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Unit Price (KES)</Label><Input type="number" placeholder="0" /></div>
                  <div className="space-y-2"><Label>Expected Delivery</Label><Input type="date" /></div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." rows={2} /></div>
              </div>
              <DialogFooter><Button className="w-full">Create Purchase Order</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="table-modern">
          <Table>
            <TableHeader><TableRow className="bg-muted/40">
              <TableHead className="font-semibold">PO Number</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Supplier</TableHead>
              <TableHead className="font-semibold">Items</TableHead>
              <TableHead className="font-semibold">Total</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Payment</TableHead>
              <TableHead className="w-10" />
            </TableRow></TableHeader>
            <TableBody>{purchaseOrders.map(po => {
              const st = poStatusConfig[po.status];
              return (
                <TableRow key={po.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-bold text-primary">{po.id}</TableCell>
                  <TableCell className="text-muted-foreground">{po.date}</TableCell>
                  <TableCell className="font-medium">{po.supplier}</TableCell>
                  <TableCell><div className="space-y-0.5">{po.items.map((it, i) => <p key={i} className="text-sm">{it.qty}x {it.name}</p>)}</div></TableCell>
                  <TableCell className="font-bold">{formatKES(po.total)}</TableCell>
                  <TableCell><Badge className={st.className + " rounded-lg gap-1"}><st.icon className="h-3 w-3" />{st.label}</Badge></TableCell>
                  <TableCell><Badge className={po.payment_status === "paid" ? "bg-success/10 text-success border-0 rounded-lg" : "bg-warning/10 text-warning border-0 rounded-lg"}>{po.payment_status}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Received</DropdownMenuItem>
                        <DropdownMenuItem>Print PO</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ===== CATEGORIES =====
const CategoriesOverview = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {storeCategories.map(cat => {
      const items = storeItems.filter(i => i.category === cat.name);
      const revenue = items.reduce((s, i) => s + i.selling_price * i.sold_this_term, 0);
      const CatIcon = cat.icon;
      return (
        <Card key={cat.id} className="glass-card-hover">
          <CardContent className="p-5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.color} mb-4`}><CatIcon className="h-6 w-6" /></div>
            <h4 className="font-bold text-foreground text-lg">{cat.name}</h4>
            <p className="text-sm text-muted-foreground">{items.length} products</p>
            <p className="text-sm font-semibold text-foreground mt-2">{formatKES(revenue)} revenue</p>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

// ===== MAIN =====
const Inventory = () => (
  <DashboardLayout title="School Store" subtitle="Uniforms, books, supplies — sales, restocking & procurement">
    <StoreStats />
    <Tabs defaultValue="catalog" className="space-y-4">
      <TabsList className="tab-modern flex-wrap h-auto gap-1">
        <TabsTrigger value="catalog" className="gap-1.5 rounded-lg"><ShoppingBag className="h-3.5 w-3.5" />Catalog</TabsTrigger>
        <TabsTrigger value="sell" className="gap-1.5 rounded-lg"><ShoppingCart className="h-3.5 w-3.5" />Sell</TabsTrigger>
        <TabsTrigger value="history" className="gap-1.5 rounded-lg"><Receipt className="h-3.5 w-3.5" />Sales</TabsTrigger>
        <TabsTrigger value="suppliers" className="gap-1.5 rounded-lg"><Truck className="h-3.5 w-3.5" />Suppliers</TabsTrigger>
        <TabsTrigger value="purchase-orders" className="gap-1.5 rounded-lg"><FileText className="h-3.5 w-3.5" />Purchase Orders</TabsTrigger>
        <TabsTrigger value="categories" className="gap-1.5 rounded-lg"><Tag className="h-3.5 w-3.5" />Categories</TabsTrigger>
      </TabsList>
      <TabsContent value="catalog"><ProductCatalog /></TabsContent>
      <TabsContent value="sell"><SellToStudent /></TabsContent>
      <TabsContent value="history"><SalesHistory /></TabsContent>
      <TabsContent value="suppliers"><SupplierManagement /></TabsContent>
      <TabsContent value="purchase-orders"><PurchaseOrders /></TabsContent>
      <TabsContent value="categories"><CategoriesOverview /></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default Inventory;
