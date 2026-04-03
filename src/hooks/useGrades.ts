import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface GradeRow { id: string; name: string; level: string; order_index: number; curriculum_type: string; school_id: string; }
export interface StreamRow { id: string; name: string; grade_id: string; grade_name?: string; academic_year_id?: string; capacity: number | null; class_teacher_id: string | null; school_id: string; }

export function useGrades() {
  return useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/classes/grades");
        return (data?.data || data || []) as GradeRow[];
      } catch { return [] as GradeRow[]; }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStreams(gradeId?: string) {
  return useQuery({
    queryKey: ["streams", gradeId],
    queryFn: async () => {
      try {
        const params = gradeId ? `?grade_id=${gradeId}` : "";
        const data = await api.get<any>(`/classes/streams${params}`);
        return (data?.data || data || []) as StreamRow[];
      } catch { return [] as StreamRow[]; }
    },
    staleTime: 5 * 60 * 1000,
  });
}
