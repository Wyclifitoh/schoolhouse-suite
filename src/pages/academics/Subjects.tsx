import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Plus, Search, Edit, Trash2 } from "lucide-react";
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from "@/hooks/useClasses";
import { toast } from "sonner";

const Subjects = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const filtered = (subjects as any[]).filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditing(null); setForm({ name: "", code: "", description: "" }); setShowAdd(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ name: s.name, code: s.code || "", description: s.description || "" }); setShowAdd(true); };

  const handleSave = () => {
    if (!form.name || !form.code) { toast.error("Name and code are required"); return; }
    if (editing) {
      updateSubject.mutate({ id: editing.id, data: form }, { onSuccess: () => setShowAdd(false) });
    } else {
      createSubject.mutate(form, { onSuccess: () => setShowAdd(false) });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this subject?")) deleteSubject.mutate(id);
  };

  return (
    <DashboardLayout title="Subjects" subtitle="Manage academic subjects">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> All Subjects
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-9 h-9 w-52" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" />Add Subject</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
          filtered.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No subjects found.</p> : (
            <Table>
              <TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Subject</TableHead>
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>{filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{s.code}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Subject Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Subject Code *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. MATH" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createSubject.isPending || updateSubject.isPending}>
              {createSubject.isPending || updateSubject.isPending ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Subjects;
