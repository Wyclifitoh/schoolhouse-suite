import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Banknote,
  CalendarCheck,
  FileText,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePortalResults } from "@/hooks/usePortalResults";

function PortalAcademics() {
  const [studentId, setStudentId] = useState(
    () => new URLSearchParams(window.location.search).get("student") || "",
  );
  const [draft, setDraft] = useState(studentId);
  const { data: results = [], isLoading } = usePortalResults(studentId);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Student ID</Label>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste student ID"
            />
          </div>
          <Button size="sm" onClick={() => setStudentId(draft.trim())}>
            Load
          </Button>
        </CardContent>
      </Card>

      {!studentId ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Enter a student ID to view published results.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No published results yet.
          </CardContent>
        </Card>
      ) : (
        results.map((r) => (
          <Card key={r.exam_id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{r.exam_name}</CardTitle>
                <div className="flex gap-2">
                  {r.curriculum_type && (
                    <Badge variant="outline">{r.curriculum_type}</Badge>
                  )}
                  {r.term_name && (
                    <Badge variant="secondary">{r.term_name}</Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Mean {r.mean} • {r.percentage}% • Published{" "}
                {r.published_at
                  ? new Date(r.published_at).toLocaleDateString()
                  : "—"}
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.subjects.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {s.subject_name}
                      </TableCell>
                      <TableCell>
                        {s.score ?? "—"} / {s.out_of ?? "—"}
                      </TableCell>
                      <TableCell>{s.grade || "—"}</TableCell>
                      <TableCell>{s.performance_level || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.remarks || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const ParentPortal = () => {
  const { user } = useAuth();
  const [payDialog, setPayDialog] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("mpesa");

  const handlePay = () => {
    toast.success(
      `Payment of ${formatKES(Number(payAmount))} initiated via ${payMethod === "mpesa" ? "M-Pesa" : "Card"}`,
    );
    setPayDialog(false);
    setPayAmount("");
  };

  return (
    <DashboardLayout
      title="Parent Portal"
      subtitle="View your children's information"
    >
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Children</p>
              <p className="text-lg font-bold text-foreground">—</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Banknote className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-lg font-bold text-foreground">—</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-bold text-foreground">—</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Exam</p>
              <p className="text-lg font-bold text-foreground">—</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fees">
            <Banknote className="h-4 w-4 mr-1" />
            Fees & Payments
          </TabsTrigger>
          <TabsTrigger value="academics">
            <FileText className="h-4 w-4 mr-1" />
            Academics
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <CalendarCheck className="h-4 w-4 mr-1" />
            Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">
              Fee Statement
            </h3>
            <Dialog open={payDialog} onOpenChange={setPayDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Pay Now
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Make Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Amount (KES)</Label>
                    <Input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            M-Pesa
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3 w-3" />
                            Card Payment
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {payMethod === "mpesa" && (
                    <div className="space-y-2">
                      <Label>M-Pesa Phone Number</Label>
                      <Input placeholder="0712345678" />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPayDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePay}
                    disabled={!payAmount || Number(payAmount) <= 0}
                  >
                    Pay {payAmount ? formatKES(Number(payAmount)) : ""}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground">
                Fee data will load from your linked student records.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academics" className="space-y-4">
          <PortalAcademics />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground py-8">
                Attendance data will load from the backend.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ParentPortal;
