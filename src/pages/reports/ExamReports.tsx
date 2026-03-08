import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Trophy } from "lucide-react";

const ExamReports = () => (
  <DashboardLayout title="Examination Reports" subtitle="Exam results and ranking reports">
    <Tabs defaultValue="exam" className="space-y-6">
      <TabsList className="bg-muted/50 p-1">
        <TabsTrigger value="exam">Examinations Report</TabsTrigger>
        <TabsTrigger value="rank">Rank Report</TabsTrigger>
      </TabsList>
      <TabsContent value="exam"><Card><CardContent className="py-12 text-center text-muted-foreground"><BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Examinations Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="rank"><Card><CardContent className="py-12 text-center text-muted-foreground"><Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Rank Report - Coming Soon</p></CardContent></Card></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default ExamReports;
