import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  tax_pin?: string | null;
  location?: string | null;
  coa_control_account_id?: string | null;
  payment_terms_days?: number;
  opening_balance?: number;
  is_active?: number | boolean;
  notes?: string | null;
  created_at?: string;
}

export interface SupplierProfile {
  supplier: Supplier;
  summary: {
    opening_balance: number;
    po_total: number;
    po_received: number;
    po_open: number;
    expenses_paid: number;
    expenses_pending: number;
    outstanding: number;
  };
  purchase_orders: Array<Record<string, any>>;
  expenses: Array<Record<string, any>>;
  goods_received_notes: Array<Record<string, any>>;
  invoices: Array<Record<string, any>>;
  payment_vouchers: Array<Record<string, any>>;
}

const unwrap = <T>(r: any): T => (r?.data ?? r) as T;

export function useSuppliers(params: { search?: string; active?: boolean } = {}) {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.search) qs.set("search", params.search);
      if (params.active) qs.set("active", "true");
      const res = await api.get<any>(`/suppliers${qs.toString() ? `?${qs}` : ""}`);
      return unwrap<Supplier[]>(res);
    },
  });
}

export function useSupplierProfile(id?: string) {
  return useQuery({
    queryKey: ["supplier-profile", id],
    enabled: !!id,
    queryFn: async () => unwrap<SupplierProfile>(await api.get<any>(`/suppliers/${id}/profile`)),
  });
}

export function useSupplierMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["suppliers"] });
    qc.invalidateQueries({ queryKey: ["supplier-profile"] });
  };
  return {
    create: useMutation({
      mutationFn: (body: Partial<Supplier>) =>
        api.post<any>("/suppliers", body).then(unwrap<Supplier>),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Partial<Supplier> }) =>
        api.put<any>(`/suppliers/${id}`, body).then(unwrap<Supplier>),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete<any>(`/suppliers/${id}`),
      onSuccess: invalidate,
    }),
  };
}