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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Layers } from "lucide-react";
import {
  CalculationType,
  PaperType,
  useDeletePaper,
  useSavePaper,
  useSubjectPapers,
  useUpdateSubjectConfig,
} from "@/hooks/useSubjectPapers";

interface Props {
  subject: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CALC_TYPES: { value: CalculationType; label: string; help: string }[] = [
  { value: "GENERAL", label: "General", help: "Sum of papers ÷ total max × 100" },
  { value: "SCIENCE", label: "Science (Theory + Practical)", help: "Theory scaled to 60, practical added out of 40" },
  { value: "LANGUAGE", label: "Language (Weighted)", help: "Weighted sum across papers" },
  { value: "CUSTOM", label: "Custom", help: "Reserved for future formulas (behaves as General)" },
];

const PAPER_TYPES: PaperType[] = ["THEORY", "PRACTICAL", "ORAL", "PROJECT"];

export default function SubjectPapersDialog({ subject, open, onOpenChange }: Props) {
  const subjectId = subject?.id || "";
  const { data: papers = [] } = useSubjectPapers(subjectId);
  const savePaper = useSavePaper(subjectId);
  const deletePaper = useDeletePaper(subjectId);
  const saveConfig = useUpdateSubjectConfig(subjectId);

  const [hasPapers, setHasPapers] = useState<boolean>(false);
  const [calcType, setCalcType] = useState<CalculationType>("GENERAL");
  const [theoryWeight, setTheoryWeight] = useState<number>(60);
  const [practicalWeight, setPracticalWeight] = useState<number>(40);

  const [draft, setDraft] = useState({
    name: "Paper 1",
    code: "P1",
    paper_type: "THEORY" as PaperType,
    max_marks: 100,
  });

  useEffect(() => {
    if (!subject) return;
    setHasPapers(!!subject.has_papers);
    setCalcType((subject.calculation_type as CalculationType) || "GENERAL");
    const cfg =
      typeof subject.calculation_config === "string"
        ? safeParse(subject.calculation_config)
        : subject.calculation_config || {};
    setTheoryWeight(Number(cfg?.theoryWeight ?? 60));
    setPracticalWeight(Number(cfg?.practicalWeight ?? 40));
  }, [subject]);

  const saveAll = async () => {
    await saveConfig.mutateAsync({
      curriculum_type: "844",
      has_papers: hasPapers ? 1 : 0,
      calculation_type: calcType,
      calculation_config:
        calcType === "SCIENCE"
          ? { theoryWeight, practicalWeight }
          : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            8-4-4 Paper Structure — {subject?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Enable Paper Structure</Label>
              <p className="text-xs text-muted-foreground">
                Turn on for 8-4-4 subjects that have multiple papers (e.g. Math P1/P2, Bio Practical).
              </p>
            </div>
            <Switch checked={hasPapers} onCheckedChange={setHasPapers} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Calculation Method</Label>
              <Select value={calcType} onValueChange={(v) => setCalcType(v as CalculationType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CALC_TYPES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {CALC_TYPES.find((c) => c.value === calcType)?.help}
              </p>
            </div>
            {calcType === "SCIENCE" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Theory Weight</Label>
                  <Input
                    type="number"
                    value={theoryWeight}
                    onChange={(e) => setTheoryWeight(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Practical Weight</Label>
                  <Input
                    type="number"
                    value={practicalWeight}
                    onChange={(e) => setPracticalWeight(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          {hasPapers && (
            <div className="rounded-lg border">
              <div className="flex items-center justify-between p-3 border-b">
                <h4 className="text-sm font-semibold">Papers</h4>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">Code</TableHead>
                    <TableHead className="w-32">Type</TableHead>
                    <TableHead className="w-24 text-right">Max</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {papers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.code || "—"}</TableCell>
                      <TableCell>{p.paper_type}</TableCell>
                      <TableCell className="text-right">{Number(p.max_marks)}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deletePaper.mutate(p.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>
                      <Input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.code}
                        onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={draft.paper_type}
                        onValueChange={(v) => setDraft({ ...draft, paper_type: v as PaperType })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAPER_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="text-right"
                        value={draft.max_marks}
                        onChange={(e) =>
                          setDraft({ ...draft, max_marks: Number(e.target.value) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (!draft.name) return;
                          savePaper.mutate({
                            ...draft,
                            display_order: papers.length,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={saveAll} disabled={saveConfig.isPending}>
            {saveConfig.isPending ? "Saving…" : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}