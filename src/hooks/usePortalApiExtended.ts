import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { portalApi } from "@/lib/portalApi";

export interface PortalFullStudent {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  admission_number: string;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  religion: string | null;
  upi: string | null;
  admission_date: string | null;
  status: string | null;
  photo_url: string | null;
  house: string | null;
  grade_name: string | null;
  stream_name: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  school_name?: string;
  school_logo?: string | null;
}

export function usePortalProfile(studentId?: string) {
  return useQuery({
    queryKey: ["portal-profile", studentId],
    enabled: !!studentId,
    queryFn: () => portalApi.get<PortalFullStudent>(`/portal/students/${studentId}/profile`),
  });
}

export interface PortalHomework {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  class_name: string;
  section: string | null;
  assigned_date: string;
  due_date: string;
  max_marks: number | null;
  attachment_url: string | null;
  status: string;
  teacher_name: string | null;
  submission_status: string | null;
  submitted_at: string | null;
  computed_status: "pending" | "submitted" | "overdue";
}

export function usePortalHomework(studentId?: string) {
  return useQuery({
    queryKey: ["portal-homework", studentId],
    enabled: !!studentId,
    queryFn: async () =>
      (await portalApi.get<PortalHomework[]>(
        `/portal/students/${studentId}/homework`,
      )) || [],
  });
}

export interface PortalAttendanceDay {
  date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks: string | null;
}

export function usePortalAttendanceCalendar(studentId?: string, month?: string) {
  return useQuery({
    queryKey: ["portal-attendance-cal", studentId, month],
    enabled: !!studentId && !!month,
    queryFn: async () =>
      (await portalApi.get<PortalAttendanceDay[]>(
        `/portal/students/${studentId}/attendance/calendar?month=${month}`,
      )) || [],
  });
}

export function usePortalAttendanceRecent(studentId?: string, days = 30) {
  return useQuery({
    queryKey: ["portal-attendance-recent", studentId, days],
    enabled: !!studentId,
    queryFn: async () =>
      (await portalApi.get<PortalAttendanceDay[]>(
        `/portal/students/${studentId}/attendance/recent?days=${days}`,
      )) || [],
  });
}

export interface PortalTimetable {
  periods: Array<{
    id: string;
    label: string;
    start_time: string;
    end_time: string;
    position: number;
    kind: string;
  }>;
  entries: Array<{
    id: string;
    day: string;
    period: number;
    subject_id: string | null;
    teacher_id: string | null;
    room: string | null;
    subject_name: string | null;
    subject_code: string | null;
    teacher_name: string | null;
  }>;
}

export function usePortalTimetable(studentId?: string) {
  return useQuery({
    queryKey: ["portal-timetable", studentId],
    enabled: !!studentId,
    queryFn: () =>
      portalApi.get<PortalTimetable>(`/portal/students/${studentId}/timetable`),
  });
}

export interface PortalEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: number;
  color: string | null;
  category: string | null;
}

export function usePortalEvents(studentId?: string, range?: { from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  return useQuery({
    queryKey: ["portal-events", studentId, range?.from, range?.to],
    enabled: !!studentId,
    queryFn: async () =>
      (await portalApi.get<PortalEvent[]>(
        `/portal/students/${studentId}/events?${params}`,
      )) || [],
  });
}

export interface PortalNotification {
  id: string;
  type: "result" | "payment" | "homework" | "announcement";
  title: string;
  message: string;
  at: string;
  student_id: string;
}

export function usePortalNotifications() {
  return useQuery({
    queryKey: ["portal-notifications"],
    queryFn: () =>
      portalApi.get<{
        notifications: PortalNotification[];
        last_seen_at: string | null;
        unread_count: number;
      }>("/portal/notifications"),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => portalApi.post("/portal/notifications/seen", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-notifications"] }),
  });
}

export interface PortalAccount {
  id: string;
  account_type: "parent" | "student";
  identifier: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  preferences: Record<string, any> | null;
  school_name?: string;
}

export function usePortalAccount() {
  return useQuery({
    queryKey: ["portal-account"],
    queryFn: () => portalApi.get<PortalAccount>("/portal/account"),
  });
}

export function useUpdatePortalAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<PortalAccount>) =>
      portalApi.request<PortalAccount>("/portal/account", { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-account"] }),
  });
}

export function useChangePortalPin() {
  return useMutation({
    mutationFn: (new_pin: string) =>
      portalApi.post("/portal/change-pin", { new_pin }),
  });
}