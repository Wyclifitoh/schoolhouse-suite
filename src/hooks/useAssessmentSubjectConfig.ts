import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export interface AscPaper {
  id?: string;
  paper_id?: string;
  name: string;
  code?: string | null;
  paper_type: "THEORY" | "PRACTICAL" | "ORAL" | "PROJECT" | string;
  max_marks: number;
  contribution_pct: number;
  display_order?: number;
}

export interface AscRow {
  grade_id: string;
  subject_id: string;
  grade_name: string;
  subject_name: string;
  subject_code?: string;
  curriculum_type?: string;
  calculation_type?: string;
  calculation_config?: Record<string, unknown> | null;
  uses_papers: 0 | 1;
  uses_contribution: 0 | 1;
  grading_system_id?: string | null;
  paper_count: number;
  is_customized: 0 | 1;
  is_locked: boolean;
  locked_at?: string | null;
  customized_at?: string | null;
}

export interface AscDetail extends AscRow {
  papers: AscPaper[];
}

export function useAssessmentSubjectConfigList(assessmentId?: string) {
  return useQuery<AscRow[]>({
    queryKey: ["assessment-subject-config", assessmentId],
    enabled: !!assessmentId,
    queryFn: () =>
      api.get<AscRow[]>(`/assessments/${assessmentId}/subject-config`),
  });
}

export function useAssessmentSubjectConfig(
  assessmentId?: string,
  gradeId?: string,
  subjectId?: string,
) {
  return useQuery<AscDetail>({
    queryKey: ["assessment-subject-config", assessmentId, gradeId, subjectId],
    enabled: !!assessmentId && !!gradeId && !!subjectId,
    queryFn: () =>
      api.get<AscDetail>(
        `/assessments/${assessmentId}/subject-config/${gradeId}/${subjectId}`,
      ),
  });
}

export function useUpdateAssessmentSubjectConfig(assessmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      grade_id: string;
      subject_id: string;
      body: Partial<AscDetail> & { papers?: AscPaper[] };
    }) =>
      api.put<AscDetail>(
        `/assessments/${assessmentId}/subject-config/${payload.grade_id}/${payload.subject_id}`,
        payload.body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-subject-config", assessmentId] });
      toast({ title: "Assessment subject configuration saved" });
    },
    onError: (e: any) =>
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive",
      }),
  });
}

export function useResetAssessmentSubjectConfig(assessmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { grade_id: string; subject_id: string }) =>
      api.post<AscDetail>(
        `/assessments/${assessmentId}/subject-config/${payload.grade_id}/${payload.subject_id}/reset`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-subject-config", assessmentId] });
      toast({ title: "Reset to subject default" });
    },
    onError: (e: any) =>
      toast({
        title: "Reset failed",
        description: e.message,
        variant: "destructive",
      }),
  });
}