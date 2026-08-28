import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * CANONICAL BALANCE HOOK — the only place the UI may get fee figures from.
 *
 * Mirrors backend/src/modules/finance/balance.service.js exactly:
 *   charges  = total billed (net of discounts)
 *   paid     = money ALLOCATED to fees (never includes unapplied credit)
 *   balance  = charges - paid, never negative
 *   excess_available / unapplied_credit = money on account not yet applied
 *
 * Never recompute a balance in a component. Read it from here.
 */
export interface BalanceFigures {
  student_id: string;
  charges: number;
  discounts: number;
  fines: number;
  brought_forward: number;
  fee_count: number;
  overdue_count: number;
  allocated: number;
  paid: number;
  balance: number;
  received: number;
  received_lifetime: number;
  allocated_lifetime: number;
  unapplied_credit: number;
  excess_available: number;
  net_position: number;
  status: "no_fees" | "paid" | "partial" | "pending" | "credit";
  has_overdue: boolean;
  payment_count: number;
  last_payment_at: string | null;
}

export interface StudentBalanceResponse {
  student_id: string;
  scope: {
    term_id: string | null;
    academic_year_id: string | null;
    ledger_type: string | null;
  };
  current: BalanceFigures;
  lifetime: BalanceFigures;
}

export const EMPTY_BALANCE: BalanceFigures = {
  student_id: "",
  charges: 0,
  discounts: 0,
  fines: 0,
  brought_forward: 0,
  fee_count: 0,
  overdue_count: 0,
  allocated: 0,
  paid: 0,
  balance: 0,
  received: 0,
  received_lifetime: 0,
  allocated_lifetime: 0,
  unapplied_credit: 0,
  excess_available: 0,
  net_position: 0,
  status: "no_fees",
  has_overdue: false,
  payment_count: 0,
  last_payment_at: null,
};

/** Human label for the canonical status — identical everywhere. */
export const balanceStatusLabel = (s: BalanceFigures["status"]) =>
  ({
    no_fees: "No fees assigned",
    paid: "Cleared",
    partial: "Partially paid",
    pending: "Unpaid",
    credit: "In credit",
  })[s] || "—";

export function useStudentBalance(
  studentId: string | undefined,
  opts?: { termId?: string | null; ledgerType?: string | null },
) {
  const params = new URLSearchParams();
  if (opts?.termId) params.set("term_id", opts.termId);
  if (opts?.ledgerType) params.set("ledger_type", opts.ledgerType);
  const qs = params.toString();

  return useQuery({
    queryKey: ["student-balance", studentId, opts?.termId, opts?.ledgerType],
    queryFn: () =>
      api.get<StudentBalanceResponse>(
        `/finance/student-balance/${studentId}${qs ? `?${qs}` : ""}`,
      ),
    enabled: !!studentId,
    staleTime: 15_000,
  });
}
