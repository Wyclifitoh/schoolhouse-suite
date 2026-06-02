import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Club {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  patron_staff_id: string | null;
  patron_name?: string | null;
  student_leader_id: string | null;
  student_leader_name?: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_venue: string | null;
  status: "active" | "inactive" | "archived";
  member_count?: number;
}

const qstr = (params?: Record<string, any>) => {
  if (!params) return "";
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (filtered.length === 0) return "";
  return `?${filtered.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")}`;
};

// Clubs
export const useClubs = (params?: { search?: string; status?: string }) =>
  useQuery({
    queryKey: ["clubs", params],
    queryFn: async () => (await api.get<Club[]>(`/clubs${qstr(params)}`)) || [],
  });

export const useClub = (id?: string) =>
  useQuery({
    queryKey: ["club", id],
    queryFn: () => api.get<Club>(`/clubs/${id}`),
    enabled: !!id,
  });

export const useCreateClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Club>) => api.post("/clubs", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      toast.success("Club created");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useUpdateClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Club> }) =>
      api.put(`/clubs/${id}`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["club", vars.id] });
      toast.success("Club updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteClub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clubs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      toast.success("Club deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// Members
export const useClubMembers = (clubId?: string) =>
  useQuery({
    queryKey: ["club-members", clubId],
    queryFn: async () => api.get<any[]>(`/clubs/${clubId}/members`),
    enabled: !!clubId,
  });

export const useAddClubMembers = (clubId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (student_ids: string[]) =>
      api.post(`/clubs/${clubId}/members`, { student_ids }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["club-members", clubId] });
      qc.invalidateQueries({ queryKey: ["club", clubId] });
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["club-unassigned-students"] });
      const skipped = data?.data?.skipped || data?.skipped || [];
      if (skipped.length > 0) {
        toast.warning(`${skipped.length} student(s) already in a club`);
      } else {
        toast.success("Members added");
      }
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useRemoveClubMember = (clubId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      api.delete(`/clubs/${clubId}/members/${studentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["club-members", clubId] });
      qc.invalidateQueries({ queryKey: ["club", clubId] });
      qc.invalidateQueries({ queryKey: ["club-unassigned-students"] });
      toast.success("Member removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useSetClubLeader = (clubId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (student_id: string) =>
      api.put(`/clubs/${clubId}/leader`, { student_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["club-members", clubId] });
      qc.invalidateQueries({ queryKey: ["club", clubId] });
      toast.success("Student leader set");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useUnassignedStudents = (search?: string) =>
  useQuery({
    queryKey: ["club-unassigned-students", search],
    queryFn: () =>
      api.get<any[]>(
        `/clubs/students/unassigned${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      ),
  });

// Meetings
export const useClubMeetings = (clubId?: string) =>
  useQuery({
    queryKey: ["club-meetings", clubId],
    queryFn: async () => api.get<any[]>(`/clubs/${clubId}/meetings`),
    enabled: !!clubId,
  });

export const useCreateClubMeeting = (clubId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/clubs/${clubId}/meetings`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["club-meetings", clubId] });
      toast.success("Meeting scheduled");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useUpdateClubMeeting = (clubId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/clubs/meetings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["club-meetings", clubId] });
      toast.success("Meeting updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteClubMeeting = (clubId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clubs/meetings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["club-meetings", clubId] });
      toast.success("Meeting deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// Attendance
export const useMeetingAttendance = (meetingId?: string) =>
  useQuery({
    queryKey: ["club-meeting-attendance", meetingId],
    queryFn: async () =>
      api.get<any[]>(`/clubs/meetings/${meetingId}/attendance`),
    enabled: !!meetingId,
  });

export const useSaveAttendance = (meetingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: any[]) =>
      api.post(`/clubs/meetings/${meetingId}/attendance`, { records }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["club-meeting-attendance", meetingId],
      });
      qc.invalidateQueries({ queryKey: ["club-meetings"] });
      toast.success("Attendance saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// Achievements
export const useClubAchievements = (clubId?: string) =>
  useQuery({
    queryKey: ["club-achievements", clubId],
    queryFn: async () =>
      api.get<any[]>(`/clubs/${clubId}/achievements`),
    enabled: !!clubId,
  });

export const useCreateAchievement = (clubId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post(`/clubs/${clubId}/achievements`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["club-achievements", clubId] });
      toast.success("Achievement added");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteAchievement = (clubId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clubs/achievements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["club-achievements", clubId] });
      toast.success("Achievement removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

// Reports
export const useClubsSummary = () =>
  useQuery({
    queryKey: ["clubs-summary"],
    queryFn: () => api.get<any>("/clubs/reports/summary"),
  });
