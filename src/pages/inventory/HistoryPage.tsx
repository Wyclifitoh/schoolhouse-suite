import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SalesHistory } from "@/pages/Inventory";

export default function InventoryHistory() {
  return (
    <DashboardLayout title="Sales History" subtitle="View past store sales">
      <SalesHistory />
    </DashboardLayout>
  );
}
