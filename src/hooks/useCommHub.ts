import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  description?: string | null;
  category?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSmsTemplates(params: { search?: string; category?: string } = {}) {
  return useQuery({
    queryKey: ["sms-templates", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.search) q.set("search", params.search);
      if (params.category) q.set("category", params.category);
      const qs = q.toString();
      const data = await api.get<SmsTemplate[]>(`/communication/templates${qs ? `?${qs}` : ""}`);
      return data || [];
    },
  });
}

export function useCreateSmsTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SmsTemplate>) =>
      api.post<SmsTemplate>("/communication/templates", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("Template created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSmsTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SmsTemplate> }) =>
      api.put<SmsTemplate>(`/communication/templates/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("Template updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSmsTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/communication/templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("Template deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============== NOTICES ============== */
export interface Notice {
  id: string;
  title: string;
  message: string;
  audience: "all" | "parents" | "teachers" | "staff" | "students";
  priority: "low" | "normal" | "high" | "urgent";
  status: "draft" | "published" | "archived";
  pinned: boolean;
  publish_at?: string | null;
  expires_at?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export function useNotices(params: { status?: string; audience?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["notices", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      if (params.audience) q.set("audience", params.audience);
      if (params.search) q.set("search", params.search);
      const data = await api.get<Notice[]>(`/communication/notices?${q}`);
      return (data as any) || [];
    },
  });
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Notice>) => api.post<Notice>("/communication/notices", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Notice> }) =>
      api.put<Notice>(`/communication/notices/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/communication/notices/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
