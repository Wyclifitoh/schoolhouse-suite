import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

const AuditTrail = () => (
  <DashboardLayout title="Audit Trail Report" subtitle="System audit trail and change history">
    <Card><CardContent className="py-12 text-center text-muted-foreground"><Shield className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Audit Trail Report - Coming Soon</p></CardContent></Card>
  </DashboardLayout>
);

export default AuditTrail;
