/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSchool } from "@/contexts/SchoolContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/date";

export default function ApiKeysPage() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<any>(null);

  const { data: keys = [] } = useQuery({
    queryKey: ["api-keys", schoolId],
    queryFn: () => api.get<any[]>(`/api-keys`),
    enabled: !!schoolId,
  });
  const { data: logs = [] } = useQuery({
    queryKey: ["api-key-logs", schoolId],
    queryFn: () => api.get<any[]>(`/api-keys/logs?limit=200`),
    enabled: !!schoolId,
  });

  const createMut = useMutation({
    mutationFn: () => api.post<any>(`/api-keys`, { label }),
    onSuccess: (data) => {
      setCreated(data);
      setLabel("");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api-keys/${id}`),
    onSuccess: () => { toast.success("Revoked"); qc.invalidateQueries({ queryKey: ["api-keys"] }); },
  });

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <KeyRound className="h-7 w-7" /> Public API Keys
            </h1>
            <p className="text-muted-foreground">
              Keys for partners posting payments to <code>/api/v1/public/v1/payments</code>
            </p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreated(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New API Key</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{created ? "Save Your API Key" : "Create API Key"}</DialogTitle></DialogHeader>
              {!created ? (
                <div className="space-y-3 py-2">
                  <div className="space-y-2">
                    <Label>Label *</Label>
                    <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Equity Bank reconciliation" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={() => createMut.mutate()} disabled={!label || createMut.isPending}>
                      {createMut.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-800 rounded text-sm">
                    This key is shown <b>once</b>. Copy and store it securely now.
                  </div>
                  <div className="flex gap-2">
                    <Input readOnly value={created.api_key} className="font-mono text-xs" />
                    <Button variant="outline" onClick={() => copy(created.api_key)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setOpen(false); setCreated(null); }}>Done</Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="keys">
          <TabsList>
            <TabsTrigger value="keys">Keys</TabsTrigger>
            <TabsTrigger value="logs">Request Logs</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Active Keys</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Scopes</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No keys yet</TableCell></TableRow>
                    ) : keys.map((k: any) => (
                      <TableRow key={k.id}>
                        <TableCell>{k.label}</TableCell>
                        <TableCell className="font-mono text-xs">{k.key_prefix}…</TableCell>
                        <TableCell>{k.scopes}</TableCell>
                        <TableCell>{k.last_used_at ? formatDate(k.last_used_at) : "—"}</TableCell>
                        <TableCell>{formatDate(k.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={k.is_active ? "default" : "secondary"}>
                            {k.is_active ? "active" : "revoked"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {!!k.is_active && (
                            <Button size="sm" variant="ghost" onClick={() => revokeMut.mutate(k.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Recent Requests</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Idempotency</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No requests yet</TableCell></TableRow>
                    ) : logs.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(l.created_at)}</TableCell>
                        <TableCell>{l.key_label || "—"}</TableCell>
                        <TableCell>{l.method}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[260px] truncate">{l.path}</TableCell>
                        <TableCell>
                          <Badge variant={l.response_status >= 200 && l.response_status < 300 ? "default" : "destructive"}>
                            {l.response_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{l.idempotency_key || "—"}</TableCell>
                        <TableCell>{l.duration_ms ?? "—"} ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Integration Guide</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <b>Endpoint:</b>
                  <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto">
POST /api/v1/public/v1/payments
Headers:
  X-API-Key: lvk_xxxxxxxxxxxx
  Content-Type: application/json

Body:
{`{`}
  "txn_id": "EQT-001234",             // unique — used for idempotency
  "reference": "EQT-001234",
  "amount": 5000,
  "paid_at": "2026-06-22T10:00:00Z",
  "admission_number": "ADM-001",      // or "student_id"
  "payer_name": "Jane Doe",
  "payer_phone": "2547xxxxxxxx",
  "payment_method": "bank",           // bank | mpesa | cash | cheque | card
  "bank": "Equity Bank",
  "currency": "KES",
  "metadata": {`{ "branch": "Nairobi" }`}
{`}`}
                  </pre>
                </div>
                <div>
                  <b>Reconciliation:</b>
                  <pre className="bg-muted p-2 rounded mt-1 text-xs">
GET /api/v1/public/v1/payments/{`{reference}`}
Headers: X-API-Key: lvk_xxxxxxxxxxxx
                  </pre>
                </div>
                <div className="text-muted-foreground">
                  Duplicate <code>txn_id</code> values return the original payment record
                  (idempotent replay, HTTP 200).
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}