import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const unwrap = (d: any) => (d?.data ?? d ?? []);

export type PeriodKind = "lesson" | "break" | "lunch" | "assembly";
export interface PeriodRow {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  position: number;
  kind: PeriodKind;
  is_active: boolean;
  curriculum_type?: string;
}

export interface RequirementRow {
  id: string;
  grade_id: string;
  subject_id: string;
  lessons_per_week: number;
  double_periods: number;
  subject_name?: string;
  subject_code?: string;
  grade_name?: string;
}

export interface TTEntry {
  id: string;
  day: string;
  period: number;
  start_time: string | null;
  end_time: string | null;
  subject: string;
  subject_id: string;
  teacher: string;
  teacher_id: string | null;
  class_name: string;
  grade_id: string;
  section: string;
  stream_id: string;
  room?: string | null;
}

export interface ClashReport {
  teacherClashes: Array<{ teacher_id: string; day: string; period: number; c: number; slots: string }>;
  classClashes: Array<{ stream_id: string; day: string; period: number; c: number }>;
}

// ===== Periods =====
export function usePeriods() {
  return useQuery({
    queryKey: ["tt-periods"],
    queryFn: async () => unwrap(await api.get<any>("/timetable/periods")) as PeriodRow[],
  });
}
export function useSavePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PeriodRow> & { id?: string }) =>
      data.id
        ? api.put(`/timetable/periods/${data.id}`, data)
        : api.post("/timetable/periods", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tt-periods"] }); toast.success("Period saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
export function useDeletePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/timetable/periods/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tt-periods"] }); toast.success("Period removed"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Requirements =====
export function useRequirements(gradeId?: string) {
  return useQuery({
    queryKey: ["tt-reqs", gradeId],
    queryFn: async () => {
      const q = gradeId ? `?grade_id=${gradeId}` : "";
      return unwrap(await api.get<any>(`/timetable/requirements${q}`)) as RequirementRow[];
    },
  });
}
export function useUpsertRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RequirementRow>) =>
      api.post("/timetable/requirements", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tt-reqs"] }),
  });
}
export function useBulkUpsertRequirements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Partial<RequirementRow>[]) =>
      api.post("/timetable/requirements/bulk", { items }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tt-reqs"] }); toast.success("Requirements saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Generate =====
export function useGenerateTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { grade_ids: string[]; replace?: boolean; days?: string[] }) =>
      api.post<{ assigned: number; skipped: number; warnings: string[] }>(
        "/timetable/generate",
        body,
      ),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["timetable"] });
      qc.invalidateQueries({ queryKey: ["teacher-timetable"] });
      qc.invalidateQueries({ queryKey: ["tt-entries"] });
      const r = res?.data || res;
      toast.success(`Generated ${r.assigned} periods${r.skipped ? ` · ${r.skipped} skipped` : ""}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Entries =====
export function useEntries(params: { stream_id?: string; teacher_id?: string; grade_id?: string }) {
  return useQuery({
    queryKey: ["tt-entries", params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
      return unwrap(await api.get<any>(`/timetable/entries?${qs}`)) as TTEntry[];
    },
    enabled: !!(params.stream_id || params.teacher_id || params.grade_id),
  });
}

export function useClashes() {
  return useQuery({
    queryKey: ["tt-clashes"],
    queryFn: async () => (await api.get<any>("/timetable/clashes"))?.data as ClashReport,
    staleTime: 30_000,
  });
}
