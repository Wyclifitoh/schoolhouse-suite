import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface StudentAttendanceRow {
  id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  grade: string;
  stream: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
}

interface AttendanceRow {
  student_id: string;
  student_name: string;
  admission_number: string;
  grade_id: string;
  attendance_id: string | null;
  date: string | null;
  status: "present" | "absent" | "late" | "excused";
  remarks: string | null;
  is_marked: number; // 0 or 1 from backend
}

interface SaveAttendancePayload {
  date: string;
  records: {
    student_id: string;
    status: "present" | "absent" | "late";
    remarks?: string;
  }[];
}

export function useStudentAttendance(date: string, gradeFilter?: string) {
  return useQuery({
    queryKey: ["student-attendance", date, gradeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ date });
      if (gradeFilter && gradeFilter !== "all")
        params.set("grade", gradeFilter);
      const data = await api.get<any[]>(`/attendance?${params}`);
      return (data || []).map((s: any) => ({
        id: s.attendance_id || s.student_id,
        student_id: s.student_id,
        student_name:
          s.student_name ||
          s.full_name ||
          `${s.first_name || ""} ${s.last_name || ""}`.trim(),
        admission_number: s.admission_number,
        grade: s.current_grade_id || s.grade || "",
        stream: s.stream || "",
        date,
        status: s.status || "present",
        is_marked: s.is_marked,
      })) as StudentAttendanceRow[];
    },
  });
}

export function useSaveAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveAttendancePayload) => {
      const result = await api.post<{
        data: any;
        success: boolean;
        message: string;
        count: number;
      }>("/attendance/bulk", payload);
      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the cache for this specific date group so it pulls down the saved locked state
      queryClient.invalidateQueries({
        queryKey: ["attendance", "register"],
      });
    },
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      records: { student_id: string; date: string; status: string }[],
    ) => api.post("/attendance", { records }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-attendance"] });
      toast.success("Attendance saved!");
    },
  });
}
