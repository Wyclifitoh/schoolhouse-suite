import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useTerm } from "@/contexts/TermContext";

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalParents: number;
  totalStaff: number;
  totalRevenue: number;
  totalExpenses: number;
  totalOutstanding: number;
  collectionRate: number;
  attendanceRate: number;
  recentPayments: Array<{
    id: string;
    student_name: string;
    amount: number;
    payment_method: string;
    reference_number: string | null;
    received_at: string;
    status: string;
  }>;
}

export function useDashboardStats() {
  const { schoolId } = useSchool();
  const { selectedTerm } = useTerm();

  return useQuery({
    queryKey: ["dashboard-stats", schoolId, selectedTerm?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!schoolId) {
        return {
          totalStudents: 0, activeStudents: 0, totalParents: 0, totalStaff: 0,
          totalRevenue: 0, totalExpenses: 0, totalOutstanding: 0,
          collectionRate: 0, attendanceRate: 0, recentPayments: [],
        };
      }

      const [studentsRes, parentsRes, staffRes, paymentsRes, feesRes, expensesRes] = await Promise.all([
        supabase.from("students").select("id, status", { count: "exact" }).eq("school_id", schoolId),
        supabase.from("parents").select("id", { count: "exact" }).eq("school_id", schoolId),
        supabase.from("staff").select("id", { count: "exact" }).eq("school_id", schoolId).eq("status", "active"),
        supabase.from("payments").select("id, amount, payment_method, reference_number, received_at, status, student_id, students(full_name)")
          .eq("school_id", schoolId).eq("status", "completed").order("received_at", { ascending: false }).limit(10),
        supabase.from("student_fees").select("amount_due, amount_paid, balance, status")
          .eq("school_id", schoolId).not("status", "in", '("cancelled","waived")'),
        supabase.from("expenses").select("amount, status").eq("school_id", schoolId).eq("status", "paid"),
      ]);

      const students = studentsRes.data || [];
      const activeStudents = students.filter(s => s.status === "active").length;
      const fees = feesRes.data || [];
      const totalDue = fees.reduce((s, f) => s + (f.amount_due || 0), 0);
      const totalPaid = fees.reduce((s, f) => s + (f.amount_paid || 0), 0);
      const totalOutstanding = fees.reduce((s, f) => s + (f.balance || 0), 0);
      const totalExpenses = (expensesRes.data || []).reduce((s, e) => s + (e.amount || 0), 0);

      const recentPayments = (paymentsRes.data || []).map((p: any) => ({
        id: p.id,
        student_name: p.students?.full_name || "Unknown",
        amount: p.amount,
        payment_method: p.payment_method,
        reference_number: p.reference_number,
        received_at: p.received_at,
        status: p.status,
      }));

      return {
        totalStudents: studentsRes.count || students.length,
        activeStudents,
        totalParents: parentsRes.count || 0,
        totalStaff: staffRes.count || 0,
        totalRevenue: totalPaid,
        totalExpenses,
        totalOutstanding,
        collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0,
        attendanceRate: 95, // Will be computed from attendance table
        recentPayments,
      };
    },
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}
