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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
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
import { Check, X, Trash2, Plus, Package, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

export default function InKindPayments() {
  const { schoolId } = useSchool();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"supplier_offset" | "parent_goods">(
    "supplier_offset",
  );
  const [open, setOpen] = useState(false);

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
    mutationFn: (id: string) => api.post(`/in-kind-payments/${id}/approve`, {}),
    onSuccess: () => {
      toast.success("Approved & posted");
      qc.invalidateQueries({ queryKey: ["in-kind"] });
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
            <TabsTrigger value="supplier_offset">Supplier Offset</TabsTrigger>
            <TabsTrigger value="parent_goods">Parent Goods</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Records</CardTitle>
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
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-6"
                        >
                          No records
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((r: any) => (
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
                                  onClick={() => approveMut.mutate(r.id)}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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
  const [studentOpen, setStudentOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("");
  const [value, setValue] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!desc || !value) return toast.error("Description and value required");
    if (kind === "supplier_offset" && !supplierId)
      return toast.error("Select supplier");
    if (!studentId) return toast.error("Select the student fees to credit");
    onSave({
      supplier_id: supplierId || null,
      student_id: studentId,
      goods_description: desc,
      quantity: Number(qty) || 1,
      unit,
      assessed_value: Number(value),
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
        <Popover open={studentOpen} onOpenChange={setStudentOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between font-normal",
                !studentId && "text-muted-foreground",
              )}
            >
              {studentId
                ? (() => {
                    const s = students.find((x: any) => x.id === studentId);
                    return s
                      ? `${s.full_name} (${s.admission_number})`
                      : "Select student";
                  })()
                : "Select student"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command
              filter={(value, search) =>
                value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
              }
            >
              <CommandInput placeholder="Search by name or admission #..." />
              <CommandList>
                <CommandEmpty>No students found.</CommandEmpty>
                <CommandGroup>
                  {students.map((s: any) => {
                    const label = `${s.full_name} ${s.admission_number} ${s.grade || ""} ${s.stream || ""}`;
                    return (
                      <CommandItem
                        key={s.id}
                        value={label}
                        onSelect={() => {
                          setStudentId(s.id);
                          setStudentOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            studentId === s.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="flex-1 truncate">{s.full_name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {s.admission_number}
                          {s.grade ? ` · ${s.grade}` : ""}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label>Goods / Services *</Label>
        <Textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="bags, hrs..."
          />
        </div>
        <div className="space-y-2">
          <Label>Assessed Value (KES) *</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
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
