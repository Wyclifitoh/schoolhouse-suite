import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CommunicationNav } from "@/components/communication/CommunicationNav";
import { StatusPill } from "@/components/communication/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ban, Trash2, Clock } from "lucide-react";
import { useScheduled, useCancelScheduled, useDeleteScheduled } from "@/hooks/useCommunicationHub";

export default function ScheduledPage() {
  const [tab, setTab] = useState("pending");
  const { data: rows = [], isLoading } = useScheduled({ status: tab });
  const cancel = useCancelScheduled();
  const del = useDeleteScheduled();

  return (
    <DashboardLayout title="Scheduled Messages" subtitle="Future messages queued for delivery">
      <CommunicationNav />
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Scheduled
            </CardTitle>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="pending">Upcoming</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> :
            !rows.length ? <p className="p-12 text-center text-sm text-muted-foreground">Nothing here</p> :
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Channel</TableHead>
                  <TableHead className="text-xs">Subject / Message</TableHead>
                  <TableHead className="text-xs">Scheduled For</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs uppercase font-medium">{r.channel}</TableCell>
                    <TableCell className="text-xs max-w-md truncate">
                      {r.subject && <span className="font-medium">{r.subject}: </span>}
                      <span className="text-muted-foreground">{r.body}</span>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(r.scheduled_at).toLocaleString()}</TableCell>
                    <TableCell><StatusPill status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Cancel"
                          onClick={() => cancel.mutate(r.id)}>
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete"
                        onClick={() => confirm("Delete?") && del.mutate(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}