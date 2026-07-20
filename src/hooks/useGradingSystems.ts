import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const unwrap = <T,>(d: any): T => (d?.data ?? d) as T;

export interface GradingSystemLevel {
  id: string;
  grade_code: string;
  min_pct: number;
  max_pct: number;
  points: number;
  band?: string | null;
  description?: string | null;
  display_order: number;
}
export interface GradingSystem {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  curriculum_type: string;
  is_default: 0 | 1;
  is_active: 0 | 1;
  level_count?: number;
  levels?: GradingSystemLevel[];
}

export function useGradingSystems() {
  return useQuery({
    queryKey: ["grading-systems"],
    queryFn: async () =>
      unwrap<GradingSystem[]>(await api.get<any>("/assessments/grading-systems")) || [],
  });
}

export function useGradingSystem(id?: string) {
  return useQuery({
    queryKey: ["grading-system", id],
    queryFn: async () =>
      unwrap<GradingSystem>(await api.get<any>(`/assessments/grading-systems/${id}`)),
    enabled: !!id,
  });
}

export function useSaveGradingSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<GradingSystem> & { id?: string }) =>
      id
        ? api.put<any>(`/assessments/grading-systems/${id}`, body)
        : api.post<any>("/assessments/grading-systems", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grading-systems"] });
      toast.success("Grading system saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGradingSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<any>(`/assessments/grading-systems/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grading-systems"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSaveGradingLevels(systemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (levels: Partial<GradingSystemLevel>[]) =>
      api.put<any>(`/assessments/grading-systems/${systemId}/levels`, { levels }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grading-system", systemId] });
      qc.invalidateQueries({ queryKey: ["grading-systems"] });
      toast.success("Levels updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Subject Categories ----
export interface SubjectCategory {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  default_grading_system_id: string | null;
  default_grading_system_name?: string | null;
  default_calculation_type: string | null;
  is_active: 0 | 1;
  subject_count?: number;
}

export function useSubjectCategories() {
  return useQuery({
    queryKey: ["subject-categories"],
    queryFn: async () =>
      unwrap<SubjectCategory[]>(await api.get<any>("/assessments/subject-categories")) || [],
  });
}

export function useSaveSubjectCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<SubjectCategory> & { id?: string }) =>
      id
        ? api.put<any>(`/assessments/subject-categories/${id}`, body)
        : api.post<any>("/assessments/subject-categories", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject-categories"] });
      toast.success("Category saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSubjectCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<any>(`/assessments/subject-categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject-categories"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}