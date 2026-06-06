import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTerm } from "@/contexts/TermContext";
import { toast } from "sonner";

export function useFeeTemplates() {
  return useQuery({
    queryKey: ["fee-templates"],
    queryFn: async () => {
      const r = await api.get<any>("/finance/fee-templates");
      return r?.rows || r?.data || r || [];
    },
  });
}
export function useFeeCategories() {
  return useQuery({
    queryKey: ["fee-categories"],
    queryFn: async () => {
      const d = await api.get<any>("/finance/fee-categories");
      return d?.data || d || [];
    },
  });
}
export function useFeeStructures() {
  return useQuery({
    queryKey: ["fee-structures"],
    queryFn: async () => {
      const d = await api.get<any>("/finance/fee-structures");
      return d?.data || d || [];
    },
  });
}
export function useFeeDiscounts() {
  return useQuery({
    queryKey: ["fee-discounts"],
    queryFn: async () => {
      const d = await api.get<any>("/finance/fee-discounts");
      return d?.data || d || [];
    },
  });
}
export function useStudentFeesList(search?: string) {
  const { selectedTerm } = useTerm();
  return useQuery({
    queryKey: ["student-fees-list", selectedTerm?.id, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedTerm?.id) params.set("term_id", selectedTerm.id);
      const data = await api.get<any[]>(`/finance/student-fees-list?${params}`);
      return (data || []).map((s: any) => ({
        id: s.id,
        student_id: s.id,
        student_name: s.full_name || `${s.first_name} ${s.last_name}`,
        admission_no: s.admission_number,
        class: `${s.grade || ""} ${s.stream || ""}`.trim(),
        total_fee: Number(s.total_fee || 0),
        discount: Number(s.discount || 0),
        fine: Number(s.fine || 0),
        paid: Number(s.paid || 0),
        balance: Number(s.balance || 0),
        status:
          Number(s.balance) <= 0
            ? Number(s.paid) > Number(s.total_fee)
              ? "advance"
              : "paid"
            : Number(s.paid) > 0
              ? "partial"
              : "pending",
      }));
    },
  });
}
export function usePayments(filters?: {
  status?: string;
  method?: string;
  search?: string;
}) {
  const { selectedTerm } = useTerm();
  return useQuery({
    queryKey: ["payments", selectedTerm?.id, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "all")
        params.set("status", filters.status);
      if (filters?.method && filters.method !== "all")
        params.set("method", filters.method);
      const r = await api.get<any>(`/payments?${params}`);
      return (r?.data || r || []).map((p: any) => ({
        ...p,
        student_name: p.student_name || "Unknown",
        admission_no: p.admission_number || "",
      }));
    },
  });
}
export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const d = await api.get<any>("/finance/expenses");
      return d?.data || d || [];
    },
  });
}
export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const d = await api.get<any>("/finance/expense-categories");
      return d?.data || d || [];
    },
  });
}
export function useCarryForwards() {
  return useQuery({
    queryKey: ["carry-forwards"],
    queryFn: async () => {
      const data = await api.get<any[]>("/finance/carry-forwards");
      return (data || []).map((cf: any) => ({
        ...cf,
        student_name: cf.student_name || "Unknown",
        from_term_name: cf.from_term_name || "N/A",
        to_term_name: cf.to_term_name || "N/A",
      }));
    },
  });
}

export function useFeeAssignments(
  feeStructureId: string | undefined,
  termId: string | undefined,
) {
  return useQuery({
    queryKey: ["fee-assignments", feeStructureId, termId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (feeStructureId) params.set("fee_structure_id", feeStructureId);
      if (termId) params.set("term_id", termId);
      const r = await api.get<any>(`/finance/fee-assignments?${params}`);
      return (r?.data || r || []) as Array<{
        id: string;
        student_id: string;
        amount_due: number;
        amount_paid: number;
        status: string;
      }>;
    },
    enabled: !!feeStructureId,
  });
}

export function useBulkAssignFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      fee_structure_id: string;
      term_id?: string | null;
      academic_year_id?: string | null;
      student_ids: string[];
      discount_amount?: number;
      scope?: { grade_ids?: string[]; stream_ids?: string[] };
    }) => api.post<any>("/finance/fee-assignments/bulk", body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["fee-assignments", vars.fee_structure_id],
      });
      qc.invalidateQueries({ queryKey: ["student-fees-list"] });
      toast.success("Fee assigned");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCloseTerm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { from_term_id: string; to_term_id: string }) =>
      api.post<any>("/finance/terms/close", body),
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ["student-fees-list"] });
      qc.invalidateQueries({ queryKey: ["carry-forwards"] });
      toast.success(`Term closed — ${d?.promoted ?? 0} students promoted`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkUnassignFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      fee_structure_id: string;
      term_id?: string | null;
      student_ids: string[];
      scope?: { grade_ids?: string[]; stream_ids?: string[] };
    }) => api.post<any>("/finance/fee-assignments/bulk-unassign", body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["fee-assignments", vars.fee_structure_id],
      });
      qc.invalidateQueries({ queryKey: ["student-fees-list"] });
      toast.success("Unassigned");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      student_id: string;
      amount: number;
      payment_method: string;
      reference_number?: string;
      fee_ids?: string[];
      notes?: string;
      term_id?: string | null;
      idempotency_key?: string;
    }) => {
      const idempotencyKey =
        body.idempotency_key ||
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      return api.post<any>("/payments/record", {
        ...body,
        idempotency_key: idempotencyKey,
      });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["student-payments", vars.student_id] });
      qc.invalidateQueries({
        queryKey: ["student-fee-items", vars.student_id],
      });
      qc.invalidateQueries({ queryKey: ["student-fees-list"] });
      qc.invalidateQueries({ queryKey: ["fee-assignments"] });
      toast.success("Payment recorded successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Phase 4 ----
export function useFinanceAuditLogs(filters?: { action?: string; studentId?: string; limit?: number }) {
  return useQuery({
    queryKey: ["finance-audit-logs", filters],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters?.action) p.set("action", filters.action);
      if (filters?.studentId) p.set("student_id", filters.studentId);
      if (filters?.limit) p.set("limit", String(filters.limit));
      const d = await api.get<any>(`/finance/audit-logs?${p}`);
      return d?.data || d || [];
    },
  });
}

export function useFeeAdjustments(status?: string) {
  return useQuery({
    queryKey: ["fee-adjustments", status],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (status) p.set("status", status);
      const d = await api.get<any>(`/finance/adjustments?${p}`);
      return d?.data || d || [];
    },
  });
}

export function useCreateFeeAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { student_fee_id: string; adjustment_type: string; amount: number; reason: string }) =>
      api.post<any>("/finance/adjustments", body),
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ["fee-adjustments"] });
      qc.invalidateQueries({ queryKey: ["student-fees-list"] });
      qc.invalidateQueries({ queryKey: ["student-fee-items"] });
      toast.success(d?.requires_approval ? "Adjustment submitted for approval" : "Adjustment applied");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDecideFeeAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, rejected_reason }: { id: string; decision: "approve" | "reject"; rejected_reason?: string }) =>
      api.post<any>(`/finance/adjustments/${id}/decision`, { decision, rejected_reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-adjustments"] });
      qc.invalidateQueries({ queryKey: ["student-fees-list"] });
      toast.success("Decision recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReconciliation(date?: string) {
  return useQuery({
    queryKey: ["reconciliation", date],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (date) p.set("date", date);
      const d = await api.get<any>(`/finance/reconciliation?${p}`);
      return d?.data || d;
    },
  });
}

export function useStudentExcessCredits(studentId?: string) {
  return useQuery({
    queryKey: ["excess-credits", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const p = new URLSearchParams();
      if (studentId) p.set("student_id", studentId);
      const d = await api.get<any>(`/finance/excess-credits?${p}`);
      return d?.data || d || [];
    },
  });
}
