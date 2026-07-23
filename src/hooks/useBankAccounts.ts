import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export interface BankAccount {
  id: string;
  name: string;
  bank_name?: string | null;
  branch?: string | null;
  account_number?: string | null;
  currency: string;
  account_type: "bank" | "cash" | "mobile_money";
  coa_account_id?: string | null;
  coa_account_name?: string | null;
  account_code?: string | null;
  opening_balance: number | string;
  is_default: 0 | 1 | boolean;
  is_active: 0 | 1 | boolean;
}

const KEY = ["bank-accounts"];

export function useBankAccounts(opts?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: [...KEY, { activeOnly: !!opts?.activeOnly }],
    queryFn: () =>
      api.get<BankAccount[]>(
        `/bank-accounts${opts?.activeOnly ? "?active=true" : ""}`,
      ),
  });
}

export function useBankAccountMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (body: Partial<BankAccount>) =>
      api.post<BankAccount>("/bank-accounts", body),
    onSuccess: () => {
      invalidate();
      toast({ title: "Bank account created" });
    },
    onError: (e: Error) =>
      toast({ title: "Failed to create", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: Partial<BankAccount> & { id: string }) =>
      api.put<BankAccount>(`/bank-accounts/${id}`, body),
    onSuccess: () => {
      invalidate();
      toast({ title: "Bank account updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/bank-accounts/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Bank account deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  return { create, update, remove };
}