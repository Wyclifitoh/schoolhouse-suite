import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const unwrap = <T,>(r: any): T => (r?.data ?? r) as T;

export interface Reconciliation {
  id: string;
  bank_account_id: string;
  bank_account_name?: string;
  account_number?: string | null;
  period_from: string;
  period_to: string;
  statement_opening: number;
  statement_closing: number;
  ledger_opening: number;
  ledger_closing: number;
  difference: number;
  status: "draft" | "completed";
  notes?: string | null;
  completed_at?: string | null;
}

export interface ReconciliationLine {
  id: string;
  txn_date: string;
  description?: string | null;
  reference?: string | null;
  debit: number;
  credit: number;
  balance?: number | null;
  status: "unmatched" | "matched" | "ignored" | "adjustment";
  matched_gl_id?: string | null;
}

export interface ReconciliationGlEntry {
  id: string;
  entry_date: string;
  posting_ref: string;
  debit: number;
  credit: number;
  narration?: string | null;
  source_type: string;
  matched_line_id?: string | null;
}

export interface ReconciliationDetail extends Reconciliation {
  lines: ReconciliationLine[];
  gl_entries: ReconciliationGlEntry[];
  adjustments: Array<{
    id: string;
    adjustment_date: string;
    direction: "debit" | "credit";
    amount: number;
    narration?: string | null;
    posting_ref?: string | null;
  }>;
  totals: {
    statement_debits: number;
    statement_credits: number;
    matched_count: number;
    unmatched_count: number;
  };
}

export const useReconciliations = (params: { bank_account_id?: string; status?: string } = {}) =>
  useQuery({
    queryKey: ["reconciliations", params],
    queryFn: async () => {
      const qs = new URLSearchParams(params as any).toString();
      return unwrap<Reconciliation[]>(
        await api.get<any>(`/bank-reconciliation${qs ? `?${qs}` : ""}`),
      );
    },
  });

export const useReconciliation = (id?: string) =>
  useQuery({
    queryKey: ["reconciliation", id],
    enabled: !!id,
    queryFn: async () =>
      unwrap<ReconciliationDetail>(await api.get<any>(`/bank-reconciliation/${id}`)),
  });

export const useReconciliationMutations = (id?: string) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reconciliations"] });
    if (id) qc.invalidateQueries({ queryKey: ["reconciliation", id] });
  };

  return {
    create: useMutation({
      mutationFn: (body: any) =>
        api.post<any>("/bank-reconciliation", body).then(unwrap<Reconciliation>),
      onSuccess: invalidate,
    }),
    importLines: useMutation({
      mutationFn: (body: any) =>
        api.post<any>(`/bank-reconciliation/${id}/import`, body).then(unwrap),
      onSuccess: invalidate,
    }),
    autoMatch: useMutation({
      mutationFn: (body: { dayTolerance?: number } = {}) =>
        api.post<any>(`/bank-reconciliation/${id}/auto-match`, body).then(unwrap),
      onSuccess: invalidate,
    }),
    match: useMutation({
      mutationFn: (body: { line_id: string; gl_id: string }) =>
        api.post<any>(`/bank-reconciliation/${id}/match`, body).then(unwrap),
      onSuccess: invalidate,
    }),
    unmatch: useMutation({
      mutationFn: (lineId: string) =>
        api.post<any>(`/bank-reconciliation/lines/${lineId}/unmatch`, {}).then(unwrap),
      onSuccess: invalidate,
    }),
    ignore: useMutation({
      mutationFn: (lineId: string) =>
        api.post<any>(`/bank-reconciliation/lines/${lineId}/ignore`, {}).then(unwrap),
      onSuccess: invalidate,
    }),
    adjust: useMutation({
      mutationFn: (body: any) =>
        api.post<any>(`/bank-reconciliation/${id}/adjustments`, body).then(unwrap),
      onSuccess: invalidate,
    }),
    complete: useMutation({
      mutationFn: () =>
        api.post<any>(`/bank-reconciliation/${id}/complete`, {}).then(unwrap),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (rid: string) =>
        api.delete<any>(`/bank-reconciliation/${rid}`).then(unwrap),
      onSuccess: invalidate,
    }),
  };
};