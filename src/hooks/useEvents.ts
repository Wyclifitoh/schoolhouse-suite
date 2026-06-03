import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const unwrap = <T,>(d: any): T => (d?.data ?? d) as T;

export interface CalendarEvent {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: 0 | 1 | boolean;
  color: string;
  category: string;
  audience: "all" | "staff" | "teachers" | "students" | "parents";
  grade_id: string | null;
  stream_id: string | null;
  reminder_minutes: number;
  reminder_sent: 0 | 1 | boolean;
  created_by: string | null;
}

export function useEvents(filters: { from?: string; to?: string; audience?: string } = {}) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: async () => {
      const qp = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && qp.set(k, v));
      return unwrap<CalendarEvent[]>(await api.get<any>(`/events?${qp}`)) || [];
    },
  });
}

export function useUpcomingEvents(limit = 5) {
  return useQuery({
    queryKey: ["events-upcoming", limit],
    queryFn: async () =>
      unwrap<CalendarEvent[]>(
        await api.get<any>(`/events/upcoming?limit=${limit}`),
      ) || [],
  });
}

export function useSaveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CalendarEvent> & { id?: string }) =>
      id ? api.put(`/events/${id}`, data) : api.post("/events", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["events-upcoming"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["events-upcoming"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
