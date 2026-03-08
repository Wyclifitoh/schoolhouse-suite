import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Users, DollarSign } from "lucide-react";

const formatKES = (a: number) => `KES ${a.toLocaleString()}`;

const staffData = [
  { id: "st1", name: "Mr. Kamau", role: "Teacher", department: "Mathematics", designation: "Senior Teacher", gender: "Male", phone: "0722111222", joining: "2018-01-10", status: "active" },
  { id: "st2", name: "Mrs. Otieno", role: "Teacher", department: "English", designation: "Teacher", gender: "Female", phone: "0733222333", joining: "2019-05-15", status: "active" },
  { id: "st3", name: "Mr. Hassan", role: "Teacher", department: "Kiswahili", designation: "Teacher", gender: "Male", phone: "0744333444", joining: "2020-01-08", status: "active" },
  { id: "st4", name: "Dr. Mwangi", role: "Teacher", department: "Science", designation: "HOD", gender: "Male", phone: "0755444555", joining: "2016-09-01", status: "active" },
  { id: "st5", name: "Ms. Wambui", role: "Teacher", department: "Social Studies", designation: "Teacher", gender: "Female", phone: "0766555666", joining: "2021-01-05", status: "active" },
  { id: "st6", name: "Rev. Omondi", role: "Teacher", department: "CRE", designation: "Teacher", gender: "Male", phone: "0777666777", joining: "2017-04-20", status: "active" },
  { id: "st7", name: "Coach Kiprop", role: "Teacher", department: "PE", designation: "Coach", gender: "Male", phone: "0788777888", joining: "2019-01-15", status: "active" },
  { id: "st8", name: "Jane Kamau", role: "Admin", department: "Administration", designation: "Principal", gender: "Female", phone: "0799888999", joining: "2015-01-02", status: "active" },
  { id: "st9", name: "Mrs. Njuguna", role: "Teacher", department: "Mathematics", designation: "Teacher", gender: "Female", phone: "0700999000", joining: "2022-05-10", status: "active" },
  { id: "st10", name: "Mr. Wafula", role: "Teacher", department: "Agriculture", designation: "Teacher", gender: "Male", phone: "0711000111", joining: "2020-09-01", status: "on_leave" },
];

const payrollData = [
  { id: "pr1", name: "Mr. Kamau", role: "Senior Teacher", basic: 65000, allowances: 12000, deductions: 8500, net: 68500, status: "paid" },
  { id: "pr2", name: "Mrs. Otieno", role: "Teacher", basic: 55000, allowances: 10000, deductions: 7200, net: 57800, status: "paid" },
  { id: "pr3", name: "Mr. Hassan", role: "Teacher", basic: 50000, allowances: 8000, deductions: 6500, net: 51500, status: "paid" },
  { id: "pr4", name: "Dr. Mwangi", role: "HOD", basic: 85000, allowances: 18000, deductions: 12000, net: 91000, status: "paid" },
  { id: "pr5", name: "Ms. Wambui", role: "Teacher", basic: 45000, allowances: 7000, deductions: 5800, net: 46200, status: "paid" },
  { id: "pr6", name: "Rev. Omondi", role: "Teacher", basic: 58000, allowances: 10000, deductions: 7500, net: 60500, status: "paid" },
  { id: "pr7", name: "Coach Kiprop", role: "Coach", basic: 48000, allowances: 8000, deductions: 6200, net: 49800, status: "paid" },
  { id: "pr8", name: "Jane Kamau", role: "Principal", basic: 120000, allowances: 25000, deductions: 18000, net: 127000, status: "paid" },
  { id: "pr9", name: "Mrs. Njuguna", role: "Teacher", basic: 42000, allowances: 6000, deductions: 5400, net: 42600, status: "pending" },
  { id: "pr10", name: "Mr. Wafula", role: "Teacher", basic: 50000, allowances: 8000, deductions: 6500, net: 51500, status: "pending" },
];

const totalBasic = payrollData.reduce((s, p) => s + p.basic, 0);
const totalNet = payrollData.reduce((s, p) => s + p.net, 0);

const HRReports = () => (
  <DashboardLayout title="Human Resource Reports" subtitle="Staff and payroll reports">
    <Tabs defaultValue="staff" className="space-y-6">
      <TabsList className="bg-muted/50 p-1">
        <TabsTrigger value="staff">Staff Report</TabsTrigger>
        <TabsTrigger value="payroll">Payroll Report</TabsTrigger>
      </TabsList>

      {/* STAFF REPORT */}
      <TabsContent value="staff" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Staff Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Staff</p><p className="text-xl font-bold text-primary">{staffData.length}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Male</p><p className="text-xl font-bold">{staffData.filter(s => s.gender === "Male").length}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Female</p><p className="text-xl font-bold">{staffData.filter(s => s.gender === "Female").length}</p></div>
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-success">{staffData.filter(s => s.status === "active").length}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Designation</TableHead>
              <TableHead className="font-semibold">Joining Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{staffData.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.role}</TableCell>
                <TableCell><Badge variant="secondary">{s.department}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{s.designation}</TableCell>
                <TableCell className="text-muted-foreground">{s.joining}</TableCell>
                <TableCell><Badge className={s.status === "active" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>{s.status.replace("_", " ")}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* PAYROLL REPORT */}
      <TabsContent value="payroll" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Payroll Report — March 2024</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Basic</p><p className="text-xl font-bold text-primary">{formatKES(totalBasic)}</p></div>
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Total Net</p><p className="text-xl font-bold text-success">{formatKES(totalNet)}</p></div>
              <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Allowances</p><p className="text-xl font-bold text-info">{formatKES(payrollData.reduce((s, p) => s + p.allowances, 0))}</p></div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Deductions</p><p className="text-xl font-bold text-destructive">{formatKES(payrollData.reduce((s, p) => s + p.deductions, 0))}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold text-right">Basic</TableHead>
              <TableHead className="font-semibold text-right">Allowances</TableHead>
              <TableHead className="font-semibold text-right">Deductions</TableHead>
              <TableHead className="font-semibold text-right">Net Salary</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payrollData.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.role}</TableCell>
                  <TableCell className="text-right">{formatKES(p.basic)}</TableCell>
                  <TableCell className="text-right text-success">{formatKES(p.allowances)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatKES(p.deductions)}</TableCell>
                  <TableCell className="text-right font-bold">{formatKES(p.net)}</TableCell>
                  <TableCell><Badge className={p.status === "paid" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">{formatKES(totalBasic)}</TableCell>
                <TableCell className="text-right text-success">{formatKES(payrollData.reduce((s, p) => s + p.allowances, 0))}</TableCell>
                <TableCell className="text-right text-destructive">{formatKES(payrollData.reduce((s, p) => s + p.deductions, 0))}</TableCell>
                <TableCell className="text-right">{formatKES(totalNet)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default HRReports;
