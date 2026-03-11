import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface SchoolProfile {
  id: string; name: string; code: string; email: string; phone: string;
  logo_url: string | null; address: string | null; curriculum_type: string;
  paybill_number: string | null;
}

export interface SchoolUser {
  id: string; email: string; full_name: string; phone: string | null;
  is_active: boolean; last_login_at: string | null; roles: string;
}

export interface NotificationTemplate {
  id: string; name: string; event_type: string; channel: string;
  subject: string | null; body: string; is_active: boolean;
}

export interface TermRow {
  id: string; name: string; start_date: string; end_date: string;
  is_current: boolean; academic_year_name: string;
}

export function useSchoolProfile() {
  return useQuery({
    queryKey: ["school-profile"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/schools/profile");
        return (data?.data || data || null) as SchoolProfile | null;
      } catch { return null; }
    },
  });
}

export function useUpdateSchoolProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SchoolProfile>) => api.put<SchoolProfile>("/schools/profile", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["school-profile"] }); toast.success("School profile updated!"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSchoolTerms() {
  return useQuery({
    queryKey: ["school-terms"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/schools/terms");
        return (data?.data || data || []) as TermRow[];
      } catch { return [] as TermRow[]; }
    },
  });
}

export function useSchoolUsers() {
  return useQuery({
    queryKey: ["school-users"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/schools/users");
        return (data?.data || data || []) as SchoolUser[];
      } catch { return [] as SchoolUser[]; }
    },
  });
}

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/schools/notification-templates");
        return (data?.data || data || []) as NotificationTemplate[];
      } catch { return [] as NotificationTemplate[]; }
    },
  });
}

export function useUpdateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationTemplate> }) =>
      api.put<NotificationTemplate>(`/schools/notification-templates/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notification-templates"] }); toast.success("Template updated!"); },
    onError: (err: Error) => toast.error(err.message),
  });
}
