import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subjects, subjectAssignments } from "@/data/mockData";
import { BookOpen, Plus, Search, Edit, Trash2, FolderOpen, Users } from "lucide-react";
import { toast } from "sonner";

const subjectGroups = [
  { id: "sg1", name: "Core Subjects", subjects: ["Mathematics", "English", "Kiswahili", "Science"], classes: "All Grades" },
  { id: "sg2", name: "Humanities", subjects: ["Social Studies", "CRE", "History"], classes: "Grade 7-8" },
  { id: "sg3", name: "Creative Arts", subjects: ["Art & Craft", "Music", "PE"], classes: "All Grades" },
  { id: "sg4", name: "Languages", subjects: ["English", "Kiswahili", "French"], classes: "All Grades" },
];

const Subjects = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="Subjects & Subject Groups" subtitle="Manage subjects and organize them into groups">
      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="subjects" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Subjects</TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5"><FolderOpen className="h-3.5 w-3.5" />Subject Groups</TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5"><Users className="h-3.5 w-3.5" />Teacher Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold">All Subjects</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="pl-9 h-9 w-52" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Dialog open={showAdd} onOpenChange={setShowAdd}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Subject</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
                      <div className="grid gap-4 py-2">
                        <div className="space-y-2"><Label>Subject Name *</Label><Input placeholder="e.g. Mathematics" /></div>
                        <div className="space-y-2"><Label>Subject Code</Label><Input placeholder="e.g. MATH" /></div>
                        <div className="space-y-2"><Label>Type</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="core">Core</SelectItem>
                              <SelectItem value="elective">Elective</SelectItem>
                              <SelectItem value="co-curricular">Co-Curricular</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                        <Button onClick={() => { toast.success("Subject added"); setShowAdd(false); }}>Add Subject</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Teachers</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredSubjects.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.code}</Badge></TableCell>
                      <TableCell className="capitalize">{s.type || "Core"}</TableCell>
                      <TableCell>{subjectAssignments.filter(a => a.subject === s.name).length}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Subject Groups</CardTitle>
                <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Group</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Subject Group</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                      <div className="space-y-2"><Label>Group Name *</Label><Input placeholder="e.g. Sciences" /></div>
                      <div className="space-y-2"><Label>Description</Label><Input placeholder="Group description" /></div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddGroup(false)}>Cancel</Button>
                      <Button onClick={() => { toast.success("Group added"); setShowAddGroup(false); }}>Add Group</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Group Name</TableHead>
                  <TableHead className="font-semibold">Subjects</TableHead>
                  <TableHead className="font-semibold">Applicable Classes</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {subjectGroups.map(g => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{g.subjects.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div></TableCell>
                      <TableCell>{g.classes}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Teacher-Subject Assignments</CardTitle>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Assign Teacher</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold">Teacher</TableHead>
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Section</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {subjectAssignments.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.subject}</TableCell>
                      <TableCell>{a.teacher}</TableCell>
                      <TableCell>{a.class}</TableCell>
                      <TableCell>{a.section}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm"><Edit className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Subjects;
