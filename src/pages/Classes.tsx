import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClasses, useStreams, useSubjects, useCreateGrade, useCreateStream, useCreateSubject, useUpdateStream, useDeleteStream } from "@/hooks/useClasses";
import { useTerm } from "@/contexts/TermContext";
import {
  School, Plus, BookOpen, Users, Clock, Wand2, Layers,
} from "lucide-react";
import { toast } from "sonner";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const Classes = () => {
  // Data hooks
  const { data: grades = [], isLoading: gradesLoading } = useClasses();
  const { data: allStreams = [], isLoading: streamsLoading } = useStreams();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { currentAcademicYear } = useTerm();

  const createGrade = useCreateGrade();
  const createStreamMut = useCreateStream();
  const createSubject = useCreateSubject();
  const updateStream = useUpdateStream();
  const deleteStream = useDeleteStream();

  // --- Add Stream Dialog (simple: name + description) ---
  const [streamDialogOpen, setStreamDialogOpen] = useState(false);
  const [streamForm, setStreamForm] = useState({ name: "", description: "" });

  const handleCreateStream = () => {
    if (!streamForm.name) { toast.error("Stream name required"); return; }
    createStreamMut.mutate({
      name: streamForm.name,
      description: streamForm.description || null,
      academic_year_id: currentAcademicYear?.id,
    } as any, {
      onSuccess: () => { setStreamDialogOpen(false); setStreamForm({ name: "", description: "" }); },
    });
  };

  // --- Add Class (Grade) Dialog ---
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", level: "primary" as string, curriculum_type: "CBC", order_index: "0", selectedStreams: [] as string[] });

  const toggleStream = (streamId: string) => {
    setClassForm(f => ({
      ...f,
      selectedStreams: f.selectedStreams.includes(streamId) ? f.selectedStreams.filter(s => s !== streamId) : [...f.selectedStreams, streamId],
    }));
  };

  const handleCreateClass = () => {
    if (!classForm.name) { toast.error("Class name required"); return; }
    createGrade.mutate({
      name: classForm.name,
      level: classForm.level as any,
      curriculum_type: classForm.curriculum_type,
      order_index: parseInt(classForm.order_index) || 0,
    }, {
      onSuccess: (data: any) => {
        const gradeId = data?.id;
        if (gradeId && classForm.selectedStreams.length > 0) {
          classForm.selectedStreams.forEach(streamId => {
            updateStream.mutate({ id: streamId, data: { grade_id: gradeId } as any });
          });
        }
        setClassDialogOpen(false);
        setClassForm({ name: "", level: "primary", curriculum_type: "CBC", order_index: "0", selectedStreams: [] });
      },
    });
  };

  // --- Add Subject Dialog ---
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" });

  const handleCreateSubject = () => {
    if (!subjectForm.name || !subjectForm.code) { toast.error("Name and code required"); return; }
    createSubject.mutate(subjectForm, {
      onSuccess: () => { setSubjectDialogOpen(false); setSubjectForm({ name: "", code: "", description: "" }); },
    });
  };

  return (
    <DashboardLayout title="Classes & Academics" subtitle="Manage streams, classes, and subjects">
      <Tabs defaultValue="streams" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="streams" className="gap-1.5"><Layers className="h-3.5 w-3.5" />Streams</TabsTrigger>
          <TabsTrigger value="classes" className="gap-1.5"><School className="h-3.5 w-3.5" />Classes</TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Subjects</TabsTrigger>
        </TabsList>

        {/* Streams Tab */}
        <TabsContent value="streams" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Streams / Sections</CardTitle>
                <Dialog open={streamDialogOpen} onOpenChange={setStreamDialogOpen}>
                  <DialogTrigger asChild><Button size="sm" disabled={grades.length === 0}><Plus className="h-4 w-4 mr-1.5" />Add Stream</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Stream</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Class *</Label>
                        <Select value={streamForm.grade_id} onValueChange={v => setStreamForm(f => ({ ...f, grade_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select class for this stream" /></SelectTrigger>
                          <SelectContent>
                            {grades.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Stream Name *</Label><Input placeholder="e.g. East, West, A, B" value={streamForm.name} onChange={e => setStreamForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Capacity (optional)</Label><Input type="number" placeholder="e.g. 45" value={streamForm.capacity} onChange={e => setStreamForm(f => ({ ...f, capacity: e.target.value }))} /></div>
                      {grades.length === 0 && <p className="text-xs text-destructive">Create a class first before adding streams.</p>}
                      <Button className="w-full mt-2" onClick={handleCreateStream} disabled={createStreamMut.isPending}>
                        {createStreamMut.isPending ? "Creating..." : "Add Stream"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {streamsLoading ? <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
              allStreams.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No streams created yet. Add streams first, then create classes.</p> : (
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Stream</TableHead>
                    <TableHead className="font-semibold">Class</TableHead>
                    <TableHead className="font-semibold">Capacity</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {allStreams.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.grade_name || <span className="text-muted-foreground text-xs">Unassigned</span>}</TableCell>
                        <TableCell>{s.capacity || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Classes (Grades)</CardTitle>
                <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Class</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Class Name</Label><Input placeholder="e.g. Grade 4" value={classForm.name} onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>Order</Label><Input type="number" value={classForm.order_index} onChange={e => setClassForm(f => ({ ...f, order_index: e.target.value }))} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Level</Label>
                          <Select value={classForm.level} onValueChange={v => setClassForm(f => ({ ...f, level: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pre_primary">Pre-Primary</SelectItem>
                              <SelectItem value="primary">Primary</SelectItem>
                              <SelectItem value="junior_secondary">Junior Secondary</SelectItem>
                              <SelectItem value="senior_secondary">Senior Secondary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Curriculum</Label>
                          <Select value={classForm.curriculum_type} onValueChange={v => setClassForm(f => ({ ...f, curriculum_type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="CBC">CBC</SelectItem><SelectItem value="8-4-4">8-4-4</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                      {allStreams.length > 0 && (
                        <div className="space-y-2">
                          <Label>Select Streams for this Class</Label>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                            {allStreams.map((s: any) => (
                              <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                <Checkbox checked={classForm.selectedStreams.includes(s.id)} onCheckedChange={() => toggleStream(s.id)} />
                                {s.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button className="w-full mt-2" onClick={handleCreateClass} disabled={createGrade.isPending}>
                        {createGrade.isPending ? "Creating..." : "Add Class"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {gradesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
              ) : grades.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No classes configured yet. Add streams first, then create classes.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {grades.map((c: any) => (
                    <Card key={c.id} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-foreground">{c.name}</h3>
                          <Badge variant="secondary" className="text-xs">{c.curriculum_type || "CBC"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{c.level}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">{(c.sections || []).map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Subjects</CardTitle>
                <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Subject</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Subject Name</Label><Input placeholder="e.g. Mathematics" value={subjectForm.name} onChange={e => setSubjectForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>Subject Code</Label><Input placeholder="e.g. MATH" value={subjectForm.code} onChange={e => setSubjectForm(f => ({ ...f, code: e.target.value }))} /></div>
                      </div>
                      <div className="space-y-2"><Label>Description (optional)</Label><Input placeholder="Brief description" value={subjectForm.description} onChange={e => setSubjectForm(f => ({ ...f, description: e.target.value }))} /></div>
                      <Button className="w-full mt-2" onClick={handleCreateSubject} disabled={createSubject.isPending}>
                        {createSubject.isPending ? "Creating..." : "Add Subject"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {subjectsLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : subjects.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No subjects configured.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Subject</TableHead>
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{subjects.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-mono">{s.code}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{s.description || "—"}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Classes;
