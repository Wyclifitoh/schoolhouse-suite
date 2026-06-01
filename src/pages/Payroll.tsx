/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSchool } from "@/contexts/SchoolContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Play, CheckCircle, Banknote, FileText } from "lucide-react";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  processing: "bg-primary/10 text-primary",
  approved: "bg-success/10 text-success",
  paid: "bg-success/20 text-success",
};

const kes = (n: any) => `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function Payroll() {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const qc = useQueryClient();
  const [newPeriodOpen, setNewPeriodOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const now = new Date();
  const [form, setForm] = useState({
    name: `Payroll ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    start_date: "",
    end_date: "",
    payment_date: "",
  });

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ["payroll-periods", schoolId],
    queryFn: () => api.get<any[]>("/payroll/periods"),
    enabled: !!schoolId,
  });

  const { data: runs = [] } = useQuery({
    queryKey: ["payroll-runs", selectedPeriodId],
    queryFn: () => api.get<any[]>(`/payroll/periods/${selectedPeriodId}/runs`),
    enabled: !!selectedPeriodId,
  });

  const selected = periods.find((p: any) => p.id === selectedPeriodId);

  const createPeriod = useMutation({
    mutationFn: () => api.post("/payroll/periods", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-periods"] });
      setNewPeriodOpen(false);
      toast({ title: "Payroll period created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const action = (path: string, label: string) => useMutation({
    mutationFn: (id: string) => api.post(`/payroll/periods/${id}/${path}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-periods"] });
      qc.invalidateQueries({ queryKey: ["payroll-runs"] });
      toast({ title: label });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const runMut = action("run", "Payroll calculated");
  const approveMut = action("approve", "Period approved");
  const payMut = action("pay", "Period marked paid");

  const totals = runs.reduce(
    (a: any, r: any) => ({
      gross: a.gross + Number(r.gross_salary || 0),
      net: a.net + Number(r.net_salary || 0),
      paye: a.paye + Number(r.paye_amount || 0),
    }),
    { gross: 0, net: 0, paye: 0 },
  );

  return (
    <DashboardLayout title="Payroll" subtitle="Periods, statutory calculations and payslips">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Manage payroll periods. Runs auto-calculate PAYE, NSSF, SHIF and Housing Levy.</p>
          <Dialog open={newPeriodOpen} onOpenChange={setNewPeriodOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Period</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Payroll Period</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Month</Label>
                    <Select value={String(form.month)} onValueChange={v => setForm(p => ({ ...p, month: Number(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                  <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                </div>
                <div><Label>Payment Date</Label><Input type="date" value={form.payment_date} onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))} /></div>
                <Button className="w-full" disabled={createPeriod.isPending} onClick={() => createPeriod.mutate()}>
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Periods list */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading…</TableCell></TableRow>
                ) : periods.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payroll periods yet</TableCell></TableRow>
                ) : periods.map((p: any) => (
                  <TableRow key={p.id} className={selectedPeriodId === p.id ? "bg-muted/40" : ""}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{MONTHS[p.month - 1]} {p.year}</TableCell>
                    <TableCell className="text-sm">{p.payment_date || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 capitalize ${STATUS_STYLES[p.status] || ""}`}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPeriodId(p.id)}>
                          <FileText className="h-4 w-4 mr-1" />View
                        </Button>
                        {p.status === "draft" && (
                          <Button variant="outline" size="sm" disabled={runMut.isPending} onClick={() => runMut.mutate(p.id)}>
                            <Play className="h-4 w-4 mr-1" />Run
                          </Button>
                        )}
                        {p.status === "processing" && (
                          <Button variant="outline" size="sm" onClick={() => approveMut.mutate(p.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />Approve
                          </Button>
                        )}
                        {p.status === "approved" && (
                          <Button size="sm" onClick={() => payMut.mutate(p.id)}>
                            <Banknote className="h-4 w-4 mr-1" />Mark Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Selected period runs */}
        {selected && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{runs.length}</div><p className="text-sm text-muted-foreground">Payslips</p></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{kes(totals.gross)}</div><p className="text-sm text-muted-foreground">Total Gross</p></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive">{kes(totals.paye)}</div><p className="text-sm text-muted-foreground">PAYE</p></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-success">{kes(totals.net)}</div><p className="text-sm text-muted-foreground">Total Net</p></CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Basic</TableHead>
                      <TableHead className="text-right">Allow.</TableHead>
                      <TableHead className="text-right">PAYE</TableHead>
                      <TableHead className="text-right">NSSF</TableHead>
                      <TableHead className="text-right">SHIF</TableHead>
                      <TableHead className="text-right">Housing</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Run the period to generate payslips</TableCell></TableRow>
                    ) : runs.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.employee_number}</TableCell>
                        <TableCell className="font-medium">{r.first_name} {r.last_name}</TableCell>
                        <TableCell className="text-right">{kes(r.basic_salary)}</TableCell>
                        <TableCell className="text-right">{kes(r.total_allowances)}</TableCell>
                        <TableCell className="text-right text-destructive">{kes(r.paye_amount)}</TableCell>
                        <TableCell className="text-right text-destructive">{kes(r.nssf_amount)}</TableCell>
                        <TableCell className="text-right text-destructive">{kes(r.shif_amount)}</TableCell>
                        <TableCell className="text-right text-destructive">{kes(r.housing_levy_amount)}</TableCell>
                        <TableCell className="text-right font-bold">{kes(r.net_salary)}</TableCell>
                        <TableCell>
                          <Badge className={`border-0 capitalize ${STATUS_STYLES[r.status] || ""}`}>{r.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
