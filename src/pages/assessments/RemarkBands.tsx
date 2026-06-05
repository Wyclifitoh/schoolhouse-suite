import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { MessageSquareText, Plus, Pencil, Trash2 } from "lucide-react";
import {
  useRemarkBands, useSaveRemarkBand, useDeleteRemarkBand, type RemarkBand,
} from "@/hooks/useRemarkBands";
import { useGrades } from "@/hooks/useGrades";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

type Form = Partial<RemarkBand>;
const blank: Form = { min_pct: 0, max_pct: 100, remark: "", sort_order: 0, is_active: true };

export default function RemarkBandsPage() {
  const { data: bands = [] } = useRemarkBands();
  const { data: grades = [] } = useGrades();
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-flat"],
    queryFn: async () => {
      const r: any = await api.get("/assessments/subject-allocations");
      const list = (r?.data ?? r) || [];
      // dedupe by subject_id
      const seen = new Map();
      list.forEach((x: any) => seen.set(x.subject_id, { id: x.subject_id, name: x.subject_name }));
      return Array.from(seen.values());
    },
  });

  const save = useSaveRemarkBand();
  const remove = useDeleteRemarkBand();
  const [editing, setEditing] = useState<Form | null>(null);

  const close = () => setEditing(null);
  const onSave = async () => {
    if (!editing?.remark || editing.min_pct == null || editing.max_pct == null) return;
    await save.mutateAsync(editing as any);
    close();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-end gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquareText className="h-7 w-7 text-primary" />
              Remark Templates
            </h1>
            <p className="text-muted-foreground">
              Configure auto-fill remarks per subject &amp; class. When a score is entered,
              the matching remark is suggested automatically.
            </p>
          </div>
          <Button onClick={() => setEditing({ ...blank })}>
            <Plus className="h-4 w-4 mr-1" /> Add band
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Configured bands</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="w-20 text-right">Min %</TableHead>
                  <TableHead className="w-20 text-right">Max %</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bands.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.subject_name || <Badge variant="outline">All subjects</Badge>}</TableCell>
                    <TableCell>{b.grade_name || <Badge variant="outline">All classes</Badge>}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(b.min_pct).toFixed(1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(b.max_pct).toFixed(1)}</TableCell>
                    <TableCell className="text-sm">{b.remark}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(b as any)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!bands.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Default bands will be created automatically on first use.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit band" : "New remark band"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Subject</label>
                  <Select
                    value={editing.subject_id || "_all"}
                    onValueChange={(v) => setEditing({ ...editing, subject_id: v === "_all" ? null : v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All subjects</SelectItem>
                      {(subjects as any[]).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Class</label>
                  <Select
                    value={editing.grade_id || "_all"}
                    onValueChange={(v) => setEditing({ ...editing, grade_id: v === "_all" ? null : v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All classes</SelectItem>
                      {(grades as any[]).map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Min %</label>
                  <Input type="number" value={editing.min_pct ?? 0}
                    onChange={(e) => setEditing({ ...editing, min_pct: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Max %</label>
                  <Input type="number" value={editing.max_pct ?? 0}
                    onChange={(e) => setEditing({ ...editing, max_pct: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Remark</label>
                <Textarea
                  value={editing.remark || ""}
                  onChange={(e) => setEditing({ ...editing, remark: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={onSave} disabled={save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
