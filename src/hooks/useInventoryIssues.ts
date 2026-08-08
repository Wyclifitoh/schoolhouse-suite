import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface InventoryIssue {
  id: string;
  item_id: string;
  item_name: string;
  sku: string | null;
  unit: string | null;
  staff_id: string;
  staff_name: string | null;
  employee_number: string | null;
  quantity: number;
  quantity_returned: number;
  status: "issued" | "partially_returned" | "returned";
  issued_at: string;
  due_date: string | null;
  returned_at: string | null;
  notes: string | null;
}

export interface IssueFilters {
  status?: string;
  staffId?: string;
  search?: string;
}

export function useInventoryIssues(filters: IssueFilters = {}) {
  return useQuery({
    queryKey: ["inventory-issues", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      if (filters.staffId) params.set("staff_id", filters.staffId);
      if (filters.search) params.set("search", filters.search);
      params.set("limit", "200");
      try {
        const res = await api.get<any>(`/inventory/issues?${params}`);
        return (res?.data || res || []) as InventoryIssue[];
      } catch {
        return [] as InventoryIssue[];
      }
    },
  });
}

export function useInventoryIssueSummary() {
  return useQuery({
    queryKey: ["inventory-issues-summary"],
    queryFn: async () => {
      try {
        const res = await api.get<any>("/inventory/issues/summary");
        return (res?.data || res || {}) as {
          total_assignments: number;
          items_out: number;
          staff_holding: number;
        };
      } catch {
        return { total_assignments: 0, items_out: 0, staff_holding: 0 };
      }
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["inventory-issues"] });
    qc.invalidateQueries({ queryKey: ["inventory-issues-summary"] });
    qc.invalidateQueries({ queryKey: ["inventory-items"] });
  };
}

export function useAssignItem() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: {
      item_id: string;
      staff_id: string;
      quantity: number;
      due_date?: string | null;
      notes?: string | null;
    }) => api.post("/inventory/issues", data),
    onSuccess: () => {
      invalidate();
      toast.success("Item assigned to staff member");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReturnIssue() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity?: number }) =>
      api.post(`/inventory/issues/${id}/return`, { quantity }),
    onSuccess: () => {
      invalidate();
      toast.success("Return recorded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteIssue() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/issues/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Assignment removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
