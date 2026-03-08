import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign } from "lucide-react";

const HRReports = () => (
  <DashboardLayout title="Human Resource Reports" subtitle="Staff and payroll reports">
    <Tabs defaultValue="staff" className="space-y-6">
      <TabsList className="bg-muted/50 p-1">
        <TabsTrigger value="staff">Staff Report</TabsTrigger>
        <TabsTrigger value="payroll">Payroll Report</TabsTrigger>
      </TabsList>
      <TabsContent value="staff"><Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Staff Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="payroll"><Card><CardContent className="py-12 text-center text-muted-foreground"><DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Payroll Report - Coming Soon</p></CardContent></Card></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default HRReports;
