import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { SmsPreview, EmailPreview } from "@/components/communication/MessagePreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Mail, Send, Users, FileText, Eye, Plus, X, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import {
  useSendSms, useSendEmail, usePreviewRecipients,
  type Audience, type AudienceType, type ParentRelationship,
} from "@/hooks/useMessaging";
import { useSmsTemplates } from "@/hooks/useCommHub";
import { useSaveScheduled } from "@/hooks/useCommunicationHub";

type Channel = "sms" | "email" | "both";

export default function SendMessagePage() {
  const [channel, setChannel] = useState<Channel>("sms");
  const [audience, setAudience] = useState<Audience>({ type: "parents", relationship: "all" });
  const [customRows, setCustomRows] = useState([{ name: "", phone: "", email: "" }]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);

  const { data: templates = [] } = useSmsTemplates();
  const preview = usePreviewRecipients();
  const sendSms = useSendSms();
  const sendEmail = useSendEmail();
  const schedule = useSaveScheduled();

  const smsSegments = Math.ceil(body.length / 160) || 1;
  const filteredTemplates = useMemo(() => {
    return templates.filter((t: any) => {
      if (channel === "both") return true;
      return !t.channel || t.channel === "sms" || t.channel === channel;
    });
  }, [templates, channel]);

  const finalAudience: Audience =
    audience.type === "custom" ? { type: "custom", custom: customRows.filter((r) => r.phone || r.email) } : audience;

  const doPreview = () => {
    preview.mutate(finalAudience, {
      onSuccess: (r) => setConfirmOpen(true),
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const doSend = async () => {
    if (channel === "sms" || channel === "both") {
      if (!body.trim()) return toast.error("Message body is required");
      await sendSms.mutateAsync({ audience: finalAudience, message: body });
    }
    if (channel === "email" || channel === "both") {
      if (!subject.trim() || !body.trim()) return toast.error("Subject and body are required");
      await sendEmail.mutateAsync({ audience: finalAudience, subject, body });
    }
    setBody(""); setSubject(""); setConfirmOpen(false);
  };

  const doSchedule = () => {
    if (!scheduledAt) return toast.error("Pick a date/time");
    if (!body.trim()) return toast.error("Message body is required");
    schedule.mutate(
      { data: { channel, audience: finalAudience, subject, body, scheduled_at: scheduledAt } },
      { onSuccess: () => { setBody(""); setSubject(""); setScheduledAt(""); } },
    );
  };

  return (
    <DashboardLayout title="Send Message" subtitle="Compose and deliver messages across channels">
      <CommunicationNav />

      <div className="grid gap-4 lg:grid-cols-[1fr,360px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Compose</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Channel */}
            <div>
              <Label className="text-xs mb-2 block">Channel</Label>
              <div className="inline-flex rounded-lg border p-1 bg-muted/40">
                {([
                  { v: "sms", label: "SMS", icon: MessageSquare },
                  { v: "email", label: "Email", icon: Mail },
                  { v: "both", label: "Both", icon: Send },
                ] as const).map((c) => (
                  <button
                    key={c.v}
                    onClick={() => setChannel(c.v)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      channel === c.v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <c.icon className="h-3.5 w-3.5" /> {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Users className="h-3.5 w-3.5" /> Recipients
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Audience</Label>
                  <Select value={audience.type} onValueChange={(v: AudienceType) => setAudience({
                    ...audience, type: v, relationship: v === "parents" ? "all" : undefined,
                  })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parents">Parents</SelectItem>
                      <SelectItem value="teachers">Teachers</SelectItem>
                      <SelectItem value="staff">All Staff</SelectItem>
                      <SelectItem value="custom">Custom List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {audience.type === "parents" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Relationship</Label>
                    <Select value={audience.relationship || "all"} onValueChange={(v: ParentRelationship) =>
                      setAudience({ ...audience, relationship: v })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Parents</SelectItem>
                        <SelectItem value="father">Fathers only</SelectItem>
                        <SelectItem value="mother">Mothers only</SelectItem>
                        <SelectItem value="guardian">Guardians only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {audience.type === "custom" && (
                <div className="space-y-2">
                  {customRows.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2">
                      <Input placeholder="Name" className="h-8 text-xs" value={row.name}
                        onChange={(e) => { const n = [...customRows]; n[i].name = e.target.value; setCustomRows(n); }} />
                      <Input placeholder="Phone" className="h-8 text-xs" value={row.phone}
                        onChange={(e) => { const n = [...customRows]; n[i].phone = e.target.value; setCustomRows(n); }} />
                      <Input placeholder="Email" className="h-8 text-xs" value={row.email}
                        onChange={(e) => { const n = [...customRows]; n[i].email = e.target.value; setCustomRows(n); }} />
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => setCustomRows(customRows.filter((_, idx) => idx !== i))}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="h-8"
                    onClick={() => setCustomRows([...customRows, { name: "", phone: "", email: "" }])}>
                    <Plus className="h-3 w-3 mr-1" /> Add recipient
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() =>
                  preview.mutate(finalAudience, {
                    onSuccess: (r) => toast.success(`${r.count} recipient(s) found`),
                    onError: (e: Error) => toast.error(e.message),
                  })} disabled={preview.isPending}>
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {preview.isPending ? "Checking…" : "Preview recipients"}
                </Button>
                {preview.data && (
                  <Badge variant="secondary" className="text-xs">{preview.data.count} recipient(s)</Badge>
                )}
                <span className="text-[11px] text-muted-foreground ml-auto">
                  More audiences (classes, streams, fee defaulters, clubs) coming soon
                </span>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Message</Label>
                <Button size="sm" variant="outline" className="h-7"
                  onClick={() => setTplOpen(true)} disabled={!filteredTemplates.length}>
                  <FileText className="h-3 w-3 mr-1.5" /> Use template
                </Button>
              </div>
              {(channel === "email" || channel === "both") && (
                <Input placeholder="Email subject" value={subject}
                  onChange={(e) => setSubject(e.target.value)} />
              )}
              <Textarea rows={8} value={body}
                placeholder={channel === "email" ? "Compose your email (HTML supported)…" : "Type your message…"}
                onChange={(e) => setBody(e.target.value)}
                maxLength={channel === "sms" ? 480 : undefined} />
              {(channel === "sms" || channel === "both") && (
                <p className="text-[11px] text-muted-foreground text-right">
                  {body.length}/{channel === "sms" ? 480 : "∞"} chars · {smsSegments} SMS segment{smsSegments > 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <Button onClick={doPreview}
                disabled={!body.trim() || preview.isPending || sendSms.isPending || sendEmail.isPending}>
                <Send className="h-4 w-4 mr-1.5" /> Send now
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <Input type="datetime-local" className="h-9 w-52 text-xs"
                  value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                <Button variant="outline" onClick={doSchedule} disabled={schedule.isPending || !scheduledAt}>
                  <CalendarClock className="h-4 w-4 mr-1.5" /> Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Eye className="h-3.5 w-3.5" /> Preview
          </div>
          {(channel === "sms" || channel === "both") && <SmsPreview message={body} />}
          {(channel === "email" || channel === "both") && <EmailPreview subject={subject} body={body} />}
        </div>
      </div>

      {/* Confirm */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm send</DialogTitle>
            <DialogDescription>
              Sending to <b>{preview.data?.count || 0}</b> recipient(s) via <b>{channel.toUpperCase()}</b>.
              {(channel === "sms" || channel === "both") &&
                ` This will use ${(preview.data?.count || 0) * smsSegments} SMS credit(s).`}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap max-h-40 overflow-auto">
            {subject && <p className="font-medium mb-1">Subject: {subject}</p>}
            {body}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={doSend} disabled={sendSms.isPending || sendEmail.isPending}>
              {sendSms.isPending || sendEmail.isPending ? "Sending…" : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates picker */}
      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Pick a template</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {filteredTemplates.map((t: any) => (
              <button key={t.id} className="w-full text-left rounded-md border p-3 hover:bg-accent transition"
                onClick={() => { setBody(t.body); if (t.subject) setSubject(t.subject); setTplOpen(false); }}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-sm">{t.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{t.channel || "sms"}</Badge>
                </div>
                {t.subject && <p className="text-xs font-medium">{t.subject}</p>}
                <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
              </button>
            ))}
            {!filteredTemplates.length && (
              <p className="text-sm text-muted-foreground text-center py-8">No templates available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}