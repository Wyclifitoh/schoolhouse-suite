import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { NoticeboardTab } from "@/pages/Communication";

export default function CommunicationNoticeboard() {
  return (
    <DashboardLayout title="Noticeboard" subtitle="Post and manage notices">
      <CommunicationNav />
      <NoticeboardTab />
    </DashboardLayout>
  );
}
