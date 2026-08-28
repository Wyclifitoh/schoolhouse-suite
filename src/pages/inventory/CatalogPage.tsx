import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryNav } from "@/components/inventory/InventoryNav";
import { ProductCatalog } from "@/pages/Inventory";

export default function InventoryCatalog() {
  return (
    <DashboardLayout title="Catalog" subtitle="Manage store products">
      <InventoryNav />
      <ProductCatalog />
    </DashboardLayout>
  );
}
