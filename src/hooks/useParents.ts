import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface ParentRow {
  id: string; first_name: string; last_name: string; phone: string;
  alt_phone: string | null; email: string | null; id_number: string | null;
  occupation: string | null; employer: string | null; address: string | null;
  school_id: string; user_id: string | null; created_at: string | null; updated_at: string | null;
}

export function useParents(search?: string) {
  return useQuery({
    queryKey: ["parents", search],
    queryFn: async () => {
      const params = new URLSearchParams(); if (search) params.set("search", search);
      const result = await api.get<any>(`/parents?${params}`);
      return (result?.data || result || []) as ParentRow[];
    },
  });
}

export function useParentWithChildren(parentId: string | undefined) {
  return useQuery({
    queryKey: ["parent-children", parentId],
    queryFn: () => api.get<{ children: any[] }>(`/parents/${parentId}`),
    enabled: !!parentId,
  });
}

export function useCreateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ParentRow>) => api.post<ParentRow>("/parents", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parents"] }); toast.success("Parent added!"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ParentRow> }) => api.put(`/parents/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parents"] }); toast.success("Parent updated!"); },
    onError: (err: Error) => toast.error(err.message),
  });
}
