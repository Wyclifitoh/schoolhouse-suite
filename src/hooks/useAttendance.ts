import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface StudentAttendanceRow {
  id: string; student_id: string; student_name: string; admission_number: string;
  grade: string; stream: string; date: string; status: "present" | "absent" | "late" | "excused";
}

export function useStudentAttendance(date: string, gradeFilter?: string) {
  return useQuery({
    queryKey: ["student-attendance", date, gradeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ date });
      if (gradeFilter && gradeFilter !== "all") params.set("grade", gradeFilter);
      const data = await api.get<any[]>(`/attendance?${params}`);
      return (data || []).map((s: any) => ({
        id: s.attendance_id || s.student_id,
        student_id: s.student_id,
        student_name: s.full_name || `${s.first_name} ${s.last_name}`,
        admission_number: s.admission_number,
        grade: s.grade || "",
        stream: s.stream || "",
        date,
        status: s.status || "present",
      })) as StudentAttendanceRow[];
    },
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: { student_id: string; date: string; status: string }[]) =>
      api.post("/attendance", { records }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["student-attendance"] }); toast.success("Attendance saved!"); },
  });
}
