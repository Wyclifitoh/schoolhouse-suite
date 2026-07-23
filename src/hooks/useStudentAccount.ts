import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface StatementV2Group {
  vote_head_id: string | null;
  code: string | null;
  name: string;
  amount: number;
  discount: number;
  waived: number;
  net: number;
}

export interface StatementV2Payment {
  id: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  receipt_number: string | null;
  received_at: string;
  status: string;
  notes: string | null;
  allocations?: { vote_head_id: string | null; bucket: string; amount: number }[];
}

export interface StatementV2 {
  school: { name: string; code?: string; email?: string; phone?: string; address?: string; logo_url?: string };
  student: {
    id: string;
    admission_number: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    grade?: string;
    stream?: string;
    parent_name?: string;
    parent_phone?: string;
  };
  term: { id: string; name: string; start_date: string; end_date: string } | null;
  academic_year: { id: string; name: string } | null;
  opening: { balance: number; as_of: string | null };
  charges: StatementV2Group[];
  payments: StatementV2Payment[];
  arrears: { term_id: string; term_name: string; balance: number }[];
  overpayments: number;
  totals: {
    opening_balance: number;
    charges: number;
    discounts: number;
    waivers: number;
    payments: number;
    closing_balance: number;
    excess_credit: number;
    net_owing: number;
  };
  generated_at: string;
  version: "v2";
}

export function useStudentAccountV2(
  studentId: string | undefined,
  opts?: { termId?: string; academicYearId?: string },
) {
  const params = new URLSearchParams();
  if (opts?.termId) params.set("term_id", opts.termId);
  if (opts?.academicYearId) params.set("academic_year_id", opts.academicYearId);
  const qs = params.toString();
  return useQuery({
    queryKey: ["student-account-v2", studentId, opts?.termId, opts?.academicYearId],
    queryFn: () =>
      api.get<StatementV2>(
        `/finance/enterprise/students/${studentId}/statement${qs ? `?${qs}` : ""}`,
      ),
    enabled: !!studentId,
  });
}