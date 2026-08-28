/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

/**
 * Store operations data layer: the stock ledger, the inventory command centre,
 * staff issuance / returns and inventory reports.
 *
 * Every stock number the UI shows comes from the backend ledger — the client
 * never computes balances itself.
 */

export interface InventoryOverview {
  kpis: {
    total_items: number;
    total_units: number;
    low_stock: number;
    out_of_stock: number;
    stock_value: number;
    issued_to_staff: number;
    items_sold: number;
    sales_value: number;
    pending_purchase_orders: number;
    awaiting_return: number;
  };
  low_stock: any[];
  recent_movements: any[];
  recent_issuances: any[];
}

export function useInventoryOverview() {
  return useQuery({
    queryKey: ["inventory-overview"],
    queryFn: () => api.get<InventoryOverview>("/inventory/overview"),
  });
}

export function useStockMovements(filters: { type?: string; item_id?: string } = {}) {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.item_id) params.set("item_id", filters.item_id);
  return useQuery({
    queryKey: ["inventory-movements", filters],
    queryFn: () => api.get<any[]>(`/inventory/movements?${params}`),
  });
}

export function useMovementTypes() {
  return useQuery({
    queryKey: ["inventory-movement-types"],
    queryFn: () =>
      api.get<{ key: string; label: string; direction: string }[]>(
        "/inventory/movement-types",
      ),
    staleTime: 60 * 60 * 1000,
  });
}

export function useItemHistory(itemId?: string) {
  return useQuery({
    queryKey: ["inventory-item-history", itemId],
    queryFn: () => api.get<any>(`/inventory/items/${itemId}/history`),
    enabled: !!itemId,
  });
}

// ---------- Issuances ----------

export interface Issuance {
  id: string;
  staff_id: string;
  staff_name: string;
  department_name: string | null;
  employee_number: string | null;
  status: "issued" | "partially_returned" | "returned";
  issue_date: string;
  purpose: string | null;
  notes: string | null;
  issued_by_name: string | null;
  items?: any[];
}

export function useIssuances(
  filters: { status?: string; staff_id?: string; search?: string } = {},
) {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.staff_id) params.set("staff_id", filters.staff_id);
  if (filters.search) params.set("search", filters.search);
  return useQuery({
    queryKey: ["inventory-issuances", filters],
    queryFn: () => api.get<Issuance[]>(`/inventory/issuances?${params}`),
  });
}

export function useIssuance(id?: string) {
  return useQuery({
    queryKey: ["inventory-issuance", id],
    queryFn: () => api.get<Issuance>(`/inventory/issuances/${id}`),
    enabled: !!id,
  });
}

export function useStaffIssuedItems(staffId?: string) {
  return useQuery({
    queryKey: ["inventory-staff-issued", staffId],
    queryFn: () => api.get<any>(`/inventory/staff/${staffId}/issued`),
    enabled: !!staffId,
  });
}

const invalidateStore = (qc: ReturnType<typeof useQueryClient>) => {
  [
    "inventory-overview",
    "inventory-items",
    "inventory-movements",
    "inventory-issuances",
    "inventory-staff-issued",
    "inventory-item-history",
  ].forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
};

export function useCreateIssuance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      staff_id: string;
      purpose?: string;
      issue_date?: string;
      department_id?: string | null;
      notes?: string;
      items: { item_id: string; quantity: number; condition_out?: string; notes?: string }[];
    }) => api.post<Issuance>("/inventory/issuances", payload),
    onSuccess: () => {
      invalidateStore(qc);
      toast.success("Items issued to staff");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useProcessReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      notes?: string;
      items: {
        /** inventory_issuance_items.id */
        id: string;
        quantity: number;
        condition_in?: string;
        notes?: string;
      }[];
    }) => api.post<Issuance>(`/inventory/issuances/${id}/return`, payload),
    onSuccess: () => {
      invalidateStore(qc);
      toast.success("Return recorded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---------- Reports ----------

export interface InventoryReportMeta {
  key: string;
  label: string;
  description?: string;
}

export function useInventoryReports() {
  return useQuery({
    queryKey: ["inventory-reports"],
    queryFn: () => api.get<InventoryReportMeta[]>("/inventory/reports"),
  });
}

export function useInventoryReport(
  key?: string,
  range: { from?: string; to?: string } = {},
) {
  const params = new URLSearchParams();
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
  return useQuery({
    queryKey: ["inventory-report", key, range],
    queryFn: () => api.get<{ key: string; label: string; rows: any[] }>(
        `/inventory/reports/${key}?${params}`,
      ),
    enabled: !!key,
  });
}
