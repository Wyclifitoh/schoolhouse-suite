import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Truck, MapPin, Users } from "lucide-react";

const formatKES = (a: number) => `KES ${a.toLocaleString()}`;

const routes = [
  { id: "r1", name: "Route A — Westlands", vehicle: "KBZ 123A", driver: "Samuel Maina", capacity: 45, students: 38, distance: "12 km", fee: 8000, status: "active" },
  { id: "r2", name: "Route B — Kilimani", vehicle: "KCA 456B", driver: "Peter Njoroge", capacity: 40, students: 35, distance: "15 km", fee: 9000, status: "active" },
  { id: "r3", name: "Route C — Karen", vehicle: "KCB 789C", driver: "Joseph Wanyama", capacity: 50, students: 42, distance: "20 km", fee: 10000, status: "active" },
  { id: "r4", name: "Route D — Langata", vehicle: "KCC 012D", driver: "James Oduor", capacity: 40, students: 30, distance: "18 km", fee: 9500, status: "active" },
  { id: "r5", name: "Route E — Eastleigh", vehicle: "KCD 345E", driver: "Ali Hassan", capacity: 45, students: 40, distance: "10 km", fee: 7500, status: "maintenance" },
];

const totalStudents = routes.reduce((s, r) => s + r.students, 0);
const totalRevenue = routes.reduce((s, r) => s + (r.students * r.fee), 0);

const TransportReports = () => (
  <DashboardLayout title="Transport Reports" subtitle="Transport route and vehicle reports">
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Truck className="h-4 w-4 text-primary" />Transport Route Report</CardTitle>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Routes</p><p className="text-xl font-bold text-primary">{routes.length}</p></div>
          <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Students Using</p><p className="text-xl font-bold text-info">{totalStudents}</p></div>
          <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Revenue (Term)</p><p className="text-xl font-bold text-success">{formatKES(totalRevenue)}</p></div>
          <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Under Maintenance</p><p className="text-xl font-bold text-warning">{routes.filter(r => r.status === "maintenance").length}</p></div>
        </div>
        <Table><TableHeader><TableRow className="bg-muted/50">
          <TableHead className="font-semibold">Route</TableHead>
          <TableHead className="font-semibold">Vehicle</TableHead>
          <TableHead className="font-semibold">Driver</TableHead>
          <TableHead className="font-semibold">Distance</TableHead>
          <TableHead className="font-semibold text-center">Capacity</TableHead>
          <TableHead className="font-semibold text-center">Students</TableHead>
          <TableHead className="font-semibold text-right">Fee/Term</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
        </TableRow></TableHeader>
        <TableBody>{routes.map(r => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell className="font-mono text-sm text-muted-foreground">{r.vehicle}</TableCell>
            <TableCell className="text-muted-foreground">{r.driver}</TableCell>
            <TableCell className="text-muted-foreground">{r.distance}</TableCell>
            <TableCell className="text-center">{r.capacity}</TableCell>
            <TableCell className="text-center font-semibold">{r.students}</TableCell>
            <TableCell className="text-right font-semibold">{formatKES(r.fee)}</TableCell>
            <TableCell><Badge className={r.status === "active" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>{r.status}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent>
    </Card>
  </DashboardLayout>
);

export default TransportReports;
