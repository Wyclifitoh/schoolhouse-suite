import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LogTable } from "@/pages/Communication";

export default function CommunicationSmsLog() {
  return (
    <DashboardLayout title="SMS Logs" subtitle="Delivery history for SMS messages">
      <LogTable kind="sms" />
    </DashboardLayout>
  );
}
