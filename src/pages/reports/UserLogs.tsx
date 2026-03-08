import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

const UserLogs = () => (
  <DashboardLayout title="User Logs" subtitle="User login and activity logs">
    <Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>User Logs - Coming Soon</p></CardContent></Card>
  </DashboardLayout>
);

export default UserLogs;
