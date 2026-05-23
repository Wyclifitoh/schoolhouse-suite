import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useReportCardTemplates, useSaveReportCardTemplate, useDeleteReportCardTemplate,
  useReportCardRuns, useCreateReportRun, usePublishReportRun,
} from "@/hooks/useExamsExtended";
import { useExams } from "@/hooks/useExams";
import { useGrades } from "@/hooks/useGrades";
import { FileText, Plus, Send, Trash2 } from "lucide-react";

export default function ReportCards() {
  const { data: templates = [] } = useReportCardTemplates();
  const { data: runs = [] } = useReportCardRuns();
  const { data: exams = [] } = useExams();
  const { data: grades = [] } = useGrades();
  const saveTpl = useSaveReportCardTemplate();
  const delTpl = useDeleteReportCardTemplate();
  const createRun = useCreateReportRun();
  const publish = usePublishReportRun();

  const [tplName, setTplName] = useState("");
  const [tplKind, setTplKind] = useState<"CBC" | "844" | "HYBRID">("CBC");
  const [runExam, setRunExam] = useState("");
  const [runGrade, setRunGrade] = useState("");
  const [runTpl, setRunTpl] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" /> Report Cards
          </h1>
          <p className="text-muted-foreground">Manage report card templates and generate batches per class.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Template name" value={tplName} onChange={(e) => setTplName(e.target.value)} />
                <Select value={tplKind} onValueChange={(v: any) => setTplKind(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBC">CBC</SelectItem>
                    <SelectItem value="844">8-4-4</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => { if (tplName) { saveTpl.mutate({ name: tplName, kind: tplKind }); setTplName(""); } }}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Kind</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {(templates as any[]).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name} {t.is_default ? <Badge variant="outline" className="ml-1">default</Badge> : null}</TableCell>
                      <TableCell><Badge>{t.kind}</Badge></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => delTpl.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {!templates.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No templates yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Generate Run</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Select value={runExam} onValueChange={setRunExam}>
                  <SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger>
                  <SelectContent>{(exams as any[]).map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={runGrade} onValueChange={setRunGrade}>
                  <SelectTrigger><SelectValue placeholder="Class (optional)" /></SelectTrigger>
                  <SelectContent>{(grades as any[]).map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={runTpl} onValueChange={setRunTpl}>
                  <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
                  <SelectContent>{(templates as any[]).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button
                  disabled={!runExam || createRun.isPending}
                  onClick={() => createRun.mutate({ exam_id: runExam, grade_id: runGrade || null, template_id: runTpl || null })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Create Run
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Runs</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Generated</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {(runs as any[]).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.generated_at).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={r.status === "PUBLISHED" ? "default" : "outline"}>{r.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {r.status !== "PUBLISHED" && (
                        <Button size="sm" onClick={() => publish.mutate(r.id)}>
                          <Send className="h-4 w-4 mr-1" /> Publish
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!runs.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No runs.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
