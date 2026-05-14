import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface ExamRow {
  id: string;
  name: string;
  type: string;
  term: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  curriculum_type: string;
  description: string | null;
  classes: string[];
}

export interface ExamScheduleRow {
  id: string;
  exam_id: string;
  exam_name?: string;
  subject_name: string;
  grade_id: string | null;
  grade_name?: string | null;
  stream_id: string | null;
  stream_name?: string | null;
  exam_date: string | null;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  full_marks: number;
  pass_marks: number;
  // legacy compat (old UI fields)
  subject?: string;
  date?: string;
  class?: string;
}

export type CbcLevel = "EE" | "ME" | "AE" | "BE";

export interface ExamMarkRow {
  id: string;
  exam_id: string;
  student_id: string;
  student_name?: string;
  admission_number?: string;
  subject_name: string;
  score: number | null;
  out_of: number | null;
  performance_level: CbcLevel | null;
  performance_score: number | null;
  remarks: string | null;
  grade_id?: string;
  stream_id?: string;
  grade_name?: string;
  stream_name?: string;
  // legacy compat (old UI fields)
  student?: string;
  admission_no?: string;
  math?: number;
  english?: number;
  kiswahili?: number;
  science?: number;
  social_studies?: number;
  cre?: number;
  total?: number;
  percentage?: number;
  grade?: string;
  rank?: number;
}

const unwrap = <T>(d: any): T => (d?.data ?? d) as T;

// ===== Exams =====
export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      try {
        return (
          unwrap<ExamRow[]>(await api.get<any>("/examinations/exams")) || []
        );
      } catch {
        return [] as ExamRow[];
      }
    },
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: Partial<ExamRow> & {
        classes?: Array<{ grade_id: string; stream_id?: string | null }>;
      },
    ) => api.post<any>("/examinations/exams", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam created");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create exam"),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<ExamRow>) =>
      api.put<any>(`/examinations/exams/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam updated");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update exam"),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<any>(`/examinations/exams/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete exam"),
  });
}

// ===== Schedules =====
export function useExamSchedules(examId?: string) {
  return useQuery({
    queryKey: ["exam-schedules", examId],
    queryFn: async () => {
      try {
        const qs = examId ? `?exam_id=${examId}` : "";
        return (
          unwrap<ExamScheduleRow[]>(
            await api.get<any>(`/examinations/schedules${qs}`),
          ) || []
        );
      } catch {
        return [] as ExamScheduleRow[];
      }
    },
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ExamScheduleRow>) =>
      api.post<any>("/examinations/schedules", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-schedules"] });
      toast.success("Schedule added");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add schedule"),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<any>(`/examinations/schedules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-schedules"] });
      toast.success("Schedule deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete"),
  });
}

// ===== Marks =====
export function useMarksRegister(
  examId?: string,
  filters: { grade_id?: string; stream_id?: string; student_id?: string } = {},
) {
  return useQuery({
    queryKey: ["exam-marks", examId, filters],
    queryFn: async () => {
      try {
        const qp = new URLSearchParams();
        if (examId) qp.set("exam_id", examId);
        if (filters.grade_id) qp.set("grade_id", filters.grade_id);
        if (filters.stream_id) qp.set("stream_id", filters.stream_id);
        if (filters.student_id) qp.set("student_id", filters.student_id);
        return (
          unwrap<ExamMarkRow[]>(
            await api.get<any>(`/examinations/marks?${qp}`),
          ) || []
        );
      } catch {
        return [] as ExamMarkRow[];
      }
    },
    enabled: !!examId,
  });
}

export function useRecordMark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ExamMarkRow>) =>
      api.post<any>("/examinations/marks", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-marks"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save mark"),
  });
}

export function useBulkSaveMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (marks: Partial<ExamMarkRow>[]) =>
      api.post<any>("/examinations/marks/bulk", { marks }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["exam-marks"] });
      toast.success(`${res?.saved ?? 0} marks saved`);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save marks"),
  });
}

export const CBC_LEVELS: { value: CbcLevel; label: string; score: number }[] = [
  { value: "EE", label: "Exceeding Expectations", score: 4 },
  { value: "ME", label: "Meeting Expectations", score: 3 },
  { value: "AE", label: "Approaching Expectations", score: 2 },
  { value: "BE", label: "Below Expectations", score: 1 },
];
