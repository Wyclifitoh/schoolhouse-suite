import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Users, Calendar, Trophy, Plus, Trash2, Crown, ClipboardList } from "lucide-react";
import {
  useClub, useClubMembers, useAddClubMembers, useRemoveClubMember, useSetClubLeader, useUnassignedStudents,
  useClubMeetings, useCreateClubMeeting, useDeleteClubMeeting,
  useMeetingAttendance, useSaveAttendance,
  useClubAchievements, useCreateAchievement, useDeleteAchievement,
} from "@/hooks/useClubs";
import { toast } from "sonner";

export default function ClubDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { data: club } = useClub(id);
  if (!club) {
    return <DashboardLayout title="Club"><p className="p-6 text-sm text-muted-foreground">Loading club…</p></DashboardLayout>;
  }

  return (
    <DashboardLayout title={club.name} subtitle={club.category || "Club"}>
      <div className="space-y-6">
        <Link to="/clubs" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5"/> Back to Clubs
        </Link>

        <Card>
          <CardContent className="p-5 grid md:grid-cols-4 gap-4">
            <div><p className="text-xs text-muted-foreground">Patron</p><p className="font-medium">{club.patron_name?.trim() || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Student Leader</p><p className="font-medium">{club.student_leader_name?.trim() || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Meeting</p><p className="font-medium">{club.meeting_day || "—"} {club.meeting_time || ""}</p></div>
            <div><p className="text-xs text-muted-foreground">Venue</p><p className="font-medium">{club.meeting_venue || "—"}</p></div>
            {club.description && <div className="md:col-span-4"><p className="text-xs text-muted-foreground">About</p><p className="text-sm">{club.description}</p></div>}
          </CardContent>
        </Card>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members"><Users className="h-3.5 w-3.5 mr-1.5"/>Members</TabsTrigger>
            <TabsTrigger value="meetings"><Calendar className="h-3.5 w-3.5 mr-1.5"/>Meetings</TabsTrigger>
            <TabsTrigger value="attendance"><ClipboardList className="h-3.5 w-3.5 mr-1.5"/>Attendance</TabsTrigger>
            <TabsTrigger value="achievements"><Trophy className="h-3.5 w-3.5 mr-1.5"/>Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="members"><MembersTab clubId={id} /></TabsContent>
          <TabsContent value="meetings"><MeetingsTab clubId={id} /></TabsContent>
          <TabsContent value="attendance"><AttendanceTab clubId={id} /></TabsContent>
          <TabsContent value="achievements"><AchievementsTab clubId={id} /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ───────── Members ─────────
function MembersTab({ clubId }: { clubId: string }) {
  const { data: members = [] } = useClubMembers(clubId);
  const [search, setSearch] = useState("");
  const { data: candidates = [] } = useUnassignedStudents(search);
  const add = useAddClubMembers(clubId);
  const remove = useRemoveClubMember(clubId);
  const setLeader = useSetClubLeader(clubId);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const submit = () => {
    if (selected.length === 0) { toast.error("Pick at least one student"); return; }
    add.mutate(selected, { onSuccess: () => { setSelected([]); setOpen(false); } });
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Members ({members.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5"/>Add Members</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Students to Club</DialogTitle></DialogHeader>
            <Input placeholder="Search by name / admission no…" value={search} onChange={e=>setSearch(e.target.value)} className="mb-3"/>
            <div className="border rounded-md max-h-72 overflow-y-auto divide-y">
              {candidates.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No unassigned students found.</p>}
              {candidates.map((s: any) => (
                <label key={s.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/30 text-sm">
                  <Checkbox checked={selected.includes(s.id)} onCheckedChange={()=>toggle(s.id)}/>
                  <span className="font-medium">{s.first_name} {s.last_name}</span>
                  <span className="text-xs text-muted-foreground">{s.admission_number} · {s.grade_name} {s.stream_name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">A student can belong to only one club.</p>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={add.isPending}>Add {selected.length || ""}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {members.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No members yet.</p>
        ) : (
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Adm No.</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {members.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell>{m.admission_number}</TableCell>
                  <TableCell className="font-medium">{m.first_name} {m.last_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.grade_name} {m.stream_name}</TableCell>
                  <TableCell><Badge variant="secondary">{m.role}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Make student leader" onClick={()=>setLeader.mutate(m.student_id)}><Crown className="h-3.5 w-3.5 text-warning"/></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={()=>{ if (confirm("Remove from club?")) remove.mutate(m.student_id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ───────── Meetings ─────────
function MeetingsTab({ clubId }: { clubId: string }) {
  const { data: meetings = [] } = useClubMeetings(clubId);
  const create = useCreateClubMeeting(clubId);
  const del = useDeleteClubMeeting(clubId);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", meeting_date: new Date().toISOString().slice(0,10), start_time: "", end_time: "", venue: "", agenda: "" });

  const save = () => {
    if (!f.title || !f.meeting_date) { toast.error("Title and date required"); return; }
    create.mutate(f, { onSuccess: () => { setOpen(false); setF({ title:"", meeting_date:new Date().toISOString().slice(0,10), start_time:"", end_time:"", venue:"", agenda:"" }); } });
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Meetings ({meetings.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5"/>Schedule Meeting</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Meeting</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-2"><Label>Title *</Label><Input value={f.title} onChange={e=>setF({...f, title:e.target.value})}/></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Date *</Label><Input type="date" value={f.meeting_date} onChange={e=>setF({...f, meeting_date:e.target.value})}/></div>
                <div className="space-y-2"><Label>Start</Label><Input type="time" value={f.start_time} onChange={e=>setF({...f, start_time:e.target.value})}/></div>
                <div className="space-y-2"><Label>End</Label><Input type="time" value={f.end_time} onChange={e=>setF({...f, end_time:e.target.value})}/></div>
              </div>
              <div className="space-y-2"><Label>Venue</Label><Input value={f.venue} onChange={e=>setF({...f, venue:e.target.value})}/></div>
              <div className="space-y-2"><Label>Agenda</Label><Textarea rows={3} value={f.agenda} onChange={e=>setF({...f, agenda:e.target.value})}/></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={create.isPending}>Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {meetings.length === 0 ? <p className="p-6 text-sm text-muted-foreground text-center">No meetings yet.</p> : (
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Title</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Venue</TableHead><TableHead>Status</TableHead><TableHead>Present</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {meetings.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.title}</TableCell>
                  <TableCell>{m.meeting_date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.start_time?.slice(0,5)} {m.end_time ? `– ${m.end_time.slice(0,5)}` : ""}</TableCell>
                  <TableCell className="text-sm">{m.venue || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                  <TableCell>{m.attendance_count || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={()=>{ if (confirm("Delete meeting?")) del.mutate(m.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ───────── Attendance ─────────
function AttendanceTab({ clubId }: { clubId: string }) {
  const { data: meetings = [] } = useClubMeetings(clubId);
  const { data: members = [] } = useClubMembers(clubId);
  const [meetingId, setMeetingId] = useState<string>("");
  const { data: existing = [] } = useMeetingAttendance(meetingId);
  const save = useSaveAttendance(meetingId);
  const [marks, setMarks] = useState<Record<string, string>>({});

  const set = (sid: string, status: string) => setMarks(m => ({ ...m, [sid]: status }));

  // Seed marks from existing
  const seeded = members.map((m: any) => {
    const e = existing.find((x: any) => x.student_id === m.student_id);
    return { ...m, status: marks[m.student_id] ?? e?.status ?? "present" };
  });

  const handleSave = () => {
    if (!meetingId) { toast.error("Select a meeting"); return; }
    const records = seeded.map((m: any) => ({ student_id: m.student_id, status: m.status }));
    save.mutate(records);
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-base">Mark Attendance</CardTitle>
        <div className="flex gap-2 items-center">
          <Select value={meetingId} onValueChange={setMeetingId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Select meeting"/></SelectTrigger>
            <SelectContent>
              {meetings.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.meeting_date} — {m.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleSave} disabled={!meetingId || save.isPending}>Save</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!meetingId ? <p className="p-6 text-sm text-muted-foreground text-center">Choose a meeting to mark attendance.</p> :
         members.length === 0 ? <p className="p-6 text-sm text-muted-foreground text-center">No members in this club.</p> : (
          <Table>
            <TableHeader><TableRow className="bg-muted/50"><TableHead>Adm</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {seeded.map((m: any) => (
                <TableRow key={m.student_id}>
                  <TableCell>{m.admission_number}</TableCell>
                  <TableCell className="font-medium">{m.first_name} {m.last_name}</TableCell>
                  <TableCell>
                    <Select value={m.status} onValueChange={(v)=>set(m.student_id, v)}>
                      <SelectTrigger className="w-36"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ───────── Achievements ─────────
function AchievementsTab({ clubId }: { clubId: string }) {
  const { data: items = [] } = useClubAchievements(clubId);
  const create = useCreateAchievement(clubId);
  const del = useDeleteAchievement(clubId);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", description: "", award_level: "school", achievement_date: new Date().toISOString().slice(0,10), position: "" });
  const save = () => {
    if (!f.title) { toast.error("Title required"); return; }
    create.mutate(f, { onSuccess: () => setOpen(false) });
  };
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Achievements</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5"/>Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Achievement</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-2"><Label>Title *</Label><Input value={f.title} onChange={e=>setF({...f, title:e.target.value})}/></div>
              <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={f.description} onChange={e=>setF({...f, description:e.target.value})}/></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Level</Label>
                  <Select value={f.award_level} onValueChange={v=>setF({...f, award_level:v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {["school","zonal","sub_county","county","regional","national","international"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Position</Label><Input value={f.position} onChange={e=>setF({...f, position:e.target.value})} placeholder="1st, 2nd…"/></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={f.achievement_date} onChange={e=>setF({...f, achievement_date:e.target.value})}/></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={create.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="p-6 text-sm text-muted-foreground text-center">No achievements yet.</p> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((a: any) => (
              <Card key={a.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{a.award_level?.replace("_"," ")} {a.position ? `· ${a.position}` : ""} · {a.achievement_date}</p>
                      {a.description && <p className="text-sm mt-2">{a.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={()=>{ if (confirm("Remove?")) del.mutate(a.id); }}><Trash2 className="h-3.5 w-3.5"/></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
