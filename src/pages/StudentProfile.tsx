import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { students, studentFeeCollection, parents } from "@/data/mockData";
import {
  ArrowLeft, User, GraduationCap, Phone, Mail, MapPin, Calendar, Edit,
  Trash2, Wallet, CreditCard, Users, FileText, Download, Printer,
  CheckCircle, AlertTriangle, BookOpen, Shield,
} from "lucide-react";
import { toast } from "sonner";

const formatKES = (amount: number) => `KES ${Math.abs(amount).toLocaleString()}`;

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const student = students.find(s => s.id === studentId);
  if (!student) {
    return (
      <DashboardLayout title="Student Not Found">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <AlertTriangle className="h-12 w-12 text-warning" />
          <p className="text-lg font-semibold text-foreground">Student not found</p>
          <Button variant="outline" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const collection = studentFeeCollection.find(c => c.student_id === student.id);
  const siblings = students.filter(s => s.id !== student.id && s.parent_phone === student.parent_phone);

  // Editable state
  const [editData, setEditData] = useState({ ...student });

  const handleSave = () => {
    toast.success("Student profile updated successfully!");
    setIsEditing(false);
  };

  const handleDelete = () => {
    toast.success(`${student.full_name} has been deactivated (soft deleted)`);
    setShowDeleteDialog(false);
    navigate("/students");
  };

  return (
    <DashboardLayout title="Student Profile" subtitle={`${student.full_name} · ${student.admission_no}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/students")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />Back to Students
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("ID card sent to print queue")}>
            <Printer className="h-4 w-4 mr-1.5" />Print ID
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Fee statement downloaded")}>
            <Download className="h-4 w-4 mr-1.5" />Statement
          </Button>
          {!isEditing ? (
            <>
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1.5" />Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-1.5" />Deactivate
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditData({ ...student }); }}>Cancel</Button>
              <Button size="sm" className="bg-success hover:bg-success/90" onClick={handleSave}>
                <CheckCircle className="h-4 w-4 mr-1.5" />Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-2xl shadow-lg shrink-0">
              {student.full_name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">{student.full_name}</h1>
                <Badge className={student.status === "active" ? "bg-success/10 text-success border-0" : ""}>{student.status}</Badge>
                {student.rte && <Badge className="bg-info/10 text-info border-0">RTE</Badge>}
                <Badge variant="secondary" className="capitalize">{student.category}</Badge>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{student.grade} · {student.stream}</span>
                <span className="flex items-center gap-1.5 font-mono text-xs">{student.admission_no}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Joined {student.joined}</span>
              </div>
              {collection && (
                <div className="flex items-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Balance:</span>
                    <span className={`text-sm font-bold ${student.balance < 0 ? "text-destructive" : student.balance > 0 ? "text-success" : "text-muted-foreground"}`}>
                      {student.balance === 0 ? "Cleared" : `${student.balance < 0 ? "-" : "+"}${formatKES(student.balance)}`}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/student-fees/${student.id}`)}>
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />Fees & Payments
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="personal" className="gap-1.5"><User className="h-3.5 w-3.5" />Personal</TabsTrigger>
          <TabsTrigger value="guardian" className="gap-1.5"><Users className="h-3.5 w-3.5" />Guardian & Siblings</TabsTrigger>
          <TabsTrigger value="academic" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Academic</TabsTrigger>
          <TabsTrigger value="fees" className="gap-1.5"><Wallet className="h-3.5 w-3.5" />Fee Summary</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold">Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">First Name</Label><Input value={editData.full_name.split(" ")[0]} className="h-9" onChange={e => setEditData({...editData, full_name: e.target.value + " " + (editData.full_name.split(" ").slice(1).join(" "))})} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Last Name</Label><Input value={editData.full_name.split(" ").slice(1).join(" ")} className="h-9" onChange={e => setEditData({...editData, full_name: editData.full_name.split(" ")[0] + " " + e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Date of Birth</Label><Input type="date" value={editData.dob} className="h-9" onChange={e => setEditData({...editData, dob: e.target.value})} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Gender</Label>
                        <Select value={editData.gender} onValueChange={v => setEditData({...editData, gender: v})}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Religion</Label><Input value={editData.religion} className="h-9" onChange={e => setEditData({...editData, religion: e.target.value})} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Blood Group</Label><Input value={editData.blood_group} className="h-9" onChange={e => setEditData({...editData, blood_group: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Nationality</Label><Input value={editData.nationality} className="h-9" onChange={e => setEditData({...editData, nationality: e.target.value})} /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Mother Tongue</Label><Input value={editData.mother_tongue} className="h-9" onChange={e => setEditData({...editData, mother_tongue: e.target.value})} /></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {[
                      ["Gender", student.gender],
                      ["Date of Birth", student.dob],
                      ["Religion", student.religion],
                      ["Blood Group", student.blood_group],
                      ["Nationality", student.nationality],
                      ["Mother Tongue", student.mother_tongue],
                      ["Category", student.category],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium capitalize">{val as string}</span>
                      </div>
                    ))}
                    {student.rte && (
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">RTE Student</span>
                        <Badge className="bg-info/10 text-info border-0 text-xs">Yes</Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold">Academic Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {isEditing ? (
                  <div className="grid gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Grade</Label>
                      <Select value={editData.grade} onValueChange={v => setEditData({...editData, grade: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Stream</Label>
                      <Select value={editData.stream} onValueChange={v => setEditData({...editData, stream: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{["East","West","North","South","A","B","C"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Status</Label>
                      <Select value={editData.status} onValueChange={v => setEditData({...editData, status: v})}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="transferred">Transferred</SelectItem><SelectItem value="graduated">Graduated</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <>
                    {[
                      ["Admission No.", student.admission_no],
                      ["Grade", student.grade],
                      ["Stream", student.stream],
                      ["Date Joined", student.joined],
                      ["Status", student.status],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between py-1 border-b border-border/50 last:border-0">
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
                <CardHeader><CardTitle className="text-sm font-semibold">Previous School</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-muted-foreground block text-xs">School Name</span><span className="font-medium">{student.previous_school}</span></div>
                    <div><span className="text-muted-foreground block text-xs">Previous Class</span><span className="font-medium">{student.previous_class}</span></div>
                    <div><span className="text-muted-foreground block text-xs">TC No.</span><span className="font-medium font-mono">{student.tc_no}</span></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="guardian">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold">Parent / Guardian</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground font-bold">
                    {student.parent_name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{student.parent_name}</p>
                    <Badge variant="secondary" className="text-xs mt-0.5">Primary Guardian</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /><span>{student.parent_phone}</span>
                </div>
              </CardContent>
            </Card>

            {siblings.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-info" />Siblings ({siblings.length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {siblings.map(sb => (
                    <div key={sb.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/students/${sb.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {sb.full_name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{sb.full_name}</p>
                          <p className="text-xs text-muted-foreground">{sb.admission_no} · {sb.grade} {sb.stream}</p>
                        </div>
                      </div>
                      <Badge className={sb.status === "active" ? "bg-success/10 text-success border-0" : ""}>{sb.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="academic">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Academic History</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Exam results, attendance records, and academic progression will be displayed here when connected to live data.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          {collection ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Fees</p>
                  <p className="text-xl font-bold text-foreground mt-1">KES {collection.total_fee.toLocaleString()}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-xl font-bold text-success mt-1">KES {collection.paid.toLocaleString()}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Discount</p>
                  <p className="text-xl font-bold text-primary mt-1">KES {collection.discount.toLocaleString()}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className={`text-xl font-bold mt-1 ${collection.balance > 0 ? "text-destructive" : "text-success"}`}>KES {collection.balance.toLocaleString()}</p>
                </CardContent></Card>
              </div>
              <Button onClick={() => navigate(`/student-fees/${student.id}`)}>
                <Wallet className="h-4 w-4 mr-1.5" />View Full Fee Details & Payments
              </Button>
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No fee records found for this student.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Identity & Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Birth Certificate No.</span>
                  <span className="font-medium font-mono">{student.birth_cert_no}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">NEMIS / UPI No.</span>
                  <span className="font-medium font-mono">{student.nemis_no}</span>
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
              This will soft-delete <strong>{student.full_name}</strong> ({student.admission_no}). 
              The student record will be marked as inactive but can be reactivated later. 
              Outstanding fee balances will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deactivate Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default StudentProfile;
