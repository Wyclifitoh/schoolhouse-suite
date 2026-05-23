import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const unwrap = <T,>(d: any): T => (d?.data ?? d) as T;
const safeList = async <T,>(url: string) => {
  try { return unwrap<T[]>(await api.get<any>(url)) || []; } catch { return [] as T[]; }
};

// ===== Lifecycle =====
export function useExamLifecycle() {
  const qc = useQueryClient();
  const mk = (action: string, label: string) =>
    useMutation({
      mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
        api.post<any>(`/examinations/exams/${id}/${action}`, { reason }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["exams"] });
        qc.invalidateQueries({ queryKey: ["exam-marks"] });
        toast.success(`Exam ${label}`);
      },
      onError: (e: Error) => toast.error(e.message || `Failed to ${label}`),
    });
  return {
    submit: mk("submit", "submitted"),
    review: mk("review", "reviewed"),
    approve: mk("approve", "approved"),
    lock: mk("lock", "locked"),
    reopen: mk("reopen", "reopened"),
    archive: mk("archive", "archived"),
  };
}

export function useSubmitDraftMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => api.post<any>(`/examinations/marks/${examId}/submit`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-marks"] });
      toast.success("Marks submitted");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });
}

// ===== Analytics =====
export interface ExamAnalytics {
  summary: { marks_count: number; mean_score: number; min_score: number; max_score: number; passed: number } | null;
  subjects: Array<{ subject_name: string; mean: number; n: number }>;
  students: Array<{ student_id: string; student_name: string; total: number; mean: number; subjects: number }>;
}
export function useExamAnalytics(examId?: string) {
  return useQuery<ExamAnalytics>({
    queryKey: ["exam-analytics", examId],
    queryFn: () => api.get<any>(`/examinations/exams/${examId}/analytics`).then((d) => unwrap<ExamAnalytics>(d)),
    enabled: !!examId,
  });
}
export function useRecomputeRankings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) =>
      api.post<any>(`/examinations/exams/${examId}/rankings/recompute`, {}),
    onSuccess: (_, examId) => {
      qc.invalidateQueries({ queryKey: ["exam-analytics", examId] });
      toast.success("Rankings recomputed");
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });
}

// ===== Audit =====
export function useExamAudit(examId?: string) {
  return useQuery<any[]>({
    queryKey: ["exam-audit", examId],
    queryFn: () => api.get<any>(`/examinations/exams/${examId}/audit`).then((d) => unwrap<any[]>(d) || []),
    enabled: !!examId,
  });
}

// ===== Assessment types =====
export function useAssessmentTypes() {
  return useQuery({
    queryKey: ["assessment-types"],
    queryFn: () => safeList<any>("/examinations/assessment-types"),
  });
}
export function useSaveAssessmentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: any) =>
      id
        ? api.put<any>(`/examinations/assessment-types/${id}`, payload)
        : api.post<any>("/examinations/assessment-types", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-types"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteAssessmentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<any>(`/examinations/assessment-types/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-types"] });
      toast.success("Deleted");
    },
  });
}

// ===== Grading scales =====
export function useGradingScales() {
  return useQuery({
    queryKey: ["grading-scales"],
    queryFn: () => safeList<any>("/examinations/grading-scales"),
  });
}
export function useGradingScale(id?: string) {
  return useQuery<any>({
    queryKey: ["grading-scale", id],
    queryFn: () => api.get<any>(`/examinations/grading-scales/${id}`).then((d) => unwrap<any>(d)),
    enabled: !!id,
  });
}
export function useSaveGradingScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: any) =>
      id
        ? api.put<any>(`/examinations/grading-scales/${id}`, payload)
        : api.post<any>("/examinations/grading-scales", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grading-scales"] });
      qc.invalidateQueries({ queryKey: ["grading-scale"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteGradingScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<any>(`/examinations/grading-scales/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grading-scales"] }),
  });
}

// ===== Competencies =====
export function useCompetencies(filters: { subject_id?: string; grade_id?: string } = {}) {
  const qs = new URLSearchParams(filters as any).toString();
  return useQuery({
    queryKey: ["competencies", filters],
    queryFn: () => safeList<any>(`/examinations/competencies${qs ? "?" + qs : ""}`),
  });
}
export function useSaveCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: any) =>
      id
        ? api.put<any>(`/examinations/competencies/${id}`, payload)
        : api.post<any>("/examinations/competencies", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["competencies"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<any>(`/examinations/competencies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["competencies"] }),
  });
}

// ===== Observations =====
export function useObservations(filters: { student_id?: string; competency_id?: string } = {}) {
  const qs = new URLSearchParams(filters as any).toString();
  return useQuery({
    queryKey: ["observations", filters],
    queryFn: () => safeList<any>(`/examinations/observations${qs ? "?" + qs : ""}`),
  });
}
export function useCreateObservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.post<any>("/examinations/observations", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["observations"] });
      toast.success("Observation recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Report card templates & runs =====
export function useReportCardTemplates() {
  return useQuery({
    queryKey: ["report-card-templates"],
    queryFn: () => safeList<any>("/examinations/report-card-templates"),
  });
}
export function useSaveReportCardTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.post<any>("/examinations/report-card-templates", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-card-templates"] });
      toast.success("Template saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteReportCardTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<any>(`/examinations/report-card-templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-card-templates"] }),
  });
}
export function useReportCardRuns() {
  return useQuery({
    queryKey: ["report-card-runs"],
    queryFn: () => safeList<any>("/examinations/report-card-runs"),
  });
}
export function useCreateReportRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.post<any>("/examinations/report-card-runs", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-card-runs"] });
      toast.success("Report run created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function usePublishReportRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<any>(`/examinations/report-card-runs/${id}/publish`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-card-runs"] });
      toast.success("Run published");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Exam subjects =====
export function useExamSubjects(examId?: string) {
  return useQuery({
    queryKey: ["exam-subjects", examId],
    queryFn: () => safeList<any>(`/examinations/exams/${examId}/subjects`),
    enabled: !!examId,
  });
}
export function useUpsertExamSubject(examId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      api.post<any>(`/examinations/exams/${examId}/subjects`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-subjects", examId] });
      toast.success("Subject saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
