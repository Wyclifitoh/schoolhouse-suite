import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";

export interface GradeRow {
  id: string;
  name: string;
  level: string;
  order_index: number;
  curriculum_type: string;
  school_id: string;
}

export interface StreamRow {
  id: string;
  name: string;
  grade_id: string;
  academic_year_id: string;
  capacity: number | null;
  class_teacher_id: string | null;
  school_id: string;
}

export function useGrades() {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["grades", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("school_id", schoolId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data || []) as GradeRow[];
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStreams(gradeId?: string) {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["streams", schoolId, gradeId],
    queryFn: async () => {
      if (!schoolId) return [];
      let query = supabase
        .from("streams")
        .select("*")
        .eq("school_id", schoolId)
        .order("name", { ascending: true });

      if (gradeId) {
        query = query.eq("grade_id", gradeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StreamRow[];
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}
