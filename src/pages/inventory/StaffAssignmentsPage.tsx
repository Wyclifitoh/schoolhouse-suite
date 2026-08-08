import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StaffAssignments } from "@/components/inventory/StaffAssignments";

export default function InventoryStaffAssignments() {
  return (
    <DashboardLayout
      title="Staff Assignments"
      subtitle="Issue store items to staff and track returns"
    >
      <StaffAssignments />
    </DashboardLayout>
  );
}
