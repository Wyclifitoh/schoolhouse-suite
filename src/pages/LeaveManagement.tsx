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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Check, X, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function LeaveManagement() {
  const { currentSchool } = useSchool();
  const { user } = useAuth();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({ staff_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" });

  const { data: leaveApplications = [], isLoading } = useQuery({
    queryKey: ["leave-applications", schoolId, statusFilter],
    queryFn: async () => {
      if (!schoolId) return [];
      let q = supabase.from("leave_applications").select("*, staff(first_name, last_name, staff_id_number), leave_types(name)").eq("school_id", schoolId).order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q;
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("staff").select("id, first_name, last_name, staff_id_number").eq("school_id", schoolId).eq("status", "active").order("first_name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: leaveTypes = [] } = useQuery({
    queryKey: ["leave-types", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("leave_types").select("*").eq("school_id", schoolId).eq("is_active", true);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("No school");
      const totalDays = differenceInDays(new Date(form.end_date), new Date(form.start_date)) + 1;
      const { error } = await supabase.from("leave_applications").insert({
        school_id: schoolId,
        staff_id: form.staff_id,
        leave_type_id: form.leave_type_id,
        start_date: form.start_date,
        end_date: form.end_date,
        total_days: totalDays,
        reason: form.reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      setIsApplyOpen(false);
      setForm({ staff_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "" });
      toast({ title: "Leave application submitted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leave_applications").update({ status, approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      toast({ title: "Leave application updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = { approved: "default", pending: "secondary", rejected: "destructive" };
    return <Badge variant={map[status] || "outline"} className="capitalize">{status}</Badge>;
  };

  const pendingCount = leaveApplications.filter((l: any) => l.status === "pending").length;
  const approvedCount = leaveApplications.filter((l: any) => l.status === "approved").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
            <p className="text-muted-foreground">Manage staff leave applications</p>
          </div>
          <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Apply Leave</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Staff Member *</Label>
                  <Select value={form.staff_id} onValueChange={v => setForm(p => ({ ...p, staff_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent>{staffList.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.staff_id_number})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Leave Type *</Label>
                  <Select value={form.leave_type_id} onValueChange={v => setForm(p => ({ ...p, leave_type_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{leaveTypes.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.max_days} days)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                  <div><Label>End Date *</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                </div>
                <div><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsApplyOpen(false)}>Cancel</Button>
                  <Button onClick={() => applyMutation.mutate()} disabled={!form.staff_id || !form.leave_type_id || !form.start_date || !form.end_date || applyMutation.isPending}>
                    {applyMutation.isPending ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{leaveApplications.length}</div><p className="text-sm text-muted-foreground">Total Applications</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-600">{pendingCount}</div><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{approvedCount}</div><p className="text-sm text-muted-foreground">Approved</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{leaveApplications.filter((l: any) => l.status === "rejected").length}</div><p className="text-sm text-muted-foreground">Rejected</p></CardContent></Card>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : leaveApplications.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leave applications</TableCell></TableRow>
                ) : leaveApplications.map((leave: any) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">{leave.staff?.first_name} {leave.staff?.last_name}</TableCell>
                    <TableCell>{leave.leave_types?.name}</TableCell>
                    <TableCell>{leave.start_date}</TableCell>
                    <TableCell>{leave.end_date}</TableCell>
                    <TableCell>{leave.total_days}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{leave.reason || "—"}</TableCell>
                    <TableCell>{statusBadge(leave.status)}</TableCell>
                    <TableCell>
                      {leave.status === "pending" && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="text-green-600" onClick={() => actionMutation.mutate({ id: leave.id, status: "approved" })}><Check className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-600" onClick={() => actionMutation.mutate({ id: leave.id, status: "rejected" })}><X className="h-4 w-4" /></Button>
                        </div>
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
