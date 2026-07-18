import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, AlertTriangle } from "lucide-react";
import {
  PaperType,
  useSubjectPapers,
  useUpdateSubjectConfig,
  useSavePaperTemplate,
} from "@/hooks/useSubjectPapers";
import { Badge } from "@/components/ui/badge";

interface Props {
  subject: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAPER_TYPES: PaperType[] = ["THEORY", "PRACTICAL", "ORAL", "PROJECT"];

interface PaperRow {
  name: string;
  code: string;
  paper_type: PaperType;
  max_marks: number;
  contribution_pct: number;
}

const DEFAULT_ROWS: PaperRow[] = [
  { name: "Paper 1", code: "P1", paper_type: "THEORY", max_marks: 100, contribution_pct: 50 },
  { name: "Paper 2", code: "P2", paper_type: "THEORY", max_marks: 100, contribution_pct: 50 },
  { name: "Paper 3 (Practical)", code: "P3", paper_type: "PRACTICAL", max_marks: 80, contribution_pct: 0 },
];

export default function SubjectPapersDialog({ subject, open, onOpenChange }: Props) {
  const subjectId = subject?.id || "";
  const { data: papers = [] } = useSubjectPapers(subjectId);
  const saveConfig = useUpdateSubjectConfig(subjectId);
  const saveTemplate = useSavePaperTemplate(subjectId);

  const [hasPapers, setHasPapers] = useState<boolean>(false);
  const [paperCount, setPaperCount] = useState<1 | 2 | 3>(2);
  const [rows, setRows] = useState<PaperRow[]>(DEFAULT_ROWS);

  useEffect(() => {
    if (!subject) return;
    setHasPapers(!!subject.has_papers);
  }, [subject]);

  useEffect(() => {
    if (!papers.length) {
      setRows(DEFAULT_ROWS);
      setPaperCount(2);
      return;
    }
    const sorted = [...papers].sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0),
    );
    const mapped: PaperRow[] = DEFAULT_ROWS.map((d, i) => {
      const p = sorted[i];
      if (!p) return d;
      return {
        name: p.name,
        code: p.code || d.code,
        paper_type: p.paper_type as PaperType,
        max_marks: Number(p.max_marks) || d.max_marks,
        contribution_pct: Number(p.contribution_pct) || 0,
      };
    });
    setRows(mapped);
    setPaperCount(Math.min(Math.max(sorted.length, 1), 3) as 1 | 2 | 3);
  }, [papers]);

  const active = rows.slice(0, paperCount);
  const totalContribution = active.reduce(
    (s, r) => s + (Number(r.contribution_pct) || 0),
    0,
  );
  const contribValid = Math.abs(totalContribution - 100) < 0.01;

  const saveAll = async () => {
    await saveConfig.mutateAsync({
      curriculum_type: "844",
      has_papers: hasPapers ? 1 : 0,
      calculation_type: "GENERAL",
      calculation_config: null,
    });
    if (hasPapers) {
      await saveTemplate.mutateAsync(active);
    }
    onOpenChange(false);
  };

  const updateRow = (i: number, patch: Partial<PaperRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Paper Template — {subject?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">This subject has papers</Label>
              <p className="text-xs text-muted-foreground">
                Turn on for subjects that are examined via multiple papers
                (e.g. Math P1/P2, Biology P1/P2/Practical). Each new assessment
                inherits this template as its default.
              </p>
            </div>
            <Switch checked={hasPapers} onCheckedChange={setHasPapers} />
          </div>

          {hasPapers && (
            <>
              <div className="flex items-center gap-3">
                <Label className="text-sm">Number of papers</Label>
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <Button
                      key={n}
                      variant={paperCount === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaperCount(n as 1 | 2 | 3)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Total contribution:
                  </span>
                  <Badge
                    variant={contribValid ? "default" : "destructive"}
                    className="font-mono"
                  >
                    {totalContribution}%
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <div className="col-span-4">Paper</div>
                  <div className="col-span-3">Type</div>
                  <div className="col-span-2 text-right">Out Of</div>
                  <div className="col-span-3 text-right">Contribution %</div>
                </div>
                {active.map((r, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-t"
                  >
                    <div className="col-span-4">
                      <Input
                        value={r.name}
                        onChange={(e) => updateRow(i, { name: e.target.value })}
                        placeholder={`Paper ${i + 1}`}
                      />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={r.paper_type}
                        onValueChange={(v) =>
                          updateRow(i, { paper_type: v as PaperType })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAPER_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        className="text-right"
                        value={r.max_marks}
                        onChange={(e) =>
                          updateRow(i, { max_marks: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        className="text-right"
                        value={r.contribution_pct}
                        onChange={(e) =>
                          updateRow(i, {
                            contribution_pct: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {!contribValid && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  Contributions should add up to 100%. The engine will still
                  compute correctly by normalising, but a clean 100% keeps
                  reports easy to read.
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={saveAll}
            disabled={saveConfig.isPending || saveTemplate.isPending}
          >
            {saveConfig.isPending || saveTemplate.isPending
              ? "Saving…"
              : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}