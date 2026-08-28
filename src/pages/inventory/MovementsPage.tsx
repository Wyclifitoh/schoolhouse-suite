/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryNav } from "@/components/inventory/InventoryNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useMovementTypes, useStockMovements } from "@/hooks/useInventoryOps";

/**
 * The stock ledger. Every quantity change in the store has a row here with a
 * reason and the balance it produced — this is the audit view of stock.
 */
export default function InventoryMovements() {
  const [type, setType] = useState("all");
  const { data: types = [] } = useMovementTypes();
  const { data: movements = [], isLoading } = useStockMovements({ type });

  const typeMeta = (key: string) => types.find((t) => t.key === key);

  return (
    <DashboardLayout
      title="Stock Movements"
      subtitle="Every stock change, with its reason and resulting balance"
    >
      <InventoryNav />

      <div className="flex items-center gap-3 mb-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All movement types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t.key} value={t.key}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movement ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Recorded by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Loading ledger…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No stock movements recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {movements.map((m: any) => {
                const meta = typeMeta(m.type);
                const dir = Number(meta?.direction ?? 0);
                const Icon = dir > 0 ? ArrowUpRight : dir < 0 ? ArrowDownRight : Minus;
                const tone =
                  dir > 0 ? "text-success" : dir < 0 ? "text-destructive" : "text-muted-foreground";
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {m.created_at ? String(m.created_at).slice(0, 16).replace("T", " ") : "—"}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{m.item_name}</p>
                      <p className="text-xs text-muted-foreground">{m.sku}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{meta?.label || m.type}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${tone}`}>
                      <span className="inline-flex items-center gap-1">
                        <Icon className="h-3.5 w-3.5" />
                        {Math.abs(Number(m.quantity))} {m.unit || ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {m.balance_after ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[240px]">
                      {m.reason || m.notes || "—"}
                      {m.staff_name ? ` · ${m.staff_name}` : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.recorded_by_name || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
