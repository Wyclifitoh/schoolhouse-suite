/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  HandHelping,
  PackageX,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useInventoryOverview } from "@/hooks/useInventoryOps";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

/**
 * Inventory command centre. Every figure comes from the backend stock ledger,
 * so the KPIs always agree with the movement history.
 */
export function InventoryOverview() {
  const { data, isLoading } = useInventoryOverview();
  const k = data?.kpis;

  const kpis = [
    { label: "Total Items", value: k?.total_items ?? 0, icon: Boxes, tone: "bg-primary/10 text-primary" },
    { label: "Stock Units", value: k?.total_units ?? 0, icon: Boxes, tone: "bg-info/10 text-info" },
    { label: "Low Stock", value: k?.low_stock ?? 0, icon: AlertTriangle, tone: "bg-warning/10 text-warning" },
    { label: "Out of Stock", value: k?.out_of_stock ?? 0, icon: PackageX, tone: "bg-destructive/10 text-destructive" },
    { label: "Issued to Staff", value: k?.issued_to_staff ?? 0, icon: HandHelping, tone: "bg-info/10 text-info" },
    { label: "Items Sold", value: k?.items_sold ?? 0, icon: TrendingUp, tone: "bg-success/10 text-success" },
    { label: "Stock Value", value: formatKES(k?.stock_value ?? 0), icon: Wallet, tone: "bg-primary/10 text-primary" },
    { label: "Pending Orders", value: k?.pending_purchase_orders ?? 0, icon: ShoppingCart, tone: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">{s.label}</p>
                <p className="text-xl font-bold text-foreground">
                  {isLoading ? "—" : s.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Needs restocking
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/inventory/catalog">
                Catalog <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.low_stock || []).length === 0 && (
              <p className="text-sm text-muted-foreground">Stock levels are healthy.</p>
            )}
            {(data?.low_stock || []).map((i: any) => (
              <div key={i.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.sku}</p>
                </div>
                <Badge
                  className={
                    Number(i.quantity_in_stock) <= 0
                      ? "bg-destructive/10 text-destructive border-0"
                      : "bg-warning/10 text-warning border-0"
                  }
                >
                  {i.quantity_in_stock} / {i.reorder_level}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Recent movements
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/inventory/movements">
                Ledger <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.recent_movements || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No stock movements yet.</p>
            )}
            {(data?.recent_movements || []).slice(0, 6).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.item_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {String(m.type).replace(/_/g, " ")}
                    {m.reason ? ` · ${m.reason}` : ""}
                  </p>
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {Number(m.quantity) > 0 ? "+" : ""}
                  {m.quantity}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <HandHelping className="h-4 w-4 text-info" /> With staff
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/inventory/issuances">
                Issuance <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.recent_issuances || []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing issued to staff yet.</p>
            )}
            {(data?.recent_issuances || []).slice(0, 6).map((i: any) => (
              <div key={i.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{i.staff_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {i.purpose || i.department_name || "School use"}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize whitespace-nowrap">
                  {String(i.status).replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default InventoryOverview;
