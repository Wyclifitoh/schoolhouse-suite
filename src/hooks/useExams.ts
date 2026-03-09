import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ExamRow {
  id: string; name: string; type: string; term: string;
  start_date: string; end_date: string; status: string; classes: string[];
}

export interface ExamScheduleRow {
  id: string; exam: string; subject: string; date: string;
  start_time: string; end_time: string; room: string; full_marks: number; pass_marks: number; class: string;
}

export interface MarksRow {
  id: string; student: string; admission_no: string;
  math: number; english: number; kiswahili: number; science: number;
  social_studies: number; cre: number; total: number; percentage: number;
  grade: string; rank: number;
}

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/classes/exams");
        return (data?.data || data || []) as ExamRow[];
      } catch { return [] as ExamRow[]; }
    },
  });
}

export function useExamSchedules(examId?: string) {
  return useQuery({
    queryKey: ["exam-schedules", examId],
    queryFn: async () => {
      try {
        const params = examId ? `?exam_id=${examId}` : "";
        const data = await api.get<any>(`/classes/exam-schedules${params}`);
        return (data?.data || data || []) as ExamScheduleRow[];
      } catch { return [] as ExamScheduleRow[]; }
    },
  });
}

export function useMarksRegister(examId?: string, classFilter?: string) {
  return useQuery({
    queryKey: ["marks-register", examId, classFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (examId) params.set("exam_id", examId);
        if (classFilter) params.set("class", classFilter);
        const data = await api.get<any>(`/classes/marks?${params}`);
        return (data?.data || data || []) as MarksRow[];
      } catch { return [] as MarksRow[]; }
    },
  });
}
