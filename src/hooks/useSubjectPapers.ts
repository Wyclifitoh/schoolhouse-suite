import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type PaperType = "THEORY" | "PRACTICAL" | "ORAL" | "PROJECT";
export type CalculationType = "GENERAL" | "SCIENCE" | "LANGUAGE" | "CUSTOM";

export interface SubjectPaper {
  id: string;
  school_id: string;
  subject_id: string;
  name: string;
  code: string | null;
  paper_type: PaperType;
  max_marks: number;
  contribution_pct?: number;
  display_order: number;
  is_active: number;
}

const unwrap = <T,>(d: any): T => (d?.data ?? d) as T;

export function useSubjectPapers(subjectId?: string) {
  return useQuery({
    queryKey: ["subject-papers", subjectId],
    queryFn: async () => {
      if (!subjectId) return [] as SubjectPaper[];
      try {
        return unwrap<SubjectPaper[]>(
          await api.get<any>(`/classes/subjects/${subjectId}/papers`),
        ) || [];
      } catch {
        return [] as SubjectPaper[];
      }
    },
    enabled: !!subjectId,
  });
}

export function useSavePaper(subjectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<SubjectPaper> & { id?: string }) =>
      id
        ? api.put<any>(`/classes/subjects/${subjectId}/papers/${id}`, payload)
        : api.post<any>(`/classes/subjects/${subjectId}/papers`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject-papers", subjectId] });
      toast.success("Paper saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePaper(subjectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<any>(`/classes/subjects/${subjectId}/papers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject-papers", subjectId] });
      toast.success("Paper removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSubjectConfig(subjectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      curriculum_type?: string;
      has_papers?: boolean | number;
      calculation_type?: CalculationType;
      calculation_config?: Record<string, any> | null;
    }) => api.put<any>(`/classes/subjects/${subjectId}/config`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject configuration saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Bulk-replace the paper template for a subject (max 3 papers).
export function useSavePaperTemplate(subjectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (papers: Partial<SubjectPaper>[]) =>
      api.put<any>(`/classes/subjects/${subjectId}/paper-template`, { papers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject-papers", subjectId] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Paper template saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== 8-4-4 paper marks =====
export interface PaperMarkRow {
  id: string;
  exam_id: string;
  student_id: string;
  student_name?: string;
  admission_number?: string;
  subject_id: string;
  subject_name: string;
  paper_id: string;
  paper_name?: string;
  paper_type?: PaperType;
  score: number | null;
  max_marks: number;
}

export function usePaperMarks(params: {
  exam_id?: string;
  subject_id?: string;
  paper_id?: string;
  grade_id?: string;
}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => !!v) as [string, string][],
  ).toString();
  return useQuery({
    queryKey: ["paper-marks", params],
    queryFn: async () => {
      try {
        return unwrap<PaperMarkRow[]>(
          await api.get<any>(`/examinations/paper-marks?${qs}`),
        ) || [];
      } catch {
        return [] as PaperMarkRow[];
      }
    },
    enabled: !!params.exam_id && !!params.paper_id,
  });
}

export function useBulkSavePaperMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (marks: Partial<PaperMarkRow>[]) =>
      api.post<any>("/examinations/paper-marks/bulk", { marks }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["paper-marks"] });
      qc.invalidateQueries({ queryKey: ["exam-marks"] });
      toast.success(`${res?.data?.saved ?? res?.saved ?? 0} paper marks saved`);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save"),
  });
}