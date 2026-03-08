import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface GradeRow { id: string; name: string; level: string; order_index: number; curriculum_type: string; school_id: string; }
export interface StreamRow { id: string; name: string; grade_id: string; academic_year_id: string; capacity: number | null; class_teacher_id: string | null; school_id: string; }

export function useGrades() {
  return useQuery({
    queryKey: ["grades"],
    queryFn: () => api.get<GradeRow[]>("/classes/grades"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStreams(gradeId?: string) {
  return useQuery({
    queryKey: ["streams", gradeId],
    queryFn: () => {
      const params = gradeId ? `?grade_id=${gradeId}` : "";
      return api.get<StreamRow[]>(`/classes/streams${params}`);
    },
    staleTime: 5 * 60 * 1000,
  });
}
