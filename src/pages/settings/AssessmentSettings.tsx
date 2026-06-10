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
  useAchievementLevels,
  useSaveLevel,
  useDeleteLevel,
  useCompetencies,
  useSaveCompetency,
  useDeleteCompetency,
  AssessmentType,
  PerformanceBand,
  AchievementLevel,
  Competency,
} from "@/hooks/useAssessments";

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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => del.mutate(b.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
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

// ===== Achievement Levels Tab =====
function LevelsTab() {
  const { data: levels = [], isLoading } = useAchievementLevels();
  const { data: bands = [] } = useBands();
  const save = useSaveLevel();
  const del = useDeleteLevel();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<AchievementLevel>>({});

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() =>
                setForm({
                  code: "",
                  band_code: "ME",
                  min_score: 0,
                  max_score: 0,
                  points: 0,
                  description: "",
                  sort_order: ((levels as any[]).length || 0) + 1,
                  is_active: true,
                })
              }
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Level
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Achievement Level</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="space-y-1">
                <Label>Code</Label>
                <Input
                  value={form.code || ""}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="AL5"
                />
              </div>
              <div className="space-y-1">
                <Label>Band</Label>
                <Select
                  value={form.band_code}
                  onValueChange={(v) => setForm({ ...form, band_code: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(bands as any[]).map((b) => (
                      <SelectItem key={b.id} value={b.code}>
                        {b.code} — {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Min Score</Label>
                <Input
                  type="number"
                  value={form.min_score ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, min_score: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Max Score</Label>
                <Input
                  type="number"
                  value={form.max_score ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, max_score: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={form.points ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, points: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Description</Label>
                <Input
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
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Code</TableHead>
              <TableHead>Band</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(levels as any[])
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {l.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{l.band_code}</Badge>
                  </TableCell>
                  <TableCell>
                    {Number(l.min_score)} – {Number(l.max_score)}
                  </TableCell>
                  <TableCell className="font-semibold">{l.points}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {l.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setForm(l);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => del.mutate(l.id)}
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
        <strong className="text-foreground">Where these are used:</strong> CBC
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
              <DialogTitle>CBC Competency</DialogTitle>
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
      subtitle="Configure CBC types, bands, achievement levels & competencies"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> CBC Assessment
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="types">
            <TabsList className="grid grid-cols-4 w-full md:w-fit">
              <TabsTrigger value="types" className="gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Types
              </TabsTrigger>
              <TabsTrigger value="bands" className="gap-1.5">
                <Scale className="h-3.5 w-3.5" /> Bands
              </TabsTrigger>
              <TabsTrigger value="levels" className="gap-1.5">
                <Award className="h-3.5 w-3.5" /> Levels
              </TabsTrigger>
              <TabsTrigger value="comps" className="gap-1.5">
                <Target className="h-3.5 w-3.5" /> Competencies
              </TabsTrigger>
            </TabsList>
            <TabsContent value="types" className="mt-4">
              <TypesTab />
            </TabsContent>
            <TabsContent value="bands" className="mt-4">
              <BandsTab />
            </TabsContent>
            <TabsContent value="levels" className="mt-4">
              <LevelsTab />
            </TabsContent>
            <TabsContent value="comps" className="mt-4">
              <CompetenciesTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AssessmentSettings;
