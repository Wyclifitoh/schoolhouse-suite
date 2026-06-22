/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSchool } from "@/contexts/SchoolContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useStudents } from "@/hooks/useStudents";
import { formatDate } from "@/utils/date";
import { Plus, Users, Check, Trash2, Eye } from "lucide-react";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

export default function BulkBursary() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);

  const { data: bulks = [] } = useQuery({
    queryKey: ["bulk-payments", schoolId],
    queryFn: () => api.get<any[]>(`/bulk-payments`),
    enabled: !!schoolId,
  });
  const { data: detail } = useQuery({
    queryKey: ["bulk-payments", viewId],
    queryFn: () => api.get<any>(`/bulk-payments/${viewId}`),
    enabled: !!viewId,
  });

  const commitMut = useMutation({
    mutationFn: (id: string) => api.post(`/bulk-payments/${id}/commit`, {}),
    onSuccess: () => {
      toast.success("Bulk payment committed — individual payments created");
      qc.invalidateQueries({ queryKey: ["bulk-payments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/bulk-payments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bulk-payments"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-7 w-7" /> Bulk Sponsorship / Bursary
            </h1>
            <p className="text-muted-foreground">Distribute one sponsor payment across many students</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Bulk Payment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Bulk Sponsorship Wizard</DialogTitle></DialogHeader>
              <BulkWizard
                onSaved={() => {
                  qc.invalidateQueries({ queryKey: ["bulk-payments"] });
                  setOpen(false);
                }}
                onClose={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Bulk Payments</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulks.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No bulk payments yet</TableCell></TableRow>
                ) : bulks.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell>{formatDate(b.payment_date)}</TableCell>
                    <TableCell>{b.sponsor_name}</TableCell>
                    <TableCell>{b.reference || "—"}</TableCell>
                    <TableCell className="text-right">{formatKES(b.total_amount)}</TableCell>
                    <TableCell className="text-right">{b.allocation_count}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === "committed" ? "default" : "secondary"}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setViewId(b.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {b.status === "draft" && (
                          <>
                            <Button size="sm" onClick={() => commitMut.mutate(b.id)}>
                              <Check className="h-4 w-4 mr-1" />Commit
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => delMut.mutate(b.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Bulk Allocations</DialogTitle></DialogHeader>
            {detail && (
              <div className="space-y-3">
                <div className="text-sm">
                  <div><b>Sponsor:</b> {detail.sponsor_name}</div>
                  <div><b>Total:</b> {formatKES(detail.total_amount)}</div>
                  <div><b>Status:</b> {detail.status}</div>
                </div>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Adm No</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(detail.allocations || []).map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.student_name}</TableCell>
                        <TableCell>{a.admission_number}</TableCell>
                        <TableCell className="text-right">{formatKES(a.amount)}</TableCell>
                        <TableCell>{a.payment_id ? <Badge variant="default">Posted</Badge> : <Badge variant="secondary">Pending</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function BulkWizard({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const { schoolId } = useSchool();
  const [step, setStep] = useState(1);
  const [sponsor, setSponsor] = useState("");
  const [contact, setContact] = useState("");
  const [total, setTotal] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState("bank");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"equal" | "manual">("equal");
  const [search, setSearch] = useState("");

  const { data: students = [] } = useStudents({ enabled: !!schoolId, search });

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  const allocations = useMemo(() => {
    if (!selectedIds.length) return [];
    if (mode === "equal" && total) {
      const per = Number(total) / selectedIds.length;
      return selectedIds.map((id) => ({ student_id: id, amount: Math.round(per * 100) / 100 }));
    }
    return selectedIds.map((id) => ({ student_id: id, amount: Number(amounts[id] || 0) }));
  }, [selectedIds, mode, total, amounts]);

  const allocTotal = allocations.reduce((s, a) => s + a.amount, 0);

  const saveMut = useMutation({
    mutationFn: () => api.post(`/bulk-payments`, {
      sponsor_name: sponsor, sponsor_contact: contact,
      total_amount: Number(total) || allocTotal,
      reference, payment_method: method, payment_date: date, notes,
      allocations,
    }),
    onSuccess: () => { toast.success("Draft saved"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        {["Sponsor", "Students", "Distribute", "Review"].map((label, i) => (
          <Badge key={i} variant={step === i + 1 ? "default" : "outline"}>{i + 1}. {label}</Badge>
        ))}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 col-span-2"><Label>Sponsor Name *</Label>
            <Input value={sponsor} onChange={(e) => setSponsor(e.target.value)} /></div>
          <div className="space-y-2"><Label>Contact</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} /></div>
          <div className="space-y-2"><Label>Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
          <div className="space-y-2"><Label>Total Amount (KES) *</Label>
            <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} /></div>
          <div className="space-y-2"><Label>Payment Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="mpesa_c2b">M-Pesa</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2"><Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="text-sm text-muted-foreground">{selectedIds.length} selected</div>
          <div className="border rounded max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead><TableHead>Adm No</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {students.slice(0, 300).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell><Checkbox checked={!!selected[s.id]} onCheckedChange={(v) => setSelected({ ...selected, [s.id]: !!v })} /></TableCell>
                    <TableCell>{s.full_name}</TableCell>
                    <TableCell>{s.admission_number}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <Label>Distribution:</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Equal split</SelectItem>
                <SelectItem value="manual">Manual amounts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {allocations.map((a) => {
                const s = students.find((x: any) => x.id === a.student_id);
                return (
                  <TableRow key={a.student_id}>
                    <TableCell>{s?.full_name || a.student_id}</TableCell>
                    <TableCell className="text-right">
                      {mode === "manual" ? (
                        <Input type="number" className="w-32 ml-auto text-right"
                          value={amounts[a.student_id] || ""}
                          onChange={(e) => setAmounts({ ...amounts, [a.student_id]: e.target.value })} />
                      ) : formatKES(a.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="text-right text-sm">Allocated: <b>{formatKES(allocTotal)}</b> of {formatKES(Number(total) || 0)}</div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-2 text-sm">
          <div><b>Sponsor:</b> {sponsor}</div>
          <div><b>Total:</b> {formatKES(Number(total) || 0)}</div>
          <div><b>Students:</b> {selectedIds.length}</div>
          <div><b>Allocated:</b> {formatKES(allocTotal)}</div>
          <div className="text-muted-foreground">Click "Save Draft" — you can review and commit later.</div>
        </div>
      )}

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 4 ? (
          <Button onClick={() => {
            if (step === 1 && (!sponsor || !total)) return toast.error("Sponsor and total required");
            if (step === 2 && selectedIds.length === 0) return toast.error("Select at least one student");
            setStep(step + 1);
          }}>Next</Button>
        ) : (
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving..." : "Save Draft"}
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}