/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  UserCircle,
  Mail,
  Phone,
  Building2,
  Edit,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";

const ROLES = [
  "Manager",
  "Teacher",
  "Accountant",
  "Librarian",
  "Receptionist",
  "Super Admin",
  "Admin",
];
const GENDERS = ["Male", "Female"];
const MARITAL_STATUSES = [
  "Single",
  "Married",
  "Widowed",
  "Separated",
  "Not Specified",
];
const CONTRACT_TYPES = ["Permanent", "Probation"];

export default function StaffDirectory() {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewStaff, setViewStaff] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const [form, setForm] = useState({
    staff_id_number: "",
    first_name: "",
    last_name: "",
    father_name: "",
    mother_name: "",
    email: "",
    gender: "",
    date_of_birth: "",
    date_of_joining: "",
    phone: "",
    id_number: "",
    kra_pin: "",
    emergency_contact: "",
    marital_status: "not_specified",
    address: "",
    permanent_address: "",
    qualification: "",
    work_experience: "",
    note: "",
    department_id: "",
    designation_id: "",
    role: "teacher",
    epf_no: "",
    basic_salary: "",
    contract_type: "permanent",
    work_shift: "",
    work_location: "",
    medical_leave_quota: "12",
    paternity_leave_quota: "14",
    maternity_leave_quota: "90",
    other_leave_quota: "10",
    account_title: "",
    bank_account_number: "",
    bank_name: "",
    ifsc_code: "",
    bank_branch_name: "",
    facebook_url: "",
    twitter_url: "",
    linkedin_url: "",
    instagram_url: "",
  });

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["staff", schoolId],
    queryFn: async () => {
      const rows = await api.get<any[]>("/staff");
      return rows || [];
    },
    enabled: !!schoolId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", schoolId],
    queryFn: async () => {
      const rows = await api.get<any[]>("/departments");
      return rows || [];
    },
    enabled: !!schoolId,
  });

  const { data: designations = [] } = useQuery({
    queryKey: ["designations", schoolId],
    queryFn: async () => {
      const rows = await api.get<any[]>("/designations");
      return rows || [];
    },
    enabled: !!schoolId,
  });

  const addStaffMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("No school selected");

      const payload = {
        school_id: schoolId,
        employee_number: form.staff_id_number,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        join_date: form.date_of_joining || null,
        department_id: form.department_id || null,
        designation_id: form.designation_id || null,
        qualification: form.qualification || null,
        salary: form.basic_salary ? parseFloat(form.basic_salary) : 0,
        address: form.address || null,
        id_number: form.id_number || null,
        kra_pin: form.kra_pin || null,
        bank_name: form.bank_name || null,
        bank_account: form.bank_account_number || null,
        status: "active",
      };

      return api.post("/staff", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setIsAddOpen(false);
      if (typeof resetForm === "function") resetForm();
      toast({ title: "Staff member added successfully" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message || "Failed to add staff member",
        variant: "destructive",
      }),
  });

  const resetForm = () => {
    setForm({
      staff_id_number: "",
      first_name: "",
      last_name: "",
      father_name: "",
      mother_name: "",
      email: "",
      gender: "",
      date_of_birth: "",
      date_of_joining: "",
      phone: "",
      id_number: "",
      kra_pin: "",
      emergency_contact: "",
      marital_status: "not_specified",
      address: "",
      permanent_address: "",
      qualification: "",
      work_experience: "",
      note: "",
      department_id: "",
      designation_id: "",
      role: "teacher",
      epf_no: "",
      basic_salary: "",
      contract_type: "permanent",
      work_shift: "",
      work_location: "",
      medical_leave_quota: "12",
      paternity_leave_quota: "14",
      maternity_leave_quota: "90",
      other_leave_quota: "10",
      account_title: "",
      bank_account_number: "",
      bank_name: "",
      ifsc_code: "",
      bank_branch_name: "",
      facebook_url: "",
      twitter_url: "",
      linkedin_url: "",
      instagram_url: "",
    });
    setActiveTab("basic");
  };

  const filtered = staffList.filter((s: any) =>
    `${s.first_name} ${s.last_name} ${s.staff_id_number} ${s.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const updateField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <DashboardLayout title="Staff Directory">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Manage all staff members</p>
          </div>
          <Dialog
            open={isAddOpen}
            onOpenChange={(o) => {
              setIsAddOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-6 w-full">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="payroll">Payroll</TabsTrigger>
                  <TabsTrigger value="leaves">Leaves</TabsTrigger>
                  <TabsTrigger value="bank">Bank Details</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                  <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Staff ID *</Label>
                      <Input
                        value={form.staff_id_number}
                        onChange={(e) =>
                          updateField("staff_id_number", e.target.value)
                        }
                        placeholder="e.g. STF-001"
                      />
                    </div>
                    <div>
                      <Label>Role *</Label>
                      <Select
                        value={form.role}
                        onValueChange={(v) => updateField("role", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem
                              key={r}
                              value={r.toLowerCase().replace(/ /g, "_")}
                            >
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Select
                        value={form.department_id}
                        onValueChange={(v) => updateField("department_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Designation</Label>
                      <Select
                        value={form.designation_id}
                        onValueChange={(v) => updateField("designation_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {designations.map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={form.first_name}
                        onChange={(e) =>
                          updateField("first_name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={form.last_name}
                        onChange={(e) =>
                          updateField("last_name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Father Name</Label>
                      <Input
                        value={form.father_name}
                        onChange={(e) =>
                          updateField("father_name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Mother Name</Label>
                      <Input
                        value={form.mother_name}
                        onChange={(e) =>
                          updateField("mother_name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Gender *</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(v) => updateField("gender", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDERS.map((g) => (
                            <SelectItem key={g} value={g.toLowerCase()}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={form.date_of_birth}
                        onChange={(e) =>
                          updateField("date_of_birth", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Date of Joining</Label>
                      <Input
                        type="date"
                        value={form.date_of_joining}
                        onChange={(e) =>
                          updateField("date_of_joining", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Emergency Contact</Label>
                      <Input
                        value={form.emergency_contact}
                        onChange={(e) =>
                          updateField("emergency_contact", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Marital Status</Label>
                      <Select
                        value={form.marital_status}
                        onValueChange={(v) => updateField("marital_status", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MARITAL_STATUSES.map((s) => (
                            <SelectItem
                              key={s}
                              value={s.toLowerCase().replace(/ /g, "_")}
                            >
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Permanent Address</Label>
                    <Textarea
                      value={form.permanent_address}
                      onChange={(e) =>
                        updateField("permanent_address", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Qualification</Label>
                    <Input
                      value={form.qualification}
                      onChange={(e) =>
                        updateField("qualification", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Work Experience</Label>
                    <Input
                      value={form.work_experience}
                      onChange={(e) =>
                        updateField("work_experience", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <Textarea
                      value={form.note}
                      onChange={(e) => updateField("note", e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="payroll" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>EPF No.</Label>
                      <Input
                        value={form.epf_no}
                        onChange={(e) => updateField("epf_no", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Basic Salary</Label>
                      <Input
                        type="number"
                        value={form.basic_salary}
                        onChange={(e) =>
                          updateField("basic_salary", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>KRA PIN</Label>
                      <Input
                        type="number"
                        value={form.kra_pin}
                        onChange={(e) =>
                          updateField("kra_pin", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Contract Type</Label>
                      <Select
                        value={form.contract_type}
                        onValueChange={(v) => updateField("contract_type", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTRACT_TYPES.map((c) => (
                            <SelectItem key={c} value={c.toLowerCase()}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Work Shift</Label>
                      <Input
                        value={form.work_shift}
                        onChange={(e) =>
                          updateField("work_shift", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Work Location</Label>
                      <Input
                        value={form.work_location}
                        onChange={(e) =>
                          updateField("work_location", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="leaves" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Medical Leave (days)</Label>
                      <Input
                        type="number"
                        value={form.medical_leave_quota}
                        onChange={(e) =>
                          updateField("medical_leave_quota", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Paternity Leave (days)</Label>
                      <Input
                        type="number"
                        value={form.paternity_leave_quota}
                        onChange={(e) =>
                          updateField("paternity_leave_quota", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Maternity Leave (days)</Label>
                      <Input
                        type="number"
                        value={form.maternity_leave_quota}
                        onChange={(e) =>
                          updateField("maternity_leave_quota", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Other Leave (days)</Label>
                      <Input
                        type="number"
                        value={form.other_leave_quota}
                        onChange={(e) =>
                          updateField("other_leave_quota", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bank" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Account Title</Label>
                      <Input
                        value={form.account_title}
                        onChange={(e) =>
                          updateField("account_title", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Bank Account Number</Label>
                      <Input
                        value={form.bank_account_number}
                        onChange={(e) =>
                          updateField("bank_account_number", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Bank Name</Label>
                      <Input
                        value={form.bank_name}
                        onChange={(e) =>
                          updateField("bank_name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>IFSC Code</Label>
                      <Input
                        value={form.ifsc_code}
                        onChange={(e) =>
                          updateField("ifsc_code", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Bank Branch Name</Label>
                      <Input
                        value={form.bank_branch_name}
                        onChange={(e) =>
                          updateField("bank_branch_name", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Facebook URL</Label>
                      <Input
                        value={form.facebook_url}
                        onChange={(e) =>
                          updateField("facebook_url", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Twitter URL</Label>
                      <Input
                        value={form.twitter_url}
                        onChange={(e) =>
                          updateField("twitter_url", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>LinkedIn URL</Label>
                      <Input
                        value={form.linkedin_url}
                        onChange={(e) =>
                          updateField("linkedin_url", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Instagram URL</Label>
                      <Input
                        value={form.instagram_url}
                        onChange={(e) =>
                          updateField("instagram_url", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="other" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Documents can be uploaded after creating the staff record.
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addStaffMutation.mutate()}
                  disabled={
                    !form.staff_id_number ||
                    !form.first_name ||
                    addStaffMutation.isPending
                  }
                >
                  {addStaffMutation.isPending ? "Saving..." : "Save Staff"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{staffList.length}</div>
              <p className="text-sm text-muted-foreground">Total Staff</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {staffList.filter((s: any) => s.status === "active").length}
              </div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {staffList.filter((s: any) => s.role === "teacher").length}
              </div>
              <p className="text-sm text-muted-foreground">Teachers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {
                  new Set(
                    staffList.map((s: any) => s.department_id).filter(Boolean),
                  ).size
                }
              </div>
              <p className="text-sm text-muted-foreground">Departments</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Staff Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No staff found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((staff: any) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-mono text-sm">
                        {staff.employee_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {staff.first_name} {staff.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {staff.role?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{staff.department_name || "—"}</TableCell>
                      <TableCell>{staff.designation_name || "—"}</TableCell>
                      <TableCell>{staff.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            staff.status === "active" ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {staff.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewStaff(staff)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Staff Dialog */}
        <Dialog open={!!viewStaff} onOpenChange={() => setViewStaff(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Staff Details</DialogTitle>
            </DialogHeader>
            {viewStaff && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {viewStaff.first_name} {viewStaff.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {viewStaff.staff_id_number} ·{" "}
                      {viewStaff.role?.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {viewStaff.email || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {viewStaff.phone || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>{" "}
                    {viewStaff.departments?.name || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Designation:</span>{" "}
                    {viewStaff.designations?.name || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contract:</span>{" "}
                    {viewStaff.contract_type || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Salary:</span> KES{" "}
                    {viewStaff.basic_salary?.toLocaleString() || "0"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date Joined:</span>{" "}
                    {viewStaff.date_of_joining || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>{" "}
                    {viewStaff.gender || "—"}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
