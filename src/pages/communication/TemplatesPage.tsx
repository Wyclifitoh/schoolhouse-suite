import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit3, FileText, Sparkles } from "lucide-react";
import { SmsPreview, EmailPreview } from "@/components/communication/MessagePreview";
import {
  useSmsTemplates, useCreateSmsTemplate, useUpdateSmsTemplate, useDeleteSmsTemplate,
} from "@/hooks/useCommHub";
import { toast } from "sonner";

const PLACEHOLDERS = [
  "{{student_name}}", "{{parent_name}}", "{{school_name}}",
  "{{balance}}", "{{class}}", "{{stream}}",
];

const SAMPLES: Record<string, string> = {
  "{{student_name}}": "Amina Kimani", "{{parent_name}}": "John Kimani",
  "{{school_name}}": "CHUO Academy", "{{balance}}": "KES 3,500",
  "{{class}}": "Grade 6", "{{stream}}": "East",
};
function fill(text: string) {
  return PLACEHOLDERS.reduce((acc, p) => acc.split(p).join(SAMPLES[p]), text || "");
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useSmsTemplates();
  const create = useCreateSmsTemplate();
  const update = useUpdateSmsTemplate();
  const del = useDeleteSmsTemplate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>({ name: "", body: "", channel: "sms", is_active: true });

  const save = () => {
    if (!editing.name || !editing.body) return toast.error("Name and body required");
    if (editing.id) update.mutate({ id: editing.id, data: editing }, { onSuccess: () => setOpen(false) });
    else create.mutate(editing, { onSuccess: () => setOpen(false) });
  };

  return (
    <DashboardLayout title="Templates" subtitle="Reusable SMS and Email templates with placeholders">
      <CommunicationNav />
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Templates
              <Badge variant="secondary" className="text-[10px]">{templates.length}</Badge>
            </CardTitle>
            <Button size="sm" onClick={() => { setEditing({ name: "", body: "", channel: "sms", is_active: true }); setOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
            !templates.length ? <p className="text-sm text-muted-foreground py-8 text-center col-span-2">No templates yet.</p> :
            templates.map((t: any) => (
              <div key={t.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-semibold text-sm">{t.name}</h4>
                      <Badge variant="outline" className="text-[10px] uppercase">{t.channel || "sms"}</Badge>
                      {t.category && <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>}
                    </div>
                    {t.subject && <p className="text-xs font-medium mt-0.5">{t.subject}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={t.is_active} onCheckedChange={() => update.mutate({ id: t.id, data: { is_active: !t.is_active } })} />
                    <Button size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => { setEditing(t); setOpen(true); }}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={() => confirm("Delete?") && del.mutate(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{t.body}</p>
              </div>
            ))
          }
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} Template</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Name</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label className="text-xs">Channel</Label>
                  <Select value={editing.channel || "sms"} onValueChange={(v) => setEditing({ ...editing, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Category</Label>
                <Input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
              {editing.channel === "email" && (
                <div><Label className="text-xs">Subject</Label>
                  <Input value={editing.subject || ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></div>
              )}
              <div><Label className="text-xs">Body</Label>
                <Textarea rows={7} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></div>
              <div>
                <Label className="text-xs mb-1 block flex items-center gap-1"><Sparkles className="h-3 w-3" /> Insert placeholder</Label>
                <div className="flex flex-wrap gap-1">
                  {PLACEHOLDERS.map((p) => (
                    <Button key={p} size="sm" variant="outline" className="h-6 text-[10px] font-mono"
                      onClick={() => setEditing({ ...editing, body: (editing.body || "") + " " + p })}>{p}</Button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Live preview (with sample data)</Label>
              {editing.channel === "email"
                ? <EmailPreview subject={fill(editing.subject || "")} body={fill(editing.body || "")} />
                : <SmsPreview message={fill(editing.body || "")} />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing.id ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}