import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const unwrap = <T,>(r: any): T => (r?.data ?? r) as T;

export interface Budget {
  id: string;
  academic_year_id: string;
  academic_year_name?: string;
  term_id?: string | null;
  term_name?: string | null;
  name: string;
  status: "draft" | "active" | "closed";
  overspend_policy: "warn" | "block";
  version: number;
  notes?: string | null;
  activated_at?: string | null;
  closed_at?: string | null;
  line_count?: number;
  total_budgeted?: number;
}

export interface BudgetLine {
  id: string;
  budget_id: string;
  vote_head_id: string;
  vote_head_code?: string;
  vote_head_name?: string;
  coa_account_id?: string | null;
  budgeted_amount: number;
  actual_amount: number;
  committed_amount: number;
  available_amount: number;
  variance: number;
  utilisation_pct: number;
  notes?: string | null;
}

export interface BudgetDetail extends Budget {
  lines: BudgetLine[];
  totals: {
    budgeted: number;
    actual: number;
    variance: number;
    utilisation_pct: number;
  };
}

export const useBudgets = (params: Record<string, string> = {}) =>
  useQuery({
    queryKey: ["budgets", params],
    queryFn: async () => {
      const qs = new URLSearchParams(params).toString();
      return unwrap<Budget[]>(await api.get<any>(`/budgets${qs ? `?${qs}` : ""}`));
    },
  });

export const useBudget = (id?: string) =>
  useQuery({
    queryKey: ["budget", id],
    enabled: !!id,
    queryFn: async () => unwrap<BudgetDetail>(await api.get<any>(`/budgets/${id}`)),
  });

export const useBudgetMutations = (id?: string) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["budgets"] });
    if (id) qc.invalidateQueries({ queryKey: ["budget", id] });
  };
  const onErr = (e: Error) =>
    toast({ title: "Action failed", description: e.message, variant: "destructive" });

  return {
    create: useMutation({
      mutationFn: (body: Partial<Budget>) =>
        api.post<any>("/budgets", body).then(unwrap<Budget>),
      onSuccess: () => { invalidate(); toast({ title: "Budget created" }); },
      onError: onErr,
    }),
    update: useMutation({
      mutationFn: (body: Partial<Budget> & { id: string }) =>
        api.put<any>(`/budgets/${body.id}`, body).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Budget saved" }); },
      onError: onErr,
    }),
    activate: useMutation({
      mutationFn: (bid: string) => api.post<any>(`/budgets/${bid}/activate`, {}).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Budget activated" }); },
      onError: onErr,
    }),
    close: useMutation({
      mutationFn: (bid: string) => api.post<any>(`/budgets/${bid}/close`, {}).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Budget closed" }); },
      onError: onErr,
    }),
    remove: useMutation({
      mutationFn: (bid: string) => api.delete<any>(`/budgets/${bid}`).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Budget deleted" }); },
      onError: onErr,
    }),
    upsertLine: useMutation({
      mutationFn: (body: Partial<BudgetLine>) =>
        api.post<any>(`/budgets/${id}/lines`, body).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Line saved" }); },
      onError: onErr,
    }),
    removeLine: useMutation({
      mutationFn: (lineId: string) =>
        api.delete<any>(`/budgets/${id}/lines/${lineId}`).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Line removed" }); },
      onError: onErr,
    }),
  };
};