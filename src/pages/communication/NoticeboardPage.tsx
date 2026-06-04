import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NoticeboardTab } from "@/pages/Communication";

export default function CommunicationNoticeboard() {
  return (
    <DashboardLayout title="Noticeboard" subtitle="Post and manage notices">
      <NoticeboardTab />
    </DashboardLayout>
  );
}
