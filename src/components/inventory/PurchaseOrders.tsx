/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSchool } from "@/contexts/SchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  CheckCircle,
  Edit3,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/utils/date";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function PurchaseOrders() {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activePoId, setActivePoId] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState([
    { item_id: "", quantity: 1, unit_price: 0 },
  ]);

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["inventory-pos", schoolId],
    queryFn: () => api.get<any[]>("/inventory/purchase-orders"),
    enabled: !!schoolId,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["inventory-suppliers", schoolId],
    queryFn: () => api.get<any[]>("/inventory/suppliers"),
    enabled: !!schoolId,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["inventory-items", schoolId],
    queryFn: () => api.get<any[]>("/inventory/items"),
    enabled: !!schoolId,
  });

  const subtotal = useMemo(
    () =>
      lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [lineItems],
  );

  const grandTotal = subtotal + Number(shippingCost) - Number(discountAmount);

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      isEditMode
        ? api.put(`/inventory/purchase-orders/${activePoId}`, data)
        : api.post("/inventory/purchase-orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-pos"] });
      setIsOpen(false);
      resetForm();
      toast({ title: isEditMode ? "Order Updated" : "Order Created" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/inventory/purchase-orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-pos"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast({ title: "Inventory stock updated" });
    },
  });

  const resetForm = () => {
    setSupplierId("");
    setShippingCost(0);
    setDiscountAmount(0);
    setNotes("");
    setLineItems([{ item_id: "", quantity: 1, unit_price: 0 }]);
    setIsEditMode(false);
    setActivePoId(null);
  };

  const handleEdit = async (po: any) => {
    setIsEditMode(true);
    setActivePoId(po.id);
    setSupplierId(po.supplier_id);
    setShippingCost(po.shipping_cost);
    setDiscountAmount(po.discount_amount);
    setNotes(po.notes || "");

    const items = await api.get<any[]>(
      `/inventory/purchase-orders/${po.id}/items`,
    );
    setLineItems(
      items.map((i) => ({
        item_id: i.item_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    );
    setIsOpen(true);
  };

  const addRow = () =>
    setLineItems([...lineItems, { item_id: "", quantity: 1, unit_price: 0 }]);

  const updateRow = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "item_id") {
      const prod = catalog.find((p) => p.id === value);
      if (prod) updated[index].unit_price = prod.cost_price;
    }
    setLineItems(updated);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Purchase Orders</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage supplier orders and restocks
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </CardHeader>

      <CardContent>
        {/* MODAL FORM */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-background border rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Delivery instructions..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <Label className="font-bold">Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addRow}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Item
                  </Button>
                </div>
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Select
                        value={item.item_id}
                        onValueChange={(v) => updateRow(idx, "item_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalog.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateRow(idx, "quantity", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateRow(idx, "unit_price", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        disabled
                        value={(
                          item.quantity * item.unit_price
                        ).toLocaleString()}
                        className="bg-muted"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setLineItems(lineItems.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Shipping Fee</Label>
                    <Input
                      className="w-32"
                      type="number"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Discount</Label>
                    <Input
                      className="w-32"
                      type="number"
                      value={discountAmount}
                      onChange={(e) =>
                        setDiscountAmount(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">Grand Total</p>
                  <p className="text-3xl font-bold text-primary">
                    KES {grandTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  saveMutation.mutate({
                    supplier_id: supplierId,
                    items: lineItems,
                    shipping_cost: shippingCost,
                    discount_amount: discountAmount,
                    notes,
                  })
                }
                disabled={saveMutation.isPending || !supplierId}
              >
                {isEditMode ? "Update Order" : "Place Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* TABLE LIST */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pos.map((po: any) => (
              <TableRow key={po.id}>
                <TableCell className="font-mono font-bold text-primary">
                  {po.order_number}
                </TableCell>
                <TableCell>{po.supplier_name}</TableCell>
                <TableCell>{formatDate(po.order_date)}</TableCell>
                <TableCell className="font-medium">
                  KES {po.total_amount?.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`capitalize rounded-lg ${
                      po.status === "delivered"
                        ? "bg-green-100 text-green-700"
                        : po.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {po.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {po.status === "pending" ||
                      po.status === "ordered" ||
                      po.status === "in_transit" ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleEdit(po)}
                            className="cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4 mr-2" /> Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatus.mutate({
                                id: po.id,
                                status: "delivered",
                              })
                            }
                            className="cursor-pointer text-green-600 focus:text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark
                            Delivered
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatus.mutate({
                                id: po.id,
                                status: "cancelled",
                              })
                            }
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem disabled>
                          No actions available
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
