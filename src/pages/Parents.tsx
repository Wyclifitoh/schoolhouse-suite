import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/PermissionGate";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermission";
import {
  useParents,
  useCreateParent,
  useUpdateParent,
  useDeleteParent,
  useCreatePortalAccount,
  useResetPortalPin,
  useTogglePortalAccount,
  useParentsPaged,
  useLinkStudentsToParent,
  type ParentRow,
} from "@/hooks/useParents";
import { StudentMultiSelect } from "@/components/parents/StudentMultiSelect";
import {
  Search,
  Plus,
  Download,
  Users,
  Phone,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  KeyRound,
  UserPlus,
  Power,
  ShieldCheck,
  Link2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { EmptyState } from "@/components/help/EmptyState";

const emptyForm = {
  first_name: "",
  last_name: "",
  phone: "",
  alt_phone: "",
  email: "",
  id_number: "",
  occupation: "",
  employer: "",
  address: "",
};

const Parents = () => {
  const navigate = useNavigate();
  const perms = usePermissions([
    "parents:create",
    "parents:update",
    "parents:delete",
    "reports:export",
    "users:manage",
  ]);
  const canCreate = perms["parents:create"];
  const canUpdate = perms["parents:update"];
  const canDelete = perms["parents:delete"];
  const canExport = perms["reports:export"];
  const canManagePortal = perms["users:manage"] || canUpdate;

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ParentRow | null>(null);
  const [deleting, setDeleting] = useState<ParentRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [linkTarget, setLinkTarget] = useState<ParentRow | null>(null);
  const [linkIds, setLinkIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [filterPortal, setFilterPortal] = useState<"all" | "with" | "without">(
    "all",
  );
  const [filterStudents, setFilterStudents] = useState<
    "all" | "with" | "without"
  >("all");

  const { data: paged, isLoading } = useParentsPaged({
    search: search || undefined,
    page,
    limit: pageSize,
    hasPortal:
      filterPortal === "with"
        ? "1"
        : filterPortal === "without"
          ? "0"
          : undefined,
    students:
      filterStudents === "with"
        ? "with"
        : filterStudents === "without"
          ? "none"
          : undefined,
  });
  const parentsList = paged?.data || [];
  const totalParents = paged?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalParents / pageSize));
  const createParent = useCreateParent();
  const updateParent = useUpdateParent();
  const deleteParent = useDeleteParent();
  const createAcct = useCreatePortalAccount();
  const resetPin = useResetPortalPin();
  const toggleAcct = useTogglePortalAccount();
  const linkStudents = useLinkStudentsToParent();

  const openEdit = (p: ParentRow) => {
    setForm({
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      phone: p.phone || "",
      alt_phone: p.alt_phone || "",
      email: p.email || "",
      id_number: p.id_number || "",
      occupation: p.occupation || "",
      employer: p.employer || "",
      address: p.address || "",
    });
    setEditing(p);
  };

  const handleSave = () => {
    if (!form.first_name || !form.last_name || !form.phone) return;
    if (editing) {
      updateParent.mutate(
        { id: editing.id, data: form },
        {
          onSuccess: () => {
            setEditing(null);
            setForm({ ...emptyForm });
          },
        },
      );
    } else {
      if (studentIds.length === 0) {
        // require at least one student per request
        return;
      }
      createParent.mutate(
        { ...(form as any), student_ids: studentIds } as any,
        {
          onSuccess: () => {
            setShowAdd(false);
            setForm({ ...emptyForm });
            setStudentIds([]);
          },
        },
      );
    }
  };

  const FormFields = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone *</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0712345678"
          />
        </div>
        <div className="space-y-2">
          <Label>Alt Phone</Label>
          <Input
            value={form.alt_phone}
            onChange={(e) => setForm({ ...form, alt_phone: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            value={form.email}
            type="email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>ID Number</Label>
          <Input
            value={form.id_number}
            onChange={(e) => setForm({ ...form, id_number: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Occupation</Label>
          <Input
            value={form.occupation}
            onChange={(e) => setForm({ ...form, occupation: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Employer</Label>
          <Input
            value={form.employer}
            onChange={(e) => setForm({ ...form, employer: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </div>
      {!editing && (
        <div className="space-y-2 border-t pt-4">
          <Label>
            Link to Students <span className="text-destructive">*</span>
          </Label>
          <StudentMultiSelect
            value={studentIds}
            onChange={setStudentIds}
            placeholder="Search and select one or more students..."
          />
          <p className="text-xs text-muted-foreground">
            At least one student is required. The first selected becomes the
            primary guardian by default.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout
      title="Parents"
      subtitle="Manage parent and guardian records"
    >
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Parents</p>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{totalParents}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">With Email</p>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">
                  {parentsList.filter((p) => p.email).length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Phone className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SMS Enabled</p>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">
                  {parentsList.filter((p) => p.phone).length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">
              Parent Directory
            </CardTitle>
            <div className="flex items-center gap-2">
              {canExport && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
              )}
              {canCreate && (
                <Dialog
                  open={showAdd}
                  onOpenChange={(o) => {
                    setShowAdd(o);
                    if (!o) setForm({ ...emptyForm });
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Parent
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add New Parent</DialogTitle>
                    </DialogHeader>
                    {FormFields}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAdd(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={createParent.isPending}
                      >
                        {createParent.isPending
                          ? "Saving..."
                          : studentIds.length === 0
                            ? "Select a student first"
                            : "Register Parent"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={filterPortal === "all" ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setPage(1);
                  setFilterPortal("all");
                }}
              >
                All Portal
              </Button>
              <Button
                variant={filterPortal === "with" ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setPage(1);
                  setFilterPortal("with");
                }}
              >
                Has Portal
              </Button>
              <Button
                variant={filterPortal === "without" ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setPage(1);
                  setFilterPortal("without");
                }}
              >
                No Portal
              </Button>
              <span className="w-px h-5 bg-border mx-1" />
              <Button
                variant={filterStudents === "all" ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setPage(1);
                  setFilterStudents("all");
                }}
              >
                All
              </Button>
              <Button
                variant={filterStudents === "without" ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setPage(1);
                  setFilterStudents("without");
                }}
              >
                No Student
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Parent</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : parentsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        compact
                        className="border-0 bg-transparent"
                        icon={Users}
                        title={
                          search
                            ? "No parents match your search"
                            : "No parents yet"
                        }
                        description={
                          search
                            ? "Try a different name or phone number, or clear the search to see every parent."
                            : "Add parents and link them to their children so fee statements, results and SMS reach the right person."
                        }
                        article="adding-students"
                        actions={[
                          {
                            label: "Add Parent",
                            icon: Plus,
                            onClick: () => setShowAdd(true),
                            hidden: !canCreate,
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>

                ) : (
                  parentsList.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <button
                          className="flex items-center gap-3 hover:underline"
                          onClick={() => navigate(`/parents/${p.id}`)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {p.first_name?.[0]}
                            {p.last_name?.[0]}
                          </div>
                          <p className="font-medium text-left">
                            {p.first_name} {p.last_name}
                          </p>
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {p.phone}
                      </TableCell>
                      <TableCell>
                        {Number(p.students_count || 0) > 0 ? (
                          <button
                            className="inline-flex"
                            onClick={() => navigate(`/parents/${p.id}`)}
                          >
                            <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/20">
                              <Users className="h-3 w-3 mr-1" />
                              {p.students_count} student
                              {Number(p.students_count) > 1 ? "s" : ""}
                            </Badge>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="text-warning border-warning/40"
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              None
                            </Badge>
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setLinkTarget(p);
                                  setLinkIds([]);
                                }}
                              >
                                <Link2 className="h-3 w-3 mr-1" />
                                Attach
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {Number(p.has_portal_account || 0) > 0 ? (
                          <Badge className="bg-success/10 text-success border-0">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : canManagePortal ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={createAcct.isPending}
                            onClick={() => createAcct.mutate(p.id)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Create
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.email || "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={() => navigate(`/parents/${p.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            {canUpdate && (
                              <>
                                <DropdownMenuItem onClick={() => openEdit(p)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setLinkTarget(p);
                                    setLinkIds([]);
                                  }}
                                >
                                  <Link2 className="h-4 w-4 mr-2" />
                                  Link Students
                                </DropdownMenuItem>
                              </>
                            )}
                            {canManagePortal && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs">
                                  Portal Account
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => createAcct.mutate(p.id)}
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Create Account
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => resetPin.mutate(p.id)}
                                >
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Reset PIN
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleAcct.mutate(p.id)}
                                >
                                  <Power className="h-4 w-4 mr-2" />
                                  Enable / Disable
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleting(p)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Parent
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="text-muted-foreground">
              Showing {parentsList.length === 0 ? 0 : (page - 1) * pageSize + 1}
              –{(page - 1) * pageSize + parentsList.length} of {totalParents}{" "}
              parents
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link students dialog */}
      <Dialog
        open={!!linkTarget}
        onOpenChange={(o) => {
          if (!o) {
            setLinkTarget(null);
            setLinkIds([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Link Students to {linkTarget?.first_name} {linkTarget?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <Label>Select one or more students</Label>
            <StudentMultiSelect value={linkIds} onChange={setLinkIds} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                !linkTarget || linkIds.length === 0 || linkStudents.isPending
              }
              onClick={() => {
                if (!linkTarget) return;
                linkStudents.mutate(
                  {
                    parentId: linkTarget.id,
                    studentIds: linkIds,
                    relationship: "guardian",
                    setPrimary: false,
                  },
                  {
                    onSuccess: () => {
                      setLinkTarget(null);
                      setLinkIds([]);
                    },
                  },
                );
              }}
            >
              {linkStudents.isPending ? "Linking..." : "Link Students"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Parent</DialogTitle>
          </DialogHeader>
          {FormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateParent.isPending}>
              {updateParent.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this parent?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <b>
                {deleting?.first_name} {deleting?.last_name}
              </b>
              , their portal account, and all links to students. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleting) return;
                deleteParent.mutate(
                  { id: deleting.id, force: true },
                  { onSuccess: () => setDeleting(null) },
                );
              }}
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Parents;
