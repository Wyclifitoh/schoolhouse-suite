import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { SmsBalanceCard } from "@/components/communication/SmsBalanceCard";
import { StatusPill } from "@/components/communication/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, Mail, Clock, XCircle, TrendingUp,
  Send, Megaphone, FileText, CalendarClock, AlertCircle,
} from "lucide-react";
import { useCommDashboard } from "@/hooks/useCommunicationHub";
import { useHistory } from "@/hooks/useCommunicationHub";

function Stat({ icon: Icon, label, value, tint, sub }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
          <div className={`h-7 w-7 rounded-lg ${tint} flex items-center justify-center`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function CommunicationDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useCommDashboard();
  const { data: history } = useHistory({ limit: 6 });
  const { data: failures } = useHistory({ status: "failed", limit: 5 });

  const quickActions = [
    { label: "Send Message", icon: Send, to: "/communication/send", variant: "default" as const },
    { label: "Create Campaign", icon: Megaphone, to: "/communication/campaigns" },
    { label: "Schedule Message", icon: CalendarClock, to: "/communication/scheduled" },
    { label: "Create Template", icon: FileText, to: "/communication/templates" },
  ];

  return (
    <DashboardLayout title="Communication" subtitle="Command center for all school messaging">
      <CommunicationNav />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Stat icon={MessageSquare} label="SMS Today" value={stats?.sms_today ?? 0}
              sub={`${stats?.sms_sent_30d ?? 0} in last 30d`} tint="bg-primary/10 text-primary" />
            <Stat icon={Mail} label="Emails Today" value={stats?.email_today ?? 0}
              sub={`${stats?.email_sent_30d ?? 0} in last 30d`} tint="bg-blue-500/10 text-blue-600" />
            <Stat icon={Clock} label="Scheduled" value={stats?.scheduled ?? 0}
              sub="pending sends" tint="bg-warning/10 text-warning" />
            <Stat icon={XCircle} label="Failed (30d)" value={stats?.failed_30d ?? 0}
              sub="needs attention" tint="bg-destructive/10 text-destructive" />
            <Stat icon={TrendingUp} label="Delivery Rate" value={`${stats?.success_rate ?? 0}%`}
              sub="last 30 days" tint="bg-success/10 text-success" />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickActions.map((a) => (
                <Button key={a.label} variant={a.variant || "outline"}
                  className="h-auto py-3 flex-col gap-1.5" onClick={() => navigate(a.to)}>
                  <a.icon className="h-4 w-4" />
                  <span className="text-xs">{a.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!history?.rows?.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No messages sent yet
                </div>
              ) : (
                <div className="divide-y">
                  {history.rows.map((r) => (
                    <div key={`${r.channel}-${r.id}`} className="px-4 py-3 flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        r.channel === "sms" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {r.channel === "sms" ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {r.recipient_name || r.recipient}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.subject || r.body}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <StatusPill status={r.status} />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(r.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <SmsBalanceCard />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" /> Recent Failures
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!failures?.rows?.length ? (
                <div className="p-6 text-center text-xs text-muted-foreground">All clear</div>
              ) : (
                <div className="divide-y">
                  {failures.rows.map((r) => (
                    <div key={`${r.channel}-${r.id}`} className="px-4 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium truncate">
                          {r.recipient_name || r.recipient}
                        </p>
                        <span className="text-[10px] text-muted-foreground">{r.channel}</span>
                      </div>
                      {r.error_message && (
                        <p className="text-[11px] text-destructive truncate mt-0.5">
                          {r.error_message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}