import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";

const TransportReports = () => (
  <DashboardLayout title="Transport Reports" subtitle="Transport route and vehicle reports">
    <Card><CardContent className="py-12 text-center text-muted-foreground"><Truck className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Transport Reports - Coming Soon</p></CardContent></Card>
  </DashboardLayout>
);

export default TransportReports;
