import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface ClassRow {
  id: string; name: string; alias?: string; sections: string[]; students: number; curriculum: string;
}

export interface SubjectRow {
  id: string; name: string; code: string; type: string; classes: string[];
}

export interface SubjectAssignment {
  id: string; subject: string; teacher: string; class: string; section: string;
}

export interface TimetableEntry {
  id: string; day: string; period: number; start: string; end: string;
  subject: string; teacher: string; class: string; section: string; room: string;
}

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/classes");
        return (data?.data || data || []) as ClassRow[];
      } catch { return [] as ClassRow[]; }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/classes/subjects");
        return (data?.data || data || []) as SubjectRow[];
      } catch { return [] as SubjectRow[]; }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubjectAssignments() {
  return useQuery({
    queryKey: ["subject-assignments"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/classes/subject-assignments");
        return (data?.data || data || []) as SubjectAssignment[];
      } catch { return [] as SubjectAssignment[]; }
    },
  });
}

export function useTimetable(className?: string, section?: string) {
  return useQuery({
    queryKey: ["timetable", className, section],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (className) params.set("class", className);
        if (section) params.set("section", section);
        const data = await api.get<any>(`/classes/timetable?${params}`);
        return (data?.data || data || []) as TimetableEntry[];
      } catch { return [] as TimetableEntry[]; }
    },
    enabled: !!className,
  });
}

export function useTeacherTimetable(teacher?: string) {
  return useQuery({
    queryKey: ["teacher-timetable", teacher],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (teacher) params.set("teacher", teacher);
        const data = await api.get<any>(`/classes/timetable?${params}`);
        return (data?.data || data || []) as TimetableEntry[];
      } catch { return [] as TimetableEntry[]; }
    },
    enabled: !!teacher,
  });
}
