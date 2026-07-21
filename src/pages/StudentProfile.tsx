import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/PermissionGate";
import { usePermission } from "@/hooks/usePermission";
import {
  useStudentWithFees,
  useUpdateStudent,
  useSoftDeleteStudent,
  useStudentParents,
  useStudentSiblings,
} from "@/hooks/useStudents";
import { useUpdateParent } from "@/hooks/useParents";
import { useStudentExcessCredits } from "@/hooks/useFinance";
import { useGrades, useStreams } from "@/hooks/useGrades";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Wallet,
  CreditCard,
  Users,
  FileText,
  Download,
  Printer,
  CheckCircle,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/date";

const formatKES = (amount: number) =>
  `KES ${Math.abs(amount).toLocaleString()}`;

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [editParentData, setEditParentData] = useState<Record<string, any>>({});
  const [primaryParent, setPrimaryParent] = useState<any>(null);
  const canViewFinance = usePermission("finance:fees:read");

  const { data: student, isLoading } = useStudentWithFees(studentId);
  const { data: parentLinks = [] } = useStudentParents(studentId);

  const primaryParentId =
    parentLinks.find((p) => p.is_primary)?.id || parentLinks[0]?.id || null;

  const { data: siblings = [] } = useStudentSiblings(
    studentId,
    primaryParentId,
  );
  const { data: grades = [] } = useGrades();
  const { data: streams = [] } = useStreams(editData?.current_grade_id || undefined);
  const updateStudent = useUpdateStudent();
  const updateParent = useUpdateParent();
  const { data: excessCredits = [] } = useStudentExcessCredits(studentId);
  const softDelete = useSoftDeleteStudent();

  // Sync edit data when student loads
  const startEditing = () => {
    if (student) {
      setEditData({
        first_name: student.first_name,
        last_name: student.last_name,
        middle_name: student.middle_name || "",
        date_of_birth: student.date_of_birth || "",
        gender: student.gender || "",
        religion: student.religion || "",
        nationality: student.nationality || "",
        grade: student.grade || "",
        stream: student.stream || "",
        current_grade_id: student.current_grade_id || "",
        current_stream_id: student.current_stream_id || "",
        parent_name: student.parent_name || "",
        parent_phone: student.parent_phone || "",
        special_needs: student.special_needs || "",
        status: student.status,
      });
      // Seed primary parent edit form
      const primary =
        (parentLinks as any[]).find(
          (p: any) => p.is_primary || p.is_primary_contact,
        ) ||
        (parentLinks as any[])[0] ||
        null;
      setPrimaryParent(primary);
      if (primary) {
        setEditParentData({
          first_name: primary.first_name || "",
          last_name: primary.last_name || "",
          phone: primary.phone || "",
          email: primary.email || "",
          occupation: primary.occupation || "",
          id_number: primary.id_number || "",
        });
      }
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Student Profile">
        <div className="space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Not Found">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <AlertTriangle className="h-12 w-12 text-warning" />
          <p className="text-lg font-semibold text-foreground">
            Student not found
          </p>
          <Button variant="outline" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const fullName =
    student.full_name || `${student.first_name} ${student.last_name}`;
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);

  const handleSave = async () => {
    try {
      // Resolve grade name if grade ID changed
      const payload: any = { ...editData };
      if (editData.current_grade_id) {
        const g = (grades as any[]).find(
          (gr: any) => gr.id === editData.current_grade_id,
        );
        if (g) payload.grade = g.name;
      }
      if (editData.current_stream_id) {
        const s = (streams as any[]).find(
          (st: any) => st.id === editData.current_stream_id,
        );
        if (s) payload.stream = s.name;
      } else if (editData.current_stream_id === null) {
        payload.stream = null;
      }
      await updateStudent.mutateAsync({ id: student.id, data: payload });
      // Update primary linked parent if one exists
      if (primaryParent?.id && Object.keys(editParentData).length > 0) {
        await updateParent.mutateAsync({
          id: primaryParent.id,
          data: editParentData,
        });
      }
      setIsEditing(false);
    } catch {
      // Errors handled by mutations
    }
  };

  const handleDelete = () => {
    softDelete.mutate(student.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        navigate("/students");
      },
    });
  };

  return (
    <DashboardLayout
      title="Student Profile"
      subtitle={`${fullName} · ${student.admission_number}`}
    >
      {/* Top bar */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => navigate("/students")}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Students
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("ID card sent to print queue")}
          >
            <Printer className="h-4 w-4 mr-1.5" />
            <span className="hidden xs:inline">Print ID</span>
            <span className="xs:hidden">Print</span>
          </Button>
          {canViewFinance && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Fee statement downloaded")}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Statement
            </Button>
          )}
          {!isEditing ? (
            <>
              <PermissionGate permission="students:update">
                <Button size="sm" onClick={startEditing}>
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Button>
              </PermissionGate>
              <PermissionGate permission="students:delete">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Deactivate
                </Button>
              </PermissionGate>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <PermissionGate permission="students:update">
                <Button
                  size="sm"
                  className="bg-success hover:bg-success/90"
                  onClick={handleSave}
                  disabled={updateStudent.isPending || updateParent.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  {updateStudent.isPending || updateParent.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </PermissionGate>
            </>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-xl sm:text-2xl shadow-lg shrink-0 self-start">
              {initials}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  {fullName}
                </h1>
                <Badge
                  className={
                    student.status === "active"
                      ? "bg-success/10 text-success border-0"
                      : ""
                  }
                >
                  {student.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {student.grade || "N/A"} · {student.stream || "N/A"}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  {student.admission_number}
                </span>
                {student.admission_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(student.admission_date)}
                  </span>
                )}
              </div>
              {canViewFinance && (
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Balance:
                    </span>
                    <span
                      className={`text-sm font-bold ${student.balance > 0 ? "text-destructive" : student.balance === 0 ? "text-muted-foreground" : "text-success"}`}
                    >
                      {student.balance === 0
                        ? "Cleared"
                        : formatKES(student.balance)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/student-fees/${student.id}`)}
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    Fees & Payments
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="personal" className="space-y-4">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="bg-muted/50 p-1 w-max min-w-full sm:w-auto">
            <TabsTrigger
              value="personal"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Personal</span>
              <span className="xs:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger
              value="guardian"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Guardian & Siblings</span>
              <span className="xs:hidden">Guardian</span>
            </TabsTrigger>
            <TabsTrigger
              value="academic"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Academic
            </TabsTrigger>
            {canViewFinance && (
              <TabsTrigger value="fees" className="gap-1.5 text-xs sm:text-sm">
                <Wallet className="h-3.5 w-3.5" />
                Fees
              </TabsTrigger>
            )}
            <TabsTrigger
              value="documents"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <FileText className="h-3.5 w-3.5" />
              Docs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">First Name</Label>
                        <Input
                          value={editData.first_name || ""}
                          className="h-9"
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              first_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Last Name</Label>
                        <Input
                          value={editData.last_name || ""}
                          className="h-9"
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              last_name: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Middle Name</Label>
                      <Input
                        value={editData.middle_name || ""}
                        className="h-9"
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            middle_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Date of Birth</Label>
                        <Input
                          type="date"
                          value={editData.date_of_birth || ""}
                          className="h-9"
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              date_of_birth: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Gender</Label>
                        <Select
                          value={editData.gender || ""}
                          onValueChange={(v) =>
                            setEditData({ ...editData, gender: v })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Religion</Label>
                        <Input
                          value={editData.religion || ""}
                          className="h-9"
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              religion: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nationality</Label>
                        <Input
                          value={editData.nationality || ""}
                          className="h-9"
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              nationality: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {[
                      ["Gender", student.gender],
                      [
                        "Date of Birth",
                        student.date_of_birth
                          ? formatDate(student.date_of_birth)
                          : null,
                      ],
                      ["Religion", student.religion],
                      ["Nationality", student.nationality],
                      ["Special Needs", student.special_needs],
                    ]
                      .filter(([, val]) => val)
                      .map(([label, val]) => (
                        <div
                          key={label as string}
                          className="flex justify-between py-1 border-b border-border/50 last:border-0"
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium capitalize">
                            {val as string}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Academic Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {isEditing ? (
                  <div className="grid gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Grade</Label>
                      <Select
                        value={editData.current_grade_id || ""}
                        onValueChange={(v) => {
                          const g = grades.find((gr) => gr.id === v);
                          setEditData({
                            ...editData,
                            current_grade_id: v,
                            grade: g?.name || editData.grade,
                          });
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Stream</Label>
                      <Select
                        value={editData.current_stream_id || "none"}
                        onValueChange={(v) => {
                          const val = v === "none" ? null : v;
                          const s = streams.find((st) => st.id === val);
                          setEditData({
                            ...editData,
                            current_stream_id: val,
                            stream: s?.name || null,
                          });
                        }}
                        disabled={!editData.current_grade_id}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select stream" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Stream</SelectItem>
                          {streams.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={editData.status || ""}
                        onValueChange={(v) =>
                          setEditData({ ...editData, status: v })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="transferred">
                            Transferred
                          </SelectItem>
                          <SelectItem value="graduated">Graduated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <>
                    {[
                      ["Admission No.", student.admission_number],
                      ["Grade", student.grade],
                      ["Stream", student.stream],
                      [
                        "Date Joined",
                        student.admission_date
                          ? formatDate(student.admission_date)
                          : null,
                      ],
                      ["Status", student.status],
                      ["UPI", student.upi],
                    ]
                      .filter(([, val]) => val)
                      .map(([label, val]) => (
                        <div
                          key={label as string}
                          className="flex justify-between py-1 border-b border-border/50 last:border-0"
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{val as string}</span>
                        </div>
                      ))}
                  </>
                )}
              </CardContent>
            </Card>

            {student.previous_school && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Previous School
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <span className="text-muted-foreground">School: </span>
                    <span className="font-medium">
                      {student.previous_school}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="guardian">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Parent / Guardian
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {isEditing ? (
                  // ── EDIT MODE ──────────────────────────────────────────
                  primaryParent ? (
                    // Linked parent record — edit the parent table
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">First Name</Label>
                          <Input
                            className="h-9"
                            value={editParentData.first_name || ""}
                            onChange={(e) =>
                              setEditParentData({
                                ...editParentData,
                                first_name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Last Name</Label>
                          <Input
                            className="h-9"
                            value={editParentData.last_name || ""}
                            onChange={(e) =>
                              setEditParentData({
                                ...editParentData,
                                last_name: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Phone</Label>
                          <Input
                            className="h-9"
                            value={editParentData.phone || ""}
                            onChange={(e) =>
                              setEditParentData({
                                ...editParentData,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email</Label>
                          <Input
                            className="h-9"
                            type="email"
                            value={editParentData.email || ""}
                            onChange={(e) =>
                              setEditParentData({
                                ...editParentData,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Occupation</Label>
                          <Input
                            className="h-9"
                            value={editParentData.occupation || ""}
                            onChange={(e) =>
                              setEditParentData({
                                ...editParentData,
                                occupation: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">ID Number</Label>
                          <Input
                            className="h-9"
                            value={editParentData.id_number || ""}
                            onChange={(e) =>
                              setEditParentData({
                                ...editParentData,
                                id_number: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Legacy parent fields — edit on student record
                    <div className="grid gap-3">
                      <p className="text-xs text-muted-foreground">
                        No linked parent record. Edit guardian name and phone
                        below.
                      </p>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Guardian Full Name</Label>
                        <Input
                          className="h-9"
                          value={editData.parent_name || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              parent_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Phone Number</Label>
                        <Input
                          className="h-9"
                          value={editData.parent_phone || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              parent_phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )
                ) : // ── VIEW MODE ──────────────────────────────────────────
                (parentLinks as any[]).length > 0 ? (
                  (() => {
                    // Show only the PRIMARY guardian (fallback: first linked parent)
                    const primary =
                      (parentLinks as any[]).find(
                        (p: any) => p.is_primary || p.is_primary_contact,
                      ) || (parentLinks as any[])[0];
                    const link: any = primary;
                    return (
                      <div
                        key={link.id}
                        className="p-3 rounded-lg border space-y-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground font-bold text-sm">
                            {link.first_name?.[0]}
                            {link.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {link.first_name} {link.last_name}
                            </p>
                            <div className="flex gap-1.5">
                              <Badge
                                variant="secondary"
                                className="text-xs capitalize"
                              >
                                {link.relationship}
                              </Badge>
                              <Badge className="bg-primary/10 text-primary border-0 text-xs">
                                Primary Guardian
                              </Badge>
                              {link.is_fee_payer && (
                                <Badge className="bg-success/10 text-success border-0 text-xs">
                                  Fee Payer
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="text-xs">{link.phone}</span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-2">
                    {student.parent_name && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground font-bold">
                          {student.parent_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {student.parent_name}
                          </p>
                          <Badge variant="secondary" className="text-xs mt-0.5">
                            Primary Guardian
                          </Badge>
                        </div>
                      </div>
                    )}
                    {student.parent_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{student.parent_phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {siblings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-info" />
                    Siblings ({siblings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {siblings.map((sb: any) => (
                    <div
                      key={sb.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/students/${sb.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {(sb.full_name || `${sb.first_name} ${sb.last_name}`)
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {sb.full_name || `${sb.first_name} ${sb.last_name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sb.admission_number} · {sb.grade} {sb.stream}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          sb.status === "active"
                            ? "bg-success/10 text-success border-0"
                            : ""
                        }
                      >
                        {sb.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Academic History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Exam results, attendance records, and academic progression will
                be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          {!canViewFinance ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                You do not have permission to view financial information.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Total Fees</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {formatKES(student.total_fees)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-xl font-bold text-success mt-1">
                      {formatKES(student.total_paid)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p
                      className={`text-xl font-bold mt-1 ${student.balance > 0 ? "text-destructive" : "text-success"}`}
                    >
                      {formatKES(student.balance)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {excessCredits.length > 0 && (
                <Card className="border-success/40 bg-success/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Available Excess / Advance Credits
                        </p>
                        <p className="text-2xl font-bold text-success mt-1">
                          {formatKES(
                            excessCredits.reduce(
                              (s: number, c: any) =>
                                s + Number(c.remaining_amount || c.amount || 0),
                              0,
                            ),
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {excessCredits.length} active credit
                          {excessCredits.length === 1 ? "" : "s"} — applicable
                          on next charge
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate("/excess-payments")}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Button onClick={() => navigate(`/student-fees/${student.id}`)}>
                <Wallet className="h-4 w-4 mr-1.5" />
                View Full Fee Details & Payments
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Identity & Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                {student.upi && (
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">UPI No.</span>
                    <span className="font-medium font-mono">{student.upi}</span>
                  </div>
                )}
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">
                    Admission Number
                  </span>
                  <span className="font-medium font-mono">
                    {student.admission_number}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Student</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete <strong>{fullName}</strong> (
              {student.admission_number}). The student record will be marked as
              inactive but can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={softDelete.isPending}
            >
              {softDelete.isPending ? "Deactivating..." : "Deactivate Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default StudentProfile;
