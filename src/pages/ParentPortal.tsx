import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap, Banknote, CalendarCheck, FileText, CreditCard,
  TrendingUp, AlertTriangle, CheckCircle2, Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const formatKES = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const ParentPortal = () => {
  const { user } = useAuth();
  const [payDialog, setPayDialog] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("mpesa");

  const handlePay = () => {
    toast.success(`Payment of ${formatKES(Number(payAmount))} initiated via ${payMethod === "mpesa" ? "M-Pesa" : "Card"}`);
    setPayDialog(false);
    setPayAmount("");
  };

  return (
    <DashboardLayout title="Parent Portal" subtitle="View your children's information">
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Children</p><p className="text-lg font-bold text-foreground">—</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Banknote className="h-5 w-5 text-success" /></div>
          <div><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-lg font-bold text-foreground">—</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><AlertTriangle className="h-5 w-5 text-warning" /></div>
          <div><p className="text-xs text-muted-foreground">Balance</p><p className="text-lg font-bold text-foreground">—</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><TrendingUp className="h-5 w-5 text-info" /></div>
          <div><p className="text-xs text-muted-foreground">Last Exam</p><p className="text-lg font-bold text-foreground">—</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="fees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fees"><Banknote className="h-4 w-4 mr-1" />Fees & Payments</TabsTrigger>
          <TabsTrigger value="academics"><FileText className="h-4 w-4 mr-1" />Academics</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck className="h-4 w-4 mr-1" />Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">Fee Statement</h3>
            <Dialog open={payDialog} onOpenChange={setPayDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><CreditCard className="h-4 w-4 mr-1" />Pay Now</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Make Payment</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Amount (KES)</Label>
                    <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount" />
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
                      <Input placeholder="0712345678" />
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
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground">Fee data will load from your linked student records.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academics" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground py-8">No exam results available yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground py-8">Attendance data will load from the backend.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ParentPortal;
