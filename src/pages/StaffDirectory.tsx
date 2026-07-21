/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSchool } from "@/contexts/SchoolContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermission";
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
import { toast as sonner } from "sonner";
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
  Upload,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
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
  const perms = usePermissions(["staff:create","staff:update","staff:delete"]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [viewStaff, setViewStaff] = useState<any>(null);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [deleteStaff, setDeleteStaff] = useState<any>(null);
  const [resetStaff, setResetStaff] = useState<any>(null);
  const [resetResult, setResetResult] = useState<any>(null);
  const [resetting, setResetting] = useState(false);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  // Bulk upload
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const handleReset = async (target: any) => {
    setResetting(true);
    setResetStaff(target);
    setResetResult(null);
    try {
      const res = await api.post<any>(`/staff/${target.id}/reset-password`, {
        send: "none",
      });
      setResetResult(res);
    } catch (e: any) {
      sonner.error(e.message || "Reset failed");
      setResetStaff(null);
    } finally {
      setResetting(false);
    }
  };
  const sendReset = async (channel: "email" | "sms") => {
    if (!resetStaff) return;
    try {
      const res = await api.post<any>(
        `/staff/${resetStaff.id}/reset-password`,
        { send: channel },
      );
      setResetResult(res);
      const ok =
        channel === "email" ? res?.delivery?.email?.ok : res?.delivery?.sms?.ok;
      ok
        ? sonner.success(`Sent via ${channel.toUpperCase()}`)
        : sonner.error(`Failed to send via ${channel.toUpperCase()}`);
    } catch (e: any) {
      sonner.error(e.message || "Send failed");
    }
  };
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState({ ...emptyForm });

  const { data: staffPage, isLoading } = useQuery({
    queryKey: ["staff", schoolId, currentPage, PAGE_SIZE, search, roleFilter],
    queryFn: () =>
      api.getPaginated<any[]>(
        `/staff?page=${currentPage}&limit=${PAGE_SIZE}` +
          (search ? `&search=${encodeURIComponent(search)}` : "") +
          (roleFilter !== "all" ? `&role=${roleFilter}` : ""),
      ),
    enabled: !!schoolId,
  });
  const staffList: any[] = staffPage?.data ?? [];
  const staffPagination = staffPage?.pagination;

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

  const isTeacher = form.role?.includes("teacher");

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
            <Select value={form.role?.split(',')[0]?.trim()} onValueChange={(v) => set("role", v)} disabled={!!editStaff}>
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
    { label: "Total Staff", value: staffPagination?.total ?? staffList.length },
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

  // ── CSV bulk-upload helpers ──────────────────────────────────────
  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { rows: [], errors: ["CSV has no data rows"] };
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const rows: any[] = [];
    const errors: string[] = [];
    lines.slice(1).forEach((line, i) => {
      if (!line.trim()) return;
      const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: any = {};
      headers.forEach((h, j) => { obj[h] = vals[j] ?? ""; });
      if (!obj.first_name && !obj.full_name && !obj.name) {
        errors.push(`Row ${i + 2}: missing name`);
      }
      rows.push(obj);
    });
    return { rows, errors };
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    setBulkResult(null);
    setBulkErrors([]);
    setBulkPreview([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setBulkPreview(rows.slice(0, 5));
      setBulkErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    try {
      const text = await bulkFile.text();
      const { rows } = parseCSV(text);
      const result = await api.post<any>("/staff/bulk-import", {
        staff: rows,
        school_name: currentSchool?.name,
      });
      setBulkResult(result);
      qc.invalidateQueries({ queryKey: ["staff"] });
    } catch (err: any) {
      sonner.error(err.message || "Bulk import failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [
      "employee_number,first_name,last_name,email,phone,gender,role,department_id,designation_id,join_date,salary,tsc_number,specialization",
      "EMP-001,Jane,Doe,jane@school.co.ke,254712345678,female,teacher,,,2024-01-15,50000,TSC12345,Mathematics",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "staff_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

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
          <div className="flex gap-2">
            {perms["staff:create"] && (
              <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            )}
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
            {perms["staff:create"] && <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>}
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
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
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
                ) : staffList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No staff found
                    </TableCell>
                  </TableRow>
                ) : (
                  staffList.map((s: any) => (
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
                        <div className="flex gap-1 flex-wrap">
                          {s.role?.split(',').filter(Boolean).map((r: string) => (
                            <Badge key={r} variant="outline" className="capitalize whitespace-nowrap">
                              {r.trim().replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
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
                          {perms["staff:update"] && <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(s)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>}
                          {perms["staff:update"] && <Button
                            variant="ghost"
                            size="icon"
                            title="Reset password"
                            onClick={() => handleReset(s)}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>}
                          {perms["staff:delete"] && <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteStaff(s)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {staffPagination && staffPagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, staffPagination.total)} of {staffPagination.total} staff
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: staffPagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === staffPagination.totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="icon"
                      onClick={() => setCurrentPage(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                variant="outline" size="icon"
                disabled={currentPage >= staffPagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

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
                      {viewStaff.role?.split(',').map((r: string) => r.trim().replace(/_/g, " ")).filter(Boolean).join(", ") || "—"}
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

        {/* Reset password */}
        <Dialog
          open={!!resetStaff}
          onOpenChange={(o) => {
            if (!o) {
              setResetStaff(null);
              setResetResult(null);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
            </DialogHeader>
            {resetting && !resetResult ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Generating new password…
              </p>
            ) : resetResult ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    New password for{" "}
                    <span className="font-medium text-foreground">
                      {resetStaff?.first_name} {resetStaff?.last_name}
                    </span>
                  </p>
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Temporary password
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-base font-semibold tracking-wide">
                      {resetResult.new_password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(resetResult.new_password);
                        sonner.success("Copied");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Staff will be required to change it on first login.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => sendReset("email")}
                    disabled={!resetStaff?.email}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send via Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => sendReset("sms")}
                    disabled={!resetStaff?.phone}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Send via SMS
                  </Button>
                </div>
                {resetResult.delivery && (
                  <div className="text-xs space-y-1">
                    {resetResult.delivery.email && (
                      <div>
                        Email:{" "}
                        {resetResult.delivery.email.ok ? (
                          <span className="text-green-600">Sent</span>
                        ) : (
                          <span className="text-destructive">
                            {resetResult.delivery.email.error || "Failed"}
                          </span>
                        )}
                      </div>
                    )}
                    {resetResult.delivery.sms && (
                      <div>
                        SMS:{" "}
                        {resetResult.delivery.sms.ok ? (
                          <span className="text-green-600">Sent</span>
                        ) : (
                          <span className="text-destructive">
                            {resetResult.delivery.sms.error || "Failed"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setResetStaff(null);
                      setResetResult(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog */}
        <Dialog
          open={isBulkOpen}
          onOpenChange={(o) => {
            setIsBulkOpen(o);
            if (!o) { setBulkFile(null); setBulkPreview([]); setBulkErrors([]); setBulkResult(null); }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Upload Staff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Template download */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">Download CSV Template</p>
                  <p className="text-xs text-muted-foreground">Fill in the template and re-upload. Max 500 rows.</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>

              {/* File picker */}
              <div>
                <Label htmlFor="bulk-csv">Select CSV File</Label>
                <Input
                  id="bulk-csv"
                  type="file"
                  accept=".csv,text/csv"
                  className="mt-1"
                  onChange={handleBulkFileChange}
                />
              </div>

              {/* Validation errors */}
              {bulkErrors.length > 0 && (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {bulkErrors.length} warning(s) detected
                  </div>
                  <ul className="text-xs text-destructive/80 list-disc pl-5 space-y-0.5">
                    {bulkErrors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {bulkPreview.length > 0 && !bulkResult && (
                <div>
                  <p className="text-sm font-medium mb-2">Preview (first {bulkPreview.length} rows)</p>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          {Object.keys(bulkPreview[0]).slice(0, 7).map((h) => (
                            <th key={h} className="px-2 py-1.5 text-left font-medium capitalize">{h.replace(/_/g, " ")}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkPreview.map((row, i) => (
                          <tr key={i} className="border-t">
                            {Object.values(row).slice(0, 7).map((v: any, j) => (
                              <td key={j} className="px-2 py-1.5 truncate max-w-[120px]">{v || "—"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import result */}
              {bulkResult && (
                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Import Complete
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{bulkResult.created?.length ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                      <p className="text-2xl font-bold text-red-700 dark:text-red-400">{bulkResult.failed?.length ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-2xl font-bold">{bulkResult.total ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                  {bulkResult.failed?.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto border rounded p-2 bg-muted/30">
                      {bulkResult.failed.map((f: any, i: number) => (
                        <p key={i}><span className="font-medium">Row {f.row}:</span> {f.message}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
                {!bulkResult && (
                  <Button
                    onClick={handleBulkSubmit}
                    disabled={!bulkFile || bulkLoading}
                  >
                    {bulkLoading ? "Importing…" : `Import ${bulkPreview.length > 0 ? "Staff" : ""}`}
                  </Button>
                )}
                {bulkResult && (
                  <Button variant="outline" onClick={() => { setBulkFile(null); setBulkPreview([]); setBulkErrors([]); setBulkResult(null); }}>
                    Upload Another
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
