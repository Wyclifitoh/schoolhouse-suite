import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useTerm } from "@/contexts/TermContext";

export function useFeeTemplates() {
  const { schoolId } = useSchool();
  return useQuery({
    queryKey: ["fee-templates", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("fee_templates")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .order("priority", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });
}

export function useFeeCategories() {
  const { schoolId } = useSchool();
  return useQuery({
    queryKey: ["fee-categories", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("fee_categories")
        .select("*")
        .eq("school_id", schoolId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });
}

export function useFeeStructures() {
  const { schoolId } = useSchool();
  return useQuery({
    queryKey: ["fee-structures", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*, fee_category:fee_categories(name, type), grade:grades(name)")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });
}

export function useFeeDiscounts() {
  const { schoolId } = useSchool();
  return useQuery({
    queryKey: ["fee-discounts", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("fee_discounts")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .order("priority");
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });
}

export function useStudentFeesList(search?: string) {
  const { schoolId } = useSchool();
  const { selectedTerm } = useTerm();

  return useQuery({
    queryKey: ["student-fees-list", schoolId, selectedTerm?.id, search],
    queryFn: async () => {
      if (!schoolId) return [];

      let query = supabase
        .from("students")
        .select(`
          id, first_name, last_name, full_name, admission_number, grade, stream, status,
          student_fees(id, amount_due, amount_paid, balance, status, fee_template_id, term_id, discount_amount, fine_amount)
        `)
        .eq("school_id", schoolId)
        .eq("status", "active");

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;

      return (data || []).map((s: any) => {
        const fees = (s.student_fees || []).filter((f: any) =>
          !selectedTerm?.id || f.term_id === selectedTerm.id
        );
        const total_fee = fees.reduce((sum: number, f: any) => sum + (f.amount_due || 0), 0);
        const discount = fees.reduce((sum: number, f: any) => sum + (f.discount_amount || 0), 0);
        const fine = fees.reduce((sum: number, f: any) => sum + (f.fine_amount || 0), 0);
        const paid = fees.reduce((sum: number, f: any) => sum + (f.amount_paid || 0), 0);
        const balance = fees.reduce((sum: number, f: any) => sum + (f.balance || 0), 0);

        return {
          id: s.id,
          student_id: s.id,
          student_name: s.full_name || `${s.first_name} ${s.last_name}`,
          admission_no: s.admission_number,
          class: `${s.grade || ""} ${s.stream || ""}`.trim(),
          total_fee,
          discount,
          fine,
          paid,
          balance,
          status: balance <= 0 ? (paid > total_fee ? "advance" : "paid") : paid > 0 ? "partial" : balance > 0 ? "overdue" : "pending",
        };
      });
    },
    enabled: !!schoolId,
  });
}

export function usePayments(filters?: { status?: string; method?: string; search?: string }) {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["payments", schoolId, filters],
    queryFn: async () => {
      if (!schoolId) return [];
      let query = supabase
        .from("payments")
        .select("*, students(full_name, admission_number)")
        .eq("school_id", schoolId)
        .order("received_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.method && filters.method !== "all") {
        query = query.eq("payment_method", filters.method);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;

      return (data || []).map((p: any) => ({
        ...p,
        student_name: p.students?.full_name || "Unknown",
        admission_no: p.students?.admission_number || "",
      }));
    },
    enabled: !!schoolId,
  });
}

export function useExpenses() {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["expenses", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*, category:expense_categories(name)")
        .eq("school_id", schoolId)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        category_name: e.category?.name || "Uncategorized",
      }));
    },
    enabled: !!schoolId,
  });
}

export function useExpenseCategories() {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["expense-categories", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("school_id", schoolId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });
}

export function useCarryForwards() {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["carry-forwards", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("fee_carry_forwards")
        .select("*, student:students(full_name), from_term:terms!fee_carry_forwards_from_term_id_fkey(name), to_term:terms!fee_carry_forwards_to_term_id_fkey(name)")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((cf: any) => ({
        ...cf,
        student_name: cf.student?.full_name || "Unknown",
        from_term_name: cf.from_term?.name || "N/A",
        to_term_name: cf.to_term?.name || "N/A",
      }));
    },
    enabled: !!schoolId,
  });
}
