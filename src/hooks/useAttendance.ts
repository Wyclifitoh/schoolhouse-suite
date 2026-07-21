import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface StudentAttendanceRow {
  id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  grade: string;
  grade_name?: string | null;
  stream_name?: string | null;
  stream_id?: string | null;
  date: string;
  status: AttendanceStatus;
  remarks?: string | null;
  is_marked: number;
}

interface SaveAttendancePayload {
  date: string;
  records: { student_id: string; status: AttendanceStatus; remarks?: string }[];
}

export function useStudentAttendance(date: string, gradeFilter?: string) {
  return useQuery({
    queryKey: ["attendance", "register", date, gradeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ date });
      if (gradeFilter && gradeFilter !== "all")
        params.set("grade", gradeFilter);
      const res = await api.get<any>(`/attendance?${params}`);
      const data = res?.data ?? res ?? [];
      return (data as any[]).map((s) => ({
        id: s.attendance_id || s.student_id,
        student_id: s.student_id,
        student_name:
          s.student_name || `${s.first_name || ""} ${s.last_name || ""}`.trim(),
        admission_number: s.admission_number,
        grade: s.current_grade_id || "",
        grade_name: s.grade_name,
        stream_name: s.stream_name,
        stream_id: s.current_stream_id,
        date,
        status: (s.status || "present") as AttendanceStatus,
        remarks: s.remarks ?? null,
        is_marked: Number(s.is_marked) || 0,
      })) as StudentAttendanceRow[];
    },
  });
}

export function useAttendanceSummary(
  year: number,
  month: number,
  gradeFilter?: string,
) {
  return useQuery({
    queryKey: ["attendance", "summary", year, month, gradeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
      });
      if (gradeFilter && gradeFilter !== "all")
        params.set("grade", gradeFilter);
      const res = await api.get<any>(`/attendance/summary?${params}`);
      return (res?.data ?? res ?? []) as any[];
    },
  });
}

export function useSaveAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveAttendancePayload) => {
      const res = await api.post<any>("/attendance/bulk", payload);
      return res?.data ?? res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (record: {
      student_id: string;
      date: string;
      status: AttendanceStatus;
      remarks?: string;
    }) => api.post("/attendance", record),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/attendance/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Record cleared");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
