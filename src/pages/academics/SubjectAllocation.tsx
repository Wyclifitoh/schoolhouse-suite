import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, Save, BookOpen } from "lucide-react";
import { useClasses, useSubjects } from "@/hooks/useClasses";
import {
  useSubjectAllocations,
  useAllocateSubjects,
} from "@/hooks/useAssessments";

const SubjectAllocation = () => {
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const [gradeId, setGradeId] = useState<string>("");
  const { data: allocations = [], isLoading } = useSubjectAllocations(gradeId);
  const allocate = useAllocateSubjects();

  const allocatedIds = useMemo(
    () => new Set(allocations.map((a) => a.subject_id)),
    [allocations],
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // sync selected whenever allocations change
  useMemo(() => setSelected(new Set(allocatedIds)), [allocations.length, gradeId]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleSave = () => {
    if (!gradeId) return;
    allocate.mutate({ grade_id: gradeId, subject_ids: Array.from(selected) });
  };

  const activeSubjects = (subjects as any[]).filter(
    (s) => (s.status ?? "active") === "active",
  );

  return (
    <DashboardLayout
      title="Subject Allocation"
      subtitle="Assign subjects to each class. Drives assessments, marks entry, reports & timetables."
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Layers className="h-4 w-4 text-primary" /> Allocate by Class
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={gradeId} onValueChange={setGradeId}>
                <SelectTrigger className="w-56 h-9">
                  <SelectValue placeholder="Select a class…" />
                </SelectTrigger>
                <SelectContent>
                  {(classes as any[]).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!gradeId || allocate.isPending}
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Allocation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!gradeId ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Pick a class to allocate subjects.
            </p>
          ) : classesLoading || isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activeSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No active subjects. Add subjects first.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {activeSubjects.map((s: any) => {
                const checked = selected.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition ${
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(s.id)}
                    />
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.code || "—"}
                      </div>
                    </div>
                    {s.category && (
                      <Badge variant="outline" className="text-xs">
                        {s.category}
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default SubjectAllocation;
