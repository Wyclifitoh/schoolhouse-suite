import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Mail,
  Send,
  Users,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  History,
  Plus,
  X,
  LayoutDashboard,
  FileText,
  Megaphone,
  Pin,
  Edit3,
  Trash2,
  Copy,
  RefreshCw,
  Wallet,
  Eye,
} from "lucide-react";
import {
  usePreviewRecipients,
  useSendSms,
  useSendEmail,
  useSmsLog,
  useEmailLog,
  type Audience,
  type AudienceType,
  type ParentRelationship,
} from "@/hooks/useMessaging";
import {
  useSmsTemplates,
  useCreateSmsTemplate,
  useUpdateSmsTemplate,
  useDeleteSmsTemplate,
  useNotices,
  useCreateNotice,
  useUpdateNotice,
  useDeleteNotice,
  type SmsTemplate,
  type Notice,
} from "@/hooks/useCommHub";
import { toast } from "sonner";

/* ============= SHARED ============= */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; Icon: any }> = {
    sent: { cls: "bg-success/10 text-success border-0", Icon: CheckCircle2 },
    failed: {
      cls: "bg-destructive/10 text-destructive border-0",
      Icon: XCircle,
    },
    pending: { cls: "bg-warning/10 text-warning border-0", Icon: AlertCircle },
    published: {
      cls: "bg-success/10 text-success border-0",
      Icon: CheckCircle2,
    },
    draft: { cls: "bg-muted text-muted-foreground border-0", Icon: Edit3 },
    archived: { cls: "bg-muted/50 text-muted-foreground border-0", Icon: X },
  };
  const { cls, Icon } = map[status] || map.pending;
  return (
    <Badge className={`${cls} gap-1 text-[10px]`}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
};

const AudiencePicker = ({
  audience,
  onChange,
}: {
  audience: Audience;
  onChange: (a: Audience) => void;
}) => {
  const preview = usePreviewRecipients();
  const [customRows, setCustomRows] = useState<
    { name: string; phone: string; email: string }[]
  >(
    audience.custom?.length
      ? audience.custom.map((c) => ({
          name: c.name || "",
          phone: c.phone || "",
          email: c.email || "",
        }))
      : [{ name: "", phone: "", email: "" }],
  );

  const handlePreview = () => {
    preview.mutate(audience, {
      onSuccess: (res) => toast.success(`${res.count} recipient(s) found`),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Audience *</Label>
          <Select
            value={audience.type}
            onValueChange={(v: AudienceType) =>
              onChange({
                ...audience,
                type: v,
                relationship: v === "parents" ? "all" : undefined,
              })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parents">Parents</SelectItem>
              <SelectItem value="teachers">Teachers</SelectItem>
              <SelectItem value="staff">All Staff</SelectItem>
              <SelectItem value="custom">Custom Numbers / Emails</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {audience.type === "parents" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Relationship</Label>
            <Select
              value={audience.relationship || "all"}
              onValueChange={(v: ParentRelationship) =>
                onChange({ ...audience, relationship: v })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
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
          <Label className="text-xs">Custom recipients</Label>
          {customRows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2">
              <Input
                placeholder="Name"
                value={row.name}
                className="h-9 text-xs"
                onChange={(e) => {
                  const n = [...customRows];
                  n[i].name = e.target.value;
                  setCustomRows(n);
                  onChange({ ...audience, custom: n });
                }}
              />
              <Input
                placeholder="Phone"
                value={row.phone}
                className="h-9 text-xs"
                onChange={(e) => {
                  const n = [...customRows];
                  n[i].phone = e.target.value;
                  setCustomRows(n);
                  onChange({ ...audience, custom: n });
                }}
              />
              <Input
                placeholder="Email"
                value={row.email}
                className="h-9 text-xs"
                onChange={(e) => {
                  const n = [...customRows];
                  n[i].email = e.target.value;
                  setCustomRows(n);
                  onChange({ ...audience, custom: n });
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => {
                  const n = customRows.filter((_, idx) => idx !== i);
                  setCustomRows(
                    n.length ? n : [{ name: "", phone: "", email: "" }],
                  );
                  onChange({ ...audience, custom: n });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() =>
              setCustomRows([...customRows, { name: "", phone: "", email: "" }])
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add row
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePreview}
          disabled={preview.isPending}
        >
          <Users className="h-3.5 w-3.5 mr-1.5" />
          {preview.isPending ? "Checking..." : "Preview Recipients"}
        </Button>
        {preview.data && (
          <Badge variant="secondary" className="text-xs">
            {preview.data.count} recipient(s)
          </Badge>
        )}
      </div>
    </div>
  );
};

/* ============= OVERVIEW ============= */
export const Overview = ({ goto }: { goto?: (tab: string) => void }) => {
  const navigate = useNavigate();
  const go = (tab: string) => {
    if (goto) goto(tab);
    else navigate(`/communication/${tab}`);
  };
  const { data: smsLogs = [] } = useSmsLog();
  const { data: emailLogs = [] } = useEmailLog();

  const stats = useMemo(() => {
    const ssent = smsLogs.filter((m: any) => m.status === "sent").length;
    const sfail = smsLogs.filter((m: any) => m.status === "failed").length;
    const esent = emailLogs.filter((m: any) => m.status === "sent").length;
    const efail = emailLogs.filter((m: any) => m.status === "failed").length;
    const sRate = smsLogs.length
      ? Math.round((ssent / smsLogs.length) * 100)
      : 0;
    const eRate = emailLogs.length
      ? Math.round((esent / emailLogs.length) * 100)
      : 0;
    return {
      smsTotal: smsLogs.length,
      ssent,
      sfail,
      sRate,
      emailTotal: emailLogs.length,
      esent,
      efail,
      eRate,
    };
  }, [smsLogs, emailLogs]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Delivery Analytics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "SMS Sent",
              value: stats.ssent,
              sub: `${stats.sRate}% delivery`,
              color: "text-success",
            },
            {
              label: "SMS Failed",
              value: stats.sfail,
              sub: `of ${stats.smsTotal}`,
              color: "text-destructive",
            },
            {
              label: "Emails Sent",
              value: stats.esent,
              sub: `${stats.eRate}% delivery`,
              color: "text-success",
            },
            {
              label: "Emails Failed",
              value: stats.efail,
              sub: `of ${stats.emailTotal}`,
              color: "text-destructive",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-card p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {s.label}
              </p>
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {s.sub}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> SMS Balance & Top-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md bg-background border p-3">
            <p className="text-[11px] text-muted-foreground">Current Balance</p>
            <p className="text-xl font-semibold text-foreground">
              Contact admin
            </p>
          </div>
          <div className="rounded-md bg-background border p-3 space-y-1.5">
            <p className="text-[11px] uppercase text-muted-foreground tracking-wide">
              Top-up via M-Pesa
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paybill</span>
              <span className="font-mono font-semibold">4116251</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account</span>
              <span className="font-mono font-semibold">Eagles</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            After payment, balance reflects within minutes.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => go("sms")}>
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Send SMS
          </Button>
          <Button size="sm" variant="outline" onClick={() => go("email")}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Send Email
          </Button>
          <Button size="sm" variant="outline" onClick={() => go("noticeboard")}>
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            New Notice
          </Button>
          <Button size="sm" variant="outline" onClick={() => go("templates")}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Manage Templates
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

/* ============= SMS COMPOSER ============= */
export const SmsComposer = () => {
  const [audience, setAudience] = useState<Audience>({
    type: "parents",
    relationship: "all",
  });
  const [message, setMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const { data: templates = [] } = useSmsTemplates();
  const sendSms = useSendSms();
  const preview = usePreviewRecipients();

  const handleSend = () => {
    if (!message.trim()) return toast.error("Message is required");
    sendSms.mutate(
      { audience, message },
      {
        onSuccess: () => {
          setMessage("");
          setPreviewOpen(false);
        },
      },
    );
  };
  const handlePreview = () => {
    if (!message.trim()) return toast.error("Message is required");
    preview.mutate(audience, {
      onSuccess: () => setPreviewOpen(true),
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Send SMS
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTplOpen(true)}
            disabled={!templates.length}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Use Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AudiencePicker audience={audience} onChange={setAudience} />
        <div className="space-y-1.5">
          <Label className="text-xs">
            Message *{" "}
            <span className="text-muted-foreground">
              ({message.length}/480 · {Math.ceil(message.length / 160) || 1}{" "}
              SMS)
            </span>
          </Label>
          <Textarea
            rows={5}
            value={message}
            maxLength={480}
            placeholder="Type SMS message..."
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!message.trim() || preview.isPending}
          >
            <Eye className="h-4 w-4 mr-1.5" /> Preview
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendSms.isPending || !message.trim()}
          >
            <Send className="h-4 w-4 mr-1.5" />
            {sendSms.isPending ? "Sending..." : "Send SMS"}
          </Button>
        </div>
      </CardContent>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm SMS</DialogTitle>
            <DialogDescription>
              Sending to {preview.data?.count || 0} recipient(s). This will use{" "}
              {(preview.data?.count || 0) *
                (Math.ceil(message.length / 160) || 1)}{" "}
              SMS credit(s).
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
            {message}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sendSms.isPending}>
              {sendSms.isPending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pick a Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {templates
              .filter((t) => t.is_active)
              .map((t) => (
                <button
                  key={t.id}
                  className="w-full text-left rounded-md border p-3 hover:bg-accent"
                  onClick={() => {
                    setMessage(t.body);
                    setTplOpen(false);
                  }}
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-sm">{t.name}</span>
                    {t.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {t.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {t.body}
                  </p>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

/* ============= EMAIL COMPOSER ============= */
export const EmailComposer = () => {
  const [audience, setAudience] = useState<Audience>({
    type: "parents",
    relationship: "all",
  });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const sendEmail = useSendEmail();
  const preview = usePreviewRecipients();

  const handleSend = () => {
    if (!subject.trim() || !body.trim())
      return toast.error("Subject and body required");
    sendEmail.mutate(
      { audience, subject, body },
      {
        onSuccess: () => {
          setSubject("");
          setBody("");
          setPreviewOpen(false);
        },
      },
    );
  };
  const handlePreview = () => {
    if (!subject.trim() || !body.trim())
      return toast.error("Subject and body required");
    preview.mutate(audience, {
      onSuccess: () => setPreviewOpen(true),
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Send Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AudiencePicker audience={audience} onChange={setAudience} />
        <div className="space-y-1.5">
          <Label className="text-xs">Subject *</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Body * (HTML allowed)</Label>
          <Textarea
            rows={10}
            value={body}
            placeholder="Compose email..."
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!subject.trim() || !body.trim() || preview.isPending}
          >
            <Eye className="h-4 w-4 mr-1.5" /> Preview
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendEmail.isPending || !subject.trim() || !body.trim()}
          >
            <Send className="h-4 w-4 mr-1.5" />
            {sendEmail.isPending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </CardContent>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Email</DialogTitle>
            <DialogDescription>
              Sending to {preview.data?.count || 0} recipient(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Subject:</span>{" "}
              <span className="font-medium">{subject}</span>
            </div>
            <div
              className="rounded-md border bg-background p-3 max-h-[40vh] overflow-auto prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sendEmail.isPending}>
              {sendEmail.isPending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

/* ============= LOGS ============= */
export const LogTable = ({ kind }: { kind: "sms" | "email" }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const sms = useSmsLog(
    kind === "sms"
      ? {
          search: search || undefined,
          status: status === "all" ? undefined : status,
        }
      : {},
  );
  const email = useEmailLog(
    kind === "email"
      ? {
          search: search || undefined,
          status: status === "all" ? undefined : status,
        }
      : {},
  );
  const { data: logs = [], isLoading } = kind === "sms" ? sms : email;
  const resendSms = useSendSms();
  const resendEmail = useSendEmail();
  const resend = kind === "sms" ? resendSms : resendEmail;

  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const pageRows = logs.slice(page * pageSize, (page + 1) * pageSize);

  const handleResend = (row: any) => {
    if (kind === "sms") {
      (resend as any).mutate({
        audience: {
          type: "custom",
          custom: [{ name: row.recipient_name, phone: row.to_phone }],
        },
        message: row.message,
      });
    } else {
      (resend as any).mutate({
        audience: {
          type: "custom",
          custom: [{ name: row.recipient_name, email: row.to_email }],
        },
        subject: row.subject,
        body: row.body,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {kind === "sms" ? "SMS" : "Email"} Logs
            <Badge variant="secondary" className="ml-2 text-[10px]">
              {logs.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                className="h-8 pl-7 w-48 text-xs"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !logs.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No {kind} sent yet
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Recipient</TableHead>
                  <TableHead className="text-xs">
                    {kind === "sms" ? "Phone" : "Email"}
                  </TableHead>
                  <TableHead className="text-xs">
                    {kind === "sms" ? "Message" : "Subject"}
                  </TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Sender</TableHead>
                  <TableHead className="text-xs">Timestamp</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">
                      <div className="font-medium">
                        {m.recipient_name || "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.recipient_type}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {m.to_phone || m.to_email}
                    </TableCell>
                    <TableCell
                      className="text-xs max-w-xs truncate"
                      title={m.message || m.subject}
                    >
                      {m.message || m.subject}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {m.sent_by_name || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Resend"
                        onClick={() => handleResend(m)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-3 border-t text-xs">
              <span className="text-muted-foreground">
                Page {page + 1} of {totalPages} · {logs.length} total
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/* ============= SMS TEMPLATES ============= */
const emptyTpl: Partial<SmsTemplate> = {
  name: "",
  body: "",
  description: "",
  category: "",
  is_active: true,
};
export const TemplatesTab = () => {
  const [search, setSearch] = useState("");
  const { data: templates = [], isLoading } = useSmsTemplates({
    search: search || undefined,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<SmsTemplate>>(emptyTpl);
  const create = useCreateSmsTemplate();
  const update = useUpdateSmsTemplate();
  const del = useDeleteSmsTemplate();

  const save = () => {
    if (!editing.name || !editing.body)
      return toast.error("Name and body required");
    if (editing.id)
      update.mutate(
        { id: editing.id, data: editing },
        { onSuccess: () => setOpen(false) },
      );
    else create.mutate(editing, { onSuccess: () => setOpen(false) });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> SMS Templates
            <Badge variant="secondary" className="ml-2 text-[10px]">
              {templates.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                className="h-8 pl-7 w-48 text-xs"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditing(emptyTpl);
                setOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Template
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : !templates.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No templates yet. Create your first reusable SMS template.
          </div>
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg border p-3 ${t.is_active ? "bg-background" : "bg-muted/30 opacity-70"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-sm">{t.name}</h4>
                    {t.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {t.category}
                      </Badge>
                    )}
                    {!t.is_active && (
                      <Badge variant="outline" className="text-[10px]">
                        inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {t.body}
                  </p>
                  {t.description && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">
                      {t.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={t.is_active}
                    onCheckedChange={() =>
                      update.mutate({
                        id: t.id,
                        data: { is_active: !t.is_active },
                      })
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      navigator.clipboard.writeText(t.body);
                      toast.success("Copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditing(t);
                      setOpen(true);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => {
                      if (confirm(`Delete template "${t.name}"?`))
                        del.mutate(t.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing.id ? "Edit Template" : "New Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input
                value={editing.name || ""}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Input
                  placeholder="e.g. fees, attendance"
                  value={editing.category || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Active</Label>
                <div className="h-9 flex items-center">
                  <Switch
                    checked={editing.is_active !== false}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, is_active: v })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                value={editing.description || ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Message Body *{" "}
                <span className="text-muted-foreground">
                  ({(editing.body || "").length}/480)
                </span>
              </Label>
              <Textarea
                rows={6}
                maxLength={480}
                value={editing.body || ""}
                onChange={(e) =>
                  setEditing({ ...editing, body: e.target.value })
                }
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "{student_name}",
                  "{admission_no}",
                  "{amount}",
                  "{balance}",
                  "{school_name}",
                  "{date}",
                ].map((p) => (
                  <Badge
                    key={p}
                    variant="secondary"
                    className="text-[10px] font-mono cursor-pointer"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        body: (editing.body || "") + " " + p,
                      })
                    }
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={create.isPending || update.isPending}
            >
              {editing.id ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

/* ============= NOTICEBOARD ============= */
const emptyNotice: Partial<Notice> = {
  title: "",
  message: "",
  audience: "all",
  priority: "normal",
  status: "draft",
  pinned: false,
};
export const NoticeboardTab = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: notices = [], isLoading } = useNotices({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Notice>>(emptyNotice);
  const create = useCreateNotice();
  const update = useUpdateNotice();
  const del = useDeleteNotice();

  const save = () => {
    if (!editing.title || !editing.message)
      return toast.error("Title and message required");
    if (editing.id)
      update.mutate(
        { id: editing.id, data: editing },
        { onSuccess: () => setOpen(false) },
      );
    else create.mutate(editing, { onSuccess: () => setOpen(false) });
  };
  const publish = (n: Notice) =>
    update.mutate({
      id: n.id,
      data: { status: n.status === "published" ? "draft" : "published" },
    });
  const togglePin = (n: Notice) =>
    update.mutate({ id: n.id, data: { pinned: !n.pinned } });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> Noticeboard
            <Badge variant="secondary" className="ml-2 text-[10px]">
              {notices.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                className="h-8 pl-7 w-48 text-xs"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => {
                setEditing(emptyNotice);
                setOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Notice
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : !notices.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No notices yet
          </div>
        ) : (
          notices.map((n) => {
            const expired = n.expires_at && new Date(n.expires_at) < new Date();
            return (
              <div
                key={n.id}
                className={`rounded-lg border p-3 ${n.pinned ? "border-primary/40 bg-primary/5" : "bg-background"} ${expired ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {n.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                      <h4 className="font-semibold text-sm">{n.title}</h4>
                      <StatusBadge status={n.status} />
                      <Badge variant="outline" className="text-[10px]">
                        {n.audience}
                      </Badge>
                      {n.priority !== "normal" && (
                        <Badge
                          className={`text-[10px] ${n.priority === "urgent" ? "bg-destructive/15 text-destructive" : n.priority === "high" ? "bg-warning/15 text-warning" : "bg-muted"}`}
                        >
                          {n.priority}
                        </Badge>
                      )}
                      {expired && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-destructive"
                        >
                          expired
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-3">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>By {n.created_by_name || "—"}</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      {n.expires_at && (
                        <span>
                          Expires {new Date(n.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Pin"
                      onClick={() => togglePin(n)}
                    >
                      <Pin
                        className={`h-3.5 w-3.5 ${n.pinned ? "text-primary fill-primary" : ""}`}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => publish(n)}
                    >
                      {n.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditing(n);
                        setOpen(true);
                      }}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${n.title}"?`)) del.mutate(n.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing.id ? "Edit Notice" : "New Notice"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input
                value={editing.title || ""}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message *</Label>
              <Textarea
                rows={6}
                value={editing.message || ""}
                onChange={(e) =>
                  setEditing({ ...editing, message: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Audience</Label>
                <Select
                  value={editing.audience || "all"}
                  onValueChange={(v: any) =>
                    setEditing({ ...editing, audience: v })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="parents">Parents</SelectItem>
                    <SelectItem value="teachers">Teachers</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select
                  value={editing.priority || "normal"}
                  onValueChange={(v: any) =>
                    setEditing({ ...editing, priority: v })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={editing.status || "draft"}
                  onValueChange={(v: any) =>
                    setEditing({ ...editing, status: v })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Publish now</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Publish at</Label>
                <Input
                  type="datetime-local"
                  value={editing.publish_at?.slice(0, 16) || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      publish_at: e.target.value || null,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expires at</Label>
                <Input
                  type="datetime-local"
                  value={editing.expires_at?.slice(0, 16) || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      expires_at: e.target.value || null,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!!editing.pinned}
                onCheckedChange={(v) => setEditing({ ...editing, pinned: v })}
              />
              <Label className="text-xs">Pin to top</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={create.isPending || update.isPending}
            >
              {editing.id ? "Save Changes" : "Create Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

/* ============= ROOT (Overview only — other tabs live in dedicated pages) ============= */
const Communication = () => {
  return (
    <DashboardLayout
      title="Communication"
      subtitle="Messaging, templates, and noticeboard overview"
    >
      <Overview />
    </DashboardLayout>
  );
};

export default Communication;
