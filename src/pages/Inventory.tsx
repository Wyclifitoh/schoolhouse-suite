import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { inventoryItems } from "@/data/mockData";
import { Search, Plus, Download, Package, AlertTriangle, XCircle, Filter, MoreHorizontal, ArrowUpDown } from "lucide-react";

const statusConfig = {
  in_stock: { label: "In Stock", className: "bg-success/10 text-success border-0 hover:bg-success/20" },
  low_stock: { label: "Low Stock", className: "bg-warning/10 text-warning border-0 hover:bg-warning/20" },
  out_of_stock: { label: "Out of Stock", className: "bg-destructive/10 text-destructive border-0 hover:bg-destructive/20" },
};

const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

const Inventory = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = [...new Set(inventoryItems.map((i) => i.category))];

  const filtered = inventoryItems.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || i.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const inStockCount = inventoryItems.filter((i) => i.status === "in_stock").length;
  const lowStockCount = inventoryItems.filter((i) => i.status === "low_stock").length;
  const outCount = inventoryItems.filter((i) => i.status === "out_of_stock").length;
  const totalValue = inventoryItems.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0);

  return (
    <DashboardLayout title="Inventory" subtitle="Manage school supplies and assets">
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold text-foreground">{inventoryItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Package className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Stock</p>
              <p className="text-2xl font-bold text-foreground">{inStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-foreground">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-foreground">{outCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Inventory Items</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Total value: {formatKES(totalValue)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Item Name</Label>
                        <Input placeholder="Item name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input type="number" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label>Min Stock</Label>
                        <Input type="number" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Cost (KES)</Label>
                        <Input type="number" placeholder="0" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Storage Location</Label>
                      <Input placeholder="e.g. Main Store" />
                    </div>
                    <Button className="w-full mt-2">Add Item</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 h-9">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Item</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">
                    <span className="flex items-center gap-1">Qty <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="font-semibold">Min Stock</TableHead>
                  <TableHead className="font-semibold">Unit Cost</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const cfg = statusConfig[item.status];
                  return (
                    <TableRow key={item.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Restocked {item.last_restocked}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">{item.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{item.min_stock}</TableCell>
                      <TableCell className="text-muted-foreground">{formatKES(item.unit_cost)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.location}</TableCell>
                      <TableCell>
                        <Badge variant="default" className={cfg.className}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Adjust Stock</DropdownMenuItem>
                            <DropdownMenuItem>Edit Item</DropdownMenuItem>
                            <DropdownMenuItem>View History</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {inventoryItems.length} items
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Inventory;
