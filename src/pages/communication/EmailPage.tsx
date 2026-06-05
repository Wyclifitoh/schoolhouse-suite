import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmailComposer } from "@/pages/Communication";

export default function CommunicationEmail() {
  return (
    <DashboardLayout title="Send Email" subtitle="Compose and send email messages">
      <EmailComposer />
    </DashboardLayout>
  );
}
