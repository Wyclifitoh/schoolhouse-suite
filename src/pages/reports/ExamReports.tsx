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
const marksRegister: any[] = [];
const exams: any[] = [];
import { Download, BarChart3, Trophy } from "lucide-react";

const sorted = [...marksRegister].sort((a, b) => a.rank - b.rank);

const ExamReports = () => (
  <DashboardLayout title="Examination Reports" subtitle="Exam results and ranking reports">
    <Tabs defaultValue="exam" className="space-y-6">
      <TabsList className="bg-muted/50 p-1">
        <TabsTrigger value="exam">Examinations Report</TabsTrigger>
        <TabsTrigger value="rank">Rank Report</TabsTrigger>
      </TabsList>

      {/* EXAMINATIONS REPORT */}
      <TabsContent value="exam" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Examinations Report</CardTitle>
              <div className="flex items-center gap-2">
                <Select><SelectTrigger className="w-44 h-9"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                  <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Students</p><p className="text-xl font-bold text-primary">{marksRegister.length}</p></div>
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Highest</p><p className="text-xl font-bold text-success">{Math.max(...marksRegister.map(m => m.percentage))}%</p></div>
              <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Average</p><p className="text-xl font-bold text-warning">{(marksRegister.reduce((s, m) => s + m.percentage, 0) / marksRegister.length).toFixed(1)}%</p></div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Lowest</p><p className="text-xl font-bold text-destructive">{Math.min(...marksRegister.map(m => m.percentage))}%</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Adm No.</TableHead>
              <TableHead className="font-semibold text-center">Math</TableHead>
              <TableHead className="font-semibold text-center">Eng</TableHead>
              <TableHead className="font-semibold text-center">Kis</TableHead>
              <TableHead className="font-semibold text-center">Sci</TableHead>
              <TableHead className="font-semibold text-center">SST</TableHead>
              <TableHead className="font-semibold text-center">CRE</TableHead>
              <TableHead className="font-semibold text-center">Total</TableHead>
              <TableHead className="font-semibold text-center">%</TableHead>
              <TableHead className="font-semibold text-center">Grade</TableHead>
            </TableRow></TableHeader>
            <TableBody>{sorted.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.student}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{m.admission_no}</TableCell>
                <TableCell className="text-center">{m.math}</TableCell>
                <TableCell className="text-center">{m.english}</TableCell>
                <TableCell className="text-center">{m.kiswahili}</TableCell>
                <TableCell className="text-center">{m.science}</TableCell>
                <TableCell className="text-center">{m.social_studies}</TableCell>
                <TableCell className="text-center">{m.cre}</TableCell>
                <TableCell className="text-center font-bold">{m.total}</TableCell>
                <TableCell className="text-center font-semibold">{m.percentage}%</TableCell>
                <TableCell className="text-center"><Badge className={m.percentage >= 75 ? "bg-success/10 text-success border-0" : m.percentage >= 50 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>{m.grade}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* RANK REPORT */}
      <TabsContent value="rank" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" />Rank Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-center w-16">Rank</TableHead>
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Adm No.</TableHead>
              <TableHead className="font-semibold text-center">Total</TableHead>
              <TableHead className="font-semibold text-center">Percentage</TableHead>
              <TableHead className="font-semibold text-center">Grade</TableHead>
            </TableRow></TableHeader>
            <TableBody>{sorted.map((m, i) => (
              <TableRow key={m.id} className={i < 3 ? "bg-warning/5" : ""}>
                <TableCell className="text-center">
                  {i === 0 ? <span className="text-lg">🥇</span> : i === 1 ? <span className="text-lg">🥈</span> : i === 2 ? <span className="text-lg">🥉</span> : <span className="font-bold text-muted-foreground">{m.rank}</span>}
                </TableCell>
                <TableCell className="font-medium">{m.student}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{m.admission_no}</TableCell>
                <TableCell className="text-center font-bold">{m.total}/600</TableCell>
                <TableCell className="text-center font-semibold">{m.percentage}%</TableCell>
                <TableCell className="text-center"><Badge className={m.percentage >= 75 ? "bg-success/10 text-success border-0" : m.percentage >= 50 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>{m.grade}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default ExamReports;
