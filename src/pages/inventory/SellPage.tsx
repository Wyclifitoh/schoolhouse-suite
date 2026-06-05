import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SellToStudent } from "@/pages/Inventory";

export default function InventorySell() {
  return (
    <DashboardLayout title="Sell" subtitle="Sell items to a student">
      <SellToStudent />
    </DashboardLayout>
  );
}
