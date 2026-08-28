import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Zap, Lock, Send, AlertTriangle, Wand2 } from "lucide-react";
import {
  useAutomations, useUpdateAutomation, useTestAutomation, useSeedCommDefaults,
} from "@/hooks/useCommunicationHub";
import { useSmsTemplates } from "@/hooks/useCommHub";
import { usePermissions } from "@/hooks/usePermission";

export default function AutomationsPage() {
  const { data: automations = [], isLoading } = useAutomations();
  const { data: templates = [] } = useSmsTemplates();
  const update = useUpdateAutomation();
  const test = useTestAutomation();
  const seed = useSeedCommDefaults();
  const can = usePermissions([
    "communication:update",
    "communication:send",
    "communication:create",
  ]);
  const [testFor, setTestFor] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const byChannel = useMemo(
    () => ({
      sms: templates.filter((t: any) => (t.channel || "sms") === "sms"),
      email: templates.filter((t: any) => t.channel === "email"),
    }),
    [templates],
  );

  /** Does this trigger have a usable template for the channel it will send on? */
  const templateReady = (a: any) => {
    const cat = `automation:${a.trigger_key}`;
    const has = (ch: "sms" | "email") =>
      !!a.template_id ||
      templates.some((t: any) => t.category === cat && (t.channel || "sms") === ch && t.is_active);
    if (a.channel === "email") return has("email");
    if (a.channel === "both") return has("sms") && has("email");
    return has("sms");
  };

  const readOnly = !can["communication:update"];

  return (
    <DashboardLayout title="Automated Messages" subtitle="Auto-send messages on school events">
      <CommunicationNav />

      {readOnly && (
        <Alert className="mb-4">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-xs">
            You can view automations but not change them — this needs the{" "}
            <code className="font-mono">communication:update</code> permission.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Automation Triggers
            </CardTitle>
            {can["communication:create"] && (
              <Button size="sm" variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending}>
                <Wand2 className="h-3.5 w-3.5 mr-1" /> Load default templates
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            When a trigger is enabled and has a template, CHUO sends the message
            automatically to the student's guardians and logs it in History.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> : (
            <TooltipProvider>
              <div className="divide-y">
                {automations.map((a: any) => {
                  const ready = templateReady(a);
                  const options = a.channel === "email" ? byChannel.email : byChannel.sms;
                  return (
                    <div key={a.trigger_key} className="p-4 flex items-center gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm">{a.label}</h4>
                          {a.enabled ? <Badge className="bg-success/10 text-success border-0 text-[10px]">enabled</Badge>
                                     : <Badge variant="outline" className="text-[10px]">disabled</Badge>}
                          {!ready && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-[10px] text-warning border-warning/40 gap-1">
                                  <AlertTriangle className="h-3 w-3" /> no template
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                Nothing will be sent until a template exists for this
                                trigger and channel. Use “Load default templates”, or
                                create one in Templates with category{" "}
                                <code>automation:{a.trigger_key}</code>.
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={a.channel || "sms"} disabled={readOnly}
                          onValueChange={(v: any) => update.mutate({ triggerKey: a.trigger_key, data: { channel: v } })}>
                          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={a.template_id || ""} disabled={readOnly}
                          onValueChange={(v) => update.mutate({ triggerKey: a.trigger_key, data: { template_id: v || null } })}>
                          <SelectTrigger className="h-8 w-52 text-xs">
                            <SelectValue placeholder="School default template" />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {can["communication:send"] && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8"
                                onClick={() => { setTestFor(a); setPhone(""); setEmail(""); }}>
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Send a real test message</TooltipContent>
                          </Tooltip>
                        )}
                        <Switch checked={!!a.enabled} disabled={readOnly}
                          onCheckedChange={(v) => update.mutate({ triggerKey: a.trigger_key, data: { enabled: v } })} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!testFor} onOpenChange={(o) => !o && setTestFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Test “{testFor?.label}”</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">
            This sends the real template through the live provider using sample
            placeholder values, and logs it in History.
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Phone (for SMS)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" />
            </div>
            <div>
              <Label className="text-xs">Email (for email)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.ac.ke" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestFor(null)}>Cancel</Button>
            <Button disabled={test.isPending || (!phone && !email)}
              onClick={() =>
                test.mutate(
                  { triggerKey: testFor.trigger_key, phone, email },
                  { onSuccess: () => setTestFor(null) },
                )
              }>
              Send test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
