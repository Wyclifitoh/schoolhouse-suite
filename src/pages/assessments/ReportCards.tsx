import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRcTemplates,
  useSaveRcTemplate,
  useDeleteRcTemplate,
  useRcRuns,
  useCreateRcRun,
  usePublishRcRun,
  useRcCards,
  useAssessmentsList,
  useDownloadReportCardPdf,
  useDownloadRunZip,
  useDownloadRunCombinedPdf,
  useDeleteReportCardRun,
} from "@/hooks/useAssessments";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useGrades } from "@/hooks/useGrades";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileBadge,
  Plus,
  Send,
  Trash2,
  Download,
  FileText,
  FolderArchive,
  Eye,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

const APPROVER_ROLES = [
  "super_admin",
  "admin",
  "school_admin",
  "deputy_admin",
  "manager",
];

export default function ReportCardsV2() {
  const { data: templates = [] } = useRcTemplates();
  const { data: runs = [] } = useRcRuns();
  const { data: assessments = [] } = useAssessmentsList();
  const { data: grades = [] } = useGrades();
  const saveTpl = useSaveRcTemplate();
  const delTpl = useDeleteRcTemplate();
  const createRun = useCreateRcRun();
  const publish = usePublishRcRun();
  const downloadZip = useDownloadRunZip();
  const downloadPdf = useDownloadRunCombinedPdf();
  const deleteRun = useDeleteReportCardRun();
  const [viewRunId, setViewRunId] = useState<string | null>(null);

  const { hasAnyRole } = useAuth();
  const canApprove = hasAnyRole(APPROVER_ROLES as any);

  const [tplName, setTplName] = useState("");
  const [tplKind, setTplKind] = useState<"CBC" | "844" | "HYBRID">("CBC");
  const [showPos, setShowPos] = useState(false);
  const [showBand, setShowBand] = useState(true);
  const [showComp, setShowComp] = useState(true);

  const [runAssess, setRunAssess] = useState("");
  const [runGrade, setRunGrade] = useState("");
  const [runTpl, setRunTpl] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileBadge className="h-7 w-7 text-primary" /> Report Cards
          </h1>
          <p className="text-muted-foreground">
            CBE-compliant templates and per-class batch generation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Templates */}
          {canApprove && (
            <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Template name"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                  />
                  <Select
                    value={tplKind}
                    onValueChange={(v: any) => setTplKind(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBC">CBE</SelectItem>
                      <SelectItem value="844">8-4-4</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <Label className="flex items-center gap-2">
                    <Switch checked={showPos} onCheckedChange={setShowPos} />
                    Show position
                  </Label>
                  <Label className="flex items-center gap-2">
                    <Switch checked={showBand} onCheckedChange={setShowBand} />
                    Show CBE band
                  </Label>
                  <Label className="flex items-center gap-2">
                    <Switch checked={showComp} onCheckedChange={setShowComp} />
                    Show competencies
                  </Label>
                </div>
                <Button
                  className="w-full"
                  disabled={!tplName || saveTpl.isPending}
                  onClick={() => {
                    saveTpl.mutate(
                      {
                        name: tplName,
                        kind: tplKind,
                        show_position: showPos,
                        show_band: showBand,
                        show_competencies: showComp,
                      },
                      { onSuccess: () => setTplName("") },
                    );
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add template
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Shows</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.name}
                        {t.is_default && (
                          <Badge variant="outline" className="ml-1">
                            default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge>{t.kind === "CBC" ? "CBE" : t.kind}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[
                          t.show_position && "position",
                          t.show_band && "band",
                          t.show_competencies && "competencies",
                        ]
                          .filter(Boolean)
                          .join(", ") || "minimal"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => delTpl.mutate(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!templates.length && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No templates yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          )}

          {/* Generate run */}
          {canApprove && (
            <Card>
            <CardHeader>
              <CardTitle>Generate batch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Assessment</Label>
                <Select value={runAssess} onValueChange={setRunAssess}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Class (optional)</Label>
                <Select
                  value={runGrade || "all"}
                  onValueChange={(v) => setRunGrade(v === "all" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {grades.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Template</Label>
                <Select value={runTpl} onValueChange={setRunTpl}>
                  <SelectTrigger>
                    <SelectValue placeholder="Default template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!runAssess || createRun.isPending}
                onClick={() =>
                  createRun.mutate({
                    assessment_id: runAssess,
                    grade_id: runGrade || null,
                    template_id: runTpl || null,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                {createRun.isPending ? "Generating…" : "Generate report cards"}
              </Button>
              <p className="text-xs text-muted-foreground">
                This auto-computes results, then snapshots a card per student.
              </p>
            </CardContent>
          </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Cards</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.assessment_name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.grade_name || "All"}
                    </TableCell>
                    <TableCell>{r.total_cards}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(r.generated_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "published" ? "default" : "outline"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewRunId(r.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadZip.isPending || !r.total_cards}
                          onClick={() => downloadZip.mutate({ runId: r.id })}
                        >
                          <FolderArchive className="h-4 w-4 mr-1" /> ZIP
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadPdf.isPending || !r.total_cards}
                          onClick={() => downloadPdf.mutate({ runId: r.id })}
                          title="Download all cards as one PDF"
                        >
                          <FileText className="h-4 w-4 mr-1" /> PDF
                        </Button>
                        {r.status !== "published" && canApprove && (
                          <Button
                            size="sm"
                            disabled={publish.isPending}
                            onClick={() => publish.mutate(r.id)}
                          >
                            <Send className="h-4 w-4 mr-1" /> Publish
                          </Button>
                        )}
                        {canApprove && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deleteRun.isPending}
                            onClick={() => {
                            if (
                              confirm(
                                "Delete this run and all its generated report cards?",
                              )
                            )
                              deleteRun.mutate(r.id);
                          }}
                          title="Delete run"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!runs.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No runs yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RunCardsDialog runId={viewRunId} onClose={() => setViewRunId(null)} />
    </DashboardLayout>
  );
}

function RunCardsDialog({
  runId,
  onClose,
}: {
  runId: string | null;
  onClose: () => void;
}) {
  const { data: cards = [] } = useRcCards(runId || undefined);
  const dl = useDownloadReportCardPdf();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [teacherRemark, setTeacherRemark] = useState("");
  const [principalRemark, setPrincipalRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = (c: any) => {
    setEditing(c);
    setTeacherRemark(c.teacher_remarks || "");
    setPrincipalRemark(c.principal_remarks || "");
  };
  const saveRemarks = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/assessments/report-cards/cards/${editing.id}/remarks`, {
        teacher_remarks: teacherRemark,
        principal_remarks: principalRemark,
      });
      toast.success("Remarks saved");
      qc.invalidateQueries({ queryKey: ["rc-cards"] });
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save remarks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={!!runId} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report cards in this run</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Adm #</TableHead>
                  <TableHead className="text-right">Mean %</TableHead>
                  <TableHead>AL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(cards as any[]).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.first_name} {c.last_name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.admission_number}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(c.percentage || 0).toFixed(1)}
                    </TableCell>
                    <TableCell>
                      {c.overall_al ? (
                        <Badge variant="outline">{c.overall_al}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.published ? "default" : "outline"}>
                        {c.published ? "published" : "draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(c)}
                        >
                          Remarks
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={dl.isPending}
                          onClick={() =>
                            dl.mutate({
                              cardId: c.id,
                              name: `${c.first_name}_${c.last_name}_${c.admission_number}`,
                            })
                          }
                        >
                          <FileText className="h-4 w-4 mr-1" /> PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!cards.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No cards.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Edit remarks{" "}
              {editing ? `— ${editing.first_name} ${editing.last_name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Class Teacher's Remarks</Label>
              <Textarea
                rows={3}
                value={teacherRemark}
                onChange={(e) => setTeacherRemark(e.target.value)}
                placeholder="Auto-generated remark — edit if needed"
              />
            </div>
            <div>
              <Label className="text-xs">
                Principal / Headteacher's Remarks
              </Label>
              <Textarea
                rows={3}
                value={principalRemark}
                onChange={(e) => setPrincipalRemark(e.target.value)}
                placeholder="Auto-generated remark — edit if needed"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={saveRemarks} disabled={saving}>
                {saving ? "Saving…" : "Save remarks"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
