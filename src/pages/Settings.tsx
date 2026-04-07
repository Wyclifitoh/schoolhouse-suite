import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  School, Calendar, Users, Shield, MoreHorizontal, Plus, Save, Mail, Phone, MapPin, Globe,
  MessageSquare, Bell, Edit, Copy, Trash2, CheckCircle, Send, GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSchoolProfile, useUpdateSchoolProfile, useSchoolUsers, useNotificationTemplates, useUpdateNotificationTemplate } from "@/hooks/useSettings";
import { useTerm, AcademicYear, Term } from "@/contexts/TermContext";

const termStatusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-0" },
  active: { label: "Active", className: "bg-success/10 text-success border-0 hover:bg-success/20" },
  upcoming: { label: "Upcoming", className: "bg-info/10 text-info border-0 hover:bg-info/20" },
};

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-0",
  school_admin: "bg-primary/10 text-primary border-0",
  accountant: "bg-chart-5/10 text-chart-5 border-0",
  finance_officer: "bg-chart-5/10 text-chart-5 border-0",
  teacher: "bg-success/10 text-success border-0",
  receptionist: "bg-warning/10 text-warning border-0",
  front_office: "bg-warning/10 text-warning border-0",
};

const smsPlaceholders: Record<string, string[]> = {
  payment_received: ["{amount}", "{student_name}", "{admission_no}", "{balance}", "{reference}", "{payment_method}", "{school_name}", "{date}"],
  fee_reminder: ["{student_name}", "{admission_no}", "{balance}", "{due_date}", "{fee_name}", "{school_name}"],
  fee_overdue: ["{student_name}", "{admission_no}", "{balance}", "{due_date}", "{days_overdue}", "{school_name}"],
  fee_assigned: ["{student_name}", "{admission_no}", "{fee_name}", "{amount}", "{due_date}", "{school_name}"],
  student_admitted: ["{student_name}", "{admission_no}", "{grade}", "{school_name}", "{date}"],
  student_absent: ["{student_name}", "{admission_no}", "{date}", "{school_name}"],
};

const Settings = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("school");

  // --- Data hooks ---
  const { data: schoolProfile, isLoading: profileLoading } = useSchoolProfile();
  const updateProfile = useUpdateSchoolProfile();
  const { data: usersData = [], isLoading: usersLoading } = useSchoolUsers();
  const { data: templatesData = [], isLoading: templatesLoading } = useNotificationTemplates();
  const updateTemplate = useUpdateNotificationTemplate();

  // Academic Years
  const { data: academicYears = [], isLoading: ayLoading } = useQuery({
    queryKey: ["academic-years-settings"],
    queryFn: async () => { const d = await api.get<any>("/schools/academic-years"); return (d?.data || d || []) as any[]; },
  });

  // Terms
  const { data: terms = [], isLoading: termsLoading } = useQuery({
    queryKey: ["terms-settings"],
    queryFn: async () => { const d = await api.get<any>("/schools/terms"); return (d?.data || d || []) as any[]; },
  });

  // --- Academic Year CRUD ---
  const [ayDialogOpen, setAyDialogOpen] = useState(false);
  const [ayForm, setAyForm] = useState({ name: "", start_date: "", end_date: "" });

  const createAY = useMutation({
    mutationFn: (data: any) => api.post("/schools/academic-years", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["academic-years-settings"] }); qc.invalidateQueries({ queryKey: ["academic-years"] }); toast.success("Academic year created!"); setAyDialogOpen(false); setAyForm({ name: "", start_date: "", end_date: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setCurrentAY = useMutation({
    mutationFn: (id: string) => api.put(`/schools/academic-years/${id}/set-current`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["academic-years-settings"] }); qc.invalidateQueries({ queryKey: ["academic-years"] }); toast.success("Current academic year updated!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Term CRUD ---
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [termForm, setTermForm] = useState({ name: "", start_date: "", end_date: "", academic_year_id: "" });

  const createTerm = useMutation({
    mutationFn: (data: any) => api.post("/schools/terms", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["terms-settings"] }); qc.invalidateQueries({ queryKey: ["terms"] }); toast.success("Term created!"); setTermDialogOpen(false); setTermForm({ name: "", start_date: "", end_date: "", academic_year_id: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setCurrentTerm = useMutation({
    mutationFn: (id: string) => api.put(`/schools/terms/${id}/set-current`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["terms-settings"] }); qc.invalidateQueries({ queryKey: ["terms"] }); toast.success("Current term updated!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTerm = useMutation({
    mutationFn: (id: string) => api.delete(`/schools/terms/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["terms-settings"] }); qc.invalidateQueries({ queryKey: ["terms"] }); toast.success("Term deleted!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- SMS Template editing ---
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editName, setEditName] = useState("");
  const [testPhone, setTestPhone] = useState("");

  const openEditTemplate = (tpl: any) => { setEditingTemplate(tpl); setEditMessage(tpl.body || tpl.message); setEditName(tpl.name); };
  const saveTemplate = () => {
    if (!editingTemplate) return;
    updateTemplate.mutate({ id: editingTemplate.id, data: { name: editName, body: editMessage } });
    setEditingTemplate(null);
  };

  // --- School Profile form ---
  const [profileForm, setProfileForm] = useState<Record<string, string>>({});
  const pf = { ...schoolProfile, ...profileForm };

  const getTermStatus = (term: any) => {
    if (term.is_current) return "active";
    const now = new Date();
    const end = new Date(term.end_date);
    if (end < now) return "completed";
    return "upcoming";
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage school configuration, users, and notifications">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="school" className="gap-1.5"><School className="h-4 w-4" /> School Profile</TabsTrigger>
          <TabsTrigger value="academic-years" className="gap-1.5"><GraduationCap className="h-4 w-4" /> Academic Years</TabsTrigger>
          <TabsTrigger value="terms" className="gap-1.5"><Calendar className="h-4 w-4" /> Academic Terms</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" /> User Management</TabsTrigger>
          <TabsTrigger value="sms" className="gap-1.5"><MessageSquare className="h-4 w-4" /> SMS Templates</TabsTrigger>
        </TabsList>

        {/* ── School Profile ── */}
        <TabsContent value="school" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">School Information</CardTitle>
              <CardDescription>Basic details about your institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileLoading ? <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>School Name</Label><Input value={pf.name || ""} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Registration Code</Label><Input value={pf.code || ""} disabled className="bg-muted/50" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email</Label><Input value={pf.email || ""} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} /></div>
                    <div className="space-y-2"><Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone</Label><Input value={pf.phone || ""} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Address</Label><Input value={pf.address || ""} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Paybill Number</Label><Input value={pf.paybill_number || ""} onChange={e => setProfileForm(p => ({ ...p, paybill_number: e.target.value }))} /></div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => updateProfile.mutate(profileForm)} disabled={updateProfile.isPending}>
                      <Save className="h-4 w-4 mr-1.5" /> Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Academic Years ── */}
        <TabsContent value="academic-years" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><CardTitle className="text-base font-semibold">Academic Years</CardTitle><CardDescription>Manage academic years. Terms are attached to academic years.</CardDescription></div>
                <Dialog open={ayDialogOpen} onOpenChange={setAyDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Academic Year</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Add Academic Year</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Year Name</Label><Input placeholder="e.g. 2025" value={ayForm.name} onChange={e => setAyForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={ayForm.start_date} onChange={e => setAyForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>End Date</Label><Input type="date" value={ayForm.end_date} onChange={e => setAyForm(f => ({ ...f, end_date: e.target.value }))} /></div>
                      </div>
                      <Button className="w-full mt-2" onClick={() => createAY.mutate(ayForm)} disabled={createAY.isPending || !ayForm.name || !ayForm.start_date || !ayForm.end_date}>
                        {createAY.isPending ? "Creating..." : "Create Academic Year"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {ayLoading ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
              academicYears.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No academic years configured. Add one to get started.</p> : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Year</TableHead>
                      <TableHead className="font-semibold">Start Date</TableHead>
                      <TableHead className="font-semibold">End Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Terms</TableHead>
                      <TableHead className="w-10" />
                    </TableRow></TableHeader>
                    <TableBody>
                      {academicYears.map((ay: any) => {
                        const ayTerms = terms.filter((t: any) => t.academic_year_id === ay.id);
                        return (
                          <TableRow key={ay.id} className="group">
                            <TableCell className="font-medium text-foreground">{ay.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{ay.start_date}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{ay.end_date}</TableCell>
                            <TableCell>
                              {ay.is_current ? <Badge className="bg-success/10 text-success border-0">Current</Badge> :
                                <Badge variant="secondary">Inactive</Badge>}
                            </TableCell>
                            <TableCell><Badge variant="secondary">{ayTerms.length} terms</Badge></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!ay.is_current && <DropdownMenuItem onClick={() => setCurrentAY.mutate(ay.id)}>Set as Current</DropdownMenuItem>}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Academic Terms ── */}
        <TabsContent value="terms" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><CardTitle className="text-base font-semibold">Academic Terms</CardTitle><CardDescription>Each term must be attached to an academic year</CardDescription></div>
                <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Term</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Add Academic Term</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Academic Year <span className="text-destructive">*</span></Label>
                        <Select value={termForm.academic_year_id} onValueChange={v => setTermForm(f => ({ ...f, academic_year_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger>
                          <SelectContent>
                            {academicYears.map((ay: any) => <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Term Name</Label><Input placeholder="e.g. Term 1 2025" value={termForm.name} onChange={e => setTermForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={termForm.start_date} onChange={e => setTermForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>End Date</Label><Input type="date" value={termForm.end_date} onChange={e => setTermForm(f => ({ ...f, end_date: e.target.value }))} /></div>
                      </div>
                      <Button className="w-full mt-2" disabled={createTerm.isPending || !termForm.name || !termForm.start_date || !termForm.end_date || !termForm.academic_year_id}
                        onClick={() => createTerm.mutate(termForm)}>
                        {createTerm.isPending ? "Creating..." : "Create Term"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {termsLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
              terms.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No terms configured. Add an academic year first, then create terms.</p> : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Term</TableHead>
                      <TableHead className="font-semibold">Academic Year</TableHead>
                      <TableHead className="font-semibold">Start Date</TableHead>
                      <TableHead className="font-semibold">End Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow></TableHeader>
                    <TableBody>
                      {terms.map((term: any) => {
                        const status = getTermStatus(term);
                        const cfg = termStatusConfig[status];
                        const ay = academicYears.find((a: any) => a.id === term.academic_year_id);
                        return (
                          <TableRow key={term.id} className="group">
                            <TableCell className="font-medium text-foreground">{term.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{ay?.name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{term.start_date}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{term.end_date}</TableCell>
                            <TableCell><Badge variant="default" className={cfg.className}>{cfg.label}</Badge></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!term.is_current && <DropdownMenuItem onClick={() => setCurrentTerm.mutate(term.id)}>Set as Current</DropdownMenuItem>}
                                  <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm("Delete this term?")) deleteTerm.mutate(term.id); }}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── User Management ── */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><CardTitle className="text-base font-semibold">Staff & Users</CardTitle><CardDescription>Manage system users and their access roles</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
              (usersData as any[]).length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No users found.</p> : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Last Login</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(usersData as any[]).map((u: any) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                {(u.full_name || u.email || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div><p className="font-medium text-foreground">{u.full_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className={roleColors[u.roles?.split(",")[0]?.trim()] || "bg-secondary"}>
                              <Shield className="h-3 w-3 mr-1" />{u.roles}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.is_active ? "default" : "secondary"} className={u.is_active ? "bg-success/10 text-success border-0 hover:bg-success/20" : ""}>{u.is_active ? "active" : "inactive"}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{u.last_login_at || "Never"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SMS Templates ── */}
        <TabsContent value="sms" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />SMS Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Active Templates</span>
                    <span className="font-medium text-foreground">{(templatesData as any[]).filter((t: any) => t.is_active).length} / {(templatesData as any[]).length}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Available Placeholders</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {["{student_name}", "{admission_no}", "{amount}", "{balance}", "{school_name}", "{date}", "{fee_name}", "{reference}", "{due_date}"].map(p => (
                      <Badge key={p} variant="secondary" className="text-[10px] font-mono cursor-pointer hover:bg-primary/10" onClick={() => { navigator.clipboard.writeText(p); toast.success(`Copied ${p}`); }}>{p}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Message Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {templatesLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div> :
                (templatesData as any[]).map((tpl: any) => (
                  <div key={tpl.id} className={`rounded-lg border p-4 space-y-3 transition-colors ${tpl.is_active ? "bg-background" : "bg-muted/30 opacity-70"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground">{tpl.name}</h4>
                          <Badge variant="secondary" className="text-[10px] font-mono">{tpl.event_type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tpl.body}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={tpl.is_active} onCheckedChange={() => updateTemplate.mutate({ id: tpl.id, data: { is_active: !tpl.is_active } })} />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditTemplate(tpl)}><Edit className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5 text-primary" />Edit SMS Template</DialogTitle></DialogHeader>
              {editingTemplate && (
                <div className="space-y-4 py-2">
                  <div className="space-y-2"><Label>Template Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Message</Label><Textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={5} className="font-mono text-xs" /></div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                    <Button onClick={saveTemplate}><CheckCircle className="h-4 w-4 mr-1.5" />Save</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
