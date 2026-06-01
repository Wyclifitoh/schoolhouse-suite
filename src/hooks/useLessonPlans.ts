import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const unwrap = (d: any) => d?.data ?? d ?? [];

export interface LessonPlan {
  id: string;
  school_id: string;
  academic_year_id: string | null;
  term_id: string | null;
  subject_id: string;
  grade_id: string;
  stream_id: string | null;
  teacher_id: string;
  timetable_entry_id: string | null;
  lesson_date: string;
  start_time: string | null;
  end_time: string | null;
  week_number: number | null;
  duration_minutes: number | null;
  roll: number;
  boys: number;
  girls: number;
  total_learners: number;
  strand_id: string | null;
  sub_strand_id: string | null;
  lesson_title: string | null;
  learning_outcomes: string | null;
  key_inquiry_questions: string | null;
  learning_resources: string | null;
  intro_teacher_activities: string | null;
  intro_learner_activities: string | null;
  lesson_development: string | null;
  extended_activities: string | null;
  lesson_summary: string | null;
  achievement_of_outcomes: string | null;
  reflection_went_well: string | null;
  reflection_challenges: string | null;
  reflection_improvements: string | null;
  status: "draft" | "published" | "delivered";
  published_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  subject_name?: string;
  grade_name?: string;
  stream_name?: string;
  teacher_name?: string;
  tsc_number?: string;
  teacher_gender?: string;
  strand_name?: string;
  sub_strand_name?: string;
  term_name?: string;
  academic_year_name?: string;
}

export interface CoverageReport {
  total_sub_strands: number;
  covered: number;
  pct: number;
  by_strand: Array<{
    strand_id: string;
    strand_name: string;
    total: number;
    covered: number;
    sub_strands: Array<{ id: string; name: string; expected: number; done: number; pct: number }>;
  }>;
}

export interface LessonPlanDashboard {
  totals: { total: number; drafts: number; published: number; delivered: number };
  upcoming: Array<{ id: string; lesson_date: string; start_time: string | null; lesson_title: string | null; subject_name: string; grade_name: string; stream_name?: string }>;
  compliance: Array<{ teacher_id: string; name: string; plans: number; published: number }>;
}

export interface SubStrand {
  id: string;
  school_id: string;
  strand_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  expected_lessons: number;
  is_active: number | boolean;
  strand_name?: string;
  subject_id?: string;
  grade_id?: string;
}

export interface LessonPlanTemplate {
  id: string;
  school_id: string;
  subject_id: string | null;
  grade_id: string | null;
  title: string;
  description: string | null;
  content: any;
  is_global: number | boolean;
}

export interface PageMeta { total: number; page: number; limit: number; totalPages: number }

const qs = (p: Record<string, any>) => {
  const s = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") s.set(k, String(v)); });
  return s.toString();
};

// ------------- Lesson plans -------------
export function useLessonPlans(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["lesson-plans", filters],
    queryFn: async () => {
      const res: any = await api.get(`/lesson-plans?${qs(filters)}`);
      // api.get unwraps `data`; the full body is `{data, pagination}` so the raw will be { data, pagination }.
      // But api.request returns json.data, which in paginated response is the array.
      // To get pagination we make a low-level call:
      return res;
    },
  });
}

export function useLessonPlansPaginated(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["lesson-plans-paginated", filters],
    queryFn: async () => {
      const path = `/lesson-plans?${qs(filters)}`;
      const url = (import.meta.env.VITE_API_URL || "https://chuoapi.wikiteq.co.ke/api/v1") + path;
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("chuo-token");
      const schoolId = localStorage.getItem("chuo-school-id");
      const yr = localStorage.getItem("chuo-academic-year-id");
      const tm = localStorage.getItem("chuo-term-id");
      if (token) headers.Authorization = `Bearer ${token}`;
      if (schoolId) headers["X-School-ID"] = schoolId;
      if (yr) headers["X-Academic-Year-Id"] = yr;
      if (tm) headers["X-Term-Id"] = tm;
      const r = await fetch(url, { headers });
      const json = await r.json();
      if (!r.ok || json.success === false) throw new Error(json?.error?.message || "Failed");
      return { rows: (json.data || []) as LessonPlan[], pagination: json.pagination as PageMeta };
    },
  });
}

export function useLessonPlan(id?: string) {
  return useQuery({
    queryKey: ["lesson-plan", id],
    queryFn: () => api.get<LessonPlan>(`/lesson-plans/${id}`),
    enabled: !!id,
  });
}

export function useSaveLessonPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<LessonPlan> & { id?: string }) =>
      d.id ? api.put<LessonPlan>(`/lesson-plans/${d.id}`, d)
           : api.post<LessonPlan>("/lesson-plans", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-plans"] });
      qc.invalidateQueries({ queryKey: ["lesson-plans-paginated"] });
      qc.invalidateQueries({ queryKey: ["lesson-plan-dashboard"] });
      toast.success("Lesson plan saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLessonPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lesson-plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-plans-paginated"] });
      qc.invalidateQueries({ queryKey: ["lesson-plan-dashboard"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateLessonFromTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (timetableEntryId: string) =>
      api.post<LessonPlan>(`/lesson-plans/from-timetable/${timetableEntryId}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-plans-paginated"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDuplicateLessonPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lesson_date }: { id: string; lesson_date?: string }) =>
      api.post<LessonPlan>(`/lesson-plans/${id}/duplicate`, { lesson_date }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-plans-paginated"] });
      toast.success("Duplicated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetLessonStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "publish" | "deliver" | "unpublish" }) =>
      api.post<LessonPlan>(`/lesson-plans/${id}/${action}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-plans-paginated"] });
      qc.invalidateQueries({ queryKey: ["lesson-plan-dashboard"] });
      qc.invalidateQueries({ queryKey: ["lesson-plan-coverage"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function downloadLessonPlanPdf(id: string) {
  const base = import.meta.env.VITE_API_URL || "https://chuoapi.wikiteq.co.ke/api/v1";
  const token = localStorage.getItem("chuo-token");
  const schoolId = localStorage.getItem("chuo-school-id");
  const r = await fetch(`${base}/lesson-plans/${id}/pdf`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(schoolId ? { "X-School-ID": schoolId } : {}),
    },
  });
  if (!r.ok) { toast.error("Failed to download PDF"); return; }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `lesson-plan-${id}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

// ------------- Coverage / dashboard -------------
export function useLessonCoverage(filters: { subject_id?: string; grade_id?: string; term_id?: string }) {
  return useQuery({
    queryKey: ["lesson-plan-coverage", filters],
    queryFn: () => api.get<CoverageReport>(`/lesson-plans/coverage?${qs(filters)}`),
    enabled: !!filters.subject_id && !!filters.grade_id,
  });
}

export function useLessonPlanDashboard() {
  return useQuery({
    queryKey: ["lesson-plan-dashboard"],
    queryFn: () => api.get<LessonPlanDashboard>(`/lesson-plans/dashboard`),
  });
}

// ------------- Strands -------------
export interface Strand {
  id: string;
  school_id: string;
  subject_id: string;
  grade_id: string;
  name: string;
  description: string | null;
}

export function useStrands(filters: { subject_id?: string; grade_id?: string } = {}) {
  return useQuery({
    queryKey: ["strands", filters],
    queryFn: async () => unwrap(await api.get(`/lesson-plans/strands?${qs(filters)}`)) as Strand[],
    enabled: !!(filters.subject_id || filters.grade_id),
  });
}

export function useSaveStrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Strand>) => api.post(`/lesson-plans/strands`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strands"] }); toast.success("Strand saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteStrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lesson-plans/strands/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["strands"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ------------- Sub-strands -------------
export function useSubStrands(filters: { strand_id?: string; subject_id?: string; grade_id?: string } = {}) {
  return useQuery({
    queryKey: ["sub-strands", filters],
    queryFn: async () => unwrap(await api.get(`/lesson-plans/sub-strands?${qs(filters)}`)) as SubStrand[],
  });
}

export function useSaveSubStrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<SubStrand> & { id?: string }) =>
      d.id ? api.put(`/lesson-plans/sub-strands/${d.id}`, d)
           : api.post(`/lesson-plans/sub-strands`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sub-strands"] }); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSubStrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lesson-plans/sub-strands/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sub-strands"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ------------- Templates -------------
export function useLessonPlanTemplates(filters: { subject_id?: string; grade_id?: string } = {}) {
  return useQuery({
    queryKey: ["lesson-plan-templates", filters],
    queryFn: async () => unwrap(await api.get(`/lesson-plans/templates?${qs(filters)}`)) as LessonPlanTemplate[],
  });
}

export function useSaveLessonPlanTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<LessonPlanTemplate> & { id?: string }) =>
      d.id ? api.put(`/lesson-plans/templates/${d.id}`, d)
           : api.post(`/lesson-plans/templates`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lesson-plan-templates"] }); toast.success("Template saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLessonPlanTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lesson-plans/templates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lesson-plan-templates"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
