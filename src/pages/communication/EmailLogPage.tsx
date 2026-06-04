import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LogTable } from "@/pages/Communication";

export default function CommunicationEmailLog() {
  return (
    <DashboardLayout title="Email Logs" subtitle="Delivery history for emails">
      <LogTable kind="email" />
    </DashboardLayout>
  );
}
