import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AuditEntry {
  id: string;
  sequence: number | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  prev_hash: string | null;
  entry_hash: string | null;
  created_at: string;
  first_name?: string; last_name?: string; email?: string;
}
export interface AuditList { items: AuditEntry[]; total: number; page: number; limit: number }
export interface AuditSummary { total: number; today: number; sealed: number; unsealed: number }
export interface VerifyResult {
  ok: boolean; checked: number; last_hash?: string | null;
  broken_at_sequence?: number; broken_at_id?: string;
}

export const useAuditTrail = (params: Record<string, string | number | undefined>) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) qs.append(k, String(v));
  });
  return useQuery({
    queryKey: ["audit-trail", "list", params],
    queryFn: () => api.get<AuditList>(`/audit-trail?${qs.toString()}`),
  });
};

export const useAuditEntry = (id: string | null) =>
  useQuery({
    queryKey: ["audit-trail", "entry", id],
    queryFn: () => api.get<AuditEntry>(`/audit-trail/${id}`),
    enabled: !!id,
  });

export const useAuditSummary = () =>
  useQuery({ queryKey: ["audit-trail", "summary"],
    queryFn: () => api.get<AuditSummary>("/audit-trail/summary") });

export const useVerifyChain = () =>
  useQuery({ queryKey: ["audit-trail", "verify"],
    queryFn: () => api.get<VerifyResult>("/audit-trail/verify") });

export const useSealChain = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ sealed: number; last_sequence: number; last_hash: string | null }>(
      "/audit-trail/seal", {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-trail"] }); },
  });
};