import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AcademicSession {
  id: string; name: string; is_current: boolean;
}

export function useAcademicSessions() {
  return useQuery({
    queryKey: ["academic-sessions"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/schools/academic-years");
        return (data?.data || data || []) as AcademicSession[];
      } catch { return [] as AcademicSession[]; }
    },
  });
}
