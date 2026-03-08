import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Calendar, Users } from "lucide-react";

const AttendanceReports = () => (
  <DashboardLayout title="Attendance Reports" subtitle="Student and staff attendance reports">
    <Tabs defaultValue="student" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
        <TabsTrigger value="student">Student Attendance</TabsTrigger>
        <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
        <TabsTrigger value="staff">Staff Attendance</TabsTrigger>
      </TabsList>

      <TabsContent value="student" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Student Attendance Report</CardTitle>
              <div className="flex items-center gap-2">
                <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{["Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                <Select><SelectTrigger className="w-32 h-9"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>{["January","February","March","April"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Present Days</p><p className="text-xl font-bold text-success">18</p></div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Absent Days</p><p className="text-xl font-bold text-destructive">2</p></div>
              <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Late Days</p><p className="text-xl font-bold text-warning">1</p></div>
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Attendance Rate</p><p className="text-xl font-bold text-primary">94.2%</p></div>
            </div>
            <p className="text-sm text-muted-foreground">Select a class and month to view detailed attendance data.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="daily"><Card><CardContent className="py-12 text-center text-muted-foreground"><Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Daily Attendance Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="staff"><Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Staff Attendance Report - Coming Soon</p></CardContent></Card></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default AttendanceReports;
