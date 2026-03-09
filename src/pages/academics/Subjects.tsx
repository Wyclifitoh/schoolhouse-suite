import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, Search, Edit, Trash2, FolderOpen, Users } from "lucide-react";
import { useSubjects, useSubjectAssignments } from "@/hooks/useClasses";
import { toast } from "sonner";
import { DialogFooter } from "@/components/ui/dialog";

const Subjects = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: subjectAssignments = [], isLoading: assignLoading } = useSubjectAssignments();

  const filteredSubjects = (subjects as any[]).filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="Subjects & Subject Groups" subtitle="Manage subjects and organize them into groups">
      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="subjects" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Subjects</TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5"><Users className="h-3.5 w-3.5" />Teacher Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold">All Subjects</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="pl-9 h-9 w-52" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                  <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" />Add Subject</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {subjectsLoading ? <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
              filteredSubjects.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No subjects found.</p> :
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold">Type</TableHead><TableHead className="font-semibold">Teachers</TableHead>
              </TableRow></TableHeader>
              <TableBody>{filteredSubjects.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{s.code}</Badge></TableCell>
                  <TableCell className="capitalize">{s.type || "Core"}</TableCell>
                  <TableCell>{(subjectAssignments as any[]).filter((a: any) => a.subject === s.name).length}</TableCell>
                </TableRow>
              ))}</TableBody></Table>}
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
              {assignLoading ? <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div> :
              (subjectAssignments as any[]).length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No assignments.</p> :
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold">Teacher</TableHead>
                <TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Section</TableHead>
              </TableRow></TableHeader>
              <TableBody>{(subjectAssignments as any[]).map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.subject}</TableCell>
                  <TableCell>{a.teacher}</TableCell>
                  <TableCell>{a.class}</TableCell>
                  <TableCell>{a.section}</TableCell>
                </TableRow>
              ))}</TableBody></Table>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Subjects;
