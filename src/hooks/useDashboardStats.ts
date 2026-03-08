import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardStats {
  totalStudents: number; activeStudents: number; totalParents: number; totalStaff: number;
  totalRevenue: number; totalExpenses: number; totalOutstanding: number;
  collectionRate: number; attendanceRate: number;
  recentPayments: Array<{
    id: string; student_name: string; amount: number; payment_method: string;
    reference_number: string | null; received_at: string; status: string;
  }>;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/schools/dashboard-stats"),
    staleTime: 60_000,
  });
}
