import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CategoriesOverview } from "@/pages/Inventory";

export default function InventoryCategories() {
  return (
    <DashboardLayout title="Categories" subtitle="Organise product categories">
      <CategoriesOverview />
    </DashboardLayout>
  );
}
