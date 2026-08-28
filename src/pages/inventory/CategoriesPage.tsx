import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryNav } from "@/components/inventory/InventoryNav";
import { CategoriesOverview } from "@/pages/Inventory";

export default function InventoryCategories() {
  return (
    <DashboardLayout title="Categories" subtitle="Organise product categories">
      <InventoryNav />
      <CategoriesOverview />
    </DashboardLayout>
  );
}
