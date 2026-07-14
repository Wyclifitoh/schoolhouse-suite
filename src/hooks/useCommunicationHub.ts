import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Audience } from "./useMessaging";

/* ============== DASHBOARD ============== */
export interface CommDashboardStats {
  sms_today: number;
  email_today: number;
  scheduled: number;
  failed_30d: number;
  success_rate: number;
  sms_sent_30d: number;
  email_sent_30d: number;
}
export function useCommDashboard() {
  return useQuery({
    queryKey: ["comm-dashboard"],
    queryFn: () => api.get<CommDashboardStats>("/communication/dashboard"),
    refetchInterval: 60_000,
  });
}

/* ============== SMS BALANCE ============== */
export function useSmsBalance(auto = true) {
  return useQuery({
    queryKey: ["sms-balance"],
    queryFn: () => api.get<{ balance: number | null; cached: boolean }>("/communication/sms/balance"),
    staleTime: 60_000,
    refetchInterval: auto ? 5 * 60_000 : false,
  });
}
export function useRefreshSmsBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.get<{ balance: number | null }>("/communication/sms/balance?refresh=1"),
    onSuccess: (d) => {
      qc.setQueryData(["sms-balance"], { balance: d.balance, cached: false });
      toast.success(`Balance: ${d.balance ?? "n/a"}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============== CAMPAIGNS ============== */
export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  channel: "sms" | "email" | "both";
  template_id?: string | null;
  template_name?: string | null;
  subject?: string | null;
  body: string;
  audience: Audience;
  status: "draft" | "scheduled" | "running" | "completed" | "failed";
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  stats?: { total?: number; sent?: number; failed?: number } | null;
  created_by_name?: string | null;
  created_at: string;
}
export function useCampaigns(params: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["campaigns", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      if (params.search) q.set("search", params.search);
      const data = await api.get<Campaign[]>(`/communication/campaigns${q.toString() ? `?${q}` : ""}`);
      return data || [];
    },
  });
}
export function useSaveCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<Campaign> }) =>
      id
        ? api.put<Campaign>(`/communication/campaigns/${id}`, data)
        : api.post<Campaign>("/communication/campaigns", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/communication/campaigns/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Campaign deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDuplicateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Campaign>(`/communication/campaigns/${id}/duplicate`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Campaign duplicated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Campaign>(`/communication/campaigns/${id}/send`, {}),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["comm-dashboard"] });
      toast.success(`Sent: ${c.stats?.sent || 0}/${c.stats?.total || 0}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============== SCHEDULED ============== */
export interface Scheduled {
  id: string;
  channel: "sms" | "email" | "both";
  audience: Audience;
  subject?: string | null;
  body: string;
  scheduled_at: string;
  status: "pending" | "sent" | "cancelled" | "failed";
  sent_at?: string | null;
  error?: string | null;
  stats?: any;
  created_by_name?: string | null;
  created_at: string;
}
export function useScheduled(params: { status?: string } = {}) {
  return useQuery({
    queryKey: ["scheduled", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      const d = await api.get<Scheduled[]>(`/communication/scheduled${q.toString() ? `?${q}` : ""}`);
      return d || [];
    },
  });
}
export function useSaveScheduled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<Scheduled> }) =>
      id
        ? api.put<Scheduled>(`/communication/scheduled/${id}`, data)
        : api.post<Scheduled>("/communication/scheduled", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled"] }); toast.success("Scheduled"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useCancelScheduled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/communication/scheduled/${id}/cancel`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled"] }); toast.success("Cancelled"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteScheduled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/communication/scheduled/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============== AUTOMATIONS ============== */
export interface Automation {
  key: string;
  label: string;
  description: string;
  trigger_key: string;
  channel: "sms" | "email" | "both";
  template_id?: string | null;
  audience?: Audience | null;
  enabled: boolean | number;
  config?: any;
}
export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: async () => (await api.get<Automation[]>("/communication/automations")) || [],
  });
}
export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ triggerKey, data }: { triggerKey: string; data: Partial<Automation> }) =>
      api.put<Automation>(`/communication/automations/${triggerKey}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============== SETTINGS ============== */
export interface CommSettings {
  sms: { provider?: string; sender_id?: string; retry_attempts?: number };
  email: { sender_name?: string; reply_to?: string; provider?: string };
  notices: { default_visibility?: string; default_expiry_days?: number };
  general: { queue_batch_size?: number; retry_attempts?: number };
}
export function useCommSettings() {
  return useQuery({
    queryKey: ["comm-settings"],
    queryFn: () => api.get<CommSettings>("/communication/settings"),
  });
}
export function useSaveCommSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommSettings>) => api.put<CommSettings>("/communication/settings", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm-settings"] }); toast.success("Settings saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useSendTestEmail() {
  return useMutation({
    mutationFn: (data: { to: string; subject?: string; body?: string }) =>
      api.post("/communication/settings/test-email", data),
    onSuccess: () => toast.success("Test email sent"),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============== HISTORY ============== */
export interface HistoryRow {
  id: string;
  channel: "sms" | "email";
  recipient: string;
  recipient_name?: string | null;
  recipient_type?: string | null;
  body?: string | null;
  subject?: string | null;
  status: "sent" | "failed" | "pending" | "queued" | "delivered";
  error_message?: string | null;
  sent_at?: string | null;
  created_at: string;
  sent_by_name?: string | null;
}
export function useHistory(params: { channel?: string; status?: string; search?: string; limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: ["comm-history", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.channel && params.channel !== "all") q.set("channel", params.channel);
      if (params.status && params.status !== "all") q.set("status", params.status);
      if (params.search) q.set("search", params.search);
      if (params.limit) q.set("limit", String(params.limit));
      if (params.offset) q.set("offset", String(params.offset));
      return api.get<{ rows: HistoryRow[]; total: number; limit: number; offset: number }>(
        `/communication/history${q.toString() ? `?${q}` : ""}`,
      );
    },
  });
}
export function useRetryMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: "sms" | "email"; id: string }) =>
      api.post(`/communication/history/${kind}/${id}/retry`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm-history"] }); toast.success("Retry queued"); },
    onError: (e: Error) => toast.error(e.message),
  });
}