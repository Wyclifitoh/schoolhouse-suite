import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const unwrap = <T,>(r: any): T => (r?.data ?? r) as T;

export interface Capitation {
  id: string;
  academic_year_id: string;
  academic_year_name?: string;
  name: string;
  source: string;
  per_student_amount: number;
  expected_enrolment: number;
  expected_total: number;
  status: "draft" | "active" | "closed";
  notes?: string | null;
  tranche_count?: number;
  total_received?: number;
  total_expected?: number;
}

export interface CapitationTranche {
  id: string;
  capitation_id: string;
  term_id?: string | null;
  term_name?: string | null;
  name: string;
  expected_amount: number;
  received_amount: number;
  received_date?: string | null;
  bank_account_id?: string | null;
  bank_account_name?: string | null;
  reference?: string | null;
  posting_ref?: string | null;
  status: "pending" | "received" | "cancelled";
  notes?: string | null;
}

export interface CapitationDistribution {
  id: string;
  capitation_id: string;
  vote_head_id: string;
  vote_head_code?: string;
  vote_head_name?: string;
  percentage: number;
  notes?: string | null;
}

export interface CapitationDetail extends Capitation {
  tranches: CapitationTranche[];
  distributions: CapitationDistribution[];
  totals: {
    distribution_pct: number;
    expected: number;
    received: number;
    variance: number;
  };
}

export const useCapitations = (params: Record<string, string> = {}) =>
  useQuery({
    queryKey: ["capitations", params],
    queryFn: async () => {
      const qs = new URLSearchParams(params).toString();
      return unwrap<Capitation[]>(
        await api.get<any>(`/capitation${qs ? `?${qs}` : ""}`),
      );
    },
  });

export const useCapitation = (id?: string) =>
  useQuery({
    queryKey: ["capitation", id],
    enabled: !!id,
    queryFn: async () =>
      unwrap<CapitationDetail>(await api.get<any>(`/capitation/${id}`)),
  });

export const useCapitationMutations = (id?: string) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["capitations"] });
    if (id) qc.invalidateQueries({ queryKey: ["capitation", id] });
  };
  const onErr = (e: Error) =>
    toast({ title: "Action failed", description: e.message, variant: "destructive" });

  return {
    create: useMutation({
      mutationFn: (body: Partial<Capitation>) =>
        api.post<any>("/capitation", body).then(unwrap<Capitation>),
      onSuccess: () => { invalidate(); toast({ title: "Capitation created" }); },
      onError: onErr,
    }),
    update: useMutation({
      mutationFn: (body: Partial<Capitation> & { id: string }) =>
        api.put<any>(`/capitation/${body.id}`, body).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Saved" }); },
      onError: onErr,
    }),
    activate: useMutation({
      mutationFn: (cid: string) => api.post<any>(`/capitation/${cid}/activate`, {}).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Activated" }); },
      onError: onErr,
    }),
    close: useMutation({
      mutationFn: (cid: string) => api.post<any>(`/capitation/${cid}/close`, {}).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Closed" }); },
      onError: onErr,
    }),
    remove: useMutation({
      mutationFn: (cid: string) => api.delete<any>(`/capitation/${cid}`).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
      onError: onErr,
    }),
    upsertDistribution: useMutation({
      mutationFn: (body: Partial<CapitationDistribution>) =>
        api.post<any>(`/capitation/${id}/distributions`, body).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Distribution saved" }); },
      onError: onErr,
    }),
    removeDistribution: useMutation({
      mutationFn: (did: string) =>
        api.delete<any>(`/capitation/${id}/distributions/${did}`).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Distribution removed" }); },
      onError: onErr,
    }),
    upsertTranche: useMutation({
      mutationFn: (body: Partial<CapitationTranche>) =>
        api.post<any>(`/capitation/${id}/tranches`, body).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Tranche saved" }); },
      onError: onErr,
    }),
    removeTranche: useMutation({
      mutationFn: (tid: string) =>
        api.delete<any>(`/capitation/${id}/tranches/${tid}`).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Tranche removed" }); },
      onError: onErr,
    }),
    receiveTranche: useMutation({
      mutationFn: ({ tid, ...body }: {
        tid: string;
        received_amount?: number;
        received_date?: string;
        bank_account_id?: string;
        reference?: string;
      }) => api.post<any>(`/capitation/${id}/tranches/${tid}/receive`, body).then(unwrap),
      onSuccess: () => {
        invalidate();
        toast({ title: "Tranche received", description: "Posted to General Ledger" });
      },
      onError: onErr,
    }),
  };
};