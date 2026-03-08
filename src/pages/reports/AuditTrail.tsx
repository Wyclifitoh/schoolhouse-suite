import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, Shield } from "lucide-react";

const auditData = [
  { id: "at1", timestamp: "2024-03-15 14:23:45", user: "Jane Kamau", action: "CREATE", entity: "Payment", entity_id: "PAY-00123", description: "Recorded payment of KES 15,000 for Amina Wanjiku", ip: "192.168.1.45" },
  { id: "at2", timestamp: "2024-03-15 12:10:30", user: "Jane Kamau", action: "UPDATE", entity: "Expense", entity_id: "EXP-00089", description: "Approved expense 'Science Lab Equipment' KES 65,000", ip: "192.168.1.45" },
  { id: "at3", timestamp: "2024-03-15 09:05:17", user: "Jane Kamau", action: "UPDATE", entity: "Student Fee", entity_id: "SF-00456", description: "Applied 15% sibling discount to Joy Wanjiku", ip: "192.168.1.45" },
  { id: "at4", timestamp: "2024-03-14 16:45:00", user: "System", action: "CREATE", entity: "M-Pesa Transaction", entity_id: "MPE-00078", description: "M-Pesa callback received: KES 10,000 from 0789***345", ip: "—" },
  { id: "at5", timestamp: "2024-03-14 11:30:22", user: "Mr. Kamau", action: "UPDATE", entity: "Attendance", entity_id: "ATT-20240314", description: "Marked attendance for Grade 8 East (45 students)", ip: "192.168.1.52" },
  { id: "at6", timestamp: "2024-03-14 10:15:00", user: "Jane Kamau", action: "CREATE", entity: "Student", entity_id: "STU-00010", description: "Enrolled new student Kevin Otieno in Grade 8 West", ip: "192.168.1.45" },
  { id: "at7", timestamp: "2024-03-13 15:20:45", user: "Jane Kamau", action: "DELETE", entity: "Fee Template", entity_id: "FT-00003", description: "Removed deprecated 'Sports Levy' fee template", ip: "192.168.1.45" },
  { id: "at8", timestamp: "2024-03-13 09:00:10", user: "Mrs. Otieno", action: "CREATE", entity: "Homework", entity_id: "HW-00045", description: "Assigned 'Essay Writing' to Grade 8 East, due 2024-03-15", ip: "192.168.1.60" },
  { id: "at9", timestamp: "2024-03-12 14:30:00", user: "System", action: "CREATE", entity: "SMS", entity_id: "SMS-00112", description: "Fee reminder sent to 15 parents with outstanding balances", ip: "—" },
  { id: "at10", timestamp: "2024-03-12 08:45:30", user: "Jane Kamau", action: "UPDATE", entity: "Staff", entity_id: "STF-00004", description: "Updated salary for Dr. Mwangi: KES 80,000 → KES 85,000", ip: "192.168.1.45" },
  { id: "at11", timestamp: "2024-03-11 16:00:00", user: "Jane Kamau", action: "UPDATE", entity: "School Settings", entity_id: "SCH-001", description: "Updated school term dates for Term 2 2024", ip: "192.168.1.45" },
  { id: "at12", timestamp: "2024-03-11 10:20:15", user: "Rev. Omondi", action: "CREATE", entity: "Leave", entity_id: "LV-00008", description: "Applied for sick leave: 2024-03-18 to 2024-03-20", ip: "192.168.1.71" },
];

const actionColor: Record<string, string> = {
  CREATE: "bg-success/10 text-success border-0",
  UPDATE: "bg-info/10 text-info border-0",
  DELETE: "bg-destructive/10 text-destructive border-0",
};

const AuditTrail = () => (
  <DashboardLayout title="Audit Trail Report" subtitle="System audit trail and change history">
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Audit Trail</CardTitle>
          <div className="flex items-center gap-2">
            <Input type="date" className="h-9 w-36" defaultValue="2024-03-11" />
            <span className="text-sm text-muted-foreground">to</span>
            <Input type="date" className="h-9 w-36" defaultValue="2024-03-15" />
            <Select><SelectTrigger className="w-32 h-9"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="CREATE">Create</SelectItem><SelectItem value="UPDATE">Update</SelectItem><SelectItem value="DELETE">Delete</SelectItem></SelectContent></Select>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Events</p><p className="text-xl font-bold text-primary">{auditData.length}</p></div>
          <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Creates</p><p className="text-xl font-bold text-success">{auditData.filter(a => a.action === "CREATE").length}</p></div>
          <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Updates</p><p className="text-xl font-bold text-info">{auditData.filter(a => a.action === "UPDATE").length}</p></div>
          <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Deletes</p><p className="text-xl font-bold text-destructive">{auditData.filter(a => a.action === "DELETE").length}</p></div>
        </div>
        <Table><TableHeader><TableRow className="bg-muted/50">
          <TableHead className="font-semibold">Timestamp</TableHead>
          <TableHead className="font-semibold">User</TableHead>
          <TableHead className="font-semibold">Action</TableHead>
          <TableHead className="font-semibold">Entity</TableHead>
          <TableHead className="font-semibold">Description</TableHead>
          <TableHead className="font-semibold">IP</TableHead>
        </TableRow></TableHeader>
        <TableBody>{auditData.map(a => (
          <TableRow key={a.id}>
            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{a.timestamp}</TableCell>
            <TableCell className="font-medium">{a.user}</TableCell>
            <TableCell><Badge className={actionColor[a.action]}>{a.action}</Badge></TableCell>
            <TableCell><Badge variant="secondary">{a.entity}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-xs">{a.description}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{a.ip}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent>
    </Card>
  </DashboardLayout>
);

export default AuditTrail;
