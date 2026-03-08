import { useState } from "react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { students, studentCategories, promotionRecords, parents } from "@/data/mockData";
import {
  Search, Plus, Download, Filter, Eye, MoreHorizontal, GraduationCap, Users,
  AlertTriangle, UserPlus, ArrowUpDown, FileText, Upload, X, ChevronRight, ChevronLeft,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // Auto-detect parent by phone number
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

  // Find sibling students for matched parent
  const siblingStudents = matchedParent
    ? students.filter(s => s.parent_phone === matchedParent.phone)
    : [];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
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

      {/* Step 1: Personal Details */}
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

      {/* Step 2: Guardian Info */}
      {step === 2 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Father / Guardian Information</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Father's Name *</Label><Input placeholder="Full name" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone *</Label><Input placeholder="0712345678" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Occupation</Label><Input placeholder="Occupation" className="h-9" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input type="email" placeholder="email@example.com" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">ID Number</Label><Input placeholder="National ID" className="h-9" /></div>
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

      {/* Step 3: Previous School */}
      {step === 3 && (
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-foreground">Previous School Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Previous School Name</Label><Input placeholder="School name" className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Previous Class</Label><Input placeholder="e.g. Grade 7" className="h-9" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">TC / Transfer Certificate No.</Label><Input placeholder="TC number" className="h-9" /></div>
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

      {/* Step 4: Siblings & IDs */}
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
          <div className="rounded-md border p-3 space-y-3">
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
        </div>
      )}

      {/* Step 5: Documents */}
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

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onClose()} size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />{step === 1 ? "Cancel" : "Previous"}
        </Button>
        <div className="flex gap-2">
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} size="sm">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button size="sm" className="bg-success hover:bg-success/90">
              <UserPlus className="h-4 w-4 mr-1.5" />Complete Admission
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Students = () => {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [admissionOpen, setAdmissionOpen] = useState(false);

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

  return (
    <DashboardLayout title="Students" subtitle="Manage student records, admissions, and promotions">
      <Tabs defaultValue="registry" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="registry" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" />Student Registry</TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5"><Users className="h-3.5 w-3.5" />Categories</TabsTrigger>
          <TabsTrigger value="promotion" className="gap-1.5"><ArrowUpDown className="h-3.5 w-3.5" />Promotion</TabsTrigger>
        </TabsList>

        {/* Registry Tab */}
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
              <div><p className="text-sm text-muted-foreground">With Balances</p><p className="text-2xl font-bold text-foreground">{withBalance}</p></div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Student List</CardTitle>
                <div className="flex items-center gap-2">
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
                  <Input placeholder="Search name, admission no, father name..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                      <TableHead className="font-semibold">Admission No.</TableHead>
                      <TableHead className="font-semibold">Grade</TableHead>
                      <TableHead className="font-semibold">Parent</TableHead>
                      <TableHead className="font-semibold">Balance</TableHead>
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
                            {formatKES(s.balance)}
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
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
                              <DropdownMenuItem>Edit Details</DropdownMenuItem>
                              <DropdownMenuItem>View Ledger</DropdownMenuItem>
                              <DropdownMenuItem>View Siblings</DropdownMenuItem>
                              <DropdownMenuItem>Record Payment</DropdownMenuItem>
                              <DropdownMenuItem>Print ID Card</DropdownMenuItem>
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

        {/* Categories Tab */}
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
                      <Button className="w-full mt-2">Create Category</Button>
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

        {/* Promotion Tab */}
        <TabsContent value="promotion" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">Student Promotion</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Promote students to the next academic session</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild><Button size="sm"><ArrowUpDown className="h-4 w-4 mr-1.5" />Promote Students</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Promote Students</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>From Session</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="2023">2023</SelectItem><SelectItem value="2024">2024</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>To Session</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="2024">2024</SelectItem><SelectItem value="2025">2025</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>From Class</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>To Class</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Promotion Criteria</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Promote All</SelectItem><SelectItem value="pass">Pass Only</SelectItem><SelectItem value="manual">Manual Selection</SelectItem></SelectContent></Select>
                      </div>
                      <Button className="w-full mt-2">Promote Students</Button>
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
                      <TableHead className="font-semibold">From</TableHead>
                      <TableHead className="font-semibold">To</TableHead>
                      <TableHead className="font-semibold">Session</TableHead>
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
    </DashboardLayout>
  );
};

export default Students;
