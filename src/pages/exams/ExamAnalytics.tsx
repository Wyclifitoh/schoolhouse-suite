import { useState } from "react";
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
import { useExams } from "@/hooks/useExams";
import { useExamAnalytics, useRecomputeRankings } from "@/hooks/useExamsExtended";
import { BarChart3, RefreshCw, TrendingUp, Trophy, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ExamAnalytics() {
  const { data: exams = [] } = useExams();
  const [examId, setExamId] = useState<string>("");
  const [showRanks, setShowRanks] = useState(true);
  const { data, isLoading } = useExamAnalytics(examId);
  const recompute = useRecomputeRankings();

  const summary = data?.summary;
  const subjects = data?.subjects || [];
  const students = data?.students || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" /> Exam Analytics
            </h1>
            <p className="text-muted-foreground">Means, rankings, and competency insights — session-scoped.</p>
          </div>
          <div className="flex items-end gap-3">
            <div className="min-w-[260px]">
              <Label className="text-xs text-muted-foreground">Exam</Label>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger><SelectValue placeholder="Choose exam" /></SelectTrigger>
                <SelectContent>
                  {(exams as any[]).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showRanks} onCheckedChange={setShowRanks} id="ranks" />
              <Label htmlFor="ranks" className="text-xs">Show rankings (disable for CBC policy)</Label>
            </div>
            <Button variant="outline" disabled={!examId || recompute.isPending} onClick={() => recompute.mutate(examId)}>
              <RefreshCw className="h-4 w-4 mr-1" /> Recompute
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Marks", value: summary?.marks_count ?? 0, icon: Users },
            { label: "Mean", value: summary?.mean_score?.toFixed?.(2) ?? "—", icon: TrendingUp },
            { label: "Highest", value: summary?.max_score ?? "—", icon: Trophy },
            { label: "Passed", value: summary?.passed ?? 0, icon: Trophy },
          ].map((c, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-2xl font-bold">{c.value as any}</div>
                </div>
                <c.icon className="h-6 w-6 text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Subject Means</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Subject</TableHead><TableHead>Mean</TableHead><TableHead>N</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((s: any) => (
                    <TableRow key={s.subject_name}>
                      <TableCell>{s.subject_name}</TableCell>
                      <TableCell><Badge variant="outline">{Number(s.mean).toFixed(2)}</Badge></TableCell>
                      <TableCell>{s.n}</TableCell>
                    </TableRow>
                  ))}
                  {!subjects.length && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">{isLoading ? "Loading…" : "No data."}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Student Performance</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {showRanks && <TableHead className="w-12">#</TableHead>}
                    <TableHead>Student</TableHead>
                    <TableHead>Mean</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s: any, i: number) => (
                    <TableRow key={s.student_id}>
                      {showRanks && <TableCell><Badge>{i + 1}</Badge></TableCell>}
                      <TableCell>{s.student_name}</TableCell>
                      <TableCell>{Number(s.mean).toFixed(2)}</TableCell>
                      <TableCell>{Number(s.total).toFixed(0)}</TableCell>
                    </TableRow>
                  ))}
                  {!students.length && (
                    <TableRow><TableCell colSpan={showRanks ? 4 : 3} className="text-center text-muted-foreground">{isLoading ? "Loading…" : "No data."}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
