import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SmsComposer } from "@/pages/Communication";

export default function CommunicationSms() {
  return (
    <DashboardLayout title="Send SMS" subtitle="Compose and send SMS messages">
      <SmsComposer />
    </DashboardLayout>
  );
}
