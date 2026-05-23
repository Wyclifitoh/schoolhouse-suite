import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";

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
              <SelectItem value="custom">Custom Numbers/Emails</SelectItem>
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
                  const next = [...customRows];
                  next[i].name = e.target.value;
                  setCustomRows(next);
                  onChange({ ...audience, custom: next });
                }}
              />
              <Input
                placeholder="Phone"
                value={row.phone}
                className="h-9 text-xs"
                onChange={(e) => {
                  const next = [...customRows];
                  next[i].phone = e.target.value;
                  setCustomRows(next);
                  onChange({ ...audience, custom: next });
                }}
              />
              <Input
                placeholder="Email"
                value={row.email}
                className="h-9 text-xs"
                onChange={(e) => {
                  const next = [...customRows];
                  next[i].email = e.target.value;
                  setCustomRows(next);
                  onChange({ ...audience, custom: next });
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => {
                  const next = customRows.filter((_, idx) => idx !== i);
                  setCustomRows(
                    next.length ? next : [{ name: "", phone: "", email: "" }],
                  );
                  onChange({ ...audience, custom: next });
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

const StatusBadge = ({ status }: { status: string }) => {
  const cls =
    status === "sent"
      ? "bg-success/10 text-success border-0"
      : status === "failed"
        ? "bg-destructive/10 text-destructive border-0"
        : "bg-warning/10 text-warning border-0";
  const Icon =
    status === "sent"
      ? CheckCircle2
      : status === "failed"
        ? XCircle
        : AlertCircle;
  return (
    <Badge className={`${cls} gap-1 text-[10px]`}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
};

const SmsComposer = () => {
  const [audience, setAudience] = useState<Audience>({
    type: "parents",
    relationship: "all",
  });
  const [message, setMessage] = useState("");
  const sendSms = useSendSms();

  const handleSend = () => {
    if (!message.trim()) return toast.error("Message is required");
    sendSms.mutate(
      { audience, message },
      {
        onSuccess: () => setMessage(""),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Send SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AudiencePicker audience={audience} onChange={setAudience} />
        <div className="space-y-1.5">
          <Label className="text-xs">
            Message *{" "}
            <span className="text-muted-foreground">
              ({message.length}/480 chars)
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
        <Button
          onClick={handleSend}
          disabled={sendSms.isPending || !message.trim()}
        >
          <Send className="h-4 w-4 mr-1.5" />
          {sendSms.isPending ? "Sending..." : "Send SMS"}
        </Button>
      </CardContent>
    </Card>
  );
};

const EmailComposer = () => {
  const [audience, setAudience] = useState<Audience>({
    type: "parents",
    relationship: "all",
  });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const sendEmail = useSendEmail();

  const handleSend = () => {
    if (!subject.trim() || !body.trim())
      return toast.error("Subject and body required");
    sendEmail.mutate(
      { audience, subject, body },
      {
        onSuccess: () => {
          setSubject("");
          setBody("");
        },
      },
    );
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
            rows={8}
            value={body}
            placeholder="Email body..."
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={sendEmail.isPending || !subject.trim() || !body.trim()}
        >
          <Send className="h-4 w-4 mr-1.5" />
          {sendEmail.isPending ? "Sending..." : "Send Email"}
        </Button>
      </CardContent>
    </Card>
  );
};

const SmsLog = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const { data: logs = [], isLoading } = useSmsLog({
    search: search || undefined,
    status: status || undefined,
  });
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            SMS History
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No SMS sent yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Recipient</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Message</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Sent By</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">
                    <div className="font-medium">{m.recipient_name || "—"}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {m.recipient_type}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {m.to_phone}
                  </TableCell>
                  <TableCell
                    className="text-xs max-w-xs truncate"
                    title={m.message}
                  >
                    {m.message}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

const EmailLog = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const { data: logs = [], isLoading } = useEmailLog({
    search: search || undefined,
    status: status || undefined,
  });
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Email History
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No emails sent yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Recipient</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Subject</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Sent By</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">
                    <div className="font-medium">{m.recipient_name || "—"}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {m.recipient_type}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{m.to_email}</TableCell>
                  <TableCell
                    className="text-xs max-w-xs truncate"
                    title={m.subject}
                  >
                    {m.subject}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

const Communication = () => {
  return (
    <DashboardLayout
      title="Communication"
      subtitle="Send SMS & emails to parents, teachers and staff"
    >
      <Tabs defaultValue="sms" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="sms" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Send SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Send Email
          </TabsTrigger>
          <TabsTrigger value="sms-log" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            SMS Log
          </TabsTrigger>
          <TabsTrigger value="email-log" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Email Log
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sms">
          <SmsComposer />
        </TabsContent>
        <TabsContent value="email">
          <EmailComposer />
        </TabsContent>
        <TabsContent value="sms-log">
          <SmsLog />
        </TabsContent>
        <TabsContent value="email-log">
          <EmailLog />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Communication;
