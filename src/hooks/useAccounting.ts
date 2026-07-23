import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CoaAccount {
  id: string;
  account_code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  parent_id: string | null;
  is_active: 0 | 1;
  is_system: 0 | 1;
}

export interface LedgerEntry {
  id: string;
  entry_date: string;
  posting_ref: string;
  narration: string | null;
  counter_account: string | null;
  source_type: string;
  source_id: string | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface CashBookResponse {
  account: {
    bank_account_id?: string;
    coa_account_id: string;
    name?: string;
    bank_name?: string;
    account_number?: string;
    account_code?: string;
  };
  from: string | null;
  to: string | null;
  opening_balance: number;
  closing_balance: number;
  totals: { debit: number; credit: number };
  entries: LedgerEntry[];
}

export interface TrialBalanceLine {
  account_id: string;
  account_code: string;
  name: string;
  type: CoaAccount["type"];
  debit: number;
  credit: number;
  dr_balance: number;
  cr_balance: number;
}

export interface TrialBalanceResponse {
  from: string | null;
  to: string | null;
  lines: TrialBalanceLine[];
  totals: { debit: number; credit: number; balanced: boolean };
}

const qs = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) s.append(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : "";
};

export function useChartOfAccounts() {
  return useQuery({
    queryKey: ["accounting", "coa"],
    queryFn: () => api.get<CoaAccount[]>("/accounting/chart-of-accounts"),
  });
}

export function useCashBook(params: {
  bank_account_id?: string;
  account_id?: string;
  from?: string;
  to?: string;
}) {
  const enabled = Boolean(params.bank_account_id || params.account_id);
  return useQuery({
    queryKey: ["accounting", "cash-book", params],
    enabled,
    queryFn: () =>
      api.get<CashBookResponse>(`/accounting/cash-book${qs(params)}`),
  });
}

export function useGeneralLedger(params: {
  account_id?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ["accounting", "general-ledger", params],
    enabled: Boolean(params.account_id),
    queryFn: () =>
      api.get<CashBookResponse>(`/accounting/general-ledger${qs(params)}`),
  });
}

export function useTrialBalance(params: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["accounting", "trial-balance", params],
    queryFn: () =>
      api.get<TrialBalanceResponse>(`/accounting/trial-balance${qs(params)}`),
  });
}

export interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  status: "open" | "closed";
  closed_at: string | null;
  closed_by: string | null;
  debit_total: number;
  credit_total: number;
  entry_count: number;
}

export function useAccountingPeriods() {
  return useQuery({
    queryKey: ["accounting", "periods"],
    queryFn: () => api.get<AccountingPeriod[]>("/accounting/periods"),
  });
}