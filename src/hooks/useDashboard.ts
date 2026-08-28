import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAcademicContext } from "@/hooks/useAcademicContext";

/**
 * DASHBOARD DATA HOOKS
 *
 * The backend decides which domains it returns based on the caller's
 * effective permissions (see backend/src/modules/dashboard). The frontend
 * merely reflects that: a missing domain means "not authorized", and the
 * widget is omitted entirely.
 */

export interface DomainMap {
  students: boolean;
  finance: boolean;
  payments: boolean;
  attendance: boolean;
  academics: boolean;
  hr: boolean;
  inventory: boolean;
  events: boolean;
  reports: boolean;
  audit: boolean;
}

export interface DashboardSummary {
  domains: DomainMap;
  students: {
    total: number;
    active: number;
    transferred: number;
    newAdmissions: number;
    byClass: { label: string; value: number }[];
  } | null;
  finance: {
    collected: number;
    billed: number;
    allocated: number;
    outstanding: number;
    collectionRate: number;
    paymentCount: number;
    categories: { label: string; value: number }[];
  } | null;
  attendance: {
    records: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
    trend: { label: string; value: number }[];
  } | null;
  academics: {
    assessments: number;
    draft: number;
    open: number;
    /** @deprecated use `open` — kept for older callers. */
    inProgress: number;
    completed: number;
    /** Assessments whose results were actually released (incl. later locked). */
    published: number;
    locked: number;
    archived: number;
    readyToPublish: number;
    /** e.g. "2 open · 1 ready to publish · 3 published" */
    summaryLine: string;
    /** % of assessments with published results. */
    publishedRate: number;
    /** % of assessments with all marks entered — NOT publication. */
    completionRate: number;
    topClasses: { label: string; value: number }[];
  } | null;

  hr: {
    totalStaff: number;
    activeStaff: number;
    pendingLeaves: number;
    presentToday: number;
    attendanceRate: number | null;
  } | null;
  inventory: { items: number; stockValue: number; lowStock: number } | null;
  recentPayments:
    | {
        id: string;
        student_name: string | null;
        amount: number;
        payment_method: string;
        reference_number: string | null;
        received_at: string;
        status: string;
      }[]
    | null;
  upcomingEvents:
    | {
        id: string;
        title: string;
        description: string | null;
        starts_at: string;
        ends_at: string | null;
        event_type: string | null;
        location: string | null;
      }[]
    | null;
}

export interface AttentionPayload {
  domains: DomainMap;
  finance: { unpaidAccounts: number; unallocatedPayments: number } | null;
  academics: {
    openTasks: number;
    readyToPublish: number;
    windowClosed: number;
    incompleteMarks: number;
  } | null;

  attendance: { unmarkedToday: number } | null;
  hr: { pendingLeaves: number } | null;
  inventory: { lowStock: number } | null;
}

export interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  actor: string | null;
}

/** Session key so every widget refetches when school / term changes. */
function useSessionKey() {
  const { viewingYear, viewingTerm } = useAcademicContext();
  return `${api.getSchoolId() || "none"}:${viewingYear?.id || "-"}:${viewingTerm?.id || "-"}`;
}

export function useDashboardSummary() {
  const key = useSessionKey();
  return useQuery({
    queryKey: ["dashboard", "summary", key],
    queryFn: () => api.get<DashboardSummary>("/dashboard/summary"),
    staleTime: 60_000,
  });
}

export function useFinanceTrend(range: "term" | "year" | "all") {
  const key = useSessionKey();
  return useQuery({
    queryKey: ["dashboard", "finance-trend", range, key],
    queryFn: () =>
      api.get<{ range: string; points: { label: string; value: number }[] }>(
        `/dashboard/finance-trend?range=${range}`,
      ),
    staleTime: 60_000,
    retry: 0,
  });
}

export function useAttention() {
  const key = useSessionKey();
  return useQuery({
    queryKey: ["dashboard", "attention", key],
    queryFn: () => api.get<AttentionPayload>("/dashboard/attention"),
    staleTime: 30_000,
  });
}

export function useDashboardActivity() {
  const key = useSessionKey();
  return useQuery({
    queryKey: ["dashboard", "activity", key],
    queryFn: () => api.get<ActivityItem[]>("/dashboard/activity"),
    staleTime: 30_000,
  });
}
