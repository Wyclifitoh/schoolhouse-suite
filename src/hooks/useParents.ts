import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface ParentRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  alt_phone: string | null;
  email: string | null;
  id_number: string | null;
  occupation: string | null;
  employer: string | null;
  address: string | null;
  school_id: string;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PortalAccount {
  id: string;
  identifier: string;
  is_active: number;
  must_change_pin: number;
  last_login_at: string | null;
  created_at: string | null;
}

export function useParents(search?: string) {
  return useQuery({
    queryKey: ["parents", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const result = await api.get<any>(`/parents?${params}`);
      return (result?.data || result || []) as ParentRow[];
    },
  });
}

export function useParentWithChildren(parentId: string | undefined) {
  return useQuery({
    queryKey: ["parent-children", parentId],
    queryFn: () => api.get<any>(`/parents/${parentId}`),
    enabled: !!parentId,
  });
}

export function useParentPortalAccount(parentId: string | undefined) {
  return useQuery({
    queryKey: ["parent-portal-account", parentId],
    queryFn: () =>
      api.get<PortalAccount | null>(`/parents/${parentId}/portal-account`),
    enabled: !!parentId,
  });
}

export function useCreateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ParentRow>) =>
      api.post<ParentRow>("/parents", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      toast.success("Parent added!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ParentRow> }) =>
      api.put(`/parents/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      qc.invalidateQueries({ queryKey: ["student-parents"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Parent updated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      api.delete(`/parents/${id}${force ? "?force=1" : ""}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      toast.success("Parent deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreatePortalAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (parentId: string) =>
      api.post<{ pin: string; identifier: string }>(
        `/parents/${parentId}/portal-account`,
        {},
      ),
    onSuccess: (data: any, parentId) => {
      qc.invalidateQueries({ queryKey: ["parent-portal-account", parentId] });
      qc.invalidateQueries({ queryKey: ["parents"] });
      const pin = data?.pin || data?.data?.pin;
      toast.success(`Account created. Temporary PIN: ${pin}`, {
        duration: 10000,
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResetPortalPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (parentId: string) =>
      api.post<{ pin: string }>(
        `/parents/${parentId}/portal-account/reset-pin`,
        {},
      ),
    onSuccess: (data: any, parentId) => {
      qc.invalidateQueries({ queryKey: ["parent-portal-account", parentId] });
      const pin = data?.pin || data?.data?.pin;
      toast.success(`PIN reset. New PIN: ${pin}`, { duration: 10000 });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTogglePortalAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (parentId: string) =>
      api.post(`/parents/${parentId}/portal-account/toggle`, {}),
    onSuccess: (_d, parentId) => {
      qc.invalidateQueries({ queryKey: ["parent-portal-account", parentId] });
      toast.success("Portal account toggled");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
