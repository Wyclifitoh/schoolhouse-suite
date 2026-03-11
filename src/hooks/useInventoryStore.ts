import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface InventoryItem {
  id: string; name: string; sku: string; description: string | null;
  category_id: string | null; category_name: string | null;
  cost_price: number; selling_price: number; quantity_in_stock: number;
  reorder_level: number; unit: string | null; is_active: boolean;
}

export interface InventoryCategory {
  id: string; name: string; description: string | null;
}

export interface InventoryTransaction {
  id: string; item_id: string; item_name: string; sku: string;
  type: string; quantity: number; unit_price: number; total_amount: number;
  notes: string | null; created_at: string;
}

export function useInventoryItems(search?: string, categoryId?: string) {
  return useQuery({
    queryKey: ["inventory-items", search, categoryId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (categoryId) params.set("category_id", categoryId);
        params.set("limit", "200");
        const data = await api.get<any>(`/inventory/items?${params}`);
        return (data?.data || data || []) as InventoryItem[];
      } catch { return [] as InventoryItem[]; }
    },
  });
}

export function useInventoryCategories() {
  return useQuery({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/inventory/categories");
        return (data?.data || data || []) as InventoryCategory[];
      } catch { return [] as InventoryCategory[]; }
    },
  });
}

export function useInventoryTransactions(type?: string) {
  return useQuery({
    queryKey: ["inventory-transactions", type],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (type) params.set("type", type);
        params.set("limit", "100");
        const data = await api.get<any>(`/inventory/transactions?${params}`);
        return (data?.data || data || []) as InventoryTransaction[];
      } catch { return [] as InventoryTransaction[]; }
    },
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) => api.post<InventoryItem>("/inventory/items", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-items"] }); toast.success("Product added!"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateInventoryCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InventoryCategory>) => api.post<InventoryCategory>("/inventory/categories", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-categories"] }); toast.success("Category created!"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateInventoryTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<InventoryTransaction>("/inventory/transactions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      qc.invalidateQueries({ queryKey: ["inventory-transactions"] });
      toast.success("Transaction recorded!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
