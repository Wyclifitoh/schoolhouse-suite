import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface StudentRow {
  id: string;
  admission_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  religion: string | null;
  nationality: string | null;
  grade: string | null;
  stream: string | null;
  current_grade_id: string | null;
  current_stream_id: string | null;
  current_term_id: string | null;
  status: string;
  admission_date: string | null;
  previous_school: string | null;
  medical_info: Record<string, unknown> | null;
  special_needs: string | null;
  photo_url: string | null;
  upi: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  school_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentWithFees extends StudentRow {
  balance: number;
  total_fees: number;
  total_paid: number;
}

export function useStudents(filters?: {
  status?: string;
  gradeId?: string;
  streamIds?: string[];
  search?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["students", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "all")
        params.set("status", filters.status);
      if (filters?.gradeId) params.set("grade_id", filters.gradeId);
      if (filters?.streamIds && filters.streamIds.length)
        params.set("stream_ids", filters.streamIds.join(","));
      if (filters?.search) params.set("search", filters.search);
      params.set("limit", "500");
      const result = await api.get<{ data: StudentRow[] }>(
        `/students?${params}`,
      );
      return (result as any)?.data || result || [];
    },
    enabled: filters?.enabled !== false,
  });
}

export function useStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: () => api.get<StudentRow>(`/students/${studentId}`),
    enabled: !!studentId,
  });
}

export function useStudentWithFees(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-with-fees", studentId],
    queryFn: async () => {
      const [student, balance] = await Promise.all([
        api.get<StudentRow>(`/students/${studentId}`),
        api.get<any[]>(`/finance/student-balance/${studentId}`).catch(() => []),
      ]);
      const total_fees = (balance || []).reduce(
        (s: number, b: any) => s + Number(b.total_due || 0),
        0,
      );
      // total_paid uses effective paid (allocated OR received — set by backend)
      const total_paid = (balance || []).reduce(
        (s: number, b: any) =>
          s + Number(b.total_paid ?? b.total_received ?? 0),
        0,
      );
      return {
        ...student,
        total_fees,
        total_paid,
        balance: total_fees - total_paid,
      } as StudentWithFees;
    },
    enabled: !!studentId,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StudentRow>) =>
      api.post<StudentRow>("/students", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student admitted!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentRow> }) =>
      api.put<StudentRow>(`/students/${id}`, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student", id] });
      toast.success("Student updated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSoftDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/students/${id}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deactivated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStudentParents(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-parents", studentId],
    queryFn: () =>
      api.get<any[]>(`/parents?student_id=${studentId}`).catch(() => []),
    enabled: !!studentId,
  });
}

export function useStudentSiblings(
  studentId: string | undefined,
  parentPhone: string | null | undefined,
) {
  return useQuery({
    queryKey: ["student-siblings", studentId, parentPhone],
    queryFn: () =>
      api.get<any[]>(
        `/students/siblings?parent_phone=${parentPhone}&exclude_id=${studentId}`,
      ),
    enabled: !!studentId && !!parentPhone,
  });
}
