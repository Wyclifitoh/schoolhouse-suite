import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PortalSubject {
  subject_name: string;
  score: number | null;
  out_of: number | null;
  grade: string | null;
  points: number | null;
  performance_level: string | null;
  remarks: string | null;
}
export interface PortalExamResult {
  exam_id: string;
  exam_name: string;
  exam_type: string | null;
  curriculum_type: string | null;
  published_at: string | null;
  academic_year_name: string | null;
  term_name: string | null;
  subjects: PortalSubject[];
  total: number;
  out_of_total: number;
  mean: number;
  percentage: number;
}

const unwrap = <T,>(d: any): T => (d?.data ?? d) as T;

/**
 * Parent / student portal — APPROVED + published exam results only.
 * Backend enforces gating; this hook just fetches.
 */
export function usePortalResults(studentId?: string) {
  return useQuery<PortalExamResult[]>({
    queryKey: ["portal-results", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      try {
        const d = await api.get<any>(`/examinations/portal/results?student_id=${studentId}`);
        return unwrap<PortalExamResult[]>(d) || [];
      } catch {
        return [];
      }
    },
    enabled: !!studentId,
  });
}
