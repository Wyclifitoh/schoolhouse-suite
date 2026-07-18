import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Tags } from "lucide-react";
import {
  useSubjectCategories,
  useSaveSubjectCategory,
  useDeleteSubjectCategory,
  useGradingSystems,
  type SubjectCategory,
} from "@/hooks/useGradingSystems";

const CALC_TYPES = [
  { value: "GENERAL", label: "General (sum of papers)" },
  { value: "SCIENCE", label: "Sciences (theory 60 / practical 40)" },
  { value: "LANGUAGE", label: "Languages (weighted papers)" },
];

export default function SubjectCategories() {
  const { data: cats = [], isLoading } = useSubjectCategories();
  const { data: systems = [] } = useGradingSystems();
  const save = useSaveSubjectCategory();
  const del = useDeleteSubjectCategory();
  const [editing, setEditing] = useState<Partial<SubjectCategory> | null>(null);

  const openNew = () =>
    setEditing({ name: "", description: "", default_calculation_type: "GENERAL" });
  const submit = async () => {
    if (!editing?.name?.trim()) return;
    await save.mutateAsync(editing);
    setEditing(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Tags className="h-6 w-6" /> Subject Categories
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Group subjects (Languages, Sciences, Mathematics…) and set the default
              grading system + calculation rule they inherit.
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> New Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Default Grading System</TableHead>
                  <TableHead>Calculation</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>Loading…</TableCell>
                  </TableRow>
                )}
                {!isLoading && cats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No categories yet.
                    </TableCell>
                  </TableRow>
                )}
                {cats.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.default_grading_system_name || "—"}</TableCell>
                    <TableCell>{c.default_calculation_type || "—"}</TableCell>
                    <TableCell>{c.subject_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          confirm(`Delete category "${c.name}"?`) && del.mutate(c.id)
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editing.name || ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="e.g. Sciences"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editing.description || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Default Grading System</Label>
                  <Select
                    value={editing.default_grading_system_id || "none"}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        default_grading_system_id: v === "none" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Inherit school default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Inherit school default</SelectItem>
                      {systems.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.is_default ? "(default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Calculation Type</Label>
                  <Select
                    value={editing.default_calculation_type || "GENERAL"}
                    onValueChange={(v) =>
                      setEditing({ ...editing, default_calculation_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CALC_TYPES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={save.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}