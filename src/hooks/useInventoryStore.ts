import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface StoreItem {
  id: string; name: string; category: string; sku: string;
  buying_price: number; selling_price: number; quantity: number;
  min_stock: number; sizes?: string; status: string;
  sold_this_term: number; last_restocked: string;
}

export interface Supplier {
  id: string; name: string; contact: string; phone: string;
  email: string; location: string; category: string;
  rating: number; total_orders: number; total_spent: number; status: string;
}

export interface PurchaseOrder {
  id: string; date: string; supplier: string;
  items: Array<{ name: string; qty: number; unit_price: number }>;
  total: number; status: string; expected_date: string;
  delivered_date: string; payment_status: string;
}

export interface SaleRecord {
  id: string; date: string; student_name: string; admission_no: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number; payment_method: string; served_by: string;
}

export function useStoreItems(search?: string, category?: string) {
  return useQuery({
    queryKey: ["store-items", search, category],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category && category !== "all") params.set("category", category);
        const data = await api.get<any>(`/inventory/items?${params}`);
        return (data?.data || data || []) as StoreItem[];
      } catch { return [] as StoreItem[]; }
    },
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/inventory/suppliers");
        return (data?.data || data || []) as Supplier[];
      } catch { return [] as Supplier[]; }
    },
  });
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/inventory/purchase-orders");
        return (data?.data || data || []) as PurchaseOrder[];
      } catch { return [] as PurchaseOrder[]; }
    },
  });
}

export function useSalesRecords() {
  return useQuery({
    queryKey: ["sales-records"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/inventory/sales");
        return (data?.data || data || []) as SaleRecord[];
      } catch { return [] as SaleRecord[]; }
    },
  });
}
