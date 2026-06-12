import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudents } from "@/hooks/useStudents";
import { useFeeDiscounts, useFeeStructures } from "@/hooks/useFinance";
import { useClasses, useStreams } from "@/hooks/useClasses";
import { useTerm } from "@/contexts/TermContext";
import {
  Percent,
  Users,
  Search,
  CheckCircle,
  Trash2,
  CheckCheck,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";

const fmt = (n: number) => `KES ${Math.abs(n).toLocaleString()}`;

const FeeDiscounts = () => {
  const qc = useQueryClient();
  const { selectedTerm, currentAcademicYear } = useTerm();
  const { data: discounts = [] } = useFeeDiscounts();
  const { data: feeStructures = [] } = useFeeStructures();
  const { data: classes = [] } = useClasses();

  const [discountId, setDiscountId] = useState("");
  const [structureId, setStructureId] = useState<string>("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [streamFilter, setStreamFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: streams = [] } = useStreams(gradeFilter || undefined);

  const { data: studentsData = [], isLoading: studentsLoading } = useStudents({
    enabled: !!gradeFilter,
    gradeId: gradeFilter || undefined,
    streamIds: streamFilter ? [streamFilter] : undefined,
    search: search || undefined,
  });

  const { data: applied = [] } = useQuery({
    queryKey: ["applied-discounts", selectedTerm?.id, discountId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTerm?.id) params.set("term_id", selectedTerm.id);
      if (discountId) params.set("discount_id", discountId);
      const r = await api.get<any>(`/finance/applied-discounts?${params}`);
      return (r?.data || r || []) as any[];
    },
  });

  // Map of student_id → applied row (filtered by discount+structure+term)
  const assignedMap = useMemo(() => {
    const m = new Map<string, any>();
    (applied as any[]).forEach((a) => {
      if (a.discount_id !== discountId) return;
      if (structureId && a.fee_structure_id !== structureId) return;
      if (selectedTerm?.id && a.term_id && a.term_id !== selectedTerm.id)
        return;
      m.set(a.student_id, a);
    });
    return m;
  }, [applied, discountId, structureId, selectedTerm?.id]);

  const apply = useMutation({
    mutationFn: (body: any) =>
      api.post<any>("/finance/applied-discounts", body),
    onSuccess: (r: any) => {
      toast.success(
        `Applied: ${r?.data?.applied || r?.applied || 0} · Skipped: ${r?.data?.skipped || r?.skipped || 0}`,
      );
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["applied-discounts"] });
      qc.invalidateQueries({ queryKey: ["student-fee-items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) =>
      api.delete<any>(`/finance/applied-discounts/${id}`),
    onSuccess: () => {
      toast.success("Revoked");
      qc.invalidateQueries({ queryKey: ["applied-discounts"] });
      qc.invalidateQueries({ queryKey: ["student-fee-items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkRevoke = useMutation({
    mutationFn: (student_ids: string[]) =>
      api.post<any>("/finance/applied-discounts/bulk-revoke", {
        discount_id: discountId,
        fee_structure_id: structureId || null,
        term_id: selectedTerm?.id || null,
        student_ids,
      }),
    onSuccess: (r: any) => {
      toast.success(`Unassigned ${r?.data?.revoked ?? r?.revoked ?? 0}`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["applied-discounts"] });
      qc.invalidateQueries({ queryKey: ["student-fee-items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedDiscount = useMemo(
    () => (discounts as any[]).find((d) => d.id === discountId),
    [discounts, discountId],
  );

  const allStudents = (studentsData as any[]).map((s: any) => ({
    id: s.id,
    full_name: s.full_name || `${s.first_name} ${s.last_name}`,
    admission_no: s.admission_number,
    grade: s.grade || "",
    stream: s.stream || "",
  }));

  const toggle = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAll = () => {
    const ids = allStudents.map((s) => s.id);
    setSelected(ids.every((i) => selected.has(i)) ? new Set() : new Set(ids));
  };

  const selectedArr = Array.from(selected);
  const selectedAssigned = selectedArr.filter((id) => assignedMap.has(id));
  const selectedUnassigned = selectedArr.filter((id) => !assignedMap.has(id));

  const handleApply = () => {
    if (!discountId) return toast.error("Pick a discount");
    if (!structureId)
      return toast.error("Pick the fee this discount applies to");
    if (!selectedUnassigned.length)
      return toast.error("No unassigned students selected");
    apply.mutate({
      discount_id: discountId,
      fee_structure_id: structureId,
      term_id: selectedTerm?.id || null,
      academic_year_id: currentAcademicYear?.id || null,
      student_ids: selectedUnassigned,
    });
  };

  const handleUnassign = () => {
    if (!discountId) return toast.error("Pick a discount");
    if (!selectedAssigned.length)
      return toast.error("No assigned students selected");
    if (
      !confirm(`Unassign discount from ${selectedAssigned.length} student(s)?`)
    )
      return;
    bulkRevoke.mutate(selectedAssigned);
  };

  return (
    <DashboardLayout
      title="Fee Discounts"
      subtitle="Apply discounts to specific students — independent of fee assignment"
    >
      {selectedTerm && (
        <div className="mb-3 text-xs text-muted-foreground">
          Term: <strong className="text-foreground">{selectedTerm.name}</strong>
        </div>
      )}

      <Tabs defaultValue="apply" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto gap-1">
          <TabsTrigger value="apply" className="gap-1.5">
            <Percent className="h-3.5 w-3.5" />
            Apply Discount
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Applied Discounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                Choose Discount
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(discounts as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No discounts configured. Add one under Finance → Fee
                  Discounts.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(discounts as any[]).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDiscountId(d.id)}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        discountId === d.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="font-semibold text-foreground text-sm block">
                        {d.name}
                      </span>
                      <p className="text-sm font-bold text-success mt-1">
                        {d.type === "percentage"
                          ? `${d.value}% off`
                          : `${fmt(d.value)} off`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className={
              !discountId
                ? "opacity-50 pointer-events-none"
                : "border-primary/20"
            }
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </div>
                Scope (Required)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Apply To Fee Structure *</Label>
                  <Select
                    value={structureId}
                    onValueChange={(v) => setStructureId(v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select fee (e.g. Tuition)" />
                    </SelectTrigger>
                    <SelectContent>
                      {(feeStructures as any[]).map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} · {fmt(Number(f.amount || 0))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Discount is applied to this fee only (e.g. Tuition). It will
                    not affect Transport, Meals, or other fees.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              !discountId || !structureId
                ? "opacity-50 pointer-events-none"
                : "border-primary/20"
            }
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </div>
                  Select Students
                  {selected.size > 0 && (
                    <Badge className="bg-primary/10 text-primary border-0 ml-2">
                      {selected.size} selected
                    </Badge>
                  )}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  <Users className="h-3.5 w-3.5 mr-1" />
                  Select All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label className="text-xs">Class *</Label>
                  <Select
                    value={gradeFilter}
                    onValueChange={(v) => {
                      setGradeFilter(v);
                      setStreamFilter("");
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {(classes as any[]).map((g: any) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Stream</Label>
                  <Select
                    value={streamFilter || "all"}
                    onValueChange={(v) => setStreamFilter(v === "all" ? "" : v)}
                    disabled={!gradeFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All streams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All streams</SelectItem>
                      {(streams as any[]).map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Name or admission no..."
                      className="pl-8 h-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {discountId && (
                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3 text-success" />
                    {assignedMap.size} student(s) currently assigned this
                    discount
                  </Badge>
                  {selected.size > 0 && (
                    <>
                      <Badge variant="outline">{selected.size} selected</Badge>
                      <Badge variant="outline">
                        {selectedAssigned.length} assigned
                      </Badge>
                      <Badge variant="outline">
                        {selectedUnassigned.length} unassigned
                      </Badge>
                    </>
                  )}
                </div>
              )}

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            allStudents.length > 0 &&
                            allStudents.every((s) => selected.has(s.id))
                          }
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Stream</TableHead>
                      <TableHead className="w-28">Discount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!gradeFilter ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Select a class to load students
                        </TableCell>
                      </TableRow>
                    ) : studentsLoading ? (
                      [1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : allStudents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No students match filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      allStudents.map((s) => {
                        const isAssigned = assignedMap.has(s.id);
                        return (
                          <TableRow
                            key={s.id}
                            className={`cursor-pointer ${selected.has(s.id) ? "bg-primary/5" : ""}`}
                            onClick={() => toggle(s.id)}
                          >
                            <TableCell>
                              <Checkbox checked={selected.has(s.id)} />
                            </TableCell>
                            <TableCell className="font-medium">
                              {s.full_name}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground text-sm">
                              {s.admission_no}
                            </TableCell>
                            <TableCell>{s.grade}</TableCell>
                            <TableCell>{s.stream}</TableCell>
                            <TableCell>
                              {isAssigned ? (
                                <Badge className="bg-success/10 text-success border-0 gap-1">
                                  <CheckCircle className="h-3 w-3" /> Assigned
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {discountId && selected.size > 0 && (
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">Bulk Actions</h3>
                  <p className="text-sm text-muted-foreground">
                    Discount <strong>{selectedDiscount?.name}</strong> →{" "}
                    {selectedUnassigned.length} to assign ·{" "}
                    {selectedAssigned.length} to unassign
                    {structureId && (
                      <>
                        {" "}
                        on{" "}
                        <strong>
                          {
                            (feeStructures as any[]).find(
                              (f) => f.id === structureId,
                            )?.name
                          }
                        </strong>
                      </>
                    )}
                  </p>
                </div>
                <PermissionGate permission="finance:fees:waive">
                  <div className="flex gap-2">
                    {selectedAssigned.length > 0 && (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleUnassign}
                        disabled={bulkRevoke.isPending}
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        {bulkRevoke.isPending
                          ? "Unassigning..."
                          : `Unassign (${selectedAssigned.length})`}
                      </Button>
                    )}
                    {selectedUnassigned.length > 0 && (
                      <Button
                        size="lg"
                        onClick={handleApply}
                        disabled={apply.isPending || !structureId}
                      >
                        <CheckCheck className="h-4 w-4 mr-1.5" />
                        {apply.isPending
                          ? "Applying..."
                          : `Assign (${selectedUnassigned.length})`}
                      </Button>
                    )}
                  </div>
                </PermissionGate>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Applied Discounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Student</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(applied as any[]).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No discounts applied yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      (applied as any[]).map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.student_name}{" "}
                            <span className="text-xs text-muted-foreground ml-1 font-mono">
                              {r.admission_number}
                            </span>
                          </TableCell>
                          <TableCell>
                            {r.discount_name}{" "}
                            <Badge
                              variant="secondary"
                              className="ml-1 text-[10px]"
                            >
                              {r.discount_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {r.fee_structure_name || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{r.term_name || "—"}</TableCell>
                          <TableCell className="text-right font-semibold text-success">
                            {fmt(Number(r.amount || 0))}
                          </TableCell>
                          <TableCell>
                            <PermissionGate permission="finance:fees:waive">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => revoke.mutate(r.id)}
                                disabled={revoke.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </PermissionGate>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default FeeDiscounts;
