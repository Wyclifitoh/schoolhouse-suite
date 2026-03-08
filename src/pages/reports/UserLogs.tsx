import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Users, LogIn, LogOut, Shield } from "lucide-react";

const userLogs = [
  { id: "ul1", user: "Jane Kamau", role: "Principal", action: "login", ip: "192.168.1.45", device: "Chrome / Windows", timestamp: "2024-03-15 07:30:12" },
  { id: "ul2", user: "Mr. Kamau", role: "Teacher", action: "login", ip: "192.168.1.52", device: "Safari / MacOS", timestamp: "2024-03-15 07:45:08" },
  { id: "ul3", user: "Jane Kamau", role: "Principal", action: "record_payment", ip: "192.168.1.45", device: "Chrome / Windows", timestamp: "2024-03-15 08:12:34" },
  { id: "ul4", user: "Mrs. Otieno", role: "Teacher", action: "login", ip: "192.168.1.60", device: "Chrome / Android", timestamp: "2024-03-15 08:15:20" },
  { id: "ul5", user: "Mr. Hassan", role: "Teacher", action: "login", ip: "192.168.1.71", device: "Firefox / Linux", timestamp: "2024-03-15 08:20:45" },
  { id: "ul6", user: "Jane Kamau", role: "Principal", action: "approve_expense", ip: "192.168.1.45", device: "Chrome / Windows", timestamp: "2024-03-15 09:05:17" },
  { id: "ul7", user: "Mr. Kamau", role: "Teacher", action: "mark_attendance", ip: "192.168.1.52", device: "Safari / MacOS", timestamp: "2024-03-15 09:10:30" },
  { id: "ul8", user: "Mrs. Otieno", role: "Teacher", action: "assign_homework", ip: "192.168.1.60", device: "Chrome / Android", timestamp: "2024-03-15 09:45:12" },
  { id: "ul9", user: "Jane Kamau", role: "Principal", action: "logout", ip: "192.168.1.45", device: "Chrome / Windows", timestamp: "2024-03-15 16:30:00" },
  { id: "ul10", user: "Mr. Kamau", role: "Teacher", action: "logout", ip: "192.168.1.52", device: "Safari / MacOS", timestamp: "2024-03-15 16:15:20" },
  { id: "ul11", user: "Mary Wanjiku", role: "Parent", action: "login", ip: "41.89.12.34", device: "Chrome / Android", timestamp: "2024-03-15 18:20:00" },
  { id: "ul12", user: "Mary Wanjiku", role: "Parent", action: "view_fees", ip: "41.89.12.34", device: "Chrome / Android", timestamp: "2024-03-15 18:22:15" },
];

const actionColor: Record<string, string> = {
  login: "bg-success/10 text-success border-0",
  logout: "bg-muted text-muted-foreground border-0",
  record_payment: "bg-primary/10 text-primary border-0",
  approve_expense: "bg-info/10 text-info border-0",
  mark_attendance: "bg-warning/10 text-warning border-0",
  assign_homework: "bg-info/10 text-info border-0",
  view_fees: "bg-muted text-muted-foreground border-0",
};

const UserLogs = () => (
  <DashboardLayout title="User Logs" subtitle="User login and activity logs">
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />User Activity Logs</CardTitle>
          <div className="flex items-center gap-2">
            <Input type="date" className="h-9 w-36" defaultValue="2024-03-15" />
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Logins Today</p><p className="text-xl font-bold text-success">{userLogs.filter(l => l.action === "login").length}</p></div>
          <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Actions</p><p className="text-xl font-bold text-primary">{userLogs.length}</p></div>
          <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Unique Users</p><p className="text-xl font-bold text-info">{new Set(userLogs.map(l => l.user)).size}</p></div>
          <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Roles Active</p><p className="text-xl font-bold">{new Set(userLogs.map(l => l.role)).size}</p></div>
        </div>
        <Table><TableHeader><TableRow className="bg-muted/50">
          <TableHead className="font-semibold">Timestamp</TableHead>
          <TableHead className="font-semibold">User</TableHead>
          <TableHead className="font-semibold">Role</TableHead>
          <TableHead className="font-semibold">Action</TableHead>
          <TableHead className="font-semibold">IP Address</TableHead>
          <TableHead className="font-semibold">Device</TableHead>
        </TableRow></TableHeader>
        <TableBody>{userLogs.map(l => (
          <TableRow key={l.id}>
            <TableCell className="font-mono text-xs text-muted-foreground">{l.timestamp}</TableCell>
            <TableCell className="font-medium">{l.user}</TableCell>
            <TableCell><Badge variant="secondary">{l.role}</Badge></TableCell>
            <TableCell><Badge className={actionColor[l.action] || "bg-muted text-muted-foreground border-0"}>{l.action.replace("_", " ")}</Badge></TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{l.ip}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{l.device}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent>
    </Card>
  </DashboardLayout>
);

export default UserLogs;
