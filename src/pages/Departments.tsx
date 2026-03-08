import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Building2, Briefcase, Edit } from "lucide-react";

export default function Departments() {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isDesigOpen, setIsDesigOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", description: "" });
  const [desigForm, setDesigForm] = useState({ name: "", description: "" });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("departments").select("*").eq("school_id", schoolId).order("name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: designations = [] } = useQuery({
    queryKey: ["designations", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("designations").select("*").eq("school_id", schoolId).order("name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: staffCounts = {} } = useQuery({
    queryKey: ["staff-dept-counts", schoolId],
    queryFn: async () => {
      if (!schoolId) return {};
      const { data } = await supabase.from("staff").select("department_id").eq("school_id", schoolId).eq("status", "active");
      const counts: Record<string, number> = {};
      data?.forEach((s: any) => { if (s.department_id) counts[s.department_id] = (counts[s.department_id] || 0) + 1; });
      return counts;
    },
    enabled: !!schoolId,
  });

  const addDeptMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("No school");
      const { error } = await supabase.from("departments").insert({ school_id: schoolId, name: deptForm.name, description: deptForm.description || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsDeptOpen(false);
      setDeptForm({ name: "", description: "" });
      toast({ title: "Department added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addDesigMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("No school");
      const { error } = await supabase.from("designations").insert({ school_id: schoolId, name: desigForm.name, description: desigForm.description || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      setIsDesigOpen(false);
      setDesigForm({ name: "", description: "" });
      toast({ title: "Designation added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <DashboardLayout title="Departments & Designations">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments & Designations</h1>
          <p className="text-muted-foreground">Manage organizational structure</p>
        </div>

        <Tabs defaultValue="departments">
          <TabsList>
            <TabsTrigger value="departments"><Building2 className="h-4 w-4 mr-2" />Departments ({departments.length})</TabsTrigger>
            <TabsTrigger value="designations"><Briefcase className="h-4 w-4 mr-2" />Designations ({designations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Dialog open={isDeptOpen} onOpenChange={setIsDeptOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Department</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Name *</Label><Input value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>Description</Label><Textarea value={deptForm.description} onChange={e => setDeptForm(p => ({ ...p, description: e.target.value }))} /></div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDeptOpen(false)}>Cancel</Button>
                      <Button onClick={() => addDeptMutation.mutate()} disabled={!deptForm.name || addDeptMutation.isPending}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Staff Count</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept: any) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell className="text-muted-foreground">{dept.description || "—"}</TableCell>
                        <TableCell>{(staffCounts as any)[dept.id] || 0}</TableCell>
                        <TableCell><Badge variant={dept.is_active ? "default" : "secondary"}>{dept.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="designations" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Dialog open={isDesigOpen} onOpenChange={setIsDesigOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Designation</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Designation</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Name *</Label><Input value={desigForm.name} onChange={e => setDesigForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>Description</Label><Textarea value={desigForm.description} onChange={e => setDesigForm(p => ({ ...p, description: e.target.value }))} /></div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDesigOpen(false)}>Cancel</Button>
                      <Button onClick={() => addDesigMutation.mutate()} disabled={!desigForm.name || addDesigMutation.isPending}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designations.map((desig: any) => (
                      <TableRow key={desig.id}>
                        <TableCell className="font-medium">{desig.name}</TableCell>
                        <TableCell className="text-muted-foreground">{desig.description || "—"}</TableCell>
                        <TableCell><Badge variant={desig.is_active ? "default" : "secondary"}>{desig.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
