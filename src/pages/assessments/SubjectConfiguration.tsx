import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AscPaper,
  useAssessmentSubjectConfig,
  useAssessmentSubjectConfigList,
  useResetAssessmentSubjectConfig,
  useUpdateAssessmentSubjectConfig,
} from "@/hooks/useAssessmentSubjectConfig";
import { useAssessment } from "@/hooks/useAssessments";
import {
  ArrowLeft,
  Lock,
  Pencil,
  RotateCcw,
  Settings2,
  Trash2,
  Plus,
} from "lucide-react";

const PAPER_TYPES = ["THEORY", "PRACTICAL", "ORAL", "PROJECT"];

export default function SubjectConfigurationPage() {
  const { id } = useParams();
  const { data: assessment } = useAssessment(id);
  const { data: rows = [], isLoading } = useAssessmentSubjectConfigList(id);
  const reset = useResetAssessmentSubjectConfig(id);

  const [editing, setEditing] = useState<{ grade_id: string; subject_id: string } | null>(
    null,
  );

  const grouped = useMemo(() => {
    const map = new Map<string, { grade_name: string; items: typeof rows }>();
    rows.forEach((r) => {
      const g = map.get(r.grade_id) || { grade_name: r.grade_name, items: [] };
      g.items.push(r);
      map.set(r.grade_id, g);
    });
    return Array.from(map, ([grade_id, v]) => ({ grade_id, ...v }));
  }, [rows]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Link
              to={`/assessments/${id}`}
              className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back to assessment
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2 mt-1">
              <Settings2 className="h-6 w-6 text-primary" />
              Assessment Subject Configuration
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Customise how a subject is scored <em>only for this assessment</em>.
              Changes never affect the master Subject Configuration. Once marks
              entry begins for a subject/class the snapshot locks automatically.
            </p>
          </div>
          {assessment && (
            <Badge variant="outline" className="text-sm">
              {assessment.name} · {(assessment as any).curriculum_type || "CBC"} ·{" "}
              {assessment.status}
            </Badge>
          )}
        </div>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}

        {grouped.map((grp) => (
          <Card key={grp.grade_id}>
            <CardHeader>
              <CardTitle className="text-lg">{grp.grade_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Structure</TableHead>
                    <TableHead>Grading system</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grp.items.map((r) => (
                    <TableRow key={r.subject_id}>
                      <TableCell>
                        <div className="font-medium">{r.subject_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.subject_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.uses_papers
                          ? `${r.paper_count} paper${r.paper_count === 1 ? "" : "s"}`
                          : "Single score"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.grading_system_id ? "Overridden" : "Inherited"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {r.is_customized ? (
                            <Badge variant="secondary">Customised</Badge>
                          ) : (
                            <Badge variant="outline">Default</Badge>
                          )}
                          {r.is_locked && (
                            <Badge className="bg-warning/20 text-warning-foreground flex gap-1">
                              <Lock className="h-3 w-3" /> Locked
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={r.is_locked}
                            onClick={() =>
                              setEditing({
                                grade_id: r.grade_id,
                                subject_id: r.subject_id,
                              })
                            }
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Customise
                          </Button>
                          {r.is_customized === 1 && !r.is_locked && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                reset.mutate({
                                  grade_id: r.grade_id,
                                  subject_id: r.subject_id,
                                })
                              }
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Reset
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {editing && (
          <EditDialog
            assessmentId={id!}
            gradeId={editing.grade_id}
            subjectId={editing.subject_id}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function EditDialog({
  assessmentId,
  gradeId,
  subjectId,
  onClose,
}: {
  assessmentId: string;
  gradeId: string;
  subjectId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useAssessmentSubjectConfig(
    assessmentId,
    gradeId,
    subjectId,
  );
  const save = useUpdateAssessmentSubjectConfig(assessmentId);

  const [usesPapers, setUsesPapers] = useState<boolean>(false);
  const [papers, setPapers] = useState<AscPaper[]>([]);
  const [inited, setInited] = useState(false);

  if (data && !inited) {
    setUsesPapers(!!data.uses_papers);
    setPapers(
      (data.papers || []).map((p) => ({
        paper_id: p.paper_id,
        name: p.name,
        code: p.code || "",
        paper_type: p.paper_type,
        max_marks: Number(p.max_marks),
        contribution_pct: Number(p.contribution_pct),
        display_order: p.display_order,
      })),
    );
    setInited(true);
  }

  const totalContribution = papers.reduce(
    (s, p) => s + (Number(p.contribution_pct) || 0),
    0,
  );
  const canAdd = papers.length < 3;

  const updatePaper = (i: number, patch: Partial<AscPaper>) => {
    setPapers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const addPaper = () => {
    if (!canAdd) return;
    setPapers((prev) => [
      ...prev,
      {
        name: `Paper ${prev.length + 1}`,
        paper_type: "THEORY",
        max_marks: 100,
        contribution_pct: 0,
        display_order: prev.length + 1,
      },
    ]);
  };

  const removePaper = (i: number) =>
    setPapers((prev) => prev.filter((_, idx) => idx !== i));

  const onSave = () => {
    save.mutate(
      {
        grade_id: gradeId,
        subject_id: subjectId,
        body: {
          uses_papers: (usesPapers ? 1 : 0) as 0 | 1,
          papers: usesPapers ? papers : [],
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Customise {data?.subject_name || "subject"} — {data?.grade_name || ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <p className="text-muted-foreground py-6">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm">Structure</label>
              <Select
                value={usesPapers ? "papers" : "single"}
                onValueChange={(v) => setUsesPapers(v === "papers")}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single composite score</SelectItem>
                  <SelectItem value="papers">Multiple papers / components</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {usesPapers && (
              <div className="space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-24">Out of</TableHead>
                      <TableHead className="w-32">Contribution %</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {papers.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Input
                            value={p.name}
                            onChange={(e) => updatePaper(i, { name: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={p.paper_type}
                            onValueChange={(v) => updatePaper(i, { paper_type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAPER_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={p.max_marks}
                            onChange={(e) =>
                              updatePaper(i, { max_marks: Number(e.target.value) })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={p.contribution_pct}
                            onChange={(e) =>
                              updatePaper(i, {
                                contribution_pct: Number(e.target.value),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePaper(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addPaper}
                    disabled={!canAdd}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add paper
                  </Button>
                  <div
                    className={`text-sm ${
                      Math.abs(totalContribution - 100) < 0.01
                        ? "text-success"
                        : "text-warning"
                    }`}
                  >
                    Total contribution: {totalContribution.toFixed(2)}% (should be 100%)
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Report cards display only the final subject result (percentage,
              grade, points). Paper-level detail is available in teacher and
              analysis views.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={save.isPending}>
            Save customisation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}