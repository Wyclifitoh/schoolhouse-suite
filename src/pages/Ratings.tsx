/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSchool } from "@/contexts/SchoolContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/date";

const CRITERIA = [
  { key: "punctuality", label: "Punctuality" },
  { key: "performance", label: "Performance" },
  { key: "responsibility", label: "Responsibility" },
  { key: "assessment_submission", label: "Assessment Submission" },
] as const;

const scoreColor = (avg: number) =>
  avg >= 4 ? "bg-success/10 text-success"
  : avg >= 3 ? "bg-primary/10 text-primary"
  : avg >= 2 ? "bg-warning/10 text-warning"
  : "bg-destructive/10 text-destructive";

export default function Ratings() {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    staff_id: "", period: "", comments: "",
    punctuality: 3, performance: 3, responsibility: 3, assessment_submission: 3,
  });

  const { data: ratings = [], isLoading } = useQuery({
    queryKey: ["ratings", schoolId],
    queryFn: () => api.get<any[]>("/ratings"),
    enabled: !!schoolId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", schoolId],
    queryFn: () => api.get<any[]>("/staff"),
    enabled: !!schoolId,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/ratings", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ratings"] });
      setOpen(false);
      setForm({ staff_id: "", period: "", comments: "",
        punctuality: 3, performance: 3, responsibility: 3, assessment_submission: 3 });
      toast({ title: "Rating recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ratings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ratings"] });
      toast({ title: "Rating removed" });
    },
  });

  return (
    <DashboardLayout title="Staff Ratings" subtitle="Performance evaluation and feedback">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Track punctuality, performance, responsibility and assessment compliance.</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Rating</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Rate Staff Member</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Staff *</Label>
                  <Select value={form.staff_id} onValueChange={v => setForm((p:any) => ({ ...p, staff_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent>
                      {staff.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Period (e.g. Term 1 2026)</Label>
                  <Input value={form.period} onChange={e => setForm((p:any) => ({ ...p, period: e.target.value }))} />
                </div>
                {CRITERIA.map(c => (
                  <div key={c.key} className="space-y-1">
                    <Label className="text-sm">{c.label}: <span className="font-bold">{form[c.key]}/5</span></Label>
                    <input
                      type="range" min={1} max={5} value={form[c.key]}
                      onChange={e => setForm((p:any) => ({ ...p, [c.key]: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                ))}
                <div>
                  <Label>Comments</Label>
                  <Textarea value={form.comments} onChange={e => setForm((p:any) => ({ ...p, comments: e.target.value }))} />
                </div>
                <Button className="w-full" disabled={!form.staff_id || createMutation.isPending} onClick={() => createMutation.mutate()}>
                  {createMutation.isPending ? "Saving..." : "Save Rating"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Period</TableHead>
                  {CRITERIA.map(c => <TableHead key={c.key} className="text-center">{c.label}</TableHead>)}
                  <TableHead className="text-center">Avg</TableHead>
                  <TableHead>Rater</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8">Loading…</TableCell></TableRow>
                ) : ratings.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No ratings yet</TableCell></TableRow>
                ) : ratings.map((r: any) => {
                  const avg = CRITERIA.reduce((a, c) => a + Number(r[c.key] || 0), 0) / CRITERIA.length;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.first_name} {r.last_name}</TableCell>
                      <TableCell>{r.period || "—"}</TableCell>
                      {CRITERIA.map(c => (
                        <TableCell key={c.key} className="text-center">{r[c.key]}</TableCell>
                      ))}
                      <TableCell className="text-center">
                        <Badge className={`border-0 ${scoreColor(avg)}`}><Star className="h-3 w-3 mr-1" />{avg.toFixed(1)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.rater_name || "—"}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
