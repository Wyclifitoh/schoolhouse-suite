import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Banknote, TrendingUp, CalendarCheck, FileText, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const StudentPanel = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Student Dashboard" subtitle="Your academic overview">
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Class</p><p className="text-lg font-bold text-foreground">—</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><TrendingUp className="h-5 w-5 text-success" /></div>
          <div><p className="text-xs text-muted-foreground">Last Exam</p><p className="text-lg font-bold text-foreground">—</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><CalendarCheck className="h-5 w-5 text-info" /></div>
          <div><p className="text-xs text-muted-foreground">Attendance</p><p className="text-lg font-bold text-foreground">—</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Banknote className="h-5 w-5 text-warning" /></div>
          <div><p className="text-xs text-muted-foreground">Fee Balance</p><p className="text-lg font-bold text-foreground">—</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="timetable" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>

        <TabsContent value="timetable">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">My Timetable</CardTitle></CardHeader>
            <CardContent>
              <p className="text-center py-8 text-sm text-muted-foreground">Timetable data will load from your class assignment.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">My Exam Results</CardTitle></CardHeader>
            <CardContent>
              <p className="text-center py-8 text-sm text-muted-foreground">No results available yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notices" className="space-y-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground">No notices available.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentPanel;
