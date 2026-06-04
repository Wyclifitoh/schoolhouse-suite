import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useClasses, useStreams } from "@/hooks/useClasses";
import { useTerm } from "@/contexts/TermContext";

type PreviewRow = {
  student_id: string;
  admission_number: string;
  full_name: string;
  previous_term_balance: number;
  existing_brought_forward: number;
};

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

export default function BroughtForwardBalances() {
  const qc = useQueryClient();
  const { terms, selectedTerm, selectedAcademicYear } = useTerm();
  const { data: grades = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const { data: streams = [] } = useStreams(classId || undefined);
  const [streamId, setStreamId] = useState("");
  const [fromTermId, setFromTermId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  // Default "from term" to the most recent term before the selected term.
  useMemo(() => {
    if (fromTermId || !selectedTerm || !terms.length) return;
    const sorted = [...terms]
      .filter((t) => t.academic_year_id === selectedTerm.academic_year_id)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    const idx = sorted.findIndex((t) => t.id === selectedTerm.id);
    if (idx > 0) setFromTermId(sorted[idx - 1].id);
  }, [terms, selectedTerm, fromTermId]);

  const previewKey = ["bf-preview", classId, streamId, fromTermId, selectedTerm?.id];
  const enabled = !!classId && !!streamId && !!fromTermId && !!selectedTerm?.id;
  const { data: rows = [], isLoading, refetch } = useQuery<PreviewRow[]>({
    queryKey: previewKey,
    enabled,
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set("class_id", classId);
      p.set("stream_id", streamId);
      p.set("from_term_id", fromTermId);
      p.set("to_term_id", selectedTerm!.id);
      const r = await api.get<any>(`/finance/brought-forward/preview?${p}`);
      return (r?.data || r || []) as PreviewRow[];
    },
  });

  const applyMutation = useMutation({
    mutationFn: (entries: { student_id: string; amount: number }[]) =>
      api.post<any>("/finance/brought-forward/apply", {
        to_term_id: selectedTerm!.id,
        academic_year_id: selectedAcademicYear?.id || null,
        entries,
      }),
    onSuccess: (r: any) => {
      toast.success(`${(r?.data?.created || 0) + (r?.data?.updated || 0)} balances applied`);
      setEdits({});
      qc.invalidateQueries({ queryKey: previewKey });
      qc.invalidateQueries({ queryKey: ["student-fees-list"] });
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.admission_number?.toLowerCase().includes(q) ||
      r.full_name?.toLowerCase().includes(q)
    );
  });

  const amountFor = (r: PreviewRow) =>
    edits[r.student_id] !== undefined
      ? edits[r.student_id]
      : String(r.existing_brought_forward > 0 ? r.existing_brought_forward : r.previous_term_balance || 0);

  const handleSubmit = () => {
    const entries = filtered
      .map((r) => ({ student_id: r.student_id, amount: Number(amountFor(r) || 0) }))
      .filter((e) => e.amount > 0);
    if (!entries.length) return toast.error("Nothing to submit");
    if (!confirm(`Apply Previous Balance for ${entries.length} student(s) into ${selectedTerm?.name}?`)) return;
    applyMutation.mutate(entries);
  };

  return (
    <DashboardLayout
      title="Brought Forward Balances"
      subtitle="Carry student balances from a previous term into the current term using the protected Previous Balance fee structure"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-primary" /> Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Class</Label>
            <Select value={classId} onValueChange={(v) => { setClassId(v); setStreamId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {grades.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Stream</Label>
            <Select value={streamId} onValueChange={setStreamId} disabled={!classId}>
              <SelectTrigger><SelectValue placeholder="Select stream" /></SelectTrigger>
              <SelectContent>
                {streams.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From Term (source of balances)</Label>
            <Select value={fromTermId} onValueChange={setFromTermId}>
              <SelectTrigger><SelectValue placeholder="Select previous term" /></SelectTrigger>
              <SelectContent>
                {terms
                  .filter((t) => t.id !== selectedTerm?.id)
                  .map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To Term (active)</Label>
            <Input value={selectedTerm?.name || ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Students</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search admission / name"
                className="h-9 pl-8 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmit} disabled={!enabled || applyMutation.isPending || !filtered.length}>
              {applyMutation.isPending ? "Applying…" : "Submit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!enabled ? (
            <p className="text-sm text-muted-foreground">Select class, stream and source term to load students.</p>
          ) : isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No students found.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Previous Term Balance</TableHead>
                    <TableHead className="text-right">Existing B/F</TableHead>
                    <TableHead className="w-48">Amount to Carry Forward</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.student_id}>
                      <TableCell className="font-mono text-xs">{r.admission_number}</TableCell>
                      <TableCell>{r.full_name}</TableCell>
                      <TableCell className="text-right">{formatKES(r.previous_term_balance)}</TableCell>
                      <TableCell className="text-right">
                        {r.existing_brought_forward > 0 ? (
                          <Badge variant="secondary">{formatKES(r.existing_brought_forward)}</Badge>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={amountFor(r)}
                          onChange={(e) =>
                            setEdits((prev) => ({ ...prev, [r.student_id]: e.target.value }))
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}