import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, DollarSign, FileText } from "lucide-react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function Payroll() {
  const { currentSchool } = useSchool();
  const { user } = useAuth();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  const { data: payrollRecords = [], isLoading } = useQuery({
    queryKey: ["payroll", schoolId, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("payroll").select("*, staff(first_name, last_name, staff_id_number, department_id, departments(name))").eq("school_id", schoolId).eq("month", selectedMonth).eq("year", selectedYear).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-for-payroll", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("staff").select("id, first_name, last_name, staff_id_number, basic_salary").eq("school_id", schoolId).eq("status", "active").order("first_name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("No school");
      const existingStaffIds = new Set(payrollRecords.map((p: any) => p.staff_id));
      const newRecords = staffList
        .filter((s: any) => !existingStaffIds.has(s.id))
        .map((s: any) => ({
          school_id: schoolId,
          staff_id: s.id,
          month: selectedMonth,
          year: selectedYear,
          basic_salary: s.basic_salary || 0,
          allowances: 0,
          deductions: 0,
          tax: 0,
          net_salary: s.basic_salary || 0,
          payment_status: "pending",
          created_by: user?.id,
        }));
      if (newRecords.length === 0) throw new Error("All staff already have payroll records for this period");
      const { error } = await supabase.from("payroll").insert(newRecords);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      setIsGenerateOpen(false);
      toast({ title: "Payroll generated successfully" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payroll").update({ payment_status: "paid", payment_date: new Date().toISOString().split("T")[0] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast({ title: "Marked as paid" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const totalGross = payrollRecords.reduce((sum: number, p: any) => sum + (p.basic_salary || 0) + (p.allowances || 0), 0);
  const totalNet = payrollRecords.reduce((sum: number, p: any) => sum + (p.net_salary || 0), 0);
  const paidCount = payrollRecords.filter((p: any) => p.payment_status === "paid").length;

  return (
    <DashboardLayout title="Payroll">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
            <p className="text-muted-foreground">Manage staff salary payments</p>
          </div>
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Generate Payroll</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Generate Payroll</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">This will create payroll records for all active staff for {MONTHS[selectedMonth - 1]} {selectedYear} using their basic salary.</p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{payrollRecords.length}</div><p className="text-sm text-muted-foreground">Staff Records</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">KES {totalGross.toLocaleString()}</div><p className="text-sm text-muted-foreground">Total Gross</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">KES {totalNet.toLocaleString()}</div><p className="text-sm text-muted-foreground">Total Net</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{paidCount}/{payrollRecords.length}</div><p className="text-sm text-muted-foreground">Paid</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : payrollRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No payroll records. Click "Generate Payroll" to create.</TableCell></TableRow>
                ) : payrollRecords.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.staff?.staff_id_number}</TableCell>
                    <TableCell className="font-medium">{record.staff?.first_name} {record.staff?.last_name}</TableCell>
                    <TableCell>{record.staff?.departments?.name || "—"}</TableCell>
                    <TableCell className="text-right">KES {record.basic_salary?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">KES {record.allowances?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">KES {record.deductions?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">KES {record.net_salary?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={record.payment_status === "paid" ? "default" : "secondary"} className="capitalize">{record.payment_status}</Badge>
                    </TableCell>
                    <TableCell>
                      {record.payment_status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => markPaidMutation.mutate(record.id)}>Mark Paid</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
