/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSchool } from "@/contexts/SchoolContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Building2, Briefcase, Edit, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

type Form = { id?: string; name: string; description: string; is_active?: boolean };

export default function Departments() {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();

  const [deptOpen, setDeptOpen] = useState(false);
  const [desigOpen, setDesigOpen] = useState(false);
  const [deptForm, setDeptForm] = useState<Form>({ name: "", description: "" });
  const [desigForm, setDesigForm] = useState<Form>({ name: "", description: "" });

  useEffect(() => { if (schoolId) api.setSchoolId(schoolId); }, [schoolId]);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", schoolId],
    queryFn: () => api.get<any[]>("/departments"),
    enabled: !!schoolId,
  });

  const { data: designations = [] } = useQuery({
    queryKey: ["designations", schoolId],
    queryFn: () => api.get<any[]>("/designations"),
    enabled: !!schoolId,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff", schoolId],
    queryFn: () => api.get<any[]>("/staff"),
    enabled: !!schoolId,
  });

  const staffCounts = (staffList as any[]).reduce((acc: Record<string, number>, s: any) => {
    if (s.department_id) acc[s.department_id] = (acc[s.department_id] || 0) + 1;
    return acc;
  }, {});

  const saveDept = useMutation({
    mutationFn: () => deptForm.id
      ? api.put(`/departments/${deptForm.id}`, deptForm)
      : api.post("/departments", { ...deptForm, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDeptOpen(false);
      setDeptForm({ name: "", description: "" });
      toast({ title: deptForm.id ? "Department updated" : "Department added" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteDept = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({ title: "Department deactivated" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const saveDesig = useMutation({
    mutationFn: () => desigForm.id
      ? api.put(`/designations/${desigForm.id}`, desigForm)
      : api.post("/designations", { ...desigForm, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      setDesigOpen(false);
      setDesigForm({ name: "", description: "" });
      toast({ title: desigForm.id ? "Designation updated" : "Designation added" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openDept = (d?: any) => {
    setDeptForm(d ? { id: d.id, name: d.name, description: d.description || "", is_active: !!d.is_active } : { name: "", description: "" });
    setDeptOpen(true);
  };
  const openDesig = (d?: any) => {
    setDesigForm(d ? { id: d.id, name: d.name, description: d.description || "", is_active: !!d.is_active } : { name: "", description: "" });
    setDesigOpen(true);
  };

  return (
    <DashboardLayout title="Departments & Designations">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Departments & Designations</h1>
          <p className="text-muted-foreground">Organisational structure used for staff onboarding</p>
        </div>

        <Tabs defaultValue="departments">
          <TabsList>
            <TabsTrigger value="departments">
              <Building2 className="h-4 w-4 mr-2" />Departments ({departments.length})
            </TabsTrigger>
            <TabsTrigger value="designations">
              <Briefcase className="h-4 w-4 mr-2" />Designations ({designations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openDept()}>
                <Plus className="h-4 w-4 mr-2" />Add Department
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Staff</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No departments yet</TableCell></TableRow>
                    ) : departments.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-muted-foreground">{d.description || "—"}</TableCell>
                        <TableCell className="text-right">{staffCounts[d.id] || 0}</TableCell>
                        <TableCell>
                          <Badge variant={d.is_active ? "default" : "secondary"}>
                            {d.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openDept(d)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost"
                            onClick={() => { if (confirm(`Deactivate ${d.name}?`)) deleteDept.mutate(d.id); }}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="designations" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openDesig()}>
                <Plus className="h-4 w-4 mr-2" />Add Designation
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designations.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No designations yet</TableCell></TableRow>
                    ) : designations.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-muted-foreground">{d.description || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={d.is_active ? "default" : "secondary"}>
                            {d.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openDesig(d)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Department Dialog */}
        <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{deptForm.id ? "Edit" : "Add"} Department</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={deptForm.name}
                  onChange={(e) => setDeptForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={deptForm.description}
                  onChange={(e) => setDeptForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeptOpen(false)}>Cancel</Button>
                <Button onClick={() => saveDept.mutate()}
                  disabled={!deptForm.name || saveDept.isPending}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Designation Dialog */}
        <Dialog open={desigOpen} onOpenChange={setDesigOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{desigForm.id ? "Edit" : "Add"} Designation</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={desigForm.name}
                  onChange={(e) => setDesigForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={desigForm.description}
                  onChange={(e) => setDesigForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDesigOpen(false)}>Cancel</Button>
                <Button onClick={() => saveDesig.mutate()}
                  disabled={!desigForm.name || saveDesig.isPending}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
