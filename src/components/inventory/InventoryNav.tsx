import { ModuleTabs } from "@/components/layout/ModuleTabs";
import {
  Package, Layers, CreditCard, Clipboard, Truck, ShoppingCart, LayoutDashboard,
  HandHelping, BarChart3, ArrowLeftRight,
} from "lucide-react";

const items = [
  { to: "/inventory", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/inventory/catalog", label: "Catalog", icon: Package },
  { to: "/inventory/categories", label: "Categories", icon: Layers },
  { to: "/inventory/sell", label: "Make Sale", icon: CreditCard },
  { to: "/inventory/issuances", label: "Staff Issuance", icon: HandHelping },
  { to: "/inventory/history", label: "Sales History", icon: Clipboard },
  { to: "/inventory/suppliers", label: "Suppliers", icon: Truck },
  { to: "/inventory/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { to: "/inventory/movements", label: "Stock Movements", icon: ArrowLeftRight },
  { to: "/inventory/reports", label: "Reports", icon: BarChart3 },
];

export function InventoryNav() {
  return <ModuleTabs items={items} />;
}
