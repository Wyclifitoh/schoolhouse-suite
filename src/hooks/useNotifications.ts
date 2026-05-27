import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AppNotification {
  id: string;
  school_id: string;
  user_id: string | null;
  audience: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  source_type: string | null;
  source_id: string | null;
  created_at: string;
  expires_at: string | null;
  read_at: string | null;
}

export const useNotifications = (params: { limit?: number; unread?: boolean } = {}) => {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.unread) qs.set("unread", "true");
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => api.get<AppNotification[]>(`/notifications?${qs.toString()}`),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
};

export const useUnreadCount = () =>
  useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.get<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};
