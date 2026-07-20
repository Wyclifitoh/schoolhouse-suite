import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { platformApi } from "@/lib/platformApi";

// ---- Stub exports for pages under construction (Admin Analytics, Feature Flags,
// SMS Ops, Support). These preserve type-safety at call sites without executing
// real requests until the corresponding endpoints ship.
const stubQuery = <T,>(fallback: T) => (..._args: any[]) =>
  useQuery({ queryKey: ["pf-stub", Math.random()], queryFn: async () => fallback, enabled: false });
const stubMutation = () => (..._args: any[]) =>
  useMutation({ mutationFn: async (_: any) => ({}) as any });

export const useAnalyticsMrr = stubQuery<any[]>([]);
export const useAnalyticsCohorts = stubQuery<any[]>([]);
export const useAnalyticsTrialConversion = stubQuery<any>({});
export const useAnalyticsChurn = stubQuery<any[]>([]);
export const useAnalyticsPlanDistribution = stubQuery<any[]>([]);

export const KNOWN_MODULES: string[] = [];
export const useAllEntitlements = stubQuery<any[]>([]);
export const useSetSchoolEntitlements = stubMutation();
export const useBulkEntitlements = stubMutation();
export interface EntitlementRow {
  school_id: string;
  module?: string;
  modules?: any;
  name?: string;
  enabled?: boolean;
  [k: string]: any;
}

export const useExternalTopupSms = stubMutation();
export const useRetrySms = stubMutation();
export const useSetSmsAccount = stubMutation();
export const useSmsMessages = stubQuery<any[]>([]);
export const useSmsOverview = stubQuery<any>({});
export const useSmsSchoolBalances = stubQuery<any[]>([]);
export interface SmsSchoolBalance {
  school_id: string;
  balance?: number;
  sms_user_id?: string | null;
  sms_paybill_account?: string | null;
  name?: string | null;
  [k: string]: any;
}

export const useSupportStats = stubQuery<any>({});
export const useSupportTickets = stubQuery<any[]>([]);
export const useTicket = stubQuery<any>({});
export const useCreateTicket = stubMutation();
export const useUpdateTicket = stubMutation();
export const useAddTicketMessage = stubMutation();
export interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  sla_due_at?: string | null;
  [k: string]: any;
}
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export interface OverviewStats {
  totals: { total_schools: number; active_schools: number; total_students: number; total_users: number };
  subscriptions: Record<string, number>;
  revenue: { collected: number; pending: number; mtd_paid: number; mtd_pending: number };
  trialsEndingSoon: Array<{ id: string; name: string; trial_ends_at: string }>;
  signups30d: Array<{ d: string; c: number }>;
}

export interface SchoolRow {
  id: string; name: string; code: string | null; email: string | null; phone: string | null;
  is_active: 0 | 1; created_at: string;
  sub_status: string | null; billing_mode: string | null; cycle: string | null;
  trial_ends_at: string | null; current_period_end: string | null;
  price_per_student: number | null; plan_name: string | null; plan_code: string | null;
  active_students: number; staff_count: number; user_count: number;
  lifetime_paid: number; pending_amount: number;
}

export interface Invoice {
  id: string; school_id: string; school_name?: string; amount: number; currency: string;
  status: "pending" | "paid" | "failed" | "void";
  period_start: string | null; period_end: string | null; student_count: number | null;
  mpesa_reference: string | null; paid_at: string | null; created_at: string;
}

export interface PlatformPlan {
  id: string; code: string; name: string;
  billing_mode: "per_student" | "module" | "free" | "flat";
  cycle: "monthly" | "termly" | "yearly";
  price_per_student: number; base_price: number;
  module_code: string | null; description: string | null;
  min_students: number | null; max_students: number | null;
  is_active: 0 | 1;
}

export interface AssessmentBillingRow {
  id: string; school_id: string; assessment_id: string; assessment_name: string | null;
  student_count: number; price_per_student: number; total_amount: number;
  status: "pending" | "paid" | "waived"; created_at: string;
}

export const useOverview = () => useQuery({ queryKey: ["pf","overview"], queryFn: () => platformApi.get<OverviewStats>("/overview"), staleTime: 30_000 });

export const useSchools = (params: { search?: string; status?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  const s = qs.toString();
  return useQuery({ queryKey: ["pf","schools", params], queryFn: () => platformApi.get<SchoolRow[]>(`/schools${s ? `?${s}` : ""}`) });
};

export const useSchoolDetail = (id: string | undefined) =>
  useQuery({ enabled: !!id, queryKey: ["pf","school", id], queryFn: () => platformApi.get<any>(`/schools/${id}`) });

export const useCreateSchool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; email?: string; phone?: string; address?: string; curriculum_type?: string; code?: string; trial_days?: number; admin_name?: string; admin_email?: string; admin_password?: string; logo_base64?: string }) =>
      platformApi.post("/schools", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf","schools"] }),
  });
};

export const useExtendTrial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      platformApi.post(`/schools/${id}/extend-trial`, { days }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useTerminateTrial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi.post(`/schools/${id}/terminate-trial`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useSetSubStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      platformApi.post(`/schools/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useSetSchoolActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      platformApi.post(`/schools/${id}/active`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useActivateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; plan_code?: string; plan_id?: string; period_start?: string; period_end?: string; modules?: string[] }) =>
      platformApi.post(`/schools/${id}/activate-subscription`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; amount: number; period_start: string; period_end: string; student_count?: number | null; mark_paid?: boolean; mpesa_reference?: string }) =>
      platformApi.post<Invoice>(`/schools/${id}/invoices`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useAllInvoices = (status?: string) =>
  useQuery({ queryKey: ["pf","invoices", status || ""], queryFn: () => platformApi.get<Invoice[]>(`/invoices${status ? `?status=${status}` : ""}`) });

export const useAllSubscriptions = (status?: string) =>
  useQuery({ queryKey: ["pf","subs", status || ""], queryFn: () => platformApi.get<any[]>(`/subscriptions${status ? `?status=${status}` : ""}`) });

export const useRevenueMonthly = () =>
  useQuery({ queryKey: ["pf","revmonthly"], queryFn: () => platformApi.get<Array<{ month: string; paid: number; pending: number; invoices: number }>>("/revenue/monthly") });

export const useConfirmInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, mpesa_reference }: { invoiceId: string; mpesa_reference?: string }) =>
      platformApi.post(`/invoices/${invoiceId}/confirm`, { mpesa_reference }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useVoidInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => platformApi.post(`/invoices/${invoiceId}/void`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const usePlatformPlans = () =>
  useQuery({ queryKey: ["pf","plans"], queryFn: () => platformApi.get<PlatformPlan[]>("/plans") });

export const useSavePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<PlatformPlan> & { id?: string }) =>
      id ? platformApi.put(`/plans/${id}`, body) : platformApi.post("/plans", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf","plans"] }),
  });
};

export const useDeletePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi.delete(`/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf","plans"] }),
  });
};

export const useSearchUsers = (q: string) =>
  useQuery({ queryKey: ["pf","users", q], queryFn: () => platformApi.get<any[]>(`/users?q=${encodeURIComponent(q)}`), enabled: q.length >= 2 });

export const useResetUserPassword = () =>
  useMutation({ mutationFn: ({ id, password }: { id: string; password: string }) => platformApi.post(`/users/${id}/reset-password`, { password }) });

export const useSetUserActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => platformApi.post(`/users/${id}/active`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf","users"] }),
  });
};

export const useAudit = () =>
  useQuery({ queryKey: ["pf","audit"], queryFn: () => platformApi.get<any[]>("/audit?limit=300") });

export const usePlatformStaff = () =>
  useQuery({ queryKey: ["pf","staff"], queryFn: () => platformApi.get<any[]>("/staff") });

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string; full_name: string; role: string }) => platformApi.post("/staff", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf","staff"] }),
  });
};

// ── Assessment Billing hooks ─────────────────────────────────────────────────

export const useAssessmentBilling = (schoolId: string | undefined) =>
  useQuery({
    enabled: !!schoolId,
    queryKey: ["pf","assessment-billing", schoolId],
    queryFn: () => platformApi.get<AssessmentBillingRow[]>(`/schools/${schoolId}/assessment-billing`),
  });

export const useBillingStatus = (schoolId: string | undefined) =>
  useQuery({
    enabled: !!schoolId,
    queryKey: ["pf","billing-status", schoolId],
    queryFn: () => platformApi.get<any>(`/schools/${schoolId}/billing-status`),
    staleTime: 15_000,
  });

export const useMarkAssessmentPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, assessmentId }: { schoolId: string; assessmentId?: string }) =>
      platformApi.post(`/schools/${schoolId}/assessment-billing/mark-paid`, { assessment_id: assessmentId }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["pf","assessment-billing", vars.schoolId] });
      qc.invalidateQueries({ queryKey: ["pf","billing-status", vars.schoolId] });
      qc.invalidateQueries({ queryKey: ["pf","school", vars.schoolId] });
    },
  });
};