import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryNav } from "@/components/inventory/InventoryNav";
import { SupplierManagement } from "@/pages/Inventory";

export default function InventorySuppliers() {
  return (
    <DashboardLayout title="Suppliers" subtitle="Manage suppliers">
      <InventoryNav />
      <SupplierManagement />
    </DashboardLayout>
  );
}
