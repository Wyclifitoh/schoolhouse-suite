/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSchool } from "@/contexts/SchoolContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useStudents } from "@/hooks/useStudents";
import {
  Check,
  X,
  Trash2,
  Plus,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { formatDate } from "@/utils/date";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ApproveInKindDialog } from "@/components/finance/ApproveInKindDialog";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

export default function InKindPayments() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"supplier_offset" | "parent_goods">(
    "supplier_offset",
  );
  const [open, setOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: records = [] } = useQuery({
    queryKey: ["in-kind", schoolId, tab],
    queryFn: () => api.get<any[]>(`/in-kind-payments?kind=${tab}`),
    enabled: !!schoolId,
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", schoolId],
    queryFn: () => api.get<any[]>(`/inventory/suppliers`),
    enabled: !!schoolId && tab === "supplier_offset",
  });
  const { data: students = [] } = useStudents({ enabled: !!schoolId });

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return (records as any[]).filter((r) =>
      [
        r.student_name,
        r.admission_number,
        r.supplier_name,
        r.goods_description,
        r.reference,
        r.notes,
      ]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q)),
    );
  }, [records, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Reset to first page when the tab or search changes
  const resetPage = () => setPage(1);

  const createMut = useMutation({
    mutationFn: (body: any) => api.post(`/in-kind-payments`, body),
    onSuccess: () => {
      toast.success("Recorded — pending approval");
      qc.invalidateQueries({ queryKey: ["in-kind"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const approveMut = useMutation({
    mutationFn: ({ id, ...body }: any) =>
      api.post(`/in-kind-payments/${id}/approve`, body),
    onSuccess: () => {
      toast.success("Approved — ledger, voucher & acknowledgement posted");
      qc.invalidateQueries({ queryKey: ["in-kind"] });
      setApproveTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const rejectMut = useMutation({
    mutationFn: (id: string) =>
      api.post(`/in-kind-payments/${id}/reject`, { reason: "Rejected" }),
    onSuccess: () => {
      toast.success("Rejected");
      qc.invalidateQueries({ queryKey: ["in-kind"] });
    },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/in-kind-payments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["in-kind"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-7 w-7" /> Payment in Kind
            </h1>
            <p className="text-muted-foreground">
              Record goods/services as fee payments
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New In-Kind Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Record In-Kind Payment</DialogTitle>
              </DialogHeader>
              <InKindForm
                kind={tab}
                suppliers={suppliers}
                students={students}
                onSave={(d: any) => createMut.mutate({ ...d, kind: tab })}
                onClose={() => setOpen(false)}
                saving={createMut.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="supplier_offset" onClick={resetPage}>
              Supplier Offset
            </TabsTrigger>
            <TabsTrigger value="parent_goods" onClick={resetPage}>
              Parent Goods
            </TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Records ({filtered.length})</CardTitle>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student, supplier, ref, item…"
                      className="pl-9 h-9"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>
                        {tab === "supplier_offset" ? "Supplier" : "Student"}
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-6"
                        >
                          {search ? "No matches for your search" : "No records"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell>{formatDate(r.created_at)}</TableCell>
                          <TableCell>
                            {tab === "supplier_offset"
                              ? r.supplier_name
                              : r.student_name}
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate">
                            {r.goods_description}
                          </TableCell>
                          <TableCell>
                            {r.quantity} {r.unit || ""}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatKES(r.assessed_value)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                r.approval_status === "approved"
                                  ? "default"
                                  : r.approval_status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {r.approval_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {r.approval_status === "pending" && (
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setApproveTarget(r)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectMut.mutate(r.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => delMut.mutate(r.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {filtered.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-4 flex-col sm:flex-row gap-2">
                    <p className="text-xs text-muted-foreground">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                      {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                      {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </Button>
                      <span className="text-xs">
                        Page {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ApproveInKindDialog
        record={approveTarget}
        open={!!approveTarget}
        onOpenChange={(o) => !o && setApproveTarget(null)}
        isPending={approveMut.isPending}
        onConfirm={(payload) =>
          approveMut.mutate({ id: approveTarget.id, ...payload })
        }
      />
    </DashboardLayout>
  );
}

function InKindForm({
  kind,
  suppliers,
  students,
  onSave,
  onClose,
  saving,
}: any) {
  const [supplierId, setSupplierId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<any[]>([
    { description: "", quantity: "1", unit: "", unit_value: "" },
  ]);

  const lineTotal = (l: any) =>
    Math.round(Number(l.quantity || 0) * Number(l.unit_value || 0) * 100) / 100;
  const total = lines.reduce((s, l) => s + lineTotal(l), 0);
  const setLine = (i: number, patch: any) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const submit = () => {
    const items = lines
      .filter((l) => l.description.trim() && lineTotal(l) > 0)
      .map((l) => ({
        description: l.description.trim(),
        quantity: Number(l.quantity) || 1,
        unit: l.unit || null,
        unit_value: Number(l.unit_value) || 0,
        total_value: lineTotal(l),
      }));
    if (!items.length)
      return toast.error("Add at least one item with a description and value");
    if (kind === "supplier_offset" && !supplierId)
      return toast.error("Select supplier");
    if (!studentId) return toast.error("Select the student fees to credit");
    onSave({
      supplier_id: supplierId || null,
      student_id: studentId,
      items,
      reference,
      notes,
    });
  };

  return (
    <div className="grid gap-4 py-2">
      {kind === "supplier_offset" && (
        <div className="space-y-2">
          <Label>Supplier *</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label>Student (fees credited) *</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger>
            <SelectValue placeholder="Select student" />
          </SelectTrigger>
          <SelectContent>
            {students.slice(0, 200).map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name} ({s.admission_number})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Items provided *</Label>
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <Input
              className="col-span-4"
              placeholder="Item / service"
              value={l.description}
              onChange={(e) => setLine(i, { description: e.target.value })}
            />
            <Input
              className="col-span-2"
              type="number"
              min={0}
              placeholder="Qty"
              value={l.quantity}
              onChange={(e) => setLine(i, { quantity: e.target.value })}
            />
            <Input
              className="col-span-2"
              placeholder="Unit"
              value={l.unit}
              onChange={(e) => setLine(i, { unit: e.target.value })}
            />
            <Input
              className="col-span-3"
              type="number"
              min={0}
              placeholder="Unit value"
              value={l.unit_value}
              onChange={(e) => setLine(i, { unit_value: e.target.value })}
            />
            <Button
              variant="ghost"
              size="sm"
              className="col-span-1"
              onClick={() => setLines(lines.filter((_, j) => j !== i))}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="col-span-12 text-right text-xs text-muted-foreground">
              Line value: KES {lineTotal(l).toLocaleString()}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setLines([
                ...lines,
                { description: "", quantity: "1", unit: "", unit_value: "" },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Add item
          </Button>
          <div className="text-sm font-medium">
            Total assessed value: KES {total.toLocaleString()}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Reference</Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}
