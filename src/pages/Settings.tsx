import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

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

  return (
    <DashboardLayout title="Settings" subtitle="Manage school configuration and users">
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
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input defaultValue="Chuo Academy" />
                </div>
                <div className="space-y-2">
                  <Label>Registration Number</Label>
                  <Input defaultValue="SCH-2024-00142" disabled className="bg-muted/50" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email</Label>
                  <Input defaultValue="admin@chuoacademy.ac.ke" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone</Label>
                  <Input defaultValue="+254 712 345 678" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Address</Label>
                  <Input defaultValue="P.O. Box 1234, Nairobi" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-muted-foreground" /> Website</Label>
                  <Input defaultValue="https://chuoacademy.ac.ke" />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Preferences</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Send payment receipts and reminders via SMS</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Auto Fee Carry-Forward</p>
                    <p className="text-xs text-muted-foreground">Automatically carry unpaid balances to next term</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">M-Pesa Integration</p>
                    <p className="text-xs text-muted-foreground">Accept payments via M-Pesa STK push</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Academic Terms ── */}
        <TabsContent value="terms" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">Academic Terms</CardTitle>
                  <CardDescription>Configure school terms and academic calendar</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1.5" /> Add Term
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Academic Term</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Term Name</Label>
                        <Input placeholder="e.g. Term 1 2025" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input type="date" />
                        </div>
                      </div>
                      <Button className="w-full mt-2">Create Term</Button>
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
                      <TableHead className="font-semibold">Term</TableHead>
                      <TableHead className="font-semibold">Start Date</TableHead>
                      <TableHead className="font-semibold">End Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicTerms.map((term) => {
                      const cfg = termStatusConfig[term.status];
                      return (
                        <TableRow key={term.id} className="group">
                          <TableCell className="font-medium text-foreground">{term.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{term.start}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{term.end}</TableCell>
                          <TableCell>
                            <Badge variant="default" className={cfg.className}>{cfg.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit Term</DropdownMenuItem>
                                <DropdownMenuItem>Set as Active</DropdownMenuItem>
                                <DropdownMenuItem>Delete</DropdownMenuItem>
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
                <div>
                  <CardTitle className="text-base font-semibold">Staff & Users</CardTitle>
                  <CardDescription>Manage system users and their access roles</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1.5" /> Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Invite New User</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input placeholder="Full name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input placeholder="email@school.ac.ke" type="email" />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select>
                          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="accountant">Accountant</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="receptionist">Receptionist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full mt-2">Send Invitation</Button>
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
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Last Login</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                              {u.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className={roleColors[u.role] || ""}>
                            <Shield className="h-3 w-3 mr-1" />
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.status === "active" ? "default" : "secondary"}
                            className={u.status === "active" ? "bg-success/10 text-success border-0 hover:bg-success/20" : ""}
                          >
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.last_login}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Role</DropdownMenuItem>
                              <DropdownMenuItem>Reset Password</DropdownMenuItem>
                              <DropdownMenuItem>{u.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
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
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
