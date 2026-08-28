import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { platformApi } from "@/lib/platformApi";

export interface OverviewStats {
  totals: {
    total_schools: number;
    active_schools: number;
    total_students: number;
    total_users: number;
  };
  subscriptions: Record<string, number>;
  revenue: {
    collected: number;
    pending: number;
    mtd_paid: number;
    mtd_pending: number;
  };
  trialsEndingSoon: Array<{ id: string; name: string; trial_ends_at: string }>;
  signups30d: Array<{ d: string; c: number }>;
}

export interface SchoolRow {
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  is_active: 0 | 1;
  created_at: string;
  sub_status: string | null;
  billing_mode: string | null;
  cycle: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  price_per_student: number | null;
  plan_name: string | null;
  plan_code: string | null;
  active_students: number;
  staff_count: number;
  user_count: number;
  lifetime_paid: number;
  pending_amount: number;
}

export interface Invoice {
  id: string;
  school_id: string;
  school_name?: string;
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

export interface PlatformPlan {
  id: string;
  code: string;
  name: string;
  billing_mode: "per_student" | "module" | "free" | "flat";
  cycle: "monthly" | "termly" | "yearly";
  price_per_student: number;
  base_price: number;
  module_code: string | null;
  description: string | null;
  min_students: number | null;
  max_students: number | null;
  is_active: 0 | 1;
}

export const useOverview = () =>
  useQuery({
    queryKey: ["pf", "overview"],
    queryFn: () => platformApi.get<OverviewStats>("/overview"),
    staleTime: 30_000,
  });

export const useSchools = (
  params: { search?: string; status?: string } = {},
) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  const s = qs.toString();
  return useQuery({
    queryKey: ["pf", "schools", params],
    queryFn: () => platformApi.get<SchoolRow[]>(`/schools${s ? `?${s}` : ""}`),
  });
};

export const useSchoolDetail = (id: string | undefined) =>
  useQuery({
    enabled: !!id,
    queryKey: ["pf", "school", id],
    queryFn: () => platformApi.get<any>(`/schools/${id}`),
  });

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
    mutationFn: (id: string) =>
      platformApi.post(`/schools/${id}/terminate-trial`),
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
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      plan_code?: string;
      plan_id?: string;
      period_start?: string;
      period_end?: string;
      modules?: string[];
    }) => platformApi.post(`/schools/${id}/activate-subscription`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      amount: number;
      period_start: string;
      period_end: string;
      student_count?: number | null;
      mark_paid?: boolean;
      mpesa_reference?: string;
    }) => platformApi.post<Invoice>(`/schools/${id}/invoices`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useAllInvoices = (status?: string) =>
  useQuery({
    queryKey: ["pf", "invoices", status || ""],
    queryFn: () =>
      platformApi.get<Invoice[]>(
        `/invoices${status ? `?status=${status}` : ""}`,
      ),
  });

export const useAllSubscriptions = (status?: string) =>
  useQuery({
    queryKey: ["pf", "subs", status || ""],
    queryFn: () =>
      platformApi.get<any[]>(
        `/subscriptions${status ? `?status=${status}` : ""}`,
      ),
  });

export const useRevenueMonthly = () =>
  useQuery({
    queryKey: ["pf", "revmonthly"],
    queryFn: () =>
      platformApi.get<
        Array<{
          month: string;
          paid: number;
          pending: number;
          invoices: number;
        }>
      >("/revenue/monthly"),
  });

export const useConfirmInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      mpesa_reference,
    }: {
      invoiceId: string;
      mpesa_reference?: string;
    }) =>
      platformApi.post(`/invoices/${invoiceId}/confirm`, { mpesa_reference }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const useVoidInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) =>
      platformApi.post(`/invoices/${invoiceId}/void`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf"] }),
  });
};

export const usePlatformPlans = () =>
  useQuery({
    queryKey: ["pf", "plans"],
    queryFn: () => platformApi.get<PlatformPlan[]>("/plans"),
  });

export const useSavePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<PlatformPlan> & { id?: string }) =>
      id
        ? platformApi.put(`/plans/${id}`, body)
        : platformApi.post("/plans", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "plans"] }),
  });
};

export const useDeletePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi.delete(`/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "plans"] }),
  });
};

export const useSearchUsers = (q: string) =>
  useQuery({
    queryKey: ["pf", "users", q],
    queryFn: () => platformApi.get<any[]>(`/users?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
  });

export const useResetUserPassword = () =>
  useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      platformApi.post(`/users/${id}/reset-password`, { password }),
  });

export const useSetUserActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      platformApi.post(`/users/${id}/active`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "users"] }),
  });
};

export const useAudit = () =>
  useQuery({
    queryKey: ["pf", "audit"],
    queryFn: () => platformApi.get<any[]>("/audit?limit=300"),
  });

export const usePlatformStaff = () =>
  useQuery({
    queryKey: ["pf", "staff"],
    queryFn: () => platformApi.get<any[]>("/staff"),
  });

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      email: string;
      password: string;
      full_name: string;
      role: string;
    }) => platformApi.post("/staff", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "staff"] }),
  });
};

export interface ImpersonationResult {
  token: string;
  school: { id: string; name: string };
  user: { id: string; email: string; full_name: string };
  roles: Array<{ role: string; school_id: string | null; is_active: boolean }>;
  expires_in: number;
}

export const useImpersonateSchool = () =>
  useMutation({
    mutationFn: (schoolId: string) =>
      platformApi.post<ImpersonationResult>(`/schools/${schoolId}/impersonate`),
  });

export const useDeleteSchool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (schoolId: string) =>
      platformApi.delete<{ ok: true; id: string; name: string }>(
        `/schools/${schoolId}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pf", "schools"] });
      qc.invalidateQueries({ queryKey: ["pf", "overview"] });
    },
  });
};

/* ---------- Feature Flags / Entitlements ---------- */
export interface EntitlementRow {
  school_id: string;
  name: string;
  is_active: 0 | 1;
  sub_status: string | null;
  modules: string[];
  current_period_end: string | null;
  trial_ends_at: string | null;
  plan_name: string | null;
  plan_code: string | null;
}

export const KNOWN_MODULES = [
  "assessments",
  "finance",
  "inventory",
  "hr",
  "communication",
  "portal",
] as const;

export const useAllEntitlements = () =>
  useQuery({
    queryKey: ["pf", "entitlements"],
    queryFn: () => platformApi.get<EntitlementRow[]>("/entitlements"),
  });

export const useSetSchoolEntitlements = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      schoolId,
      modules,
    }: {
      schoolId: string;
      modules: string[];
    }) => platformApi.put(`/schools/${schoolId}/entitlements`, { modules }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "entitlements"] }),
  });
};

export const useBulkEntitlements = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      school_ids: string[];
      add?: string[];
      remove?: string[];
    }) => platformApi.post("/entitlements/bulk", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "entitlements"] }),
  });
};

/* ---------- SMS Operations ---------- */
export interface SmsOverview {
  totals: {
    total_balance: number;
    schools_tracked: number;
    low_balance_schools: number;
  };
  messages: {
    sent_24h: number;
    failed_24h: number;
    sent_30d: number;
    failed_total: number;
  };
  daily: Array<{ d: string; sent: number; failed: number }>;
  lowBalance: Array<{
    school_id: string;
    name: string;
    balance: number;
    updated_at: string;
  }>;
}

export interface SmsSchoolBalance {
  school_id: string;
  name: string;
  code: string | null;
  is_active: 0 | 1;
  sms_user_id: string | null;
  sms_paybill_account: string | null;
  balance: number;
  balance_available?: boolean;
  balance_updated_at: string | null;
  sent_30d: number;
  failed_30d: number;
}

export interface SmsLedgerRow {
  id: string;
  school_id: string;
  school_name: string;
  delta: number;
  balance_after: number;
  reason: string;
  note: string | null;
  ref: string | null;
  actor_email: string | null;
  created_at: string;
}

export interface SmsMessageRow {
  id: string;
  school_id: string;
  school_name: string;
  to_phone: string;
  recipient_name: string | null;
  message: string;
  status: string;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
}

export const useSmsOverview = () =>
  useQuery({
    queryKey: ["pf", "sms", "overview"],
    queryFn: () => platformApi.get<SmsOverview>("/sms/overview"),
    staleTime: 30_000,
  });

export const useSmsSchoolBalances = (search = "") =>
  useQuery({
    queryKey: ["pf", "sms", "schools", search],
    queryFn: () =>
      platformApi.get<SmsSchoolBalance[]>(
        `/sms/schools${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      ),
  });

export const useSmsLedger = (schoolId?: string) =>
  useQuery({
    queryKey: ["pf", "sms", "ledger", schoolId || ""],
    queryFn: () =>
      platformApi.get<SmsLedgerRow[]>(
        `/sms/ledger${schoolId ? `?school_id=${schoolId}` : ""}`,
      ),
  });

export const useSmsMessages = (
  params: { status?: string; school_id?: string } = {},
) => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.school_id) qs.set("school_id", params.school_id);
  const s = qs.toString();
  return useQuery({
    queryKey: ["pf", "sms", "messages", params],
    queryFn: () =>
      platformApi.get<SmsMessageRow[]>(`/sms/messages${s ? `?${s}` : ""}`),
  });
};

export const useCreditSms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      note,
      ref,
    }: {
      id: string;
      amount: number;
      note?: string;
      ref?: string;
    }) => platformApi.post(`/sms/schools/${id}/credit`, { amount, note, ref }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "sms"] }),
  });
};

export const useDebitSms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      note,
      ref,
    }: {
      id: string;
      amount: number;
      note?: string;
      ref?: string;
    }) => platformApi.post(`/sms/schools/${id}/debit`, { amount, note, ref }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "sms"] }),
  });
};

export const useTransferSms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      from_school_id: string;
      to_school_id: string;
      amount: number;
      note?: string;
    }) => platformApi.post(`/sms/transfer`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "sms"] }),
  });
};

export const useRetrySms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi.post(`/sms/messages/${id}/retry`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "sms"] }),
  });
};

export const useSetSmsAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      sms_user_id,
      sms_paybill_account,
    }: {
      id: string;
      sms_user_id?: string;
      sms_paybill_account?: string | null;
    }) =>
      platformApi.put(`/sms/schools/${id}/account`, {
        sms_user_id,
        sms_paybill_account,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "sms"] }),
  });
};

export const useExternalTopupSms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      reference,
      note,
    }: {
      id: string;
      amount: number;
      reference?: string;
      note?: string;
    }) =>
      platformApi.post(`/sms/schools/${id}/external-topup`, {
        amount,
        reference,
        note,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "sms"] }),
  });
};

/* ---------- Support tickets ---------- */
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface SupportTicket {
  id: string;
  school_id: string | null;
  school_name: string | null;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  created_by_email: string | null;
  sla_due_at: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  message_count?: number;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_platform_user_id: string | null;
  author_email: string | null;
  body: string;
  internal: 0 | 1;
  created_at: string;
}

export interface SupportStats {
  open: number;
  pending: number;
  resolved: number;
  closed: number;
  overdue: number;
  urgent_open: number;
}

export const useSupportStats = () =>
  useQuery({
    queryKey: ["pf", "support", "stats"],
    queryFn: () => platformApi.get<SupportStats>("/support/stats"),
    staleTime: 30_000,
  });

export const useSupportTickets = (
  params: {
    status?: string;
    priority?: string;
    assignee_id?: string;
    school_id?: string;
    search?: string;
  } = {},
) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, String(v));
  });
  const s = qs.toString();
  return useQuery({
    queryKey: ["pf", "support", "tickets", params],
    queryFn: () =>
      platformApi.get<SupportTicket[]>(`/support/tickets${s ? `?${s}` : ""}`),
  });
};

export const useTicket = (id: string | undefined) =>
  useQuery({
    enabled: !!id,
    queryKey: ["pf", "support", "ticket", id],
    queryFn: () =>
      platformApi.get<{ ticket: SupportTicket; messages: TicketMessage[] }>(
        `/support/tickets/${id}`,
      ),
  });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      subject: string;
      description?: string;
      school_id?: string | null;
      priority?: TicketPriority;
      assignee_id?: string | null;
      created_by_email?: string;
    }) => platformApi.post<SupportTicket>("/support/tickets", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "support"] }),
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status?: TicketStatus;
      priority?: TicketPriority;
      assignee_id?: string | null;
      subject?: string;
      description?: string;
    }) => platformApi.patch<SupportTicket>(`/support/tickets/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pf", "support"] }),
  });
};

export const useAddTicketMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      internal,
    }: {
      id: string;
      body: string;
      internal?: boolean;
    }) =>
      platformApi.post<TicketMessage>(`/support/tickets/${id}/messages`, {
        body,
        internal,
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["pf", "support", "ticket", v.id] });
      qc.invalidateQueries({ queryKey: ["pf", "support", "tickets"] });
    },
  });
};

/* ---------- Advanced Analytics ---------- */
export interface MrrPoint {
  month: string;
  mrr: number;
  arr_pending: number;
  paying_schools: number;
}
export interface CohortPoint {
  cohort: string;
  new_schools: number;
  still_active: number;
}
export interface ChurnPoint {
  month: string;
  cancelled: number;
  locked: number;
}
export interface TrialConversion {
  trials: number;
  active: number;
  cancelled: number;
  locked: number;
  total: number;
}
export interface PlanDistribution {
  code: string;
  name: string;
  billing_mode: string;
  cycle: string;
  schools: number;
}

export const useAnalyticsMrr = () =>
  useQuery({
    queryKey: ["pf", "analytics", "mrr"],
    queryFn: () => platformApi.get<MrrPoint[]>("/analytics/mrr"),
  });
export const useAnalyticsCohorts = () =>
  useQuery({
    queryKey: ["pf", "analytics", "cohorts"],
    queryFn: () => platformApi.get<CohortPoint[]>("/analytics/cohorts"),
  });
export const useAnalyticsTrialConversion = () =>
  useQuery({
    queryKey: ["pf", "analytics", "trial"],
    queryFn: () =>
      platformApi.get<TrialConversion>("/analytics/trial-conversion"),
  });
export const useAnalyticsChurn = () =>
  useQuery({
    queryKey: ["pf", "analytics", "churn"],
    queryFn: () => platformApi.get<ChurnPoint[]>("/analytics/churn"),
  });
export const useAnalyticsPlanDistribution = () =>
  useQuery({
    queryKey: ["pf", "analytics", "plans"],
    queryFn: () =>
      platformApi.get<PlanDistribution[]>("/analytics/plan-distribution"),
  });
