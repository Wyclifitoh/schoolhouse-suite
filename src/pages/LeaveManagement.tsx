/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api"; // Updated to use your ApiClient
import { useSchool } from "@/contexts/SchoolContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Check, X, Settings } from "lucide-react";
import { formatDate } from "@/utils/date";
import { useAuth } from "@/contexts/AuthContext";

export default function LeaveManagement() {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    staff_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [typeForm, setTypeForm] = useState({
    name: "",
    code: "",
    max_days: "12",
    is_paid: true,
  });

  const { data: leaveApplications = [], isLoading } = useQuery({
    queryKey: ["leave-applications", schoolId, statusFilter],
    queryFn: () =>
      api.get<any[]>(`/leaves/applications?status=${statusFilter}`),
    enabled: !!schoolId,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff", schoolId],
    queryFn: () => api.get<any[]>("/staff"),
    enabled: !!schoolId,
  });

  const { data: leaveTypes = [] } = useQuery({
    queryKey: ["leave-types", schoolId],
    queryFn: () => api.get<any[]>("/leaves/types"),
    enabled: !!schoolId,
  });

  const addTypeMutation = useMutation({
    mutationFn: () =>
      api.post("/leaves/types", { ...typeForm, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      setIsTypeOpen(false);
      setTypeForm({ name: "", code: "", max_days: "12", is_paid: true });
      toast({ title: "Leave type added" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      api.post("/leaves/applications", { ...form, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      setIsApplyOpen(false);
      setForm({
        staff_id: "",
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
      });
      toast({ title: "Leave application submitted" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/leaves/applications/${id}/status`, {
        status,
        approved_by: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      toast({ title: "Leave status updated" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const statusBadge = (status: string) => {
    const map: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      cancelled: "outline",
    };
    return (
      <Badge variant={map[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="Leave Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leave Management</h1>
            <p className="text-muted-foreground">
              Manage staff leave applications and types
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isTypeOpen} onOpenChange={setIsTypeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Leave Types
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Leave Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label>Type Name (e.g. Sick Leave)</Label>
                    <Input
                      value={typeForm.name}
                      onChange={(e) =>
                        setTypeForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Code</Label>
                      <Input
                        placeholder="SL"
                        value={typeForm.code}
                        onChange={(e) =>
                          setTypeForm((p) => ({ ...p, code: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Max Days per Year</Label>
                      <Input
                        type="number"
                        value={typeForm.max_days}
                        onChange={(e) =>
                          setTypeForm((p) => ({
                            ...p,
                            max_days: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addTypeMutation.mutate()}
                    disabled={!typeForm.name || addTypeMutation.isPending}
                  >
                    Save Type
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Apply Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Leave Application</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Staff Member</Label>
                    <Select
                      value={form.staff_id}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, staff_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.first_name} {s.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Leave Type</Label>
                    <Select
                      value={form.leave_type_id}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, leave_type_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.max_days} days)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={form.start_date}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, start_date: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={form.end_date}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, end_date: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      value={form.reason}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, reason: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => applyMutation.mutate()}
                    disabled={applyMutation.isPending}
                  >
                    Submit Application
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
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
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : leaveApplications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaveApplications.map((leave: any) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">
                        {leave.first_name} {leave.last_name}
                      </TableCell>
                      <TableCell>{leave.leave_type_name}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(leave.start_date)} -{" "}
                        {formatDate(leave.end_date)}
                      </TableCell>
                      <TableCell>{leave.total_days}</TableCell>
                      <TableCell>{statusBadge(leave.status)}</TableCell>
                      <TableCell className="text-right">
                        {leave.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600"
                              disabled={!user?.id}
                              onClick={() =>
                                actionMutation.mutate({
                                  id: leave.id,
                                  status: "approved",
                                })
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() =>
                                actionMutation.mutate({
                                  id: leave.id,
                                  status: "rejected",
                                })
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
