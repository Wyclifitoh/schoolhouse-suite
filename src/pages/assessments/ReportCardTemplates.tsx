import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useRcTemplates,
  useSaveRcTemplate,
  useDeleteRcTemplate,
  type ReportCardTemplate,
} from "@/hooks/useAssessments";
import { useSchool } from "@/contexts/SchoolContext";
import { api } from "@/lib/api";
import { resolveLogoUrl } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileBadge,
  Plus,
  Pencil,
  Trash2,
  Palette,
  Save,
  Eye,
} from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";

interface SchoolProfile {
  id: string;
  name: string;
  code: string | null;
  logo_url: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
}

function useSchoolProfile() {
  return useQuery({
    queryKey: ["school-profile"],
    queryFn: async () => {
      const res = await api.get<any>("/schools/profile");
      return (res?.data ?? res) as SchoolProfile;
    },
  });
}

function useUpdateSchoolProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SchoolProfile>) =>
      api.put("/schools/profile", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-profile"] });
      qc.invalidateQueries({ queryKey: ["accessible-schools"] });
      toast.success("Branding saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

const EMPTY: Partial<ReportCardTemplate> = {
  name: "",
  kind: "CBC",
  header_title: "",
  header_subtitle: "",
  show_position: false,
  show_band: true,
  show_competencies: true,
  show_teacher_remarks: true,
  show_principal_remarks: true,
  is_default: false,
};

export default function ReportCardTemplates() {
  const { data: templates = [], isLoading } = useRcTemplates();
  const save = useSaveRcTemplate();
  const del = useDeleteRcTemplate();

  const { data: school } = useSchoolProfile();
  const updateSchool = useUpdateSchoolProfile();
  const { currentSchool } = useSchool();

  // Branding form state
  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  useEffect(() => {
    setLogoUrl(resolveLogoUrl(school?.logo_url) || "");
    setAddress(school?.address || "");
  }, [school]);

  // Template dialog
  const [editing, setEditing] = useState<Partial<ReportCardTemplate> | null>(
    null,
  );
  const [previewing, setPreviewing] = useState<ReportCardTemplate | null>(null);

  const onSubmitTemplate = () => {
    if (!editing?.name) return toast.error("Template name is required");
    save.mutate(editing as any, { onSuccess: () => setEditing(null) });
  };

  return (
    <DashboardLayout
      title="Report Card Templates"
      subtitle="Manage school branding and report card layout before publishing runs"
    >
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileBadge className="h-4 w-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5">
            <Palette className="h-4 w-4" /> School Branding
          </TabsTrigger>
        </TabsList>

        {/* ---------- TEMPLATES ---------- */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Templates
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Layout fields shown on every generated report card.
                </p>
              </div>
              <PermissionGate permission="settings:update">
                <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
                  <Plus className="h-4 w-4 mr-1.5" /> New Template
                </Button>
              </PermissionGate>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Header</TableHead>
                    <TableHead>Toggles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : templates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No templates yet. Click <strong>New Template</strong> to
                        create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.name}{" "}
                          {t.is_default && (
                            <Badge variant="secondary" className="ml-1">
                              default
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.kind}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">
                            {t.header_title || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.header_subtitle || ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {t.show_position && (
                              <Badge variant="outline">Position</Badge>
                            )}
                            {t.show_band && (
                              <Badge variant="outline">Band</Badge>
                            )}
                            {t.show_competencies && (
                              <Badge variant="outline">Competencies</Badge>
                            )}
                            {t.show_teacher_remarks && (
                              <Badge variant="outline">Teacher</Badge>
                            )}
                            {t.show_principal_remarks && (
                              <Badge variant="outline">Principal</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setPreviewing(t)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <PermissionGate permission="settings:update">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditing(t)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  if (confirm(`Delete "${t.name}"?`))
                                    del.mutate(t.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </PermissionGate>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- BRANDING ---------- */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                School Branding
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                These appear in every report card PDF and analytics export.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 max-w-3xl">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School name</Label>
                  <Input
                    value={school?.name || currentSchool?.name || ""}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>School code</Label>
                  <Input value={school?.code || ""} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  placeholder="https://…/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
                {logoUrl && (
                  <div className="mt-2 p-3 border rounded-md inline-flex items-center gap-3">
                    <img
                      src={logoUrl}
                      alt="School logo"
                      className="h-16 w-16 object-contain bg-muted rounded"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity =
                          "0.3";
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Preview
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Address (printed in report header)</Label>
                <Input
                  placeholder="P.O. Box 123 — Nairobi"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <PermissionGate permission="settings:update">
                <Button
                  onClick={() =>
                    updateSchool.mutate({ logo_url: logoUrl, address })
                  }
                  disabled={updateSchool.isPending}
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {updateSchool.isPending ? "Saving…" : "Save Branding"}
                </Button>
              </PermissionGate>

              <p className="text-xs text-muted-foreground">
                Tip: principal &amp; class-teacher signature images can be added
                per template in a future update — for now they appear as
                signature lines on the PDF.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template editor dialog */}
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit Template" : "New Template"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 py-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Template name *</Label>
                  <Input
                    value={editing.name || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    placeholder="e.g. CBE End-Term Report"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Curriculum kind</Label>
                  <Select
                    value={editing.kind || "CBC"}
                    onValueChange={(v) =>
                      setEditing({ ...editing, kind: v as any })
                    }
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
              </div>
              <div className="space-y-1.5">
                <Label>Header title</Label>
                <Input
                  value={editing.header_title || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, header_title: e.target.value })
                  }
                  placeholder="e.g. END OF TERM 2 REPORT"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Header subtitle / motto</Label>
                <Input
                  value={editing.header_subtitle || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, header_subtitle: e.target.value })
                  }
                  placeholder="e.g. Knowledge · Integrity · Service"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2 border rounded-md p-3">
                {[
                  ["show_position", "Show class position"],
                  ["show_band", "Show CBE performance band"],
                  ["show_competencies", "Show competency breakdown"],
                  ["show_teacher_remarks", "Show class-teacher remarks"],
                  ["show_principal_remarks", "Show head-teacher remarks"],
                  ["is_default", "Use as default template"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{label}</span>
                    <Switch
                      checked={!!(editing as any)[key]}
                      onCheckedChange={(v) =>
                        setEditing({ ...editing, [key]: v } as any)
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={onSubmitTemplate} disabled={save.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{" "}
              {save.isPending ? "Saving…" : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog
        open={!!previewing}
        onOpenChange={(o) => {
          if (!o) setPreviewing(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Layout preview — {previewing?.name}</DialogTitle>
          </DialogHeader>
          {previewing && (
            <div className="border rounded-md p-6 bg-card text-sm space-y-3">
              <div className="flex items-center gap-3 border-b pb-3">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-12 w-12 object-contain"
                  />
                )}
                <div>
                  <div className="text-lg font-bold uppercase">
                    {school?.name || "Your School"}
                  </div>
                  {address && (
                    <div className="text-xs text-muted-foreground">
                      {address}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-base uppercase">
                  {previewing.header_title || "Report Card"}
                </div>
                {previewing.header_subtitle && (
                  <div className="text-xs italic text-muted-foreground">
                    {previewing.header_subtitle}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 text-xs gap-2 border-y py-2">
                <div>
                  <span className="text-muted-foreground">Student:</span> Jane
                  Doe
                </div>
                <div>
                  <span className="text-muted-foreground">Class:</span> Grade 5
                  · East
                </div>
                <div>
                  <span className="text-muted-foreground">Term:</span> Term 2 /
                  2026
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Score</TableHead>
                    {previewing.show_band && <TableHead>Band</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Mathematics", 82],
                    ["English", 75],
                    ["Science", 88],
                  ].map(([s, m]) => (
                    <TableRow key={s as string}>
                      <TableCell>{s}</TableCell>
                      <TableCell>{m}</TableCell>
                      {previewing.show_band && (
                        <TableCell>
                          <Badge variant="outline">EE</Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {previewing.show_position && (
                  <div>
                    <span className="text-muted-foreground">Position:</span> 3 /
                    42
                  </div>
                )}
                {previewing.show_band && (
                  <div>
                    <span className="text-muted-foreground">Overall band:</span>{" "}
                    Exceeding Expectation
                  </div>
                )}
              </div>
              {previewing.show_teacher_remarks && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Class teacher:</span>{" "}
                  Excellent term, keep it up. ____________
                </div>
              )}
              {previewing.show_principal_remarks && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Head teacher:</span> A
                  commendable performance. ____________
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
