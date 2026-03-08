import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { useTerm } from "@/contexts/TermContext";
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

export function useStudents(filters?: { status?: string; gradeId?: string; search?: string }) {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["students", schoolId, filters],
    queryFn: async () => {
      if (!schoolId) return [];
      let query = supabase
        .from("students")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.gradeId) {
        query = query.eq("current_grade_id", filters.gradeId);
      }
      if (filters?.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,admission_number.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return (data || []) as StudentRow[];
    },
    enabled: !!schoolId,
  });
}

export function useStudent(studentId: string | undefined) {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["student", studentId, schoolId],
    queryFn: async () => {
      if (!studentId || !schoolId) return null;
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .eq("school_id", schoolId)
        .single();
      if (error) throw error;
      return data as StudentRow;
    },
    enabled: !!studentId && !!schoolId,
  });
}

export function useStudentWithFees(studentId: string | undefined) {
  const { schoolId } = useSchool();
  const { selectedTerm } = useTerm();

  return useQuery({
    queryKey: ["student-with-fees", studentId, schoolId, selectedTerm?.id],
    queryFn: async () => {
      if (!studentId || !schoolId) return null;

      const [studentRes, feesRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", studentId).eq("school_id", schoolId).single(),
        supabase
          .from("student_fees")
          .select("amount_due, amount_paid, balance, status")
          .eq("student_id", studentId)
          .eq("school_id", schoolId)
          .not("status", "in", '("cancelled","waived")')
      ]);

      if (studentRes.error) throw studentRes.error;

      const fees = feesRes.data || [];
      const total_fees = fees.reduce((sum, f) => sum + (f.amount_due || 0), 0);
      const total_paid = fees.reduce((sum, f) => sum + (f.amount_paid || 0), 0);
      const balance = fees.reduce((sum, f) => sum + (f.balance || 0), 0);

      return {
        ...studentRes.data,
        total_fees,
        total_paid,
        balance,
      } as StudentWithFees;
    },
    enabled: !!studentId && !!schoolId,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchool();

  return useMutation({
    mutationFn: async (data: Partial<StudentRow>) => {
      if (!schoolId) throw new Error("No school selected");
      const { data: result, error } = await supabase
        .from("students")
        .insert({
          school_id: schoolId,
          first_name: data.first_name!,
          last_name: data.last_name!,
          middle_name: data.middle_name,
          admission_number: data.admission_number!,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          religion: data.religion,
          nationality: data.nationality,
          grade: data.grade,
          stream: data.stream,
          current_grade_id: data.current_grade_id,
          current_stream_id: data.current_stream_id,
          admission_date: data.admission_date,
          previous_school: data.previous_school,
          medical_info: data.medical_info as any,
          special_needs: data.special_needs,
          parent_name: data.parent_name,
          parent_phone: data.parent_phone,
          status: data.status || "active",
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student admitted successfully!");
    },
    onError: (err: Error) => {
      toast.error(`Failed to admit student: ${err.message}`);
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudentRow> }) => {
      const { data: result, error } = await supabase
        .from("students")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          middle_name: data.middle_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          religion: data.religion,
          nationality: data.nationality,
          grade: data.grade,
          stream: data.stream,
          current_grade_id: data.current_grade_id,
          current_stream_id: data.current_stream_id,
          parent_name: data.parent_name,
          parent_phone: data.parent_phone,
          status: data.status,
          special_needs: data.special_needs,
          medical_info: data.medical_info as any,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      toast.success("Student updated successfully!");
    },
    onError: (err: Error) => {
      toast.error(`Failed to update student: ${err.message}`);
    },
  });
}

export function useSoftDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("students")
        .update({ status: "inactive" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deactivated successfully");
    },
    onError: (err: Error) => {
      toast.error(`Failed to deactivate: ${err.message}`);
    },
  });
}

export function useStudentParents(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-parents", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_parents")
        .select(`
          id, relationship, is_primary_contact, is_fee_payer,
          parent:parents(id, first_name, last_name, phone, alt_phone, email, id_number, occupation, employer, address)
        `)
        .eq("student_id", studentId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
}

export function useStudentSiblings(studentId: string | undefined, parentPhone: string | null | undefined) {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["student-siblings", studentId, parentPhone],
    queryFn: async () => {
      if (!studentId || !parentPhone || !schoolId) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, full_name, admission_number, grade, stream, status")
        .eq("school_id", schoolId)
        .eq("parent_phone", parentPhone)
        .neq("id", studentId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId && !!parentPhone && !!schoolId,
  });
}
