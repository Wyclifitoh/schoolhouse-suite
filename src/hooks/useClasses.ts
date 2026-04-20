import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface GradeRow {
  id: string; name: string; level: string; order_index: number; curriculum_type: string;
}

export interface StreamRow {
  id: string; name: string; grade_id: string; grade_name: string; capacity: number | null; class_teacher_id: string | null;
}

export interface SubjectRow {
  id: string; name: string; code: string; description: string | null;
}

export interface StaffRow {
  id: string; first_name: string; last_name: string; employee_number: string; email: string; phone: string; status: string;
}

export interface DepartmentRow {
  id: string; name: string; description: string | null; head_staff_id: string | null; is_active: boolean;
}

// Classes hook returns grades for backward compatibility
export function useClasses() {
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

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GradeRow>) => api.post<GradeRow>("/classes/grades", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades"] }); toast.success("Grade created!"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StreamRow & { academic_year_id: string }>) => api.post<StreamRow>("/classes/streams", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["streams"] }); toast.success("Stream created!"); },
    onError: (err: Error) => toast.error(err.message),
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

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SubjectRow>) => api.post<SubjectRow>("/classes/subjects", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject created!"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubjectRow> }) => api.put<SubjectRow>(`/classes/subjects/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject updated!"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/classes/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject deleted"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/classes/streams/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["streams"] }); toast.success("Stream deleted"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StreamRow> }) => api.put<StreamRow>(`/classes/streams/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["streams"] }); toast.success("Stream updated"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/classes/grades/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades"] }); toast.success("Class deleted"); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/classes/staff");
        return (data?.data || data || []) as StaffRow[];
      } catch { return [] as StaffRow[]; }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/classes/departments");
        return (data?.data || data || []) as DepartmentRow[];
      } catch { return [] as DepartmentRow[]; }
    },
  });
}

export function useDesignations() {
  return useQuery({
    queryKey: ["designations"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/classes/designations");
        return (data?.data || data || []) as any[];
      } catch { return []; }
    },
  });
}

// Stub hooks for pages that reference them - these return empty arrays until backend endpoints exist
export interface SubjectAssignment {
  id: string; subject: string; teacher: string; class: string; section: string;
}

export interface TimetableEntry {
  id: string; day: string; period: number; start: string; end: string;
  subject: string; teacher: string; class: string; section: string; room: string;
}

export function useSubjectAssignments() {
  return useQuery({
    queryKey: ["subject-assignments"],
    queryFn: async () => [] as SubjectAssignment[],
  });
}

export function useTimetable(className?: string, section?: string) {
  return useQuery({
    queryKey: ["timetable", className, section],
    queryFn: async () => [] as TimetableEntry[],
    enabled: !!className,
  });
}

export function useTeacherTimetable(teacher?: string) {
  return useQuery({
    queryKey: ["teacher-timetable", teacher],
    queryFn: async () => [] as TimetableEntry[],
    enabled: !!teacher,
  });
}
