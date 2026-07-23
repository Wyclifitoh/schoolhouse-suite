import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export interface VoteHead {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  coa_income_account_id?: string | null;
  coa_expense_account_id?: string | null;
  income_account_code?: string | null;
  income_account_name?: string | null;
  expense_account_code?: string | null;
  expense_account_name?: string | null;
  is_active: 0 | 1 | boolean;
  is_system: 0 | 1;
  created_at?: string;
  updated_at?: string;
}

const KEY = ["vote-heads"];

export function useVoteHeads(opts?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: [...KEY, { activeOnly: !!opts?.activeOnly }],
    queryFn: () =>
      api.get<VoteHead[]>(
        `/vote-heads${opts?.activeOnly ? "?active=true" : ""}`,
      ),
  });
}

export function useVoteHeadMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (body: Partial<VoteHead>) =>
      api.post<VoteHead>("/vote-heads", body),
    onSuccess: () => {
      invalidate();
      toast({ title: "Vote head created" });
    },
    onError: (e: Error) =>
      toast({ title: "Failed to create", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: Partial<VoteHead> & { id: string }) =>
      api.put<VoteHead>(`/vote-heads/${id}`, body),
    onSuccess: () => {
      invalidate();
      toast({ title: "Vote head updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/vote-heads/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Vote head deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  return { create, update, remove };
}