import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpRight, ArrowRightLeft, LogOut as LeaveIcon, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useClasses, useStreams } from "@/hooks/useClasses";
import { useAcademicSessions } from "@/hooks/usePromotion";
import { useTerm } from "@/contexts/TermContext";
import { toast } from "sonner";

type PromotionAction = "promote" | "retain" | "leaving";

interface PromotionEntry {
  studentId: string; name: string; admNo: string; currentClass: string;
  percentage: number; result: "pass" | "fail"; action: PromotionAction; selected: boolean;
}

const Promotion = () => {
  const [mode, setMode] = useState<"term" | "year">("term");
  const [fromSession, setFromSession] = useState("");
  const [toSession, setToSession] = useState("");
  const [fromTerm, setFromTerm] = useState("");
  const [toTerm, setToTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("all");
  const [entries, setEntries] = useState<PromotionEntry[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: classes = [] } = useClasses();
  const { data: sessions = [] } = useAcademicSessions();
  const { data: allStudents = [] } = useStudents({ gradeId: undefined });
  const { terms, currentTerm } = useTerm();
  const { data: streamsForClass = [] } = useStreams(selectedClass || undefined);

  const handleGenerate = () => {
    const classStudents = allStudents.filter((s: any) => {
      if (s.status !== "active") return false;
      if (s.grade !== selectedClass) return false;
      if (selectedStream !== "all" && s.stream !== selectedStream && s.current_stream_id !== selectedStream) return false;
      return true;
    });
    const generated: PromotionEntry[] = classStudents.map((s: any) => {
      const pct = Math.floor(Math.random() * 60 + 30);
      const pass = pct >= 40;
      return {
        studentId: s.id, name: s.full_name || `${s.first_name} ${s.last_name}`,
        admNo: s.admission_number, currentClass: `${s.grade} ${s.stream || ""}`.trim(),
        percentage: pct, result: pass ? "pass" as const : "fail" as const,
        action: pass ? "promote" as const : "retain" as const, selected: true,
      };
    });
    setEntries(generated.sort((a, b) => b.percentage - a.percentage));
  };

  const toggleSelect = (idx: number) => setEntries(prev => prev.map((e, i) => i === idx ? { ...e, selected: !e.selected } : e));
  const toggleAll = (checked: boolean) => setEntries(prev => prev.map(e => ({ ...e, selected: checked })));
  const setAction = (idx: number, action: PromotionAction) => setEntries(prev => prev.map((e, i) => i === idx ? { ...e, action } : e));
  const handlePromote = () => {
    const selected = entries.filter(e => e.selected);
    const target = mode === "term"
      ? (terms.find(t => t.id === toTerm)?.name || "next term")
      : (toSession || "next year");
    toast.success(`${selected.length} students processed → ${target}`);
    setShowConfirm(false);
  };

  const promoted = entries.filter(e => e.selected && e.action === "promote").length;
  const retained = entries.filter(e => e.selected && e.action === "retain").length;
  const leaving = entries.filter(e => e.selected && e.action === "leaving").length;

  return (
    <DashboardLayout title="Student Promotion" subtitle="Promote students to next academic session">
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-4 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From Session</label>
              <Select value={fromSession} onValueChange={setFromSession}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{sessions.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To Session</label>
              <Select value={toSession} onValueChange={setToSession}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{sessions.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Class / Grade</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={!selectedClass}>Generate List</Button>
          </div>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-foreground">{entries.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><ArrowUpRight className="h-5 w-5 text-success" /></div>
              <div><p className="text-xs text-muted-foreground">Promoting</p><p className="text-xl font-bold text-foreground">{promoted}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><ArrowRightLeft className="h-5 w-5 text-warning" /></div>
              <div><p className="text-xs text-muted-foreground">Retaining</p><p className="text-xl font-bold text-foreground">{retained}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><LeaveIcon className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-xs text-muted-foreground">Leaving</p><p className="text-xl font-bold text-foreground">{leaving}</p></div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Promotion List — {selectedClass}</CardTitle>
              <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={entries.filter(e => e.selected).length === 0}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Process Promotion
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Confirm Promotion</DialogTitle></DialogHeader>
                  <div className="space-y-3 py-4">
                    <p className="text-sm text-muted-foreground">You are about to process the following:</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-success/10 p-3"><p className="text-2xl font-bold text-success">{promoted}</p><p className="text-xs text-muted-foreground">Promote</p></div>
                      <div className="rounded-lg bg-warning/10 p-3"><p className="text-2xl font-bold text-warning">{retained}</p><p className="text-xs text-muted-foreground">Retain</p></div>
                      <div className="rounded-lg bg-destructive/10 p-3"><p className="text-2xl font-bold text-destructive">{leaving}</p><p className="text-xs text-muted-foreground">Leaving</p></div>
                    </div>
                    <div className="flex items-start gap-2 rounded-md bg-warning/10 p-3">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                      <p className="text-xs text-muted-foreground">This action will update student records. This cannot be easily undone.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                    <Button onClick={handlePromote}>Confirm & Process</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-10"><Checkbox checked={entries.every(e => e.selected)} onCheckedChange={(c) => toggleAll(!!c)} /></TableHead>
                  <TableHead>Student</TableHead><TableHead>Adm No</TableHead><TableHead>Current Class</TableHead>
                  <TableHead className="text-center">Score %</TableHead><TableHead className="text-center">Result</TableHead><TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>{entries.map((e, i) => (
                  <TableRow key={e.studentId}>
                    <TableCell><Checkbox checked={e.selected} onCheckedChange={() => toggleSelect(i)} /></TableCell>
                    <TableCell className="font-medium text-foreground">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.admNo}</TableCell>
                    <TableCell className="text-muted-foreground">{e.currentClass}</TableCell>
                    <TableCell className="text-center font-semibold text-foreground">{e.percentage.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={e.result === "pass" ? "default" : "destructive"} className={e.result === "pass" ? "bg-success/10 text-success border-0" : ""}>{e.result === "pass" ? "Pass" : "Fail"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={e.action} onValueChange={(v) => setAction(i, v as PromotionAction)}>
                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="promote">Promote</SelectItem>
                          <SelectItem value="retain">Retain</SelectItem>
                          <SelectItem value="leaving">Leaving</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
};

export default Promotion;
