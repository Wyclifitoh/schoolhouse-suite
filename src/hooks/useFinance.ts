import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTerm } from "@/contexts/TermContext";

export function useFeeTemplates() {
  return useQuery({ queryKey: ["fee-templates"], queryFn: async () => { const r = await api.get<any>("/finance/fee-templates"); return r?.rows || r?.data || r || []; } });
}
export function useFeeCategories() {
  return useQuery({ queryKey: ["fee-categories"], queryFn: async () => { const d = await api.get<any>("/finance/fee-categories"); return d?.data || d || []; } });
}
export function useFeeStructures() {
  return useQuery({ queryKey: ["fee-structures"], queryFn: async () => { const d = await api.get<any>("/finance/fee-structures"); return d?.data || d || []; } });
}
export function useFeeDiscounts() {
  return useQuery({ queryKey: ["fee-discounts"], queryFn: async () => { const d = await api.get<any>("/finance/fee-discounts"); return d?.data || d || []; } });
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
        id: s.id, student_id: s.id,
        student_name: s.full_name || `${s.first_name} ${s.last_name}`,
        admission_no: s.admission_number,
        class: `${s.grade || ""} ${s.stream || ""}`.trim(),
        total_fee: Number(s.total_fee || 0), discount: Number(s.discount || 0),
        fine: Number(s.fine || 0), paid: Number(s.paid || 0), balance: Number(s.balance || 0),
        status: Number(s.balance) <= 0 ? (Number(s.paid) > Number(s.total_fee) ? "advance" : "paid") : Number(s.paid) > 0 ? "partial" : "pending",
      }));
    },
  });
}
export function usePayments(filters?: { status?: string; method?: string; search?: string }) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "all") params.set("status", filters.status);
      if (filters?.method && filters.method !== "all") params.set("method", filters.method);
      const r = await api.get<any>(`/payments?${params}`);
      return (r?.data || r || []).map((p: any) => ({ ...p, student_name: p.student_name || "Unknown", admission_no: p.admission_number || "" }));
    },
  });
}
export function useExpenses() {
  return useQuery({ queryKey: ["expenses"], queryFn: async () => { const d = await api.get<any>("/finance/expenses"); return d?.data || d || []; } });
}
export function useExpenseCategories() {
  return useQuery({ queryKey: ["expense-categories"], queryFn: async () => { const d = await api.get<any>("/finance/expense-categories"); return d?.data || d || []; } });
}
export function useCarryForwards() {
  return useQuery({
    queryKey: ["carry-forwards"],
    queryFn: async () => {
      const data = await api.get<any[]>("/finance/carry-forwards");
      return (data || []).map((cf: any) => ({ ...cf, student_name: cf.student_name || "Unknown", from_term_name: cf.from_term_name || "N/A", to_term_name: cf.to_term_name || "N/A" }));
    },
  });
}
