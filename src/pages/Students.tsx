import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents, useCreateStudent, useSoftDeleteStudent, type StudentRow } from "@/hooks/useStudents";
import { useGrades, useStreams } from "@/hooks/useGrades";
import { useParents } from "@/hooks/useParents";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Search, Plus, Download, Filter, Eye, MoreHorizontal, GraduationCap, Users,
  AlertTriangle, UserPlus, ArrowUpDown, FileText, Upload, ChevronRight, ChevronLeft,
  Wallet, CreditCard, Printer, CheckCircle, Edit, Trash2,
} from "lucide-react";
import { BulkImportDialog } from "@/components/students/BulkImportDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

/* ─── Admission Form ─── */
const AdmissionForm = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const steps = ["Personal Details", "Guardian Info", "Previous School", "Documents & IDs"];

  const { data: grades = [] } = useGrades();
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const { data: streams = [] } = useStreams(selectedGradeId || undefined);

  // Form state
  const [form, setForm] = useState<Record<string, any>>({});
  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  // Sibling detection
  const [siblingCheck, setSiblingCheck] = useState<{ found: boolean; parent: any; students: any[] }>({ found: false, parent: null, students: [] });
  const [confirmSibling, setConfirmSibling] = useState(false);

  const lookupParentByPhone = useCallback(async (phone: string) => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 10) { setSiblingCheck({ found: false, parent: null, students: [] }); return; }
    try {
      const res = await api.get<any>(`/parents/lookup?phone=${cleaned}`);
      if (res && res.id) {
        const siblings = await api.get<any[]>(`/students/siblings?parent_phone=${cleaned}`).catch(() => []);
        setSiblingCheck({ found: true, parent: res, students: siblings || [] });
      } else {
        setSiblingCheck({ found: false, parent: null, students: [] });
      }
    } catch {
      setSiblingCheck({ found: false, parent: null, students: [] });
    }
  }, []);

  const createStudent = useCreateStudent();

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.admission_number) {
      toast.error("Please fill first name, last name, and admission number");
      return;
    }
    const selectedGrade = grades.find(g => g.id === selectedGradeId);
    const selectedStream = streams.find(s => s.id === form.stream_id);

    createStudent.mutate({
      first_name: form.first_name,
      middle_name: form.middle_name || null,
      last_name: form.last_name,
      admission_number: form.admission_number,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      religion: form.religion || null,
      nationality: form.nationality || "Kenyan",
      current_grade_id: selectedGradeId || null,
      current_stream_id: form.stream_id || null,
      grade: selectedGrade?.name || null,
      stream: selectedStream?.name || null,
      admission_date: form.admission_date || new Date().toISOString().split("T")[0],
      status: "active",
      parent_name: form.father_name || form.mother_name || null,
      parent_phone: form.father_phone || form.mother_phone || null,
      parent_email: form.father_email || form.mother_email || null,
      // Guardian info - sent to backend which auto-creates parent records
      father_name: form.father_name || null,
      father_phone: form.father_phone || null,
      father_email: form.father_email || null,
      father_occupation: form.father_occupation || null,
      father_id_number: form.father_id_number || null,
      mother_name: form.mother_name || null,
      mother_phone: form.mother_phone || null,
      mother_email: form.mother_email || null,
      mother_occupation: form.mother_occupation || null,
      primary_guardian: form.primary_guardian || "father",
      previous_school: form.previous_school || null,
      upi: form.upi || null,
      medical_info: form.medical_info ? { conditions: form.medical_info, allergies: form.allergies } : null,
      special_needs: form.special_needs || null,
    } as any, {
      onSuccess: () => { onSuccess(); onClose(); },
    });
  };

  return (
    <div className="space-y-5">
      {/* Steps indicator */}
      <div className="flex items-center justify-between px-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              step > i + 1 ? "bg-primary text-primary-foreground" :
              step === i + 1 ? "bg-primary text-primary-foreground" :
              "bg-muted text-muted-foreground"
            }`}>{step > i + 1 ? "✓" : i + 1}</div>
            <span className={`text-xs hidden sm:inline ${step === i + 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Details */}
      {step === 1 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">First Name *</Label><Input className="h-9" value={form.first_name || ""} onChange={e => set("first_name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Middle Name</Label><Input className="h-9" value={form.middle_name || ""} onChange={e => set("middle_name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Last Name *</Label><Input className="h-9" value={form.last_name || ""} onChange={e => set("last_name", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Date of Birth</Label><Input type="date" className="h-9" value={form.date_of_birth || ""} onChange={e => set("date_of_birth", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Gender *</Label>
              <Select value={form.gender || ""} onValueChange={v => set("gender", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Religion</Label>
              <Select value={form.religion || ""} onValueChange={v => set("religion", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{["Christian", "Muslim", "Hindu", "Other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Admission No. *</Label><Input className="h-9" value={form.admission_number || ""} onChange={e => set("admission_number", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Admission Date *</Label><Input type="date" className="h-9" value={form.admission_date || ""} onChange={e => set("admission_date", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Nationality</Label><Input className="h-9" defaultValue="Kenyan" value={form.nationality || "Kenyan"} onChange={e => set("nationality", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Class / Grade *</Label>
              <Select value={selectedGradeId} onValueChange={v => { setSelectedGradeId(v); set("stream_id", ""); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {grades.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Stream / Section *</Label>
              <Select value={form.stream_id || ""} onValueChange={v => set("stream_id", v)} disabled={!selectedGradeId}>
                <SelectTrigger className="h-9"><SelectValue placeholder={selectedGradeId ? "Select stream" : "Select class first"} /></SelectTrigger>
                <SelectContent>
                  {streams.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Medical Conditions</Label><Input className="h-9" placeholder="e.g. Asthma, None" value={form.medical_info || ""} onChange={e => set("medical_info", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Allergies</Label><Input className="h-9" placeholder="e.g. Dust, Peanuts" value={form.allergies || ""} onChange={e => set("allergies", e.target.value)} /></div>
          </div>
        </div>
      )}

      {/* Step 2: Guardian Info */}
      {step === 2 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Father / Male Guardian</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Father's Full Name</Label><Input className="h-9" value={form.father_name || ""} onChange={e => set("father_name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label>
              <Input className="h-9" placeholder="0712345678" value={form.father_phone || ""}
                onChange={e => { set("father_phone", e.target.value); lookupParentByPhone(e.target.value); }} />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Occupation</Label><Input className="h-9" value={form.father_occupation || ""} onChange={e => set("father_occupation", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input className="h-9" type="email" value={form.father_email || ""} onChange={e => set("father_email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">ID Number</Label><Input className="h-9" value={form.father_id_number || ""} onChange={e => set("father_id_number", e.target.value)} /></div>
          </div>

          {/* Sibling detection alert */}
          {siblingCheck.found && (
            <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Existing Parent Found!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground">{siblingCheck.parent?.first_name} {siblingCheck.parent?.last_name}</span> is already registered.
                  </p>
                  {siblingCheck.students.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {siblingCheck.students.map((s: any) => (
                        <Badge key={s.id} variant="secondary" className="text-xs">
                          {s.full_name || `${s.first_name} ${s.last_name}`} · {s.grade}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-8">
                <Checkbox id="confirm-sibling" checked={confirmSibling} onCheckedChange={(c) => setConfirmSibling(!!c)} />
                <Label htmlFor="confirm-sibling" className="text-sm font-medium cursor-pointer">
                  Yes, this student is a sibling (link to existing parent)
                </Label>
              </div>
            </div>
          )}

          <p className="text-sm font-semibold text-foreground mt-2">Mother / Female Guardian</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Mother's Full Name</Label><Input className="h-9" value={form.mother_name || ""} onChange={e => set("mother_name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label>
              <Input className="h-9" placeholder="0712345678" value={form.mother_phone || ""}
                onChange={e => { set("mother_phone", e.target.value); if (!form.father_phone) lookupParentByPhone(e.target.value); }} />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Occupation</Label><Input className="h-9" value={form.mother_occupation || ""} onChange={e => set("mother_occupation", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Mother's Email</Label><Input className="h-9" type="email" value={form.mother_email || ""} onChange={e => set("mother_email", e.target.value)} /></div>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <Label className="text-sm font-semibold text-foreground">Primary Guardian (receives SMS/notifications) *</Label>
            <Select value={form.primary_guardian || ""} onValueChange={v => set("primary_guardian", v)}>
              <SelectTrigger className="h-9 mt-2"><SelectValue placeholder="Select primary guardian" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="father">Father / Male Guardian</SelectItem>
                <SelectItem value="mother">Mother / Female Guardian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm font-semibold text-foreground mt-2">Emergency Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Contact Name</Label><Input className="h-9" value={form.emergency_name || ""} onChange={e => set("emergency_name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Relationship</Label><Input className="h-9" placeholder="e.g. Uncle" value={form.emergency_relation || ""} onChange={e => set("emergency_relation", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input className="h-9" value={form.emergency_phone || ""} onChange={e => set("emergency_phone", e.target.value)} /></div>
          </div>
        </div>
      )}

      {/* Step 3: Previous School */}
      {step === 3 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Previous School Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Previous School Name</Label><Input className="h-9" value={form.previous_school || ""} onChange={e => set("previous_school", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Previous Class</Label><Input className="h-9" value={form.previous_class || ""} onChange={e => set("previous_class", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Transfer Certificate No.</Label><Input className="h-9" value={form.tc_no || ""} onChange={e => set("tc_no", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Year of Leaving</Label><Input type="number" className="h-9" value={form.year_leaving || ""} onChange={e => set("year_leaving", e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Additional Notes</Label><Textarea rows={3} value={form.prev_notes || ""} onChange={e => set("prev_notes", e.target.value)} /></div>
        </div>
      )}

      {/* Step 4: Documents & IDs */}
      {step === 4 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Identity Documents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Birth Certificate No.</Label><Input className="h-9" value={form.birth_cert || ""} onChange={e => set("birth_cert", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">NEMIS / UPI Number</Label><Input className="h-9" value={form.upi || ""} onChange={e => set("upi", e.target.value)} /></div>
          </div>

          <p className="text-sm font-semibold text-foreground mt-2">Upload Documents</p>
          {["Birth Certificate", "Transfer Certificate", "Passport Photo", "Medical Records"].map(doc => (
            <div key={doc} className="flex items-center justify-between p-3 rounded-md border border-dashed border-muted-foreground/30">
              <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{doc}</span></div>
              <Button variant="outline" size="sm"><Upload className="h-3.5 w-3.5 mr-1.5" />Choose File</Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Accepted: PDF, JPG, PNG (Max 5MB each)</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onClose()} size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />{step === 1 ? "Cancel" : "Previous"}
        </Button>
        {step < totalSteps ? (
          <Button onClick={() => setStep(step + 1)} size="sm">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={createStudent.isPending}>
            <UserPlus className="h-4 w-4 mr-1.5" />{createStudent.isPending ? "Saving..." : "Complete Admission"}
          </Button>
        )}
      </div>
    </div>
  );
};

/* ─── Main Students Page ─── */
const Students = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<StudentRow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  const { data: allStudents = [], isLoading, refetch } = useStudents({ search: search || undefined });
  const { data: grades = [] } = useGrades();
  const softDelete = useSoftDeleteStudent();

  const filtered = allStudents.filter(s => gradeFilter === "all" || s.grade === gradeFilter);
  const activeCount = allStudents.filter(s => s.status === "active").length;

  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentMethod || !paymentStudent) {
      toast.error("Please fill in amount and payment method");
      return;
    }
    try {
      await api.post("/payments/record", {
        student_id: paymentStudent.id,
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentRef || null,
      });
      toast.success(`Payment of KES ${Number(paymentAmount).toLocaleString()} recorded`);
      setShowPaymentDialog(false);
      setPaymentAmount(""); setPaymentMethod(""); setPaymentRef(""); setPaymentStudent(null);
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const getDisplayName = (s: StudentRow) => s.full_name || `${s.first_name} ${s.last_name}`;
  const getInitials = (s: StudentRow) => getDisplayName(s).split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <DashboardLayout title="Students" subtitle="Manage student records, admissions, and data">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          <Card><CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs sm:text-sm text-muted-foreground">Total</p><p className="text-xl sm:text-2xl font-bold text-foreground">{allStudents.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10"><Users className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-xs sm:text-sm text-muted-foreground">Active</p><p className="text-xl sm:text-2xl font-bold text-foreground">{activeCount}</p></div>
          </CardContent></Card>
          <Card className="col-span-2 sm:col-span-1"><CardContent className="flex items-center gap-4 p-4 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10"><AlertTriangle className="h-5 w-5 text-orange-500" /></div>
            <div><p className="text-xs sm:text-sm text-muted-foreground">Inactive</p><p className="text-xl sm:text-2xl font-bold text-foreground">{allStudents.filter(s => s.status === "inactive").length}</p></div>
          </CardContent></Card>
        </div>

        {/* Student List */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">Student Registry</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setBulkImportOpen(true)}><Upload className="h-4 w-4 mr-1.5" />Import</Button>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                <Dialog open={admissionOpen} onOpenChange={setAdmissionOpen}>
                  <DialogTrigger asChild><Button size="sm"><UserPlus className="h-4 w-4 mr-1.5" />New Admission</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Student Admission Form</DialogTitle></DialogHeader>
                    <AdmissionForm onClose={() => setAdmissionOpen(false)} onSuccess={() => refetch()} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9"><Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder="Grade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden space-y-2">
              {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />) :
                filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground text-sm">{search ? "No students match" : "No students yet"}</p> :
                filtered.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-card" onClick={() => navigate(`/students/${s.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">{getInitials(s)}</div>
                      <div>
                        <p className="text-sm font-medium">{getDisplayName(s)}</p>
                        <p className="text-xs text-muted-foreground">{s.admission_number} · {s.grade || "—"}</p>
                      </div>
                    </div>
                    <Badge variant={s.status === "active" ? "default" : "secondary"} className={s.status === "active" ? "bg-green-500/10 text-green-600 border-0" : ""}>{s.status}</Badge>
                  </div>
                ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Student</TableHead>
                    <TableHead className="font-semibold">Adm. No.</TableHead>
                    <TableHead className="font-semibold">Grade</TableHead>
                    <TableHead className="font-semibold">Parent / Guardian</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton className="h-8 w-48" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-5 w-16" /></TableCell><TableCell /></TableRow>
                  )) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{search ? "No students match your search" : "No students found. Add your first student!"}</TableCell></TableRow>
                  ) : filtered.map(s => (
                    <TableRow key={s.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">{getInitials(s)}</div>
                          <div><p className="font-medium text-foreground">{getDisplayName(s)}</p><p className="text-xs text-muted-foreground">{s.gender || "—"}</p></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{s.admission_number}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-normal">{s.grade || "—"}{s.stream ? ` · ${s.stream}` : ""}</Badge></TableCell>
                      <TableCell><p className="text-sm">{s.parent_name || "—"}</p><p className="text-xs text-muted-foreground">{s.parent_phone || ""}</p></TableCell>
                      <TableCell>
                        <Badge variant={s.status === "active" ? "default" : "secondary"}
                          className={s.status === "active" ? "bg-green-500/10 text-green-600 border-0" : ""}>{s.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/students/${s.id}`)}><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/student-fees/${s.id}`)}><Wallet className="h-4 w-4 mr-2" />Fees & Payments</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setPaymentStudent(s); setShowPaymentDialog(true); }}><CreditCard className="h-4 w-4 mr-2" />Collect Payment</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => softDelete.mutate(s.id)}><Trash2 className="h-4 w-4 mr-2" />Deactivate</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Showing {filtered.length} of {allStudents.length} students</p>
          </CardContent>
        </Card>
      </div>

      <BulkImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} type="students" />

      {/* Quick Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Collect Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {paymentStudent && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium">{getDisplayName(paymentStudent)}</span></div>
                <div className="flex justify-between mt-1"><span className="text-muted-foreground">Adm. No.</span><span className="font-mono text-xs">{paymentStudent.admission_number}</span></div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount (KES) *</Label><Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></div>
              <div className="space-y-2"><Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="mpesa">M-Pesa</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Receipt / Reference</Label><Input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment}><CheckCircle className="h-4 w-4 mr-1.5" />Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Students;
