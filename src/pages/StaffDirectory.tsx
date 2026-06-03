/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  UserCircle,
  Edit,
  Eye,
  Trash2,
  Mail,
  Phone,
  KeyRound,
} from "lucide-react";
import { api } from "@/lib/api";

// HR 2026 — canonical 7 staff roles
const STAFF_ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "teacher", label: "Teacher" },
  { value: "receptionist", label: "Receptionist" },
];

const GENDERS = ["male", "female"];
const STATUSES = ["active", "inactive", "terminated"];

const emptyForm = {
  employee_number: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  gender: "",
  date_of_birth: "",
  join_date: "",
  department_id: "",
  designation_id: "",
  qualification: "",
  salary: "",
  address: "",
  id_number: "",
  kra_pin: "",
  nhif_number: "",
  nssf_number: "",
  bank_name: "",
  bank_account: "",
  role: "teacher",
  status: "active",
  // teacher extras
  tsc_number: "",
  specialization: "",
  bio: "",
};

export default function StaffDirectory() {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewStaff, setViewStaff] = useState<any>(null);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [deleteStaff, setDeleteStaff] = useState<any>(null);
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState({ ...emptyForm });

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["staff", schoolId],
    queryFn: () => api.get<any[]>("/staff"),
    enabled: !!schoolId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", schoolId],
    queryFn: () => api.get<any[]>("/departments"),
    enabled: !!schoolId,
  });

  const { data: designations = [] } = useQuery({
    queryKey: ["designations", schoolId],
    queryFn: () => api.get<any[]>("/designations"),
    enabled: !!schoolId,
  });

  const buildPayload = () => ({
    employee_number: form.employee_number,
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email || null,
    phone: form.phone || null,
    gender: form.gender || null,
    date_of_birth: form.date_of_birth || null,
    join_date: form.join_date || null,
    department_id: form.department_id || null,
    designation_id: form.designation_id || null,
    qualification: form.qualification || null,
    salary: form.salary ? parseFloat(form.salary) : 0,
    address: form.address || null,
    id_number: form.id_number || null,
    kra_pin: form.kra_pin || null,
    nhif_number: form.nhif_number || null,
    nssf_number: form.nssf_number || null,
    bank_name: form.bank_name || null,
    bank_account: form.bank_account || null,
    role: form.role,
    status: form.status,
    tsc_number: form.tsc_number || null,
    specialization: form.specialization || null,
    bio: form.bio || null,
    school_name: currentSchool?.name,
  });

  const addStaffMutation = useMutation({
    mutationFn: () => api.post<any>("/staff", buildPayload()),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setIsAddOpen(false);
      setForm({ ...emptyForm });
      setTab("basic");
      const c = data?.credentials_sent;
      const channels: string[] = [];
      if (c?.email?.ok) channels.push("Email");
      if (c?.sms?.ok) channels.push("SMS");
      const msg = c
        ? channels.length
          ? `Login credentials sent via ${channels.join(" + ")}`
          : "Staff created. Credentials delivery failed — share manually."
        : "Staff created (existing user re-linked).";
      toast({ title: "Staff added", description: msg });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message || "Failed to add staff",
        variant: "destructive",
      }),
  });

  const updateStaffMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/staff/${id}`, buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setEditStaff(null);
      setForm({ ...emptyForm });
      toast({ title: "Staff updated" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setDeleteStaff(null);
      toast({ title: "Staff removed" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const openEdit = (s: any) => {
    setForm({
      ...emptyForm,
      ...Object.fromEntries(Object.keys(emptyForm).map((k) => [k, s[k] ?? ""])),
      salary: s.salary?.toString() || "",
      role: s.role || "teacher",
      status: s.status || "active",
    });
    setEditStaff(s);
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const filtered = staffList.filter((s: any) => {
    const matchesSearch =
      `${s.first_name} ${s.last_name} ${s.employee_number} ${s.email}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const isTeacher = form.role === "teacher";

  const StaffForm = (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="employment">Employment</TabsTrigger>
        <TabsTrigger value="statutory">Statutory & Bank</TabsTrigger>
        <TabsTrigger value="teacher" disabled={!isTeacher}>
          Teacher
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-3 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Employee # *</Label>
            <Input
              value={form.employee_number}
              onChange={(e) => set("employee_number", e.target.value)}
              placeholder="EMP-001"
            />
          </div>
          <div>
            <Label>Role *</Label>
            <Select value={form.role} onValueChange={(v) => set("role", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>First Name *</Label>
            <Input
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
            />
          </div>
          <div>
            <Label>Last Name *</Label>
            <Input
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="2547XXXXXXXX"
            />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g} className="capitalize">
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
              onChange={(e) => set("date_of_birth", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>Address</Label>
          <Textarea
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3 py-1 bg-muted/30 rounded">
          <KeyRound className="h-3 w-3 inline mr-1" />A login account is created
          automatically. A temporary password will be sent via email + SMS.
        </p>
      </TabsContent>

      <TabsContent value="employment" className="space-y-3 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Department</Label>
            <Select
              value={form.department_id}
              onValueChange={(v) => set("department_id", v)}
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
              onValueChange={(v) => set("designation_id", v)}
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
            <Label>Join Date</Label>
            <Input
              type="date"
              value={form.join_date}
              onChange={(e) => set("join_date", e.target.value)}
            />
          </div>
          <div>
            <Label>Basic Salary (KES)</Label>
            <Input
              type="number"
              value={form.salary}
              onChange={(e) => set("salary", e.target.value)}
            />
          </div>
          <div>
            <Label>Qualification</Label>
            <Input
              value={form.qualification}
              onChange={(e) => set("qualification", e.target.value)}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="statutory" className="space-y-3 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>National ID</Label>
            <Input
              value={form.id_number}
              onChange={(e) => set("id_number", e.target.value)}
            />
          </div>
          <div>
            <Label>KRA PIN</Label>
            <Input
              value={form.kra_pin}
              onChange={(e) => set("kra_pin", e.target.value)}
            />
          </div>
          <div>
            <Label>NHIF / SHIF #</Label>
            <Input
              value={form.nhif_number}
              onChange={(e) => set("nhif_number", e.target.value)}
            />
          </div>
          <div>
            <Label>NSSF #</Label>
            <Input
              value={form.nssf_number}
              onChange={(e) => set("nssf_number", e.target.value)}
            />
          </div>
          <div>
            <Label>Bank Name</Label>
            <Input
              value={form.bank_name}
              onChange={(e) => set("bank_name", e.target.value)}
            />
          </div>
          <div>
            <Label>Bank Account</Label>
            <Input
              value={form.bank_account}
              onChange={(e) => set("bank_account", e.target.value)}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="teacher" className="space-y-3 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>TSC Number</Label>
            <Input
              value={form.tsc_number}
              onChange={(e) => set("tsc_number", e.target.value)}
            />
          </div>
          <div>
            <Label>Specialization</Label>
            <Input
              value={form.specialization}
              onChange={(e) => set("specialization", e.target.value)}
              placeholder="e.g. Mathematics / Physics"
            />
          </div>
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  const headlineStats = [
    { label: "Total Staff", value: staffList.length },
    {
      label: "Active",
      value: staffList.filter((s: any) => s.status === "active").length,
    },
    {
      label: "Teachers",
      value: staffList.filter((s: any) => s.role === "teacher").length,
    },
    {
      label: "Departments",
      value: new Set(staffList.map((s: any) => s.department_id).filter(Boolean))
        .size,
    },
  ];

  return (
    <DashboardLayout
      title="Staff Directory"
      subtitle="Manage your school workforce"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            All staff members across the 7 canonical roles.
          </p>
          <Dialog
            open={isAddOpen}
            onOpenChange={(o) => {
              setIsAddOpen(o);
              if (!o) {
                setForm({ ...emptyForm });
                setTab("basic");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              {StaffForm}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addStaffMutation.mutate()}
                  disabled={
                    !form.employee_number ||
                    !form.first_name ||
                    !form.last_name ||
                    (!form.email && !form.phone) ||
                    addStaffMutation.isPending
                  }
                >
                  {addStaffMutation.isPending ? "Saving…" : "Save Staff"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {headlineStats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{s.value}</div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {STAFF_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading…
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
                  filtered.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">
                        {s.employee_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {s.first_name} {s.last_name}
                          {s.must_change_password ? (
                            <Badge variant="outline" className="text-xs">
                              <KeyRound className="h-3 w-3 mr-1" />
                              Pending password
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {s.role?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.department_name || "—"}</TableCell>
                      <TableCell>{s.designation_name || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {s.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {s.email}
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {s.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "active" ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/staff/${s.id}`}>
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(s)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteStaff(s)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View */}
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
                      {viewStaff.employee_number} ·{" "}
                      {viewStaff.role?.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Email", viewStaff.email],
                    ["Phone", viewStaff.phone],
                    ["Department", viewStaff.department_name],
                    ["Designation", viewStaff.designation_name],
                    [
                      "Salary",
                      viewStaff.salary
                        ? `KES ${Number(viewStaff.salary).toLocaleString()}`
                        : "—",
                    ],
                    ["Join Date", viewStaff.join_date],
                    ["Gender", viewStaff.gender],
                    ["National ID", viewStaff.id_number],
                    ["KRA PIN", viewStaff.kra_pin],
                    ["Bank", viewStaff.bank_name],
                    ["Bank Account", viewStaff.bank_account],
                    ["TSC Number", viewStaff.tsc_number],
                    ["Specialization", viewStaff.specialization],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <span className="text-muted-foreground">{k}:</span>{" "}
                      {v || "—"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit */}
        <Dialog
          open={!!editStaff}
          onOpenChange={(o) => {
            if (!o) {
              setEditStaff(null);
              setForm({ ...emptyForm });
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
            </DialogHeader>
            {StaffForm}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditStaff(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editStaff && updateStaffMutation.mutate(editStaff.id)
                }
                disabled={updateStaffMutation.isPending}
              >
                {updateStaffMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog
          open={!!deleteStaff}
          onOpenChange={(o) => {
            if (!o) setDeleteStaff(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove staff?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteStaff?.first_name} {deleteStaff?.last_name} will be
                removed from this school. The linked login account will remain
                (revoke separately).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteStaff && deleteStaffMutation.mutate(deleteStaff.id)
                }
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
