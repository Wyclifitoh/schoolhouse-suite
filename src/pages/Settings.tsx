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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  School, Calendar, Users, Shield, MoreHorizontal, Plus, Save, Mail, Phone, MapPin, Globe,
  MessageSquare, Bell, Edit, Copy, Trash2, CheckCircle, Send,
} from "lucide-react";
import { toast } from "sonner";

const academicTerms = [
  { id: "t1", name: "Term 1 2024", start: "2024-01-08", end: "2024-04-05", status: "completed" as const },
  { id: "t2", name: "Term 2 2024", start: "2024-04-29", end: "2024-08-02", status: "active" as const },
  { id: "t3", name: "Term 3 2024", start: "2024-08-26", end: "2024-11-01", status: "upcoming" as const },
];

const users = [
  { id: "u1", name: "Jane Kamau", email: "jane@chuo.ac.ke", role: "admin", status: "active", last_login: "2024-03-15 09:12" },
  { id: "u2", name: "Peter Otieno", email: "peter@chuo.ac.ke", role: "accountant", status: "active", last_login: "2024-03-15 08:45" },
  { id: "u3", name: "Sarah Mwangi", email: "sarah@chuo.ac.ke", role: "teacher", status: "active", last_login: "2024-03-14 16:30" },
  { id: "u4", name: "David Kimani", email: "david@chuo.ac.ke", role: "teacher", status: "active", last_login: "2024-03-14 14:20" },
  { id: "u5", name: "Grace Wambui", email: "grace@chuo.ac.ke", role: "receptionist", status: "inactive", last_login: "2024-02-28 10:00" },
];

const smsTemplates = [
  { id: "sms1", name: "Payment Received", event: "payment_received", enabled: true, message: "Dear Parent, payment of KES {amount} received for {student_name} ({admission_no}). Balance: KES {balance}. Ref: {reference}. Thank you - {school_name}" },
  { id: "sms2", name: "Fee Reminder", event: "fee_reminder", enabled: true, message: "Dear Parent, fee balance of KES {balance} for {student_name} ({admission_no}) is due on {due_date}. Please pay to avoid late charges. - {school_name}" },
  { id: "sms3", name: "Fee Overdue", event: "fee_overdue", enabled: true, message: "Dear Parent, fee of KES {balance} for {student_name} ({admission_no}) is overdue. Please make payment immediately. - {school_name}" },
  { id: "sms4", name: "New Fee Assigned", event: "fee_assigned", enabled: false, message: "Dear Parent, {fee_name} of KES {amount} has been assigned to {student_name} ({admission_no}). Due date: {due_date}. - {school_name}" },
  { id: "sms5", name: "Admission Confirmation", event: "student_admitted", enabled: false, message: "Dear Parent, {student_name} has been admitted to {grade} at {school_name}. Admission No: {admission_no}. Welcome!" },
  { id: "sms6", name: "Attendance Alert", event: "student_absent", enabled: false, message: "Dear Parent, {student_name} ({admission_no}) was marked absent today ({date}). Please contact the school if this is unexpected. - {school_name}" },
];

const smsPlaceholders: Record<string, string[]> = {
  payment_received: ["{amount}", "{student_name}", "{admission_no}", "{balance}", "{reference}", "{payment_method}", "{school_name}", "{date}"],
  fee_reminder: ["{student_name}", "{admission_no}", "{balance}", "{due_date}", "{fee_name}", "{school_name}"],
  fee_overdue: ["{student_name}", "{admission_no}", "{balance}", "{due_date}", "{days_overdue}", "{school_name}"],
  fee_assigned: ["{student_name}", "{admission_no}", "{fee_name}", "{amount}", "{due_date}", "{school_name}"],
  student_admitted: ["{student_name}", "{admission_no}", "{grade}", "{school_name}", "{date}"],
  student_absent: ["{student_name}", "{admission_no}", "{date}", "{school_name}"],
};

const termStatusConfig = {
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-0" },
  active: { label: "Active", className: "bg-success/10 text-success border-0 hover:bg-success/20" },
  upcoming: { label: "Upcoming", className: "bg-info/10 text-info border-0 hover:bg-info/20" },
};

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-0",
  accountant: "bg-chart-5/10 text-chart-5 border-0",
  teacher: "bg-success/10 text-success border-0",
  receptionist: "bg-warning/10 text-warning border-0",
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState("school");
  const [templates, setTemplates] = useState(smsTemplates);
  const [editingTemplate, setEditingTemplate] = useState<typeof smsTemplates[0] | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editName, setEditName] = useState("");
  const [testPhone, setTestPhone] = useState("");

  const toggleTemplate = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
    const tpl = templates.find(t => t.id === id);
    toast.success(`${tpl?.name} SMS ${tpl?.enabled ? "disabled" : "enabled"}`);
  };

  const openEditTemplate = (tpl: typeof smsTemplates[0]) => {
    setEditingTemplate(tpl);
    setEditMessage(tpl.message);
    setEditName(tpl.name);
  };

  const saveTemplate = () => {
    if (!editingTemplate) return;
    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, name: editName, message: editMessage } : t));
    toast.success("SMS template saved!");
    setEditingTemplate(null);
  };

  const sendTestSms = () => {
    if (!testPhone) { toast.error("Enter a phone number"); return; }
    toast.success(`Test SMS sent to ${testPhone}`);
    setTestPhone("");
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage school configuration, users, and notifications">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="school" className="gap-1.5">
            <School className="h-4 w-4" /> School Profile
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-1.5">
            <Calendar className="h-4 w-4" /> Academic Terms
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" /> User Management
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-1.5">
            <MessageSquare className="h-4 w-4" /> SMS Templates
          </TabsTrigger>
        </TabsList>

        {/* ── School Profile ── */}
        <TabsContent value="school" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">School Information</CardTitle>
              <CardDescription>Basic details about your institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>School Name</Label><Input defaultValue="Chuo Academy" /></div>
                <div className="space-y-2"><Label>Registration Number</Label><Input defaultValue="SCH-2024-00142" disabled className="bg-muted/50" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email</Label><Input defaultValue="admin@chuoacademy.ac.ke" /></div>
                <div className="space-y-2"><Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone</Label><Input defaultValue="+254 712 345 678" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Address</Label><Input defaultValue="P.O. Box 1234, Nairobi" /></div>
                <div className="space-y-2"><Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-muted-foreground" /> Website</Label><Input defaultValue="https://chuoacademy.ac.ke" /></div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Preferences</h4>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">SMS Notifications</p><p className="text-xs text-muted-foreground">Send payment receipts and reminders via SMS</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">Auto Fee Carry-Forward</p><p className="text-xs text-muted-foreground">Automatically carry unpaid balances to next term</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">M-Pesa Integration</p><p className="text-xs text-muted-foreground">Accept payments via M-Pesa STK push</p></div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Settings saved!")}><Save className="h-4 w-4 mr-1.5" /> Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Academic Terms ── */}
        <TabsContent value="terms" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><CardTitle className="text-base font-semibold">Academic Terms</CardTitle><CardDescription>Configure school terms and academic calendar</CardDescription></div>
                <Dialog>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Term</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Add Academic Term</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Term Name</Label><Input placeholder="e.g. Term 1 2025" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Start Date</Label><Input type="date" /></div>
                        <div className="space-y-2"><Label>End Date</Label><Input type="date" /></div>
                      </div>
                      <Button className="w-full mt-2" onClick={() => toast.success("Term created!")}>Create Term</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Term</TableHead>
                    <TableHead className="font-semibold">Start Date</TableHead>
                    <TableHead className="font-semibold">End Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow></TableHeader>
                  <TableBody>
                    {academicTerms.map((term) => {
                      const cfg = termStatusConfig[term.status];
                      return (
                        <TableRow key={term.id} className="group">
                          <TableCell className="font-medium text-foreground">{term.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{term.start}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{term.end}</TableCell>
                          <TableCell><Badge variant="default" className={cfg.className}>{cfg.label}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toast.success("Edit term")}>Edit Term</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success(`${term.name} set as active`)}>Set as Active</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success(`${term.name} deleted`)}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── User Management ── */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><CardTitle className="text-base font-semibold">Staff & Users</CardTitle><CardDescription>Manage system users and their access roles</CardDescription></div>
                <Dialog>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Invite User</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Full name" /></div>
                      <div className="space-y-2"><Label>Email Address</Label><Input placeholder="email@school.ac.ke" type="email" /></div>
                      <div className="space-y-2"><Label>Role</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                        </SelectContent></Select>
                      </div>
                      <Button className="w-full mt-2" onClick={() => toast.success("Invitation sent!")}>Send Invitation</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Last Login</TableHead>
                    <TableHead className="w-10" />
                  </TableRow></TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                              {u.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div><p className="font-medium text-foreground">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className={roleColors[u.role] || ""}>
                            <Shield className="h-3 w-3 mr-1" />{u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === "active" ? "default" : "secondary"} className={u.status === "active" ? "bg-success/10 text-success border-0 hover:bg-success/20" : ""}>{u.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.last_login}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast.success("Edit role")}>Edit Role</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success("Password reset sent")}>Reset Password</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success(u.status === "active" ? "User deactivated" : "User activated")}>{u.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SMS Templates ── */}
        <TabsContent value="sms" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* SMS Settings Overview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />SMS Settings</CardTitle>
                <CardDescription>Configure when and how SMS notifications are sent to parents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">SMS Provider</span><span className="font-medium text-foreground">Africa's Talking</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sender ID</span><span className="font-medium text-foreground">CHUO_ACAD</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">SMS Balance</span><span className="font-medium text-success">2,450 units</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Active Templates</span><span className="font-medium text-foreground">{templates.filter(t => t.enabled).length} / {templates.length}</span></div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Send Test SMS</h4>
                  <p className="text-xs text-muted-foreground">Send a test SMS to verify your configuration works.</p>
                  <Input placeholder="0712345678" value={testPhone} onChange={e => setTestPhone(e.target.value)} className="h-9" />
                  <Button size="sm" className="w-full" onClick={sendTestSms}><Send className="h-3.5 w-3.5 mr-1.5" />Send Test</Button>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Available Placeholders</h4>
                  <p className="text-xs text-muted-foreground">Use these in your templates. They'll be replaced with actual values when sending.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["{student_name}", "{admission_no}", "{amount}", "{balance}", "{school_name}", "{date}", "{fee_name}", "{reference}", "{due_date}", "{grade}", "{payment_method}"].map(p => (
                      <Badge key={p} variant="secondary" className="text-[10px] font-mono cursor-pointer hover:bg-primary/10" onClick={() => { navigator.clipboard.writeText(p); toast.success(`Copied ${p}`); }}>{p}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Templates List */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Message Templates</CardTitle>
                    <CardDescription>Customize the SMS messages sent for each event</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.map(tpl => (
                  <div key={tpl.id} className={`rounded-lg border p-4 space-y-3 transition-colors ${tpl.enabled ? "bg-background" : "bg-muted/30 opacity-70"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground">{tpl.name}</h4>
                          <Badge variant="secondary" className="text-[10px] font-mono">{tpl.event}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tpl.message}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{tpl.message.length} characters · {Math.ceil(tpl.message.length / 160)} SMS page(s)</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={tpl.enabled} onCheckedChange={() => toggleTemplate(tpl.id)} />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditTemplate(tpl)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Edit Template Dialog */}
          <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5 text-primary" />Edit SMS Template</DialogTitle>
              </DialogHeader>
              {editingTemplate && (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger Event</Label>
                    <Input value={editingTemplate.event} disabled className="bg-muted/50 font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={5} className="font-mono text-xs" />
                    <p className="text-[10px] text-muted-foreground">{editMessage.length} characters · {Math.ceil(editMessage.length / 160)} SMS page(s) · Keep under 160 chars for 1 SMS</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Available Placeholders</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(smsPlaceholders[editingTemplate.event] || []).map(p => (
                        <Badge key={p} variant="secondary" className="text-[10px] font-mono cursor-pointer hover:bg-primary/10"
                          onClick={() => { setEditMessage(prev => prev + " " + p); }}>{p}</Badge>
                      ))}
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground">Preview</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {editMessage
                        .replace("{student_name}", "Amina Wanjiku")
                        .replace("{admission_no}", "ADM-2024-001")
                        .replace("{amount}", "15,000")
                        .replace("{balance}", "12,500")
                        .replace("{reference}", "SHQ2K4LM9X")
                        .replace("{payment_method}", "M-Pesa")
                        .replace("{school_name}", "Chuo Academy")
                        .replace("{fee_name}", "Tuition Fee")
                        .replace("{due_date}", "31 Jan 2024")
                        .replace("{date}", "15 Mar 2024")
                        .replace("{grade}", "Grade 8")
                        .replace("{days_overdue}", "15")
                      }
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                    <Button onClick={saveTemplate}><CheckCircle className="h-4 w-4 mr-1.5" />Save Template</Button>
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
