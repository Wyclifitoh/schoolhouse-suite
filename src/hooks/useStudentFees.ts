import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/contexts/SchoolContext";

export interface StudentFeeRow {
  id: string;
  student_id: string;
  fee_template_id: string;
  term_id: string | null;
  academic_year_id: string | null;
  ledger_type: string;
  amount_due: number;
  amount_paid: number;
  discount_amount: number;
  fine_amount: number;
  brought_forward_amount: number;
  brought_forward_credit: number;
  balance: number | null;
  status: string;
  due_date: string | null;
  assigned_at: string;
  last_payment_at: string | null;
  fee_template?: {
    id: string;
    name: string;
    fee_type: string;
    amount: number;
  };
}

/**
 * Fetch all fees for a specific student with their fee template details.
 */
export function useStudentFees(studentId: string | undefined) {
  const schoolId = useSchoolId();

  return useQuery({
    queryKey: ["student-fees", studentId, schoolId],
    queryFn: async () => {
      if (!studentId) return [];

      let query = supabase
        .from("student_fees")
        .select(`
          *,
          fee_template:fee_templates(id, name, fee_type, amount)
        `)
        .eq("student_id", studentId)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (schoolId) {
        query = query.eq("school_id", schoolId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as StudentFeeRow[];
    },
    enabled: !!studentId,
    staleTime: 30_000,
  });
}

/**
 * Fetch student balance using the database function.
 */
export function useStudentBalance(studentId: string | undefined, ledgerType = "fees") {
  return useQuery({
    queryKey: ["student-balance", studentId, ledgerType],
    queryFn: async () => {
      if (!studentId) return 0;

      const { data, error } = await supabase.rpc("get_student_balance", {
        p_student_id: studentId,
        p_ledger_type: ledgerType,
      });

      if (error) throw error;
      return (data as number) || 0;
    },
    enabled: !!studentId,
    staleTime: 30_000,
  });
}

/**
 * Fetch all fees for the school (paginated).
 */
export function useAllStudentFees(options?: { page?: number; pageSize?: number; status?: string }) {
  const schoolId = useSchoolId();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ["all-student-fees", schoolId, page, pageSize, options?.status],
    queryFn: async () => {
      if (!schoolId) return { data: [], count: 0 };

      let query = supabase
        .from("student_fees")
        .select(`
          *,
          fee_template:fee_templates(id, name, fee_type),
          student:students(id, full_name, admission_number, grade)
        `, { count: "exact" })
        .eq("school_id", schoolId)
        .range(from, to)
        .order("created_at", { ascending: false });

      if (options?.status) {
        query = query.eq("status", options.status);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data || [], count: count || 0 };
    },
    enabled: !!schoolId,
    staleTime: 30_000,
  });
}
