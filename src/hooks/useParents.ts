import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/contexts/SchoolContext";
import { toast } from "sonner";

export interface ParentRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  alt_phone: string | null;
  email: string | null;
  id_number: string | null;
  occupation: string | null;
  employer: string | null;
  address: string | null;
  school_id: string;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useParents(search?: string) {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["parents", schoolId, search],
    queryFn: async () => {
      if (!schoolId) return [];
      let query = supabase
        .from("parents")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return (data || []) as ParentRow[];
    },
    enabled: !!schoolId,
  });
}

export function useParentWithChildren(parentId: string | undefined) {
  const { schoolId } = useSchool();

  return useQuery({
    queryKey: ["parent-children", parentId],
    queryFn: async () => {
      if (!parentId || !schoolId) return { parent: null, children: [] };

      const [parentRes, childrenRes] = await Promise.all([
        supabase.from("parents").select("*").eq("id", parentId).single(),
        supabase
          .from("student_parents")
          .select(`
            relationship, is_primary_contact,
            student:students(id, first_name, last_name, full_name, admission_number, grade, stream, status)
          `)
          .eq("parent_id", parentId),
      ]);

      return {
        parent: parentRes.data as ParentRow | null,
        children: (childrenRes.data || []).map((sp: any) => ({
          ...sp.student,
          relationship: sp.relationship,
          is_primary_contact: sp.is_primary_contact,
        })),
      };
    },
    enabled: !!parentId && !!schoolId,
  });
}

export function useCreateParent() {
  const queryClient = useQueryClient();
  const { schoolId } = useSchool();

  return useMutation({
    mutationFn: async (data: Partial<ParentRow>) => {
      if (!schoolId) throw new Error("No school selected");
      const { data: result, error } = await supabase
        .from("parents")
        .insert({
          school_id: schoolId,
          first_name: data.first_name!,
          last_name: data.last_name!,
          phone: data.phone!,
          alt_phone: data.alt_phone,
          email: data.email,
          id_number: data.id_number,
          occupation: data.occupation,
          employer: data.employer,
          address: data.address,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      toast.success("Parent added successfully!");
    },
    onError: (err: Error) => {
      toast.error(`Failed to add parent: ${err.message}`);
    },
  });
}

export function useUpdateParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ParentRow> }) => {
      const { error } = await supabase.from("parents").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      toast.success("Parent updated!");
    },
    onError: (err: Error) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });
}
