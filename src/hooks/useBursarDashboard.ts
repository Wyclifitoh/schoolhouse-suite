import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface BursarOverview {
  period: { year_id: string; year_label: string; term_id: string; term_number: number } | null;
  kpis: {
    collected_term: number;
    collected_today: number;
    expenses_term: number;
    surplus_term: number;
    unallocated_payments: number;
    outstanding_arrears: number;
    bank_balance_total: number;
  };
  bank_accounts: Array<{ id: string; name: string; bank_name: string; balance: number }>;
  pending_approvals: { expenses: number; vouchers: number; purchase_orders: number };
}
export interface TrendPoint { date: string; collections: number; expenses: number }
export interface VoteHeadSpend { id: string; code: string; name: string; actual: number }
export interface RecentReceipt {
  id: string; receipt_number: string; amount: number; payment_method: string;
  payment_date: string; admission_number: string | null; student_name: string | null;
}

export const useBursarOverview = () =>
  useQuery({ queryKey: ["bursar-dashboard", "overview"],
    queryFn: () => api.get<BursarOverview>("/bursar-dashboard/overview") });

export const useBursarTrend = (days = 30) =>
  useQuery({ queryKey: ["bursar-dashboard", "trend", days],
    queryFn: () => api.get<TrendPoint[]>(`/bursar-dashboard/trend?days=${days}`) });

export const useTopVoteHeads = () =>
  useQuery({ queryKey: ["bursar-dashboard", "top-vote-heads"],
    queryFn: () => api.get<VoteHeadSpend[]>("/bursar-dashboard/top-vote-heads") });

export const useRecentReceipts = () =>
  useQuery({ queryKey: ["bursar-dashboard", "recent-receipts"],
    queryFn: () => api.get<RecentReceipt[]>("/bursar-dashboard/recent-receipts") });