import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const unwrap = <T>(d: any): T => (d?.data ?? d) as T;

// ============ TYPES ============
export interface AssessmentType {
  id: string;
  code: string;
  name: string;
  category: "observation" | "project" | "formative" | "summative" | "custom";
  weight: number;
  is_active: boolean;
}
export interface PerformanceBand {
  id: string;
  code: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}
export interface AchievementLevel {
  id: string;
  code: string;
  band_code: string;
  min_score: number;
  max_score: number;
  points: number;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}
export interface Competency {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}
export interface Rubric {
  id: string;
  name: string;
  scope: "competency" | "skill" | "subject" | "observation";
  description: string | null;
  is_active: boolean;
  criteria_count?: number;
  criteria?: { id: string; band_code: string; indicator: string }[];
}
export interface SubjectAllocation {
  id: string;
  grade_id: string;
  grade_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  subject_category: string;
}
export interface TeacherAllocation {
  id: string;
  teacher_id: string;
  teacher_name: string;
  subject_id: string;
  subject_name: string;
  grade_id: string;
  grade_name: string;
  stream_id: string | null;
  stream_name: string | null;
}

// ============ ASSESSMENT TYPES ============
export function useAssessmentTypes() {
  return useQuery({
    queryKey: ["assessment-types"],
    queryFn: async () =>
      unwrap<AssessmentType[]>(await api.get<any>("/assessments/types")) || [],
  });
}
export function useSaveAssessmentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<AssessmentType> & { id?: string }) =>
      id
        ? api.put(`/assessments/types/${id}`, data)
        : api.post("/assessments/types", data),
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
    mutationFn: (id: string) => api.delete(`/assessments/types/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-types"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ BANDS ============
export function useBands() {
  return useQuery({
    queryKey: ["bands"],
    queryFn: async () =>
      unwrap<PerformanceBand[]>(await api.get<any>("/assessments/bands")) || [],
  });
}
export function useSaveBand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PerformanceBand>) =>
      api.post("/assessments/bands", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bands"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteBand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/bands/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bands"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ ACHIEVEMENT LEVELS ============
export function useAchievementLevels() {
  return useQuery({
    queryKey: ["achievement-levels"],
    queryFn: async () =>
      unwrap<AchievementLevel[]>(
        await api.get<any>("/assessments/achievement-levels"),
      ) || [],
  });
}
export function useSaveLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AchievementLevel>) =>
      api.post("/assessments/achievement-levels", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["achievement-levels"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/assessments/achievement-levels/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["achievement-levels"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ COMPETENCIES ============
export function useCompetencies() {
  return useQuery({
    queryKey: ["assessment-competencies"],
    queryFn: async () =>
      unwrap<Competency[]>(await api.get<any>("/assessments/competencies")) ||
      [],
  });
}
export function useSaveCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Competency> & { id?: string }) =>
      id
        ? api.put(`/assessments/competencies/${id}`, data)
        : api.post("/assessments/competencies", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-competencies"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteCompetency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/competencies/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-competencies"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ RUBRICS ============
export function useRubrics() {
  return useQuery({
    queryKey: ["rubrics"],
    queryFn: async () =>
      unwrap<Rubric[]>(await api.get<any>("/assessments/rubrics")) || [],
  });
}
export function useSaveRubric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Rubric> & { criteria?: any[] }) =>
      api.post("/assessments/rubrics", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rubrics"] });
      toast.success("Rubric created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteRubric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/rubrics/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rubrics"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ SUBJECT ALLOCATIONS ============
export function useSubjectAllocations(gradeId?: string) {
  return useQuery({
    queryKey: ["subject-allocations", gradeId || "all"],
    queryFn: async () => {
      const qs = gradeId ? `?grade_id=${gradeId}` : "";
      return (
        unwrap<SubjectAllocation[]>(
          await api.get<any>(`/assessments/subject-allocations${qs}`),
        ) || []
      );
    },
  });
}
export function useAllocateSubjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { grade_id: string; subject_ids: string[] }) =>
      api.post("/assessments/subject-allocations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject-allocations"] });
      toast.success("Subjects allocated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ TEACHER ALLOCATIONS ============
export function useTeacherAllocations(
  filters: {
    teacher_id?: string;
    grade_id?: string;
  } = {},
) {
  return useQuery({
    queryKey: ["teacher-allocations", filters],
    queryFn: async () => {
      const qp = new URLSearchParams();
      if (filters.teacher_id) qp.set("teacher_id", filters.teacher_id);
      if (filters.grade_id) qp.set("grade_id", filters.grade_id);
      return (
        unwrap<TeacherAllocation[]>(
          await api.get<any>(`/assessments/teacher-allocations?${qp}`),
        ) || []
      );
    },
  });
}
export function useCreateTeacherAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      teacher_id: string;
      subject_id: string;
      grade_id: string;
      stream_id?: string | null;
    }) => api.post("/assessments/teacher-allocations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-allocations"] });
      toast.success("Allocation created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeleteTeacherAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/assessments/teacher-allocations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-allocations"] });
      toast.success("Removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ ASSESSMENTS (CRUD) ============
export type AssessmentStatus =
  | "draft"
  | "published"
  | "in_progress"
  | "locked"
  | "archived";

export interface Assessment {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: AssessmentStatus;
  academic_year_id: string | null;
  term_id: string | null;
  assessment_type_id: string | null;
  type_name?: string;
  type_code?: string;
  type_weight?: number;
  class_count?: number;
  subject_count?: number;
  task_count?: number;
  task_done?: number;
  classes?: { id: string; grade_id: string; grade_name: string }[];
  subjects?: {
    id: string;
    grade_id: string;
    subject_id: string;
    out_of: number;
    grade_name: string;
    subject_name: string;
    subject_code: string;
  }[];
}

export function useAssessmentsList(
  filters: Record<string, string | undefined> = {},
) {
  return useQuery({
    queryKey: ["assessments", filters],
    queryFn: async () => {
      const qp = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && qp.set(k, v));
      return (
        unwrap<Assessment[]>(await api.get<any>(`/assessments?${qp}`)) || []
      );
    },
  });
}

export function useAssessment(id?: string) {
  return useQuery({
    queryKey: ["assessment", id],
    enabled: !!id,
    queryFn: async () =>
      unwrap<Assessment>(await api.get<any>(`/assessments/${id}`)),
  });
}

export function useSaveAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Partial<Assessment> & {
      id?: string;
      grade_ids?: string[];
      out_of?: number;
    }) =>
      id ? api.put(`/assessments/${id}`, data) : api.post(`/assessments`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePublishAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/assessments/${id}/publish`, {}),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      qc.invalidateQueries({ queryKey: ["assessment", id] });
      qc.invalidateQueries({ queryKey: ["assessment-tasks"] });
      toast.success("Published — teacher tasks generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetAssessmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AssessmentStatus }) =>
      api.post(`/assessments/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ TASKS ============
export function useResyncAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/assessments/${id}/resync-subjects`, {}),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      qc.invalidateQueries({ queryKey: ["assessment", id] });
      qc.invalidateQueries({ queryKey: ["assessment-tasks"] });
      toast.success("Assessment synced. New students and subjects are now covered.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface AssessmentTask {
  id: string;
  assessment_id: string;
  assessment_name: string;
  assessment_status: AssessmentStatus;
  grade_id: string;
  grade_name: string;
  stream_id: string | null;
  stream_name: string | null;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  teacher_id: string | null;
  teacher_name: string | null;
  status: "pending" | "in_progress" | "submitted" | "approved" | "locked";
  student_count: number;
  marked_count: number;
}

export function useAssessmentTasks(
  filters: Record<string, string | undefined> = {},
) {
  return useQuery({
    queryKey: ["assessment-tasks", filters],
    queryFn: async () => {
      const qp = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && qp.set(k, v));
      return (
        unwrap<AssessmentTask[]>(
          await api.get<any>(`/assessments/tasks/list?${qp}`),
        ) || []
      );
    },
  });
}

export function useReassignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teacher_id }: { id: string; teacher_id: string }) =>
      api.post(`/assessments/tasks/${id}/reassign`, { teacher_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-tasks"] });
      toast.success("Reassigned");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/assessments/tasks/${id}/submit`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-tasks"] });
      qc.invalidateQueries({ queryKey: ["task-roster"] });
      toast.success("Submitted for review");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ MARKS ENTRY ============
export interface TaskRoster {
  task: AssessmentTask & { stream_id: string | null };
  out_of: number;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    gender: string | null;
    mark: null | {
      id: string;
      score: number | null;
      out_of: number;
      achievement_level_code: string | null;
      band_code: string | null;
      points: number | null;
      status: string;
      remarks: string | null;
    };
  }>;
}

export function useTaskRoster(taskId?: string) {
  return useQuery({
    queryKey: ["task-roster", taskId],
    enabled: !!taskId,
    queryFn: async () =>
      unwrap<TaskRoster>(
        await api.get<any>(`/assessments/tasks/${taskId}/roster`),
      ),
  });
}

export function useBulkSaveAssessmentMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      assessment_id: string;
      task_id?: string;
      items: Array<{
        student_id: string;
        subject_id: string;
        score: number | null;
        out_of: number;
        status?: string;
        remarks?: string | null;
      }>;
    }) => api.post(`/assessments/marks/bulk`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-roster"] });
      qc.invalidateQueries({ queryKey: ["assessment-tasks"] });
      toast.success("Marks saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// =====================================================================
// PHASE 3 — Results, Report Cards, Analytics
// =====================================================================

export type ResultStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "revoked";

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  student_id: string;
  grade_id: string;
  stream_id: string | null;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade_name: string;
  stream_name: string | null;
  subjects_count: number;
  total_score: number;
  total_out_of: number;
  mean_score: number;
  percentage: number;
  total_points: number;
  mean_points: number;
  overall_al: string | null;
  overall_band: string | null;
  class_position: number | null;
  stream_position: number | null;
  grade_position: number | null;
  status: ResultStatus;
  approved_at: string | null;
  published_at: string | null;
}

export function useAssessmentResults(
  assessmentId?: string,
  filters: Record<string, string | undefined> = {},
) {
  return useQuery({
    queryKey: ["assessment-results", assessmentId, filters],
    enabled: !!assessmentId,
    queryFn: async () => {
      const qp = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && qp.set(k, v));
      return (
        unwrap<AssessmentResult[]>(
          await api.get<any>(`/assessments/${assessmentId}/results?${qp}`),
        ) || []
      );
    },
  });
}

export function useComputeResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) =>
      api.post(`/assessments/${assessmentId}/results/compute`, {}),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["assessment-results", id] });
      qc.invalidateQueries({ queryKey: ["assessment-analytics"] });
      toast.success("Results computed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRecomputeResultPositions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) =>
      api.post(`/assessments/${assessmentId}/results/recompute-positions`, {}),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["assessment-results", id] });
      toast.success("Positions updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkResultStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessment_id,
      ids,
      status,
    }: {
      assessment_id: string;
      ids: string[];
      status: ResultStatus;
    }) =>
      api.post(`/assessments/${assessment_id}/results/bulk-status`, {
        ids,
        status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-results"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useStudentResultDetail(
  assessmentId?: string,
  studentId?: string,
) {
  return useQuery({
    queryKey: ["result-detail", assessmentId, studentId],
    enabled: !!assessmentId && !!studentId,
    queryFn: async () =>
      unwrap<any>(
        await api.get<any>(
          `/assessments/${assessmentId}/results/student/${studentId}`,
        ),
      ),
  });
}

// ---------------- REPORT CARD TEMPLATES ----------------
export interface ReportCardTemplate {
  id: string;
  name: string;
  kind: "CBC" | "844" | "HYBRID";
  header_title: string | null;
  header_subtitle: string | null;
  show_position: boolean;
  show_band: boolean;
  show_competencies: boolean;
  show_teacher_remarks: boolean;
  show_principal_remarks: boolean;
  is_default: boolean;
}

export function useRcTemplates() {
  return useQuery({
    queryKey: ["rc-templates"],
    queryFn: async () =>
      unwrap<ReportCardTemplate[]>(
        await api.get<any>("/assessments/report-cards/templates"),
      ) || [],
  });
}

export function useSaveRcTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Partial<ReportCardTemplate> & { id?: string }) =>
      id
        ? api.put(`/assessments/report-cards/templates/${id}`, data)
        : api.post("/assessments/report-cards/templates", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc-templates"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRcTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/assessments/report-cards/templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc-templates"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------------- RUNS ----------------
export interface RcRun {
  id: string;
  assessment_id: string;
  assessment_name: string;
  template_id: string | null;
  template_name: string | null;
  grade_id: string | null;
  grade_name: string | null;
  stream_id: string | null;
  stream_name: string | null;
  status: "queued" | "processing" | "generated" | "published" | "failed";
  total_cards: number;
  generated_at: string;
  published_at: string | null;
}

export function useRcRuns(assessmentId?: string) {
  return useQuery({
    queryKey: ["rc-runs", assessmentId || "all"],
    queryFn: async () => {
      const qs = assessmentId ? `?assessment_id=${assessmentId}` : "";
      return (
        unwrap<RcRun[]>(
          await api.get<any>(`/assessments/report-cards/runs${qs}`),
        ) || []
      );
    },
  });
}

export function useCreateRcRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      assessment_id: string;
      template_id?: string | null;
      grade_id?: string | null;
      stream_id?: string | null;
    }) => api.post("/assessments/report-cards/runs", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc-runs"] });
      toast.success("Run generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePublishRcRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/assessments/report-cards/runs/${id}/publish`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc-runs"] });
      qc.invalidateQueries({ queryKey: ["assessment-results"] });
      toast.success("Published to parents");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRcCards(runId?: string) {
  return useQuery({
    queryKey: ["rc-cards", runId],
    enabled: !!runId,
    queryFn: async () =>
      unwrap<any[]>(
        await api.get<any>(`/assessments/report-cards/runs/${runId}/cards`),
      ) || [],
  });
}

// ---------------- ANALYTICS ----------------
export function useAssessmentAnalytics(assessmentId?: string) {
  return useQuery({
    queryKey: ["assessment-analytics", assessmentId],
    enabled: !!assessmentId,
    queryFn: async () => {
      const [overview, subjects, bands, levels, leaderboard, grades, streams] =
        await Promise.all([
          api.get<any>(`/assessments/${assessmentId}/analytics/overview`),
          api.get<any>(`/assessments/${assessmentId}/analytics/subjects`),
          api.get<any>(`/assessments/${assessmentId}/analytics/bands`),
          api.get<any>(`/assessments/${assessmentId}/analytics/levels`),
          api.get<any>(
            `/assessments/${assessmentId}/analytics/leaderboard?limit=25`,
          ),
          api.get<any>(`/assessments/${assessmentId}/analytics/grades`),
          api.get<any>(`/assessments/${assessmentId}/analytics/streams`),
        ]);
      return {
        overview: unwrap<any>(overview),
        subjects: unwrap<any[]>(subjects) || [],
        bands: unwrap<any[]>(bands) || [],
        levels: unwrap<any[]>(levels) || [],
        leaderboard: unwrap<any[]>(leaderboard) || [],
        grades: unwrap<any[]>(grades) || [],
        streams: unwrap<any[]>(streams) || [],
      };
    },
  });
}

// ---------------- DOWNLOADS / EXPORTS ----------------
function apiBase() {
  return (import.meta as any).env?.VITE_API_URL || "/api";
}
async function downloadAuthed(path: string, filename: string) {
  const token = localStorage.getItem("chuo-token");
  const schoolId = localStorage.getItem("chuo-school-id") || "";
  const res = await fetch(`${apiBase()}${path}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "x-school-id": schoolId,
    },
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function useDownloadReportCardPdf() {
  return useMutation({
    mutationFn: ({ cardId, name }: { cardId: string; name?: string }) =>
      downloadAuthed(
        `/assessments/report-cards/cards/${cardId}/pdf`,
        `${name || "report-card"}.pdf`,
      ),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDownloadRunZip() {
  return useMutation({
    mutationFn: ({ runId }: { runId: string }) =>
      downloadAuthed(
        `/assessments/report-cards/runs/${runId}/download.zip`,
        `report-cards-${runId}.zip`,
      ),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDownloadAnalytics() {
  return useMutation({
    mutationFn: ({
      assessmentId,
      format,
      filters,
    }: {
      assessmentId: string;
      format: "pdf" | "xlsx";
      filters?: { grade_id?: string; stream_id?: string; subject_id?: string };
    }) => {
      const qp = new URLSearchParams();
      if (filters?.grade_id) qp.set("grade_id", filters.grade_id);
      if (filters?.stream_id) qp.set("stream_id", filters.stream_id);
      if (filters?.subject_id) qp.set("subject_id", filters.subject_id);
      const qs = qp.toString();
      return downloadAuthed(
        `/assessments/${assessmentId}/analytics/export.${format}${qs ? `?${qs}` : ""}`,
        `analytics-${assessmentId}${qs ? "-filtered" : ""}.${format}`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------------- COMPARISON ----------------
export function usePreviousAssessments(assessmentId?: string) {
  return useQuery({
    queryKey: ["assessment-previous", assessmentId],
    enabled: !!assessmentId,
    queryFn: async () =>
      unwrap<any[]>(
        await api.get<any>(`/assessments/${assessmentId}/comparison/previous`),
      ) || [],
  });
}
export function useAssessmentComparison(
  assessmentId?: string,
  previousId?: string,
) {
  return useQuery({
    queryKey: ["assessment-comparison", assessmentId, previousId],
    enabled: !!assessmentId && !!previousId,
    queryFn: async () =>
      unwrap<any>(
        await api.get<any>(
          `/assessments/${assessmentId}/comparison/vs/${previousId}`,
        ),
      ),
  });
}
