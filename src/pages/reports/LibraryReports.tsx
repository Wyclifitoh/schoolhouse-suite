import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, AlertCircle, Package, RotateCcw } from "lucide-react";

const LibraryReports = () => (
  <DashboardLayout title="Library Reports" subtitle="Book issue, due and inventory reports">
    <Tabs defaultValue="issue" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
        <TabsTrigger value="issue">Book Issue</TabsTrigger>
        <TabsTrigger value="due">Book Due</TabsTrigger>
        <TabsTrigger value="inventory">Book Inventory</TabsTrigger>
        <TabsTrigger value="return">Issue Return</TabsTrigger>
      </TabsList>
      <TabsContent value="issue"><Card><CardContent className="py-12 text-center text-muted-foreground"><BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Book Issue Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="due"><Card><CardContent className="py-12 text-center text-muted-foreground"><AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Book Due Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="inventory"><Card><CardContent className="py-12 text-center text-muted-foreground"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Book Inventory Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="return"><Card><CardContent className="py-12 text-center text-muted-foreground"><RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Book Issue Return Report - Coming Soon</p></CardContent></Card></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default LibraryReports;
