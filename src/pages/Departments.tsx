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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermission";

type Form = {
  id?: string;
  name: string;
  description: string;
  is_active?: boolean;
};

export default function Departments() {
  const { currentSchool } = useSchool();
  const schoolId = currentSchool?.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>({ name: "", description: "" });
  const p = usePermissions(["staff:create", "staff:update", "staff:delete"]);

  useEffect(() => {
    if (schoolId) api.setSchoolId(schoolId);
  }, [schoolId]);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", schoolId],
    queryFn: () => api.get<any[]>("/departments"),
    enabled: !!schoolId,
  });
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff", schoolId],
    queryFn: () => api.get<any[]>("/staff"),
    enabled: !!schoolId,
  });

  const staffCounts = (staffList as any[]).reduce(
    (acc: Record<string, number>, s: any) => {
      if (s.department_id)
        acc[s.department_id] = (acc[s.department_id] || 0) + 1;
      return acc;
    },
    {},
  );

  const save = useMutation({
    mutationFn: () =>
      form.id
        ? api.put(`/departments/${form.id}`, form)
        : api.post("/departments", { ...form, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setOpen(false);
      setForm({ name: "", description: "" });
      toast({ title: form.id ? "Department updated" : "Department added" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({ title: "Department deactivated" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const openEdit = (d?: any) => {
    setForm(
      d
        ? {
            id: d.id,
            name: d.name,
            description: d.description || "",
            is_active: !!d.is_active,
          }
        : { name: "", description: "" },
    );
    setOpen(true);
  };

  return (
    <DashboardLayout
      title="Departments"
      subtitle="Organisational structure used for staff onboarding"
    >
      <div className="flex justify-end mb-4">
        {p["staff:create"] && (
          <Button size="sm" onClick={() => openEdit()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        )}
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
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No departments yet
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {staffCounts[d.id] || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.is_active ? "default" : "secondary"}>
                        {d.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {p["staff:update"] && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(d)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {p["staff:delete"] && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Deactivate ${d.name}?`))
                              remove.mutate(d.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit" : "Add"} Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => save.mutate()}
                disabled={!form.name || save.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
