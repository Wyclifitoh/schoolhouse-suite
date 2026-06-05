import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TemplatesTab } from "@/pages/Communication";

export default function CommunicationTemplates() {
  return (
    <DashboardLayout title="SMS Templates" subtitle="Reusable message templates">
      <TemplatesTab />
    </DashboardLayout>
  );
}
