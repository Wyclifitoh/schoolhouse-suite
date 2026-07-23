import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MessageSquareText, Plus, Pencil, Trash2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermission";
import {
  useRemarkBands,
  useSaveRemarkBand,
  useDeleteRemarkBand,
  type RemarkBand,
} from "@/hooks/useRemarkBands";
import { useGrades } from "@/hooks/useGrades";
import { useAchievementLevels } from "@/hooks/useAssessments";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GRADES_844 } from "@/lib/grading844";


const LEVELS_844 = GRADES_844.map((g) => ({
  code: g.code,
  label: `${g.code} (${g.min}–${g.max}%)`,
}));

type Form = Partial<RemarkBand>;
const blank: Form = {
  min_pct: null,
  max_pct: null,
  remark: "",
  sort_order: 0,
  is_active: true,
};

export default function RemarkBandsPage() {
  const [curriculum, setCurriculum] = useState<"CBC" | "844">("CBC");
  const { data: bands = [] } = useRemarkBands();
  const { data: grades = [] } = useGrades();
  const { data: achievementLevels = [] } = useAchievementLevels();
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-flat"],
    queryFn: async () => {
      const r: any = await api.get("/assessments/subject-allocations");
      const list = (r?.data ?? r) || [];
      // dedupe by subject_id
      const seen = new Map();
      list.forEach((x: any) =>
        seen.set(x.subject_id, { id: x.subject_id, name: x.subject_name }),
      );
      return Array.from(seen.values());
    },
  });

  const save = useSaveRemarkBand();
  const remove = useDeleteRemarkBand();
  const p = usePermissions(["assessments:bands:manage"]);
  const [editing, setEditing] = useState<Form | null>(null);

  const close = () => setEditing(null);
  const onSave = async () => {
    if (!editing?.remark || !editing.level_code) return;
    await save.mutateAsync(editing as any);
    close();
  };

  const achievementLevelsOptions = (achievementLevels as any[]).map((l) => ({
    code: l.code,
    label: `${l.code} — ${l.band_code || ""}${
      l.description
        ? ` / ${l.description}`
        : ` (${Number(l.min_score)}–${Number(l.max_score)})`
    }`,
  }));

  const is844LevelCode = (code: string) =>
    LEVELS_844.some((g) => g.code === code);

  const custom844Levels = achievementLevelsOptions.filter((l) =>
    is844LevelCode(l.code),
  );
  const customCbcLevels = achievementLevelsOptions.filter(
    (l) => !is844LevelCode(l.code),
  );

  const cbcCodes = new Set(
    customCbcLevels.map((l) => l.code)
  );
  const codes844 = new Set(
    custom844Levels.length
      ? custom844Levels.map((l) => l.code)
      : LEVELS_844.map((l) => l.code),
  );

  const visibleBands = (bands as RemarkBand[]).filter((b) => {
    if (!b.level_code) return curriculum === "CBC"; // legacy %-based -> show under CBC
    return curriculum === "844"
      ? codes844.has(b.level_code)
      : cbcCodes.has(b.level_code);
  });

  const levelOptions = curriculum === "844"
    ? custom844Levels.length
      ? custom844Levels
      : LEVELS_844
    : customCbcLevels;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-end gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquareText className="h-7 w-7 text-primary" />
              Remark Templates
            </h1>
            <p className="text-muted-foreground">
              Configure auto-fill remarks per subject &amp; class. When a score
              is entered, the matching remark is suggested automatically.
            </p>
          </div>
          {p["assessments:bands:manage"] && (
            <Button
              onClick={() =>
                setEditing({ ...blank, level_code: levelOptions[0]?.code || "" })
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Add band
            </Button>
          )}
        </div>

        <Tabs value={curriculum} onValueChange={(v) => setCurriculum(v as any)}>
          <TabsList>
            <TabsTrigger value="CBC">CBC / CBE</TabsTrigger>
            <TabsTrigger value="844">8-4-4</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Configured bands</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="w-24">Level</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBands.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      {b.subject_name || (
                        <Badge variant="outline">All subjects</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.grade_name || (
                        <Badge variant="outline">All classes</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.level_code ? (
                        <Badge>{b.level_code}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {Number(b.min_pct).toFixed(0)}–
                          {Number(b.max_pct).toFixed(0)}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{b.remark}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing(b as any)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove.mutate(b.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!visibleBands.length && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No {curriculum} bands configured. Defaults are created on
                      first use.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit band" : "New remark band"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Subject
                  </label>
                  <Select
                    value={editing.subject_id || "_all"}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        subject_id: v === "_all" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All subjects</SelectItem>
                      {(subjects as any[]).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Class</label>
                  <Select
                    value={editing.grade_id || "_all"}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        grade_id: v === "_all" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All classes</SelectItem>
                      {(grades as any[]).map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">
                    Level / Grade
                  </label>
                  <Select
                    value={editing.level_code || ""}
                    onValueChange={(v) =>
                      setEditing({ ...editing, level_code: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Remark</label>
                <Textarea
                  value={editing.remark || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, remark: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={save.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
