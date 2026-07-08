import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type ModuleCode =
  | "assessments" | "finance" | "inventory" | "hr" | "communication" | "portal";

export interface Entitlements {
  status: "trial" | "active" | "past_due" | "locked" | "cancelled" | "free" | "unknown";
  billing_mode?: "per_student" | "module" | "free";
  cycle?: "monthly" | "termly" | "yearly";
  modules: ModuleCode[];
  all_modules?: ModuleCode[];
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  trialDaysLeft: number;
  active: boolean;
  free_tier?: boolean;
  price_per_student?: number;
  subscription_id?: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  billing_mode: "per_student" | "module" | "free";
  cycle: "monthly" | "termly" | "yearly";
  price_per_student: number;
  base_price: number;
  module_code: string | null;
  description: string | null;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "void";
  period_start: string | null;
  period_end: string | null;
  student_count: number | null;
  mpesa_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export function useEntitlements() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () => api.get<Entitlements>("/billing/subscription"),
    staleTime: 60_000,
    retry: 0,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => api.get<Plan[]>("/billing/plans"),
    staleTime: 5 * 60_000,
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: () => api.get<Invoice[]>("/billing/invoices"),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { plan_code: string; modules?: string[] }) =>
      api.post<{ invoice: Invoice; quote: any; periodEnd: string }>("/billing/checkout", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, reference }: { invoiceId: string; reference?: string }) =>
      api.post(`/billing/invoices/${invoiceId}/confirm`, { reference }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billing"] }),
  });
}
