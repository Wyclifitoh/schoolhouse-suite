import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGate } from "@/components/PermissionGate";
import { KcseAggregateTab } from "./_KcseAggregateTab";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Scale,
  Award,
  Target,
  SlidersHorizontal,
} from "lucide-react";
import {
  useAssessmentTypes,
  useSaveAssessmentType,
  useDeleteAssessmentType,
  useBands,
  useSaveBand,
  useDeleteBand,
  useCompetencies,
  useSaveCompetency,
  useDeleteCompetency,
  AssessmentType,
  PerformanceBand,
  Competency,
} from "@/hooks/useAssessments";
import {
  useGradingSystems,
  useGradingSystem,
  useSaveGradingSystem,
  useDeleteGradingSystem,
  useSaveGradingLevels,
  GradingSystem,
  GradingSystemLevel,
} from "@/hooks/useGradingSystems";
import { ArrowLeft } from "lucide-react";

// ===== Assessment Types Tab =====
function TypesTab() {
  const { data: types = [], isLoading } = useAssessmentTypes();
  const save = useSaveAssessmentType();
  const del = useDeleteAssessmentType();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AssessmentType> | null>(null);

  const totalWeight = (types as any[])
    .filter((t) => t.is_active)
    .reduce((s, t) => s + Number(t.weight || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Total active weight: <strong>{totalWeight}%</strong>
            {totalWeight !== 100 && (
              <span className="ml-2 text-amber-600">should sum to 100%</span>
            )}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() =>
                setEditing({
                  code: "",
                  name: "",
                  category: "formative",
                  weight: 0,
                  is_active: true,
                })
              }
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing?.id ? "Edit" : "New"} Assessment Type
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="space-y-1">
                <Label>Code</Label>
                <Input
                  value={editing?.code || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing!,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="CAT"
                />
              </div>
              <div className="space-y-1">
                <Label>Weight (%)</Label>
                <Input
                  type="number"
                  value={editing?.weight ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing!, weight: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Name</Label>
                <Input
                  value={editing?.name || ""}
                  onChange={(e) =>
                    setEditing({ ...editing!, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Category</Label>
                <Select
                  value={editing?.category}
                  onValueChange={(v: any) =>
                    setEditing({ ...editing!, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="observation">Observation</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="formative">Formative</SelectItem>
                    <SelectItem value="summative">Summative</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  save.mutate(editing!, { onSuccess: () => setOpen(false) })
                }
                disabled={save.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(types as any[]).map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {t.code}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="capitalize">{t.category}</TableCell>
                <TableCell>{Number(t.weight)}%</TableCell>
                <TableCell>
                  <Badge
                    variant={t.is_active ? "default" : "outline"}
                    className="text-xs"
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(t);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => del.mutate(t.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ===== Bands Tab =====
function BandsTab() {
  const { data: bands = [], isLoading } = useBands();
  const save = useSaveBand();
  const del = useDeleteBand();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<PerformanceBand>>({});

  return (
    <div className="space-y-4">
      <PermissionGate
        permission="assessments:bands:manage"
        role={["admin", "super_admin", "school_admin"]}
        fallback={
          <p className="text-xs text-muted-foreground text-right">
            Read-only — you do not have permission to manage performance bands.
          </p>
        }
      >
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() =>
                  setForm({
                    code: "",
                    name: "",
                    color: "#3b82f6",
                    sort_order: ((bands as any[]).length || 0) + 1,
                    is_active: true,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Band
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Performance Band</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="space-y-1">
                  <Label>Code</Label>
                  <Input
                    value={form.code || ""}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={form.color || "#3b82f6"}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    save.mutate(form, { onSuccess: () => setOpen(false) })
                  }
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PermissionGate>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(bands as any[]).map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <div
                className="h-2 w-full"
                style={{ backgroundColor: b.color }}
              />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="font-mono">
                    {b.code}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setForm({
                          id: b.id,
                          code: b.code,
                          name: b.name,
                          color: b.color || "#3b82f6",
                          sort_order: b.sort_order,
                          is_active: b.is_active,
                        });
                        setOpen(true);
                      }}
                      title="Edit band"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => del.mutate(b.id)}
                      title="Delete band"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="font-medium text-sm">{b.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Grading Systems Tab =====
// Replaces the legacy standalone Levels tab. Levels are now edited within
// the context of a specific Grading System (Setup drill-down).
function GradingSystemsTab() {
  const { data: systems = [], isLoading } = useGradingSystems();
  const save = useSaveGradingSystem();
  const del = useDeleteGradingSystem();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<GradingSystem>>({});
  const [setupId, setSetupId] = useState<string | null>(null);

  if (setupId) {
    return (
      <GradingSystemLevels systemId={setupId} onBack={() => setSetupId(null)} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">Grading Systems</strong> are the
        single source of truth for every grade lookup (CBE performance levels
        and 8-4-4 grades). Click <em>Setup</em> to configure the grade code,
        min/max, points, band and description.
      </div>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() =>
                setForm({
                  name: "",
                  description: "",
                  curriculum_type: "8-4-4",
                  is_default: 0,
                  is_active: 1,
                })
              }
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Grading System
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {form.id ? "Edit" : "New"} Grading System
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 8-4-4 General"
                />
              </div>
              <div className="space-y-1">
                <Label>Curriculum</Label>
                <Select
                  value={form.curriculum_type || "8-4-4"}
                  onValueChange={(v) =>
                    setForm({ ...form, curriculum_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBE">CBE</SelectItem>
                    <SelectItem value="8-4-4">8-4-4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  save.mutate(form as any, { onSuccess: () => setOpen(false) })
                }
                disabled={save.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Curriculum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Levels</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(systems as GradingSystem[]).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.name}
                  {s.is_default ? (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Default
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{s.curriculum_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={s.is_active ? "default" : "outline"}>
                    {s.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {s.level_count ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => setSetupId(s.id)}>
                    Setup
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setForm(s);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete grading system "${s.name}"?`))
                        del.mutate(s.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// Drill-down: edit the levels of a single Grading System.
function GradingSystemLevels({
  systemId,
  onBack,
}: {
  systemId: string;
  onBack: () => void;
}) {
  const { data: system, isLoading } = useGradingSystem(systemId);
  const save = useSaveGradingLevels(systemId);
  const [rows, setRows] = useState<Partial<GradingSystemLevel>[]>([]);
  const initialized = useState({ done: false })[0];

  if (system && !initialized.done) {
    setRows(system.levels || []);
    initialized.done = true;
  }

  const update = (i: number, patch: Partial<GradingSystemLevel>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) =>
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  const add = () =>
    setRows((rs) => [
      ...rs,
      {
        grade_code: "",
        min_pct: 0,
        max_pct: 0,
        points: 0,
        band: "",
        description: "",
        display_order: rs.length + 1,
      },
    ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <div className="font-semibold">{system?.name}</div>
            <div className="text-xs text-muted-foreground">
              {system?.curriculum_type} · Configure grade levels
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="h-4 w-4 mr-1" /> Add Level
          </Button>
          <Button
            size="sm"
            disabled={save.isPending}
            onClick={() => save.mutate(rows)}
          >
            Save Levels
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Grade Code</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Max</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Band</TableHead>
              <TableHead>Description</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Input
                    value={r.grade_code || ""}
                    onChange={(e) =>
                      update(i, { grade_code: e.target.value.toUpperCase() })
                    }
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={r.min_pct ?? 0}
                    onChange={(e) =>
                      update(i, { min_pct: Number(e.target.value) })
                    }
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={r.max_pct ?? 0}
                    onChange={(e) =>
                      update(i, { max_pct: Number(e.target.value) })
                    }
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={r.points ?? 0}
                    onChange={(e) =>
                      update(i, { points: Number(e.target.value) })
                    }
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={r.band || ""}
                    onChange={(e) => update(i, { band: e.target.value })}
                    className="h-8 w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={r.description || ""}
                    onChange={(e) => update(i, { description: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => remove(i)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-6"
                >
                  No levels yet — click "Add Level" to define the first grade
                  band.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ===== Competencies Tab =====
function CompetenciesTab() {
  const { data: comps = [], isLoading } = useCompetencies();
  const save = useSaveCompetency();
  const del = useDeleteCompetency();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Competency>>({});

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">Where these are used:</strong> CBE
        competencies you define here power per-student competency ratings on
        report cards (Strengths &amp; Areas to Improve), the Competency Strands
        panel on student result details, and rubrics that teachers attach to
        observation tasks. A student inherits a competency rating for every task
        tagged with that competency.
      </div>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() =>
                setForm({ name: "", description: "", is_active: true })
              }
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Competency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>CBE Competency</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  save.mutate(form, { onSuccess: () => setOpen(false) })
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(comps as any[]).map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setForm(c);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => del.mutate(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const AssessmentSettings = () => {
  return (
    <DashboardLayout
      title="Assessment Settings"
      subtitle="Configure CBE types, bands, achievement levels & competencies"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> CBE Assessment
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="types">
            <TabsList className="grid grid-cols-5 w-full md:w-fit">
              <TabsTrigger value="types" className="gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Types
              </TabsTrigger>
              <TabsTrigger value="bands" className="gap-1.5">
                <Scale className="h-3.5 w-3.5" /> Bands
              </TabsTrigger>
              <TabsTrigger value="grading-systems" className="gap-1.5">
                <Award className="h-3.5 w-3.5" /> Grading Systems
              </TabsTrigger>
              <TabsTrigger value="comps" className="gap-1.5">
                <Target className="h-3.5 w-3.5" /> Competencies
              </TabsTrigger>
              <TabsTrigger value="kcse" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> KCSE Aggregate
              </TabsTrigger>
            </TabsList>
            <TabsContent value="types" className="mt-4">
              <TypesTab />
            </TabsContent>
            <TabsContent value="bands" className="mt-4">
              <BandsTab />
            </TabsContent>
            <TabsContent value="grading-systems" className="mt-4">
              <GradingSystemsTab />
            </TabsContent>
            <TabsContent value="comps" className="mt-4">
              <CompetenciesTab />
            </TabsContent>
            <TabsContent value="kcse" className="mt-4">
              <KcseAggregateTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AssessmentSettings;
