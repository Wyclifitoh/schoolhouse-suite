import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings2, Send } from "lucide-react";
import { useCommSettings, useSaveCommSettings, useSendTestEmail } from "@/hooks/useCommunicationHub";

export default function CommunicationSettingsPage() {
  const { data } = useCommSettings();
  const save = useSaveCommSettings();
  const test = useSendTestEmail();
  const [s, setS] = useState<any>({ sms: {}, email: {}, notices: {}, general: {} });
  const [testTo, setTestTo] = useState("");
  useEffect(() => { if (data) setS(data); }, [data]);

  const upd = (section: string, k: string, v: any) =>
    setS((p: any) => ({ ...p, [section]: { ...p[section], [k]: v } }));

  return (
    <DashboardLayout title="Communication Settings" subtitle="Configure SMS, Email, and delivery preferences">
      <CommunicationNav />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" /> Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sms">
            <TabsList>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value="sms" className="space-y-3 mt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label className="text-xs">Provider</Label>
                  <Input value={s.sms.provider || ""} onChange={(e) => upd("sms","provider",e.target.value)} /></div>
                <div><Label className="text-xs">Sender ID / Shortcode</Label>
                  <Input value={s.sms.sender_id || ""} onChange={(e) => upd("sms","sender_id",e.target.value)} /></div>
                <div><Label className="text-xs">Retry attempts</Label>
                  <Input type="number" value={s.sms.retry_attempts ?? 2}
                    onChange={(e) => upd("sms","retry_attempts",Number(e.target.value))} /></div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-3 mt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label className="text-xs">Sender name</Label>
                  <Input value={s.email.sender_name || ""} onChange={(e) => upd("email","sender_name",e.target.value)} /></div>
                <div><Label className="text-xs">Reply-to email</Label>
                  <Input value={s.email.reply_to || ""} onChange={(e) => upd("email","reply_to",e.target.value)} /></div>
                <div><Label className="text-xs">Provider</Label>
                  <Input value={s.email.provider || ""} onChange={(e) => upd("email","provider",e.target.value)} /></div>
              </div>
              <div className="rounded-md border p-3 flex items-end gap-2">
                <div className="flex-1"><Label className="text-xs">Send test email to</Label>
                  <Input placeholder="test@example.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} /></div>
                <Button variant="outline" disabled={!testTo || test.isPending}
                  onClick={() => test.mutate({ to: testTo })}>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Send test
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="notices" className="space-y-3 mt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label className="text-xs">Default visibility</Label>
                  <Input value={s.notices.default_visibility || "all"}
                    onChange={(e) => upd("notices","default_visibility",e.target.value)} /></div>
                <div><Label className="text-xs">Default expiry (days)</Label>
                  <Input type="number" value={s.notices.default_expiry_days ?? 30}
                    onChange={(e) => upd("notices","default_expiry_days",Number(e.target.value))} /></div>
              </div>
            </TabsContent>

            <TabsContent value="general" className="space-y-3 mt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label className="text-xs">Queue batch size</Label>
                  <Input type="number" value={s.general.queue_batch_size ?? 25}
                    onChange={(e) => upd("general","queue_batch_size",Number(e.target.value))} /></div>
                <div><Label className="text-xs">Retry attempts</Label>
                  <Input type="number" value={s.general.retry_attempts ?? 2}
                    onChange={(e) => upd("general","retry_attempts",Number(e.target.value))} /></div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => save.mutate(s)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}