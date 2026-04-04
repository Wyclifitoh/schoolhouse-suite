import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Users, DollarSign } from "lucide-react";
import { useHRReportData } from "@/hooks/useReports";

const formatKES = (a: number) => `KES ${(a || 0).toLocaleString()}`;
const LoadingSkeleton = () => <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
const EmptyState = ({ message }: { message: string }) => <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>;

const HRReports = () => {
  const { data: report, isLoading } = useHRReportData();
  const staff = report?.staff || [];
  const payroll = report?.payroll || [];

  return (
    <DashboardLayout title="HR Reports" subtitle="Staff directory and payroll reports">
      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="bg-muted/50 p-1"><TabsTrigger value="staff">Staff Directory</TabsTrigger><TabsTrigger value="payroll">Payroll Report</TabsTrigger></TabsList>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Staff Directory Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : staff.length === 0 ? <EmptyState message="No staff records found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Designation</TableHead><TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{staff.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                    <TableCell>{s.department_name || "—"}</TableCell>
                    <TableCell>{s.designation || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{s.phone || "—"}</TableCell>
                    <TableCell><Badge className={s.status === "active" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Payroll Report</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : payroll.length === 0 ? <EmptyState message="No payroll records found" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Staff</TableHead><TableHead className="font-semibold text-right">Basic</TableHead>
                  <TableHead className="font-semibold text-right">Allowances</TableHead><TableHead className="font-semibold text-right">Deductions</TableHead>
                  <TableHead className="font-semibold text-right">Net</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{payroll.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.staff_name || "—"}</TableCell>
                    <TableCell className="text-right">{formatKES(p.basic_salary)}</TableCell>
                    <TableCell className="text-right text-success">{formatKES(p.allowances)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatKES(p.deductions)}</TableCell>
                    <TableCell className="text-right font-bold">{formatKES(p.net_salary)}</TableCell>
                    <TableCell><Badge className="bg-success/10 text-success border-0">{p.payment_status || "paid"}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default HRReports;
