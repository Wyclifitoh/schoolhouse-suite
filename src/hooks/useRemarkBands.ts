import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const unwrap = <T,>(d: any): T => (d?.data ?? d) as T;

export interface RemarkBand {
  id: string;
  subject_id: string | null;
  subject_name: string | null;
  grade_id: string | null;
  grade_name: string | null;
  min_pct: number;
  max_pct: number;
  remark: string;
  sort_order: number;
  is_active: boolean;
}

export function useRemarkBands(filters: { subject_id?: string; grade_id?: string } = {}) {
  return useQuery({
    queryKey: ["remark-bands", filters],
    queryFn: async () => {
      const qp = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && qp.set(k, v));
      return unwrap<RemarkBand[]>(
        await api.get<any>(`/assessments/remark-bands?${qp}`),
      ) || [];
    },
  });
}

export function useSaveRemarkBand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<RemarkBand> & { id?: string }) =>
      id
        ? api.put(`/assessments/remark-bands/${id}`, data)
        : api.post("/assessments/remark-bands", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["remark-bands"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRemarkBand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/remark-bands/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["remark-bands"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Client-side helper so the UI can show the suggested remark as the
 *  teacher types — server still re-resolves at save time. */
export function previewRemark(
  bands: RemarkBand[],
  opts: { subject_id?: string; grade_id?: string; pct: number },
): string | null {
  if (!bands?.length || opts.pct == null || isNaN(opts.pct)) return null;
  const eligible = bands.filter(
    (b) => b.is_active !== false &&
      Number(opts.pct) >= Number(b.min_pct) &&
      Number(opts.pct) <= Number(b.max_pct),
  );
  if (!eligible.length) return null;
  const score = (b: RemarkBand) =>
    (b.subject_id === opts.subject_id ? 2 : b.subject_id == null ? 0 : -10) +
    (b.grade_id === opts.grade_id ? 1 : b.grade_id == null ? 0 : -10);
  eligible.sort((a, b) => score(b) - score(a));
  return eligible[0]?.remark || null;
}
