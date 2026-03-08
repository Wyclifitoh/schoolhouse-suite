import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardCheck, FileText } from "lucide-react";

const HomeworkReports = () => (
  <DashboardLayout title="Homework Reports" subtitle="Homework assignment and evaluation reports">
    <Tabs defaultValue="homework" className="space-y-6">
      <TabsList className="bg-muted/50 p-1">
        <TabsTrigger value="homework">Homework Report</TabsTrigger>
        <TabsTrigger value="evaluation">Evaluation Report</TabsTrigger>
        <TabsTrigger value="daily">Daily Assignment</TabsTrigger>
      </TabsList>
      <TabsContent value="homework"><Card><CardContent className="py-12 text-center text-muted-foreground"><BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Homework Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="evaluation"><Card><CardContent className="py-12 text-center text-muted-foreground"><ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Homework Evaluation Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="daily"><Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Daily Assignment Report - Coming Soon</p></CardContent></Card></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default HomeworkReports;
