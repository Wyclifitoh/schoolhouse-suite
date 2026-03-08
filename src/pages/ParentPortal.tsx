import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap, Banknote, CalendarCheck, FileText, CreditCard, Users,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, Phone,
} from "lucide-react";
import { students, studentFeeCollection, attendanceRecords, marksRegister, notices, ledgerEntries } from "@/data/mockData";
import { toast } from "sonner";

const parentChildren = [
  { ...students[0], feeData: studentFeeCollection[0] },
  { ...students[8], feeData: studentFeeCollection.find(f => f.student_id === "s9") || { total_fee: 30500, discount: 0, fine: 0, paid: 27300, balance: 3200, status: "partial" } },
];

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const ParentPortal = () => {
  const [activeChild, setActiveChild] = useState(parentChildren[0].id);
  const [payDialog, setPayDialog] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("mpesa");

  const child = parentChildren.find(c => c.id === activeChild)!;
  const childAttendance = attendanceRecords.filter(a => a.admission_no === child.admission_no);
  const childMarks = marksRegister.filter(m => m.admission_no === child.admission_no);

  const handlePay = () => {
    toast.success(`Payment of ${formatKES(Number(payAmount))} initiated via ${payMethod === "mpesa" ? "M-Pesa" : "Card"} for ${child.full_name}`);
    setPayDialog(false);
    setPayAmount("");
  };

  return (
    <DashboardLayout title="Parent Portal" subtitle={`Welcome, Mary Wanjiku — ${parentChildren.length} children enrolled`}>
      {/* Child Selector */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        {parentChildren.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveChild(c.id)}
            className={`flex items-center gap-3 rounded-xl border p-4 min-w-[220px] transition-all ${
              activeChild === c.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
              activeChild === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {c.full_name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">{c.full_name}</p>
              <p className="text-xs text-muted-foreground">{c.grade} {c.stream} · {c.admission_no}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Class</p><p className="text-lg font-bold text-foreground">{child.grade} {child.stream}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Banknote className="h-5 w-5 text-success" /></div>
          <div><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-lg font-bold text-foreground">{formatKES(child.feeData.paid)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${child.feeData.balance > 0 ? "bg-destructive/10" : "bg-success/10"}`}>
            {child.feeData.balance > 0 ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-success" />}
          </div>
          <div><p className="text-xs text-muted-foreground">Balance</p><p className={`text-lg font-bold ${child.feeData.balance > 0 ? "text-destructive" : "text-success"}`}>{formatKES(child.feeData.balance)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><TrendingUp className="h-5 w-5 text-info" /></div>
          <div><p className="text-xs text-muted-foreground">Last Exam</p><p className="text-lg font-bold text-foreground">{childMarks[0]?.percentage ?? "—"}%</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="fees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fees"><Banknote className="h-4 w-4 mr-1" />Fees & Payments</TabsTrigger>
          <TabsTrigger value="academics"><FileText className="h-4 w-4 mr-1" />Academics</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck className="h-4 w-4 mr-1" />Attendance</TabsTrigger>
          <TabsTrigger value="notices"><Users className="h-4 w-4 mr-1" />Notices</TabsTrigger>
        </TabsList>

        {/* FEES TAB */}
        <TabsContent value="fees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">Fee Statement — {child.full_name}</h3>
            <Dialog open={payDialog} onOpenChange={setPayDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><CreditCard className="h-4 w-4 mr-1" />Pay Now</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Make Payment</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">Paying for</p>
                    <p className="font-semibold text-foreground">{child.full_name} — {child.admission_no}</p>
                    <p className="text-xs text-muted-foreground mt-1">Outstanding: <span className="font-medium text-destructive">{formatKES(child.feeData.balance)}</span></p>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (KES)</Label>
                    <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder={String(child.feeData.balance)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa"><div className="flex items-center gap-2"><Phone className="h-3 w-3" />M-Pesa</div></SelectItem>
                        <SelectItem value="card"><div className="flex items-center gap-2"><CreditCard className="h-3 w-3" />Card Payment</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {payMethod === "mpesa" && (
                    <div className="space-y-2">
                      <Label>M-Pesa Phone Number</Label>
                      <Input placeholder="0712345678" defaultValue="0712345678" />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPayDialog(false)}>Cancel</Button>
                  <Button onClick={handlePay} disabled={!payAmount || Number(payAmount) <= 0}>Pay {payAmount ? formatKES(Number(payAmount)) : ""}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Fee Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-4 text-center">
                <div><p className="text-xs text-muted-foreground">Total Fee</p><p className="font-bold text-foreground">{formatKES(child.feeData.total_fee)}</p></div>
                <div><p className="text-xs text-muted-foreground">Discount</p><p className="font-bold text-success">{formatKES(child.feeData.discount)}</p></div>
                <div><p className="text-xs text-muted-foreground">Fine</p><p className="font-bold text-warning">{formatKES(child.feeData.fine)}</p></div>
                <div><p className="text-xs text-muted-foreground">Paid</p><p className="font-bold text-primary">{formatKES(child.feeData.paid)}</p></div>
                <div><p className="text-xs text-muted-foreground">Balance</p><p className={`font-bold ${child.feeData.balance > 0 ? "text-destructive" : "text-success"}`}>{formatKES(child.feeData.balance)}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Ledger */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Transaction History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Balance</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {ledgerEntries.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-muted-foreground">{l.date}</TableCell>
                      <TableCell className="font-medium text-foreground">{l.description}</TableCell>
                      <TableCell className="text-right text-destructive">{l.type === "debit" ? formatKES(l.amount) : "—"}</TableCell>
                      <TableCell className="text-right text-success">{l.type === "credit" ? formatKES(l.amount) : "—"}</TableCell>
                      <TableCell className={`text-right font-semibold ${l.balance < 0 ? "text-destructive" : "text-success"}`}>{formatKES(l.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACADEMICS TAB */}
        <TabsContent value="academics" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Exam Results — Mid-Term 1</CardTitle></CardHeader>
            <CardContent>
              {childMarks.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-primary/5 p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{childMarks[0].total}/600</p>
                      <p className="text-xs text-muted-foreground">Total Marks</p>
                    </div>
                    <div className="rounded-lg bg-success/5 p-3 text-center">
                      <p className="text-2xl font-bold text-success">{childMarks[0].grade}</p>
                      <p className="text-xs text-muted-foreground">Grade</p>
                    </div>
                    <div className="rounded-lg bg-info/5 p-3 text-center">
                      <p className="text-2xl font-bold text-info">#{childMarks[0].rank}</p>
                      <p className="text-xs text-muted-foreground">Position</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { sub: "Mathematics", marks: childMarks[0].math },
                      { sub: "English", marks: childMarks[0].english },
                      { sub: "Kiswahili", marks: childMarks[0].kiswahili },
                      { sub: "Science", marks: childMarks[0].science },
                      { sub: "Social Studies", marks: childMarks[0].social_studies },
                      { sub: "CRE", marks: childMarks[0].cre },
                    ].map(s => (
                      <div key={s.sub} className="flex justify-between items-center rounded-md border p-3">
                        <span className="text-sm text-muted-foreground">{s.sub}</span>
                        <span className={`text-sm font-bold ${s.marks >= 70 ? "text-success" : s.marks >= 40 ? "text-foreground" : "text-destructive"}`}>{s.marks}/100</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No exam results available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ATTENDANCE TAB */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Recent Attendance</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-success/5 p-3 text-center">
                  <p className="text-2xl font-bold text-success">{childAttendance.filter(a => a.status === "present").length}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="rounded-lg bg-destructive/5 p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{childAttendance.filter(a => a.status === "absent").length}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="rounded-lg bg-warning/5 p-3 text-center">
                  <p className="text-2xl font-bold text-warning">{childAttendance.filter(a => a.status === "late").length}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(childAttendance.length > 0 ? childAttendance : [{ id: "demo", student_name: child.full_name, admission_no: child.admission_no, grade: child.grade, date: "2024-03-15", status: "present" as const }]).map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-muted-foreground">{a.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          a.status === "present" ? "border-success/30 text-success bg-success/5" :
                          a.status === "absent" ? "border-destructive/30 text-destructive bg-destructive/5" :
                          "border-warning/30 text-warning bg-warning/5"
                        }>
                          {a.status === "present" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : a.status === "late" ? <Clock className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTICES TAB */}
        <TabsContent value="notices" className="space-y-3">
          {notices.filter(n => n.audience === "All" || n.audience === "Parents").map(n => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">{n.title}</h4>
                      <Badge variant="outline" className={n.priority === "high" ? "border-destructive/30 text-destructive" : "border-primary/30 text-primary"}>{n.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">{n.date}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ParentPortal;
