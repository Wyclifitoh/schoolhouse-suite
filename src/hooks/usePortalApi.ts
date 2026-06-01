import { useQuery } from "@tanstack/react-query";
import { portalApi } from "@/lib/portalApi";

export interface PortalReportCard {
  id: string;
  assessment_id: string;
  assessment_name: string;
  published_at: string;
  teacher_remarks: string | null;
  principal_remarks: string | null;
  payload: {
    student?: { first_name: string; last_name: string; admission_number: string };
    grade_name?: string;
    stream_name?: string | null;
    percentage?: number;
    mean_score?: number;
    overall_al?: string | null;
    overall_band?: string | null;
    class_position?: number | null;
    stream_position?: number | null;
    grade_position?: number | null;
    subjects?: Array<{
      subject_name: string;
      subject_code?: string;
      score: number | null;
      out_of: number;
      achievement_level_code: string | null;
      band_code: string | null;
      points: number | null;
      remarks: string | null;
    }>;
    competencies?: Array<{ name: string; rating: string }>;
  };
}

export function usePortalReportCards(studentId?: string) {
  return useQuery({
    queryKey: ["portal-report-cards", studentId],
    enabled: !!studentId,
    queryFn: async () =>
      (await portalApi.get<PortalReportCard[]>(
        `/portal/students/${studentId}/report-cards`,
      )) || [],
  });
}

export function usePortalStudentSummary(studentId?: string) {
  return useQuery({
    queryKey: ["portal-student-summary", studentId],
    enabled: !!studentId,
    queryFn: async () =>
      portalApi.get<{
        student: any;
        attendance: {
          present_days: number;
          absent_days: number;
          late_days: number;
          total_days: number;
        } | null;
        fees: { total_billed: number; total_paid: number; balance: number };
      }>(`/portal/students/${studentId}/summary`),
  });
}
