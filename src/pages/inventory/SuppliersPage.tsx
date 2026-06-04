import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SupplierManagement } from "@/pages/Inventory";

export default function InventorySuppliers() {
  return (
    <DashboardLayout title="Suppliers" subtitle="Manage suppliers">
      <SupplierManagement />
    </DashboardLayout>
  );
}
