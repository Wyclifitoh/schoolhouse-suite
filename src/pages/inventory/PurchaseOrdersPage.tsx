import { DashboardLayout } from "@/components/layout/DashboardLayout";
import PurchaseOrders from "@/components/inventory/PurchaseOrders";

export default function InventoryPurchaseOrders() {
  return (
    <DashboardLayout title="Purchase Orders" subtitle="Create and track POs">
      <PurchaseOrders />
    </DashboardLayout>
  );
}
