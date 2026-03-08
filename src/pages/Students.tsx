import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { students, studentCategories, promotionRecords, parents, studentFeeCollection } from "@/data/mockData";
import {
  Search, Plus, Download, Filter, Eye, MoreHorizontal, GraduationCap, Users,
  AlertTriangle, UserPlus, ArrowUpDown, FileText, Upload, X, ChevronRight, ChevronLeft,
  Wallet, Phone, Mail, MapPin, Calendar, User, CreditCard, Printer, CheckCircle, Edit, Trash2,
} from "lucide-react";
import { BulkImportDialog } from "@/components/students/BulkImportDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const formatKES = (amount: number) => {
  const abs = Math.abs(amount);
  const formatted = `KES ${abs.toLocaleString()}`;
  return amount < 0 ? `-${formatted}` : amount > 0 ? `+${formatted}` : formatted;
};

const AdmissionForm = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [guardianPhone, setGuardianPhone] = useState("");
  const [matchedParent, setMatchedParent] = useState<typeof parents[0] | null>(null);
  const [siblingPromptShown, setSiblingPromptShown] = useState(false);
  const [addAsSibling, setAddAsSibling] = useState(false);
  const totalSteps = 5;
  const steps = ["Personal Details", "Guardian Info", "Previous School", "Siblings & IDs", "Documents"];

  const handlePhoneChange = (phone: string) => {
    setGuardianPhone(phone);
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length >= 10) {
      const found = parents.find(p => p.phone === cleaned);
      if (found) {
        setMatchedParent(found);
        setSiblingPromptShown(true);
      } else {
        setMatchedParent(null);
        setSiblingPromptShown(false);
        setAddAsSibling(false);
      }
    } else {
      setMatchedParent(null);
      setSiblingPromptShown(false);
      setAddAsSibling(false);
    }
  };

  const siblingStudents = matchedParent
    ? students.filter(s => s.parent_phone === matchedParent.phone)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              step > i + 1 ? "bg-success text-success-foreground" :
              step === i + 1 ? "bg-primary text-primary-foreground" :
              "bg-muted text-muted-foreground"
            }`}>{i + 1}</div>
            <span className={`text-xs hidden sm:inline ${step === i + 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:inline" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Personal Information</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">First Name *</Label><Input placeholder="First name" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Middle Name</Label><Input placeholder="Middle name" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Last Name *</Label><Input placeholder="Last name" className="h-9" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Date of Birth *</Label><Input type="date" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Gender *</Label>
              <Select><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Blood Group</Label>
              <Select><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Religion</Label>
              <Select><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["Christian","Muslim","Hindu","Other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Nationality</Label><Input defaultValue="Kenyan" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Mother Tongue</Label><Input placeholder="e.g. Kikuyu" className="h-9" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Admission No. *</Label><Input placeholder="ADM-2024-XXX" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Admission Date *</Label><Input type="date" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Category</Label>
              <Select><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{studentCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Grade *</Label>
              <Select><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Section *</Label>
              <Select><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["A","B","C","North","South","East","West"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5 flex items-end gap-2 pb-0.5">
              <Checkbox id="rte" /><Label htmlFor="rte" className="text-xs">RTE Student</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Medical Condition</Label><Input placeholder="e.g. Asthma, None" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Allergies</Label><Input placeholder="e.g. Dust, Peanuts" className="h-9" /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Permanent Address</Label><Textarea placeholder="Full address" rows={2} /></div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Father / Guardian Information</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Father's Name *</Label><Input placeholder="Full name" className="h-9" defaultValue={addAsSibling && matchedParent ? matchedParent.full_name : ""} /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone *</Label>
              <Input placeholder="0712345678" className="h-9" value={guardianPhone} onChange={e => handlePhoneChange(e.target.value)} />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Occupation</Label><Input placeholder="Occupation" className="h-9" defaultValue={addAsSibling && matchedParent ? matchedParent.occupation : ""} /></div>
          </div>

          {siblingPromptShown && matchedParent && (
            <div className="rounded-lg border-2 border-info/40 bg-info/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-info mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Existing Parent Found!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground">{matchedParent.full_name}</span> ({matchedParent.phone}) is already registered with {matchedParent.children_count} child{matchedParent.children_count > 1 ? "ren" : ""}:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {siblingStudents.map(s => (
                      <Badge key={s.id} variant="secondary" className="text-xs">
                        {s.full_name} · {s.grade} {s.stream}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-8">
                <Button size="sm" variant={addAsSibling ? "default" : "outline"} className="h-7 text-xs" onClick={() => setAddAsSibling(true)}>
                  <UserPlus className="h-3 w-3 mr-1" />Yes, Add as Sibling
                </Button>
                <Button size="sm" variant={!addAsSibling ? "default" : "outline"} className="h-7 text-xs" onClick={() => setAddAsSibling(false)}>
                  No, Different Parent
                </Button>
              </div>
              {addAsSibling && (
                <p className="text-xs text-success ml-8 font-medium">✓ This student will be linked as a sibling. Guardian details auto-filled.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input type="email" placeholder="email@example.com" className="h-9" defaultValue={addAsSibling && matchedParent ? matchedParent.email : ""} /></div>
            <div className="space-y-1.5"><Label className="text-xs">ID Number</Label><Input placeholder="National ID" className="h-9" defaultValue={addAsSibling && matchedParent ? matchedParent.id_number : ""} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Annual Income</Label>
              <Select><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="below_50k">Below KES 50,000</SelectItem><SelectItem value="50k_200k">KES 50,000 - 200,000</SelectItem><SelectItem value="200k_500k">KES 200,000 - 500,000</SelectItem><SelectItem value="above_500k">Above KES 500,000</SelectItem></SelectContent></Select>
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground mt-2">Mother Information</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Mother's Name</Label><Input placeholder="Full name" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input placeholder="0712345678" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Occupation</Label><Input placeholder="Occupation" className="h-9" /></div>
          </div>
          <p className="text-sm font-semibold text-foreground mt-2">Emergency Contact</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Contact Name *</Label><Input placeholder="Full name" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Relationship</Label><Input placeholder="e.g. Uncle" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone *</Label><Input placeholder="0712345678" className="h-9" /></div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Previous School Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Previous School Name</Label><Input placeholder="School name" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Previous Class</Label><Input placeholder="e.g. Grade 7" className="h-9" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Transfer Certificate No.</Label><Input placeholder="TC number" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Year of Leaving</Label><Input type="number" placeholder="2023" className="h-9" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Reason for Leaving</Label>
              <Select><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="promotion">Promotion</SelectItem><SelectItem value="relocation">Family Relocation</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Previous School Contact</Label><Input placeholder="Phone number" className="h-9" /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Additional Notes</Label><Textarea placeholder="Any other relevant information about the student's previous schooling" rows={3} /></div>
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Identity Documents</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Birth Certificate No. *</Label><Input placeholder="BC-XXXXXXXX" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">NEMIS / UPI Number</Label><Input placeholder="NEMIS-XXX" className="h-9" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">NHIF Number</Label><Input placeholder="NHIF number" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Passport Number</Label><Input placeholder="If applicable" className="h-9" /></div>
          </div>

          <p className="text-sm font-semibold text-foreground mt-2">Siblings in this School</p>

          {addAsSibling && siblingStudents.length > 0 && (
            <div className="rounded-lg border-2 border-success/30 bg-success/5 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-success" />
                <p className="text-sm font-semibold text-success">Auto-detected Siblings</p>
              </div>
              {siblingStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-md bg-background border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {s.full_name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.admission_no} · {s.grade} {s.stream}</p>
                    </div>
                  </div>
                  <Badge className="bg-success/10 text-success border-0 text-xs">Linked</Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-1">These siblings were automatically detected from the guardian's phone number.</p>
            </div>
          )}

          {!addAsSibling && (
            <div className="rounded-md border p-3 space-y-3">
              <p className="text-xs text-muted-foreground">No siblings auto-detected. You can manually add siblings below.</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Sibling Name</Label><Input placeholder="Full name" className="h-9" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Admission No.</Label><Input placeholder="ADM-XXXX-XXX" className="h-9" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Class</Label>
                  <Select><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full"><Plus className="h-3.5 w-3.5 mr-1.5" />Add Another Sibling</Button>
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Upload Documents</p>
          {["Birth Certificate", "Transfer Certificate", "Previous Report Card", "Passport Photo", "Medical Records", "Parent ID Copy"].map(doc => (
            <div key={doc} className="flex items-center justify-between p-3 rounded-md border border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{doc}</span>
              </div>
              <Button variant="outline" size="sm"><Upload className="h-3.5 w-3.5 mr-1.5" />Choose File</Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG (Max 5MB each)</p>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onClose()} size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />{step === 1 ? "Cancel" : "Previous"}
        </Button>
        <div className="flex gap-2">
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} size="sm">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => { toast.success("Student admitted successfully!"); onClose(); }}>
              <UserPlus className="h-4 w-4 mr-1.5" />Complete Admission
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Students = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<typeof students[0] | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<typeof students[0] | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const filtered = students.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(search.toLowerCase()) ||
      s.parent_name.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = gradeFilter === "all" || s.grade === gradeFilter;
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesGrade && matchesCategory;
  });

  const activeCount = students.filter((s) => s.status === "active").length;
  const withBalance = students.filter((s) => s.balance < 0).length;

  const handleRecordPayment = () => {
    if (!paymentAmount || !paymentMethod) {
      toast.error("Please fill in amount and payment method");
      return;
    }
    toast.success(`Payment of KES ${Number(paymentAmount).toLocaleString()} recorded for ${paymentStudent?.full_name}`);
    setShowPaymentDialog(false);
    setPaymentAmount("");
    setPaymentMethod("");
    setPaymentRef("");
    setPaymentStudent(null);
  };

  const getSiblings = (student: typeof students[0]) => {
    return students.filter(s => s.id !== student.id && s.parent_phone === student.parent_phone);
  };

  const getStudentCollection = (sid: string) => {
    return studentFeeCollection.find(c => c.student_id === sid);
  };

  return (
    <DashboardLayout title="Students" subtitle="Manage student records, admissions, and promotions">
      <Tabs defaultValue="registry" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="registry" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" />All Students</TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5"><Users className="h-3.5 w-3.5" />Categories</TabsTrigger>
          <TabsTrigger value="promotion" className="gap-1.5"><ArrowUpDown className="h-3.5 w-3.5" />Promotion</TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3 mb-0">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total Students</p><p className="text-2xl font-bold text-foreground">{students.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Users className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-foreground">{activeCount}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><AlertTriangle className="h-5 w-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">With Outstanding Fees</p><p className="text-2xl font-bold text-foreground">{withBalance}</p></div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Student List</CardTitle>
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" onClick={() => setBulkImportOpen(true)}><Upload className="h-4 w-4 mr-1.5" />Bulk Import</Button>
                   <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                   <Dialog open={admissionOpen} onOpenChange={setAdmissionOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><UserPlus className="h-4 w-4 mr-1.5" />New Admission</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Student Admission Form</DialogTitle></DialogHeader>
                      <AdmissionForm onClose={() => setAdmissionOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name, admission no, parent..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-36 h-9"><Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder="Grade" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Grades</SelectItem>{["Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Categories</SelectItem>{studentCategories.map(c => <SelectItem key={c.id} value={c.name.toLowerCase()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Adm. No.</TableHead>
                      <TableHead className="font-semibold">Grade</TableHead>
                      <TableHead className="font-semibold">Parent / Guardian</TableHead>
                      <TableHead className="font-semibold">Fee Balance</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                              {s.full_name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{s.full_name}</p>
                              <p className="text-xs text-muted-foreground">{s.gender} · {s.category === "rte" ? "RTE" : s.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{s.admission_no}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal">{s.grade} · {s.stream}</Badge></TableCell>
                        <TableCell><p className="text-sm">{s.parent_name}</p><p className="text-xs text-muted-foreground">{s.parent_phone}</p></TableCell>
                        <TableCell>
                          <span className={`text-sm font-semibold ${s.balance < 0 ? "text-destructive" : s.balance > 0 ? "text-success" : "text-muted-foreground"}`}>
                            {s.balance === 0 ? "Cleared" : formatKES(s.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.status === "active" ? "default" : "secondary"}
                            className={s.status === "active" ? "bg-success/10 text-success border-0 hover:bg-success/20" : ""}>{s.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => navigate(`/students/${s.id}`)}>
                                 <Eye className="h-4 w-4 mr-2" />View Profile
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => navigate(`/students/${s.id}?edit=true`)}>
                                 <Edit className="h-4 w-4 mr-2" />Edit Student
                               </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/student-fees/${s.id}`)}>
                                <Wallet className="h-4 w-4 mr-2" />View Fees & Payments
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setPaymentStudent(s); setShowPaymentDialog(true); }}>
                                <CreditCard className="h-4 w-4 mr-2" />Collect Payment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                const siblings = getSiblings(s);
                                if (siblings.length > 0) {
                                  toast.info(`${s.full_name} has ${siblings.length} sibling(s): ${siblings.map(sb => sb.full_name).join(", ")}`);
                                } else {
                                  toast.info(`${s.full_name} has no siblings registered in this school.`);
                                }
                              }}>
                                <Users className="h-4 w-4 mr-2" />Check Siblings
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success("ID card sent to print queue")}>
                                <Printer className="h-4 w-4 mr-2" />Print ID Card
                              </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => toast.success("Fee statement downloaded")}>
                                 <Download className="h-4 w-4 mr-2" />Download Statement
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem className="text-destructive" onClick={() => toast.success(`${s.full_name} has been deactivated`)}>
                                 <Trash2 className="h-4 w-4 mr-2" />Deactivate
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Showing {filtered.length} of {students.length} students</p>
                <div className="flex gap-1"><Button variant="outline" size="sm" disabled>Previous</Button><Button variant="outline" size="sm" disabled>Next</Button></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Student Categories</CardTitle>
                <Dialog>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Category</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Student Category</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Category Name</Label><Input placeholder="e.g. Scholarship" /></div>
                      <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Description of this category" /></div>
                      <Button className="w-full mt-2" onClick={() => toast.success("Category created!")}>Create Category</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {studentCategories.map(c => (
                  <Card key={c.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">{c.count} students</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotion" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">Student Promotion</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Move students to the next grade for the new academic year</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild><Button size="sm"><ArrowUpDown className="h-4 w-4 mr-1.5" />Promote Students</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Promote Students</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>From Year</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="2023">2023</SelectItem><SelectItem value="2024">2024</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>To Year</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="2024">2024</SelectItem><SelectItem value="2025">2025</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>From Grade</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>To Grade</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Promotion Rule</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Promote All</SelectItem><SelectItem value="pass">Only Passed Students</SelectItem><SelectItem value="manual">Select Manually</SelectItem></SelectContent></Select>
                      </div>
                      <Button className="w-full mt-2" onClick={() => toast.success("Students promoted successfully!")}>Promote Students</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">From Grade</TableHead>
                      <TableHead className="font-semibold">To Grade</TableHead>
                      <TableHead className="font-semibold">Year</TableHead>
                      <TableHead className="font-semibold">Result</TableHead>
                      <TableHead className="font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotionRecords.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.student}</TableCell>
                        <TableCell className="text-muted-foreground">{p.from_class}</TableCell>
                        <TableCell className="text-muted-foreground">{p.to_class}</TableCell>
                        <TableCell className="text-muted-foreground">{p.session}</TableCell>
                        <TableCell><Badge className="bg-success/10 text-success border-0">{p.result}</Badge></TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{p.action}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Import Dialog */}
      <BulkImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} type="students" />

      {/* Quick Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Collect Payment {paymentStudent && `- ${paymentStudent.full_name}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {paymentStudent && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium">{paymentStudent.full_name}</span></div>
                <div className="flex justify-between mt-1"><span className="text-muted-foreground">Adm. No.</span><span className="font-mono text-xs">{paymentStudent.admission_no}</span></div>
                <div className="flex justify-between mt-1"><span className="text-muted-foreground">Outstanding</span>
                  <span className={`font-bold ${paymentStudent.balance < 0 ? "text-destructive" : "text-success"}`}>KES {Math.abs(paymentStudent.balance).toLocaleString()}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (KES) *</Label>
                <Input type="number" placeholder="Enter amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Receipt / Reference No.</Label>
              <Input placeholder="Transaction reference" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Payment will be auto-allocated to the oldest outstanding fee first (FIFO). For specific fee allocation, use the Fees & Payments page.</p>
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
