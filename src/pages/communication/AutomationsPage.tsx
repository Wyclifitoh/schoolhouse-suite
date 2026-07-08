import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";
import { useAutomations, useUpdateAutomation } from "@/hooks/useCommunicationHub";
import { useSmsTemplates } from "@/hooks/useCommHub";

export default function AutomationsPage() {
  const { data: automations = [], isLoading } = useAutomations();
  const { data: templates = [] } = useSmsTemplates();
  const update = useUpdateAutomation();

  return (
    <DashboardLayout title="Automated Messages" subtitle="Auto-send messages on school events">
      <CommunicationNav />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Automation Triggers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> : (
            <div className="divide-y">
              {automations.map((a: any) => (
                <div key={a.trigger_key} className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{a.label}</h4>
                      {a.enabled ? <Badge className="bg-success/10 text-success border-0 text-[10px]">enabled</Badge>
                                 : <Badge variant="outline" className="text-[10px]">disabled</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={a.channel || "sms"}
                      onValueChange={(v: any) => update.mutate({ triggerKey: a.trigger_key, data: { channel: v } })}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={a.template_id || ""}
                      onValueChange={(v) => update.mutate({ triggerKey: a.trigger_key, data: { template_id: v || null } })}>
                      <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="No template" /></SelectTrigger>
                      <SelectContent>
                        {templates.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Switch checked={!!a.enabled}
                      onCheckedChange={(v) => update.mutate({ triggerKey: a.trigger_key, data: { enabled: v } })} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}