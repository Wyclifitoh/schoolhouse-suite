import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AlertTriangle, Search } from "lucide-react";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

export default function UnallocatedPayments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<any | null>(null);
  const [studentQuery, setStudentQuery] = useState("");

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["unallocated-payments"],
    queryFn: async () => {
      const r = await api.get<any>("/payments/unallocated");
      return (r?.data || r || []) as any[];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["student-search", studentQuery],
    queryFn: async () => {
      if (!studentQuery || studentQuery.length < 2) return [];
      const r = await api.get<any>(
        `/students?search=${encodeURIComponent(studentQuery)}&limit=10`,
      );
      return (r?.data || r || []) as any[];
    },
    enabled: !!active && studentQuery.length >= 2,
  });

  const reassign = useMutation({
    mutationFn: async ({
      paymentId,
      studentId,
    }: {
      paymentId: string;
      studentId: string;
    }) =>
      api.post(`/payments/${paymentId}/reassign`, { student_id: studentId }),
    onSuccess: () => {
      toast.success("Payment reassigned and allocated");
      qc.invalidateQueries({ queryKey: ["unallocated-payments"] });
      setActive(null);
      setStudentQuery("");
    },
    onError: (e: any) =>
      toast.error(e?.message || "Failed to reassign payment"),
  });

  const filtered = payments.filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(p.reference_number || "").toLowerCase().includes(s) ||
      String(p.admission_number_used || "").toLowerCase().includes(s) ||
      String(p.payer_phone || "").toLowerCase().includes(s)
    );
  });

  return (
    <DashboardLayout
      title="Unallocated Payments"
      subtitle="Payments received that did not match any student admission number"
    >
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Awaiting Review
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-7 h-8 text-sm"
              placeholder="Reference, admission, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Reference</TableHead>
                <TableHead className="text-xs">Admission Used</TableHead>
                <TableHead className="text-xs">Payer Phone</TableHead>
                <TableHead className="text-xs">Method</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs w-28">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No unallocated payments
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.received_at || p.created_at || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.reference_number || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.admission_number_used || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.payer_phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {p.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatKES(p.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          setActive(p);
                          setStudentQuery("");
                        }}
                      >
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Payment to Student</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <div className="rounded-md bg-muted/40 p-3 space-y-1">
                <div>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <strong>{formatKES(active.amount)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference:</span>{" "}
                  <span className="font-mono">
                    {active.reference_number || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Admission used:
                  </span>{" "}
                  {active.admission_number_used || "—"}
                </div>
              </div>
              <Input
                placeholder="Search student by name or admission number..."
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
              />
              <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
                {students.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    Type at least 2 characters to search students
                  </p>
                ) : (
                  students.map((s: any) => (
                    <button
                      key={s.id}
                      className="w-full text-left p-2 hover:bg-muted/50 text-sm"
                      onClick={() =>
                        reassign.mutate({
                          paymentId: active.id,
                          studentId: s.id,
                        })
                      }
                      disabled={reassign.isPending}
                    >
                      <div className="font-medium">
                        {s.full_name ||
                          `${s.first_name || ""} ${s.last_name || ""}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.admission_number} · {s.grade || ""} {s.stream || ""}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
