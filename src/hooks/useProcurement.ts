import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const unwrap = <T>(r: any): T => (r?.data ?? r) as T;

export interface RequisitionLine {
  id?: string;
  item_id?: string | null;
  description: string;
  quantity: number;
  estimated_price?: number;
}
export interface Requisition {
  id: string;
  requisition_no: string;
  status: string;
  requested_at: string;
  total_estimate: number;
  department_name?: string | null;
  justification?: string | null;
  items?: RequisitionLine[];
}
export interface GRN {
  id: string;
  grn_no: string;
  po_id: string;
  po_number?: string;
  supplier_id: string;
  supplier_name?: string;
  received_date: string;
  status: string;
  items?: any[];
}
export interface SupplierInvoice {
  id: string;
  invoice_no: string;
  supplier_id: string;
  supplier_name?: string;
  po_id?: string | null;
  po_number?: string | null;
  invoice_date: string;
  due_date?: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  items?: any[];
}

// Requisitions
export const useRequisitions = (params: { status?: string } = {}) =>
  useQuery({
    queryKey: ["requisitions", params],
    queryFn: async () => {
      const qs = new URLSearchParams(params as any).toString();
      return unwrap<Requisition[]>(await api.get<any>(`/procurement/requisitions${qs ? `?${qs}` : ""}`));
    },
  });

export const useRequisitionMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["requisitions"] });
  return {
    create: useMutation({
      mutationFn: (body: any) =>
        api.post<any>("/procurement/requisitions", body).then(unwrap<Requisition>),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        api.patch<any>(`/procurement/requisitions/${id}/status`, { status }).then(unwrap<Requisition>),
      onSuccess: invalidate,
    }),
  };
};

// GRNs
export const useGRNs = (params: { supplier_id?: string; po_id?: string } = {}) =>
  useQuery({
    queryKey: ["grns", params],
    queryFn: async () => {
      const qs = new URLSearchParams(params as any).toString();
      return unwrap<GRN[]>(await api.get<any>(`/procurement/grns${qs ? `?${qs}` : ""}`));
    },
  });

export const useGRNMutations = () => {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: (body: any) =>
        api.post<any>("/procurement/grns", body).then(unwrap<GRN>),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["grns"] });
        qc.invalidateQueries({ queryKey: ["supplier-profile"] });
      },
    }),
  };
};

// Invoices
export const useSupplierInvoices = (params: { supplier_id?: string; status?: string } = {}) =>
  useQuery({
    queryKey: ["supplier-invoices", params],
    queryFn: async () => {
      const qs = new URLSearchParams(params as any).toString();
      return unwrap<SupplierInvoice[]>(await api.get<any>(`/procurement/invoices${qs ? `?${qs}` : ""}`));
    },
  });

export const useSupplierInvoiceMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["supplier-invoices"] });
    qc.invalidateQueries({ queryKey: ["supplier-profile"] });
  };
  return {
    create: useMutation({
      mutationFn: (body: any) =>
        api.post<any>("/procurement/invoices", body).then(unwrap<SupplierInvoice>),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        api.patch<any>(`/procurement/invoices/${id}/status`, { status }).then(unwrap<SupplierInvoice>),
      onSuccess: invalidate,
    }),
  };
};
// Purchase orders (from inventory) — needed to raise GRNs and invoices.
export interface PurchaseOrderItem {
  id: string;
  item_id?: string | null;
  item_name?: string;
  quantity: number;
  unit_price: number;
}
export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name?: string;
  status: string;
  order_date?: string;
  total_amount?: number;
}

export const usePurchaseOrders = () =>
  useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () =>
      unwrap<PurchaseOrder[]>(await api.get<any>("/inventory/purchase-orders")) || [],
  });

export const usePurchaseOrderItems = (poId?: string | null) =>
  useQuery({
    queryKey: ["purchase-order-items", poId],
    enabled: !!poId,
    queryFn: async () =>
      unwrap<PurchaseOrderItem[]>(
        await api.get<any>(`/inventory/purchase-orders/${poId}/items`),
      ) || [],
  });

export const useGRN = (id?: string | null) =>
  useQuery({
    queryKey: ["grns", "one", id],
    enabled: !!id,
    queryFn: async () => unwrap<GRN>(await api.get<any>(`/procurement/grns/${id}`)),
  });
