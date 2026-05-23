import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useAssessmentTypes, useSaveAssessmentType, useDeleteAssessmentType,
  useGradingScales, useSaveGradingScale, useDeleteGradingScale, useGradingScale,
  useCompetencies, useSaveCompetency, useDeleteCompetency,
} from "@/hooks/useExamsExtended";
import { Settings as SettingsIcon, Plus, Trash2, Scale, Target, ListChecks } from "lucide-react";

function AssessmentTypesTab() {
  const { data: rows = [] } = useAssessmentTypes();
  const save = useSaveAssessmentType();
  const del = useDeleteAssessmentType();
  const [form, setForm] = useState({ code: "", name: "", category: "SUMMATIVE", weight: 100 });
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Assessment Types</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FORMATIVE">Formative</SelectItem>
              <SelectItem value="SUMMATIVE">Summative</SelectItem>
              <SelectItem value="PROJECT">Project</SelectItem>
              <SelectItem value="OBSERVATION">Observation</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} />
          <Button onClick={() => { if (form.code && form.name) { save.mutate(form); setForm({ code: "", name: "", category: "SUMMATIVE", weight: 100 }); } }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Weight</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {(rows as any[]).map((r) => (
              <TableRow key={r.id}>
                <TableCell><Badge variant="outline">{r.code}</Badge></TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell>{r.weight}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">None yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function GradingScalesTab() {
  const { data: scales = [] } = useGradingScales();
  const save = useSaveGradingScale();
  const del = useDeleteGradingScale();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: scale } = useGradingScale(selected || undefined);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"MARKS" | "CBC" | "HYBRID">("MARKS");
  const [bands, setBands] = useState<any[]>([]);

  const addBand = () => setBands([...bands, { min_score: 0, max_score: 100, grade: "", points: 0, remark: "" }]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Scales</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="New scale name" value={name} onChange={(e) => setName(e.target.value)} />
            <Select value={kind} onValueChange={(v: any) => setKind(v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MARKS">Marks</SelectItem>
                <SelectItem value="CBC">CBC</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { if (name) { save.mutate({ name, kind }); setName(""); } }}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-1">
            {(scales as any[]).map((s) => (
              <div key={s.id} className={`p-2 rounded cursor-pointer flex items-center justify-between ${selected === s.id ? "bg-muted" : "hover:bg-muted/50"}`} onClick={() => { setSelected(s.id); setBands([]); }}>
                <div>
                  <div className="font-medium text-sm">{s.name} {s.is_default ? <Badge variant="outline" className="ml-1">default</Badge> : null}</div>
                  <div className="text-xs text-muted-foreground">{s.kind}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); del.mutate(s.id); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            {!scales.length && <div className="text-center text-muted-foreground text-sm">No scales.</div>}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Bands {scale?.name ? `— ${scale.name}` : ""}</CardTitle></CardHeader>
        <CardContent>
          {!selected ? (
            <p className="text-muted-foreground text-sm">Select a scale to edit its grade bands.</p>
          ) : (
            <div className="space-y-3">
              <Table>
                <TableHeader><TableRow><TableHead>Min</TableHead><TableHead>Max</TableHead><TableHead>Grade</TableHead><TableHead>Points</TableHead><TableHead>Remark</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(bands.length ? bands : scale?.bands || []).map((b: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><Input type="number" defaultValue={b.min_score} onChange={(e) => { const x = [...(bands.length ? bands : scale?.bands)]; x[i] = { ...x[i], min_score: Number(e.target.value) }; setBands(x); }} /></TableCell>
                      <TableCell><Input type="number" defaultValue={b.max_score} onChange={(e) => { const x = [...(bands.length ? bands : scale?.bands)]; x[i] = { ...x[i], max_score: Number(e.target.value) }; setBands(x); }} /></TableCell>
                      <TableCell><Input defaultValue={b.grade} onChange={(e) => { const x = [...(bands.length ? bands : scale?.bands)]; x[i] = { ...x[i], grade: e.target.value }; setBands(x); }} /></TableCell>
                      <TableCell><Input type="number" defaultValue={b.points ?? 0} onChange={(e) => { const x = [...(bands.length ? bands : scale?.bands)]; x[i] = { ...x[i], points: Number(e.target.value) }; setBands(x); }} /></TableCell>
                      <TableCell><Input defaultValue={b.remark ?? ""} onChange={(e) => { const x = [...(bands.length ? bands : scale?.bands)]; x[i] = { ...x[i], remark: e.target.value }; setBands(x); }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex gap-2">
                <Button variant="outline" onClick={addBand}><Plus className="h-4 w-4 mr-1" /> Add Band</Button>
                <Button onClick={() => save.mutate({ id: selected, bands })}>Save Bands</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CompetenciesTab() {
  const { data: rows = [] } = useCompetencies();
  const save = useSaveCompetency();
  const del = useDeleteCompetency();
  const [form, setForm] = useState({ code: "", name: "", description: "" });
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> CBC Competencies</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button onClick={() => { if (form.code && form.name) { save.mutate(form); setForm({ code: "", name: "", description: "" }); } }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {(rows as any[]).map((r) => (
              <TableRow key={r.id}>
                <TableCell><Badge variant="outline">{r.code}</Badge></TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.description}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">None yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AssessmentSettings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-7 w-7 text-primary" /> Assessment Settings
          </h1>
          <p className="text-muted-foreground">Configure assessment types, grading scales, and CBC competencies.</p>
        </div>
        <Tabs defaultValue="types">
          <TabsList>
            <TabsTrigger value="types">Assessment Types</TabsTrigger>
            <TabsTrigger value="scales">Grading Scales</TabsTrigger>
            <TabsTrigger value="competencies">CBC Competencies</TabsTrigger>
          </TabsList>
          <TabsContent value="types"><AssessmentTypesTab /></TabsContent>
          <TabsContent value="scales"><GradingScalesTab /></TabsContent>
          <TabsContent value="competencies"><CompetenciesTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
