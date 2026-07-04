/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSchool } from "@/contexts/SchoolContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[]; // pre-selected catalog rows
  onDone?: () => void;
}

type Line = {
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
};

export default function MakeOrderDialog({
  open,
  onOpenChange,
  products,
  onDone,
}: Props) {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const qc = useQueryClient();

  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["inventory-suppliers", schoolId],
    queryFn: () => api.get<any[]>("/inventory/suppliers"),
    enabled: !!schoolId && open,
  });

  // Seed line items from the products the user checked
  useEffect(() => {
    if (!open) return;
    setLines(
      products.map((p) => ({
        item_id: p.id,
        name: p.name,
        quantity: Math.max(1, p.reorder_level || 1),
        unit_price: Number(p.cost_price) || 0,
      })),
    );
    setSupplierId((prev) => prev || products[0]?.supplier_id || "");
  }, [open, products]);

  const subtotal = lines.reduce(
    (s, l) => s + Number(l.quantity) * Number(l.unit_price),
    0,
  );

  const save = useMutation({
    mutationFn: () =>
      api.post("/inventory/purchase-orders", {
        supplier_id: supplierId,
        items: lines.map(({ item_id, quantity, unit_price }) => ({
          item_id,
          quantity,
          unit_price,
        })),
        shipping_cost: 0,
        discount_amount: 0,
        notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-pos"] });
      toast({
        title: "Order placed",
        description: `${lines.length} product${lines.length === 1 ? "" : "s"} added to a new purchase order.`,
      });
      onOpenChange(false);
      onDone?.();
    },
    onError: (e: Error) =>
      toast({ title: "Failed to create order", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make Order</DialogTitle>
          <DialogDescription>
            Create a single purchase order for the selected products. Adjust
            quantities and unit price before placing the order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery instructions…"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Product</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-32">Unit Price</TableHead>
                  <TableHead className="w-32 text-right">Line Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l, i) => (
                  <TableRow key={l.item_id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={l.quantity}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setLines((rows) =>
                            rows.map((r, idx) =>
                              idx === i ? { ...r, quantity: v } : r,
                            ),
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={l.unit_price}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setLines((rows) =>
                            rows.map((r, idx) =>
                              idx === i ? { ...r, unit_price: v } : r,
                            ),
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      KES{" "}
                      {(Number(l.quantity) * Number(l.unit_price)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setLines((rows) => rows.filter((_, idx) => idx !== i))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!lines.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      No products selected.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end text-right">
            <div>
              <p className="text-xs text-muted-foreground">Order total</p>
              <p className="text-2xl font-bold text-primary">
                KES {subtotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!supplierId || !lines.length || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Placing…" : "Place Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
