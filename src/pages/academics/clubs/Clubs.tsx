import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sparkles, Plus, Users, Trash2, Edit, ExternalLink } from "lucide-react";
import { useClubs, useCreateClub, useUpdateClub, useDeleteClub, useClubsSummary, Club } from "@/hooks/useClubs";
import { useStaff } from "@/hooks/useClasses";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermission";

const blank = {
  name: "", category: "", description: "",
  patron_staff_id: "", meeting_day: "", meeting_time: "", meeting_venue: "",
  status: "active" as const,
};

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function Clubs() {
  const perms = usePermissions(["events:create","events:update","events:delete"]);
  const { data: clubs = [], isLoading } = useClubs();
  const { data: staff = [] } = useStaff();
  const { data: summary } = useClubsSummary();
  const createClub = useCreateClub();
  const updateClub = useUpdateClub();
  const deleteClub = useDeleteClub();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);
  const [form, setForm] = useState<any>(blank);

  const openCreate = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (c: Club) => {
    setEditing(c);
    setForm({
      name: c.name, category: c.category || "", description: c.description || "",
      patron_staff_id: c.patron_staff_id || "",
      meeting_day: c.meeting_day || "", meeting_time: c.meeting_time || "",
      meeting_venue: c.meeting_venue || "", status: c.status,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name) { toast.error("Club name required"); return; }
    const payload = { ...form, patron_staff_id: form.patron_staff_id || null };
    if (editing) {
      updateClub.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) });
    } else {
      createClub.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <DashboardLayout title="Clubs & Societies" subtitle="Manage student clubs, patrons, meetings and achievements">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary"/></div>
            <div><p className="text-xs text-muted-foreground">Active Clubs</p><p className="text-2xl font-bold">{summary?.totals?.total_clubs ?? 0}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><Users className="h-5 w-5 text-success"/></div>
            <div><p className="text-xs text-muted-foreground">Total Members</p><p className="text-2xl font-bold">{summary?.totals?.total_members ?? 0}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Meetings Held</p>
            <p className="text-2xl font-bold">{summary?.totals?.total_meetings ?? 0}</p>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Achievements</p>
            <p className="text-2xl font-bold">{summary?.totals?.total_achievements ?? 0}</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">All Clubs</CardTitle>
            {perms["events:create"] && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5"/>New Club</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editing ? "Edit Club" : "Create Club"}</DialogTitle></DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2 col-span-2"><Label>Club Name *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="e.g. Science Club"/></div>
                    <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e=>setForm({...form, category:e.target.value})} placeholder="Academic / Sports / Arts"/></div>
                    <div className="space-y-2"><Label>Status</Label>
                      <Select value={form.status} onValueChange={v=>setForm({...form, status:v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/></div>
                  <div className="space-y-2"><Label>Patron (Staff)</Label>
                    <Select value={form.patron_staff_id || "__none__"} onValueChange={v=>setForm({...form, patron_staff_id: v === "__none__" ? "" : v})}>
                      <SelectTrigger><SelectValue placeholder="Select patron"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {(staff as any[]).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2"><Label>Meeting Day</Label>
                      <Select value={form.meeting_day || "__none__"} onValueChange={v=>setForm({...form, meeting_day: v === "__none__" ? "" : v})}>
                        <SelectTrigger><SelectValue placeholder="Day"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Time</Label><Input type="time" value={form.meeting_time} onChange={e=>setForm({...form, meeting_time:e.target.value})}/></div>
                    <div className="space-y-2"><Label>Venue</Label><Input value={form.meeting_venue} onChange={e=>setForm({...form, meeting_venue:e.target.value})}/></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                  <Button onClick={save} disabled={createClub.isPending || updateClub.isPending}>
                    {editing ? "Save Changes" : "Create Club"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Loading clubs…</p>
            ) : clubs.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No clubs yet. Create your first club.</p>
            ) : (
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Patron</TableHead>
                  <TableHead>Student Leader</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Meeting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {clubs.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link className="hover:underline" to={`/clubs/${c.id}`}>{c.name}</Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.category || "—"}</TableCell>
                      <TableCell className="text-sm">{c.patron_name?.trim() || <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                      <TableCell className="text-sm">{c.student_leader_name?.trim() || <span className="text-muted-foreground italic">—</span>}</TableCell>
                      <TableCell><Badge variant="secondary">{c.member_count ?? 0}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.meeting_day || "—"} {c.meeting_time || ""}</TableCell>
                      <TableCell>
                        <Badge className={c.status === "active" ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Link to={`/clubs/${c.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5"/></Button></Link>
                          {perms["events:update"] && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>openEdit(c)}><Edit className="h-3.5 w-3.5"/></Button>
                          )}
                          {perms["events:delete"] && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={()=>{ if (confirm(`Delete club "${c.name}"? Members, meetings and attendance will be removed.`)) deleteClub.mutate(c.id); }}>
                              <Trash2 className="h-3.5 w-3.5"/>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
