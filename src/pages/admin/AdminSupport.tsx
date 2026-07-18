import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LifeBuoy, Plus, AlertTriangle, Clock, CheckCircle2, MessageSquare, Loader2, Lock } from "lucide-react";
import {
  useSupportStats, useSupportTickets, useTicket, useCreateTicket,
  useUpdateTicket, useAddTicketMessage,
  type SupportTicket, type TicketPriority, type TicketStatus,
} from "@/hooks/usePlatform";
import { useSchools } from "@/hooks/usePlatform";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const priorityColor: Record<TicketPriority, string> = {
  urgent: "bg-red-500/10 text-red-600 border-red-500/30",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  normal: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  low: "bg-slate-500/10 text-slate-600 border-slate-500/30",
};
const statusColor: Record<TicketStatus, string> = {
  open: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  resolved: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  closed: "bg-slate-500/10 text-slate-600 border-slate-500/30",
};

function isOverdue(t: SupportTicket) {
  return t.sla_due_at && (t.status === "open" || t.status === "pending") &&
    new Date(t.sla_due_at).getTime() < Date.now();
}

export default function AdminSupport() {
  const stats = useSupportStats();
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [search, setSearch] = useState("");
  const tickets = useSupportTickets({ status, priority, search });
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LifeBuoy className="h-4 w-4" /> Platform Support
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Support Center</h1>
          <p className="text-sm text-muted-foreground">
            Tickets across all schools, with SLA tracking, priorities and internal notes.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" /> New ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Stat label="Open" value={stats.data?.open} icon={<MessageSquare className="h-4 w-4" />} />
        <Stat label="Pending" value={stats.data?.pending} icon={<Clock className="h-4 w-4" />} />
        <Stat label="Urgent open" value={stats.data?.urgent_open} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} />
        <Stat label="Overdue SLA" value={stats.data?.overdue} icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
        <Stat label="Resolved" value={stats.data?.resolved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
        <Stat label="Closed" value={stats.data?.closed} icon={<Lock className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base flex-1 min-w-[160px]">Ticket queue</CardTitle>
            <Input placeholder="Search subject or email…" value={search}
              onChange={(e) => setSearch(e.target.value)} className="w-56 h-9" />
            <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority || "all"} onValueChange={(v) => setPriority(v === "all" ? "" : v)}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.isLoading && (
                  <TableRow><TableCell colSpan={7} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>
                )}
                {tickets.data?.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tickets match your filters.</TableCell></TableRow>
                )}
                {tickets.data?.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setOpenId(t.id)}>
                    <TableCell>
                      <div className="font-medium">{t.subject}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[320px]">
                        {t.created_by_email || "—"} · {t.message_count || 0} messages
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{t.school_name || <span className="text-muted-foreground">Platform</span>}</TableCell>
                    <TableCell><Badge variant="outline" className={priorityColor[t.priority]}>{t.priority}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={statusColor[t.status]}>{t.status}</Badge></TableCell>
                    <TableCell className="text-sm">{t.assignee_name || t.assignee_email || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>
                      {t.sla_due_at ? (
                        <span className={isOverdue(t) ? "text-red-600 font-medium" : ""}>
                          {isOverdue(t) ? "Overdue " : ""}
                          {formatDistanceToNow(new Date(t.sla_due_at), { addSuffix: true })}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {creating && <CreateTicketDialog onClose={() => setCreating(false)} />}
      {openId && <TicketDetailDialog id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value?: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>{icon}
        </div>
        <div className="text-2xl font-semibold mt-1">{value ?? "—"}</div>
      </CardContent>
    </Card>
  );
}

function CreateTicketDialog({ onClose }: { onClose: () => void }) {
  const schools = useSchools({});
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [schoolId, setSchoolId] = useState<string>("none");
  const create = useCreateTicket();

  const submit = async () => {
    if (!subject.trim()) return toast({ title: "Subject required", variant: "destructive" });
    try {
      await create.mutateAsync({
        subject, description,
        priority,
        school_id: schoolId === "none" ? null : schoolId,
      });
      toast({ title: "Ticket created" });
      onClose();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New support ticket</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent (4h SLA)</SelectItem>
                  <SelectItem value="high">High (12h SLA)</SelectItem>
                  <SelectItem value="normal">Normal (24h SLA)</SelectItem>
                  <SelectItem value="low">Low (72h SLA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>School</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Platform / none</SelectItem>
                  {schools.data?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TicketDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useTicket(id);
  const update = useUpdateTicket();
  const reply = useAddTicketMessage();
  const [msg, setMsg] = useState("");
  const [internal, setInternal] = useState(false);

  const t = q.data?.ticket;
  const messages = q.data?.messages || [];

  const doStatus = async (status: TicketStatus) => {
    try { await update.mutateAsync({ id, status }); toast({ title: `Marked ${status}` }); }
    catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };
  const doPriority = async (priority: TicketPriority) => {
    try { await update.mutateAsync({ id, priority }); }
    catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };
  const send = async () => {
    if (!msg.trim()) return;
    try {
      await reply.mutateAsync({ id, body: msg, internal });
      setMsg(""); setInternal(false);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="pr-6">{t?.subject || "Ticket"}</DialogTitle>
        </DialogHeader>
        {!t ? (
          <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <Badge variant="outline" className={statusColor[t.status]}>{t.status}</Badge>
              <Badge variant="outline" className={priorityColor[t.priority]}>{t.priority}</Badge>
              <span className="text-muted-foreground">
                {t.school_name || "Platform"} · {t.created_by_email || "—"}
              </span>
              <span className="text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={t.status} onValueChange={(v) => doStatus(v as TicketStatus)}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["open","pending","resolved","closed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={t.priority} onValueChange={(v) => doPriority(v as TicketPriority)}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["urgent","high","normal","low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {t.description && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                {t.description}
              </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`rounded-md border p-3 text-sm ${m.internal ? "bg-amber-500/5 border-amber-500/30" : "bg-background"}`}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">{m.author_email || "System"}</span>
                    {m.internal ? <Badge variant="outline" className="h-5 text-[10px]">Internal</Badge> : null}
                    <span className="ml-auto">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)}
                placeholder={internal ? "Internal note (not shared with school)…" : "Reply to school…"} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                  Internal note
                </label>
                <Button onClick={send} disabled={reply.isPending || !msg.trim()}>
                  {reply.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {internal ? "Add internal note" : "Send reply"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}