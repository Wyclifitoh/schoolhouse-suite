import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { students } from "@/data/mockData";
import { Download, Users, GraduationCap, UserCheck } from "lucide-react";

const StudentReports = () => (
  <DashboardLayout title="Student Reports" subtitle="Student information, class and admission reports">
    <Tabs defaultValue="student" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
        <TabsTrigger value="student">Student Report</TabsTrigger>
        <TabsTrigger value="class">Class & Stream</TabsTrigger>
        <TabsTrigger value="admission">Admission Report</TabsTrigger>
        <TabsTrigger value="gender">Gender Ratio</TabsTrigger>
      </TabsList>

      <TabsContent value="student" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Student Report</CardTitle>
              <div className="flex items-center gap-2">
                <Select><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{["All","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                <Select><SelectTrigger className="w-32 h-9"><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{students.length}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Male</p><p className="text-xl font-bold">{students.filter(s => s.gender === "Male").length}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Female</p><p className="text-xl font-bold">{students.filter(s => s.gender === "Female").length}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold">{students.filter(s => s.status === "active").length}</p></div>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Gender</TableHead><TableHead className="font-semibold">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>{students.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.admission_no}</TableCell>
                  <TableCell>{s.grade} {s.stream}</TableCell>
                  <TableCell>{s.gender}</TableCell>
                  <TableCell><Badge className={s.status === "active" ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{s.status}</Badge></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="class"><Card><CardContent className="py-12 text-center text-muted-foreground"><GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Class & Stream Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="admission"><Card><CardContent className="py-12 text-center text-muted-foreground"><UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Admission Report - Coming Soon</p></CardContent></Card></TabsContent>
      <TabsContent value="gender"><Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Gender Ratio Report - Coming Soon</p></CardContent></Card></TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default StudentReports;
