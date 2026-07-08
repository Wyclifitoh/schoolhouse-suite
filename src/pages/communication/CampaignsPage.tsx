import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { StatusPill } from "@/components/communication/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Copy, Trash2, Send, Edit3, Megaphone } from "lucide-react";
import {
  useCampaigns, useSaveCampaign, useDeleteCampaign, useDuplicateCampaign, useSendCampaign,
  type Campaign,
} from "@/hooks/useCommunicationHub";

const empty: Partial<Campaign> = { name: "", channel: "sms", body: "", audience: { type: "parents", relationship: "all" } as any, status: "draft" };

export default function CampaignsPage() {
  const [status, setStatus] = useState<string>("all");
  const { data: campaigns = [], isLoading } = useCampaigns({ status: status === "all" ? undefined : status });
  const save = useSaveCampaign();
  const del = useDeleteCampaign();
  const dup = useDuplicateCampaign();
  const send = useSendCampaign();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Campaign>>(empty);

  const submit = () => {
    if (!editing.name || !editing.body) return;
    save.mutate({ id: editing.id, data: editing }, { onSuccess: () => setOpen(false) });
  };

  return (
    <DashboardLayout title="Campaigns" subtitle="Bulk messaging campaigns">
      <CommunicationNav />
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" /> Campaigns
              <Badge variant="secondary" className="text-[10px] ml-1">{campaigns.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["all","draft","scheduled","running","completed","failed"].map(s =>
                    <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => { setEditing(empty); setOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> New Campaign
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : !campaigns.length ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No campaigns yet. Create your first campaign to send bulk messages.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Channel</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Stats</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{c.name}</div>
                      {c.description && <div className="text-[11px] text-muted-foreground">{c.description}</div>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] uppercase">{c.channel}</Badge></TableCell>
                    <TableCell><StatusPill status={c.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.stats ? `${c.stats.sent || 0}/${c.stats.total || 0} sent · ${c.stats.failed || 0} failed` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {(c.status === "draft" || c.status === "scheduled") && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Send now"
                            disabled={send.isPending} onClick={() => send.mutate(c.id)}>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit"
                          onClick={() => { setEditing({ ...c, audience: typeof c.audience === "string" ? JSON.parse(c.audience as any) : c.audience }); setOpen(true); }}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Duplicate"
                          onClick={() => dup.mutate(c.id)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete"
                          onClick={() => confirm("Delete this campaign?") && del.mutate(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} Campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Name</Label>
                <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label className="text-xs">Channel</Label>
                <Select value={editing.channel} onValueChange={(v: any) => setEditing({ ...editing, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Description</Label>
              <Input value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            {(editing.channel === "email" || editing.channel === "both") && (
              <div><Label className="text-xs">Subject</Label>
                <Input value={editing.subject || ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></div>
            )}
            <div><Label className="text-xs">Audience type</Label>
              <Select value={(editing.audience as any)?.type || "parents"}
                onValueChange={(v) => setEditing({ ...editing, audience: { type: v, relationship: v === "parents" ? "all" : undefined } as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="parents">All Parents</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="staff">All Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Message body</Label>
              <Textarea rows={6} value={editing.body || ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></div>
            <div><Label className="text-xs">Schedule for (optional)</Label>
              <Input type="datetime-local" value={editing.scheduled_at?.slice(0,16) || ""}
                onChange={(e) => setEditing({ ...editing, scheduled_at: e.target.value, status: e.target.value ? "scheduled" : "draft" })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}