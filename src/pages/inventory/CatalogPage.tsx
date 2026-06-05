import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProductCatalog } from "@/pages/Inventory";

export default function InventoryCatalog() {
  return (
    <DashboardLayout title="Catalog" subtitle="Manage store products">
      <ProductCatalog />
    </DashboardLayout>
  );
}
