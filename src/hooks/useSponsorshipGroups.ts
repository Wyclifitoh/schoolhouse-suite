import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const unwrap = <T,>(r: any): T => (r?.data ?? r) as T;

export interface SponsorshipGroupMember {
  id?: string;
  student_id: string;
  student_name?: string;
  admission_number?: string;
  grade_name?: string | null;
  default_amount?: number | null;
}

export interface SponsorshipGroup {
  id: string;
  name: string;
  sponsor_name?: string | null;
  sponsor_contact?: string | null;
  description?: string | null;
  is_active?: number | boolean;
  member_count?: number;
  default_total?: number;
  members?: SponsorshipGroupMember[];
  created_at?: string;
}

export const useSponsorshipGroups = () =>
  useQuery({
    queryKey: ["sponsorship-groups"],
    queryFn: async () =>
      unwrap<SponsorshipGroup[]>(await api.get<any>("/sponsorship-groups")) || [],
  });

export const useSponsorshipGroup = (id?: string | null) =>
  useQuery({
    queryKey: ["sponsorship-groups", id],
    enabled: !!id,
    queryFn: async () =>
      unwrap<SponsorshipGroup>(await api.get<any>(`/sponsorship-groups/${id}`)),
  });

export const useSponsorshipGroupMutations = () => {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["sponsorship-groups"] });
  return {
    create: useMutation({
      mutationFn: (body: any) =>
        api.post<any>("/sponsorship-groups", body).then(unwrap<SponsorshipGroup>),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: any) =>
        api
          .patch<any>(`/sponsorship-groups/${id}`, body)
          .then(unwrap<SponsorshipGroup>),
      onSuccess: invalidate,
    }),
    setMembers: useMutation({
      mutationFn: ({ id, members }: { id: string; members: any[] }) =>
        api.put<any>(`/sponsorship-groups/${id}/members`, { members }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete<any>(`/sponsorship-groups/${id}`),
      onSuccess: invalidate,
    }),
  };
};
