import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryNav } from "@/components/inventory/InventoryNav";
import { SellToStudent } from "@/pages/Inventory";

export default function InventorySell() {
  return (
    <DashboardLayout title="Sell" subtitle="Sell items to a student">
      <InventoryNav />
      <SellToStudent />
    </DashboardLayout>
  );
}
