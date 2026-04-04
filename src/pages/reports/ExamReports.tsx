import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, BarChart3, Trophy } from "lucide-react";
import { useExamReportData } from "@/hooks/useReports";

const LoadingSkeleton = () => (
  <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
);
const EmptyState = ({ message }: { message: string }) => (
  <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>
);

const ExamReports = () => {
  const [examId, setExamId] = useState("");
  const { data: report, isLoading } = useExamReportData({ examId });

  const exams = report?.exams || [];
  const marksRegister = report?.marksRegister || [];
  const sorted = [...marksRegister].sort((a: any, b: any) => (a.rank || 999) - (b.rank || 999));
  const summary = report?.summary || { count: 0, highest: 0, average: 0, lowest: 0 };

  return (
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Examinations Report</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={examId} onValueChange={setExamId}>
                    <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Exams</SelectItem>
                      {exams.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Students</p><p className="text-xl font-bold text-primary">{summary.count}</p></div>
                <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Highest</p><p className="text-xl font-bold text-success">{summary.highest}%</p></div>
                <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Average</p><p className="text-xl font-bold text-warning">{summary.average}%</p></div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Lowest</p><p className="text-xl font-bold text-destructive">{summary.lowest}%</p></div>
              </div>
              {isLoading ? <LoadingSkeleton /> : sorted.length === 0 ? <EmptyState message="No exam results found. Create exams and enter marks first." /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead>
                  <TableHead className="font-semibold text-center">Total</TableHead><TableHead className="font-semibold text-center">%</TableHead>
                  <TableHead className="font-semibold text-center">Grade</TableHead>
                </TableRow></TableHeader>
                <TableBody>{sorted.map((m: any) => (
                  <TableRow key={m.id || m.student_id}>
                    <TableCell className="font-medium">{m.student_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.admission_no}</TableCell>
                    <TableCell className="text-center font-bold">{m.total}</TableCell>
                    <TableCell className="text-center font-semibold">{m.percentage}%</TableCell>
                    <TableCell className="text-center"><Badge className={(m.percentage || 0) >= 75 ? "bg-success/10 text-success border-0" : (m.percentage || 0) >= 50 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>{m.grade}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
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
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : sorted.length === 0 ? <EmptyState message="No ranking data available" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-center w-16">Rank</TableHead><TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Adm No.</TableHead><TableHead className="font-semibold text-center">Total</TableHead>
                  <TableHead className="font-semibold text-center">%</TableHead><TableHead className="font-semibold text-center">Grade</TableHead>
                </TableRow></TableHeader>
                <TableBody>{sorted.map((m: any, i: number) => (
                  <TableRow key={m.id || m.student_id} className={i < 3 ? "bg-warning/5" : ""}>
                    <TableCell className="text-center">
                      {i === 0 ? <span className="text-lg">🥇</span> : i === 1 ? <span className="text-lg">🥈</span> : i === 2 ? <span className="text-lg">🥉</span> : <span className="font-bold text-muted-foreground">{m.rank || i + 1}</span>}
                    </TableCell>
                    <TableCell className="font-medium">{m.student_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.admission_no}</TableCell>
                    <TableCell className="text-center font-bold">{m.total}</TableCell>
                    <TableCell className="text-center font-semibold">{m.percentage}%</TableCell>
                    <TableCell className="text-center"><Badge className={(m.percentage || 0) >= 75 ? "bg-success/10 text-success border-0" : (m.percentage || 0) >= 50 ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>{m.grade}</Badge></TableCell>
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

export default ExamReports;
