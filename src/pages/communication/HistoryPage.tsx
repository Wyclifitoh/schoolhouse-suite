import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { StatusPill } from "@/components/communication/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Search, MessageSquare, Mail, History as HistoryIcon } from "lucide-react";
import { useHistory, useRetryMessage } from "@/hooks/useCommunicationHub";

export default function HistoryPage() {
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 25;
  const [detail, setDetail] = useState<any>(null);
  const { data, isLoading } = useHistory({ channel, status, search: search || undefined, limit, offset });
  const retry = useRetryMessage();

  const total = data?.total || 0;
  const rows = data?.rows || [];

  return (
    <DashboardLayout title="Message History" subtitle="Unified delivery log across SMS & Email">
      <CommunicationNav />
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HistoryIcon className="h-4 w-4 text-primary" /> History <span className="text-xs text-muted-foreground">({total})</span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
                <Input className="h-8 pl-7 w-48 text-xs" placeholder="Search…" value={search}
                  onChange={(e) => { setSearch(e.target.value); setOffset(0); }} />
              </div>
              <Select value={channel} onValueChange={(v) => { setChannel(v); setOffset(0); }}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => { setStatus(v); setOffset(0); }}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> :
            !rows.length ? <p className="p-12 text-center text-sm text-muted-foreground">No messages match</p> :
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Channel</TableHead>
                    <TableHead className="text-xs">Recipient</TableHead>
                    <TableHead className="text-xs">Subject / Message</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Sent by</TableHead>
                    <TableHead className="text-xs">When</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={`${r.channel}-${r.id}`} className="cursor-pointer" onClick={() => setDetail(r)}>
                      <TableCell>
                        {r.channel === "sms" ? <MessageSquare className="h-4 w-4 text-primary" /> : <Mail className="h-4 w-4 text-blue-600" />}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{r.recipient_name || "—"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{r.recipient}</div>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{r.subject || r.body}</TableCell>
                      <TableCell><StatusPill status={r.status} /></TableCell>
                      <TableCell className="text-xs">{r.sent_by_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {r.status === "failed" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Retry"
                            onClick={(e) => { e.stopPropagation(); retry.mutate({ kind: r.channel, id: r.id }); }}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between p-3 border-t text-xs">
                <span className="text-muted-foreground">Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7" disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}>Prev</Button>
                  <Button size="sm" variant="outline" className="h-7" disabled={offset + limit >= total}
                    onClick={() => setOffset(offset + limit)}>Next</Button>
                </div>
              </div>
            </>
          }
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Message details</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Channel:</span> {detail.channel}</div>
              <div><span className="text-muted-foreground">To:</span> {detail.recipient_name} · <span className="font-mono text-xs">{detail.recipient}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <StatusPill status={detail.status} /></div>
              {detail.subject && <div><span className="text-muted-foreground">Subject:</span> {detail.subject}</div>}
              <div className="rounded-md border bg-muted/40 p-3 whitespace-pre-wrap text-xs">{detail.body}</div>
              {detail.error_message && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                  {detail.error_message}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {new Date(detail.created_at).toLocaleString()}{detail.sent_by_name ? ` · by ${detail.sent_by_name}` : ""}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}