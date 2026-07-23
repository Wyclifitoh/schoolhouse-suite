import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const qs = (p: Record<string, string | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => { if (v) s.append(k, v); });
  const str = s.toString();
  return str ? `?${str}` : "";
};

export interface IncomeStatement {
  from: string | null; to: string | null;
  income: Array<{ account_id: string; account_code: string; name: string; amount: number }>;
  expense: Array<{ account_id: string; account_code: string; name: string; amount: number }>;
  totals: { income: number; expense: number; surplus: number };
}
export interface BalanceSheet {
  as_of: string | null;
  assets: Array<{ id: string; account_code: string; name: string; balance: number }>;
  liabilities: Array<{ id: string; account_code: string; name: string; balance: number }>;
  equity: Array<{ id: string; account_code: string; name: string; balance: number }>;
  retained_earnings: number;
  totals: { assets: number; liabilities: number; equity: number; liabilities_plus_equity: number; balanced: boolean };
}

export const useIncomeStatement = (p: { from?: string; to?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "income", p],
    queryFn: () => api.get<IncomeStatement>(`/financial-reports/income-statement${qs(p)}`),
  });

export const useBalanceSheet = (p: { to?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "balance", p],
    queryFn: () => api.get<BalanceSheet>(`/financial-reports/balance-sheet${qs(p)}`),
  });

export const useSupplierStatement = (p: { supplier_id?: string; from?: string; to?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "supplier", p],
    enabled: !!p.supplier_id,
    queryFn: () => api.get<any>(`/financial-reports/supplier-statement${qs(p)}`),
  });

export const useApAging = (p: { as_of?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "ap-aging", p],
    queryFn: () => api.get<any>(`/financial-reports/ap-aging${qs(p)}`),
  });

export const useVoucherRegister = (p: { from?: string; to?: string; status?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "vouchers", p],
    queryFn: () => api.get<any>(`/financial-reports/voucher-register${qs(p)}`),
  });

export const useReceiptRegister = (p: { from?: string; to?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "receipts", p],
    queryFn: () => api.get<any>(`/financial-reports/receipt-register${qs(p)}`),
  });

export const usePoRegister = (p: { from?: string; to?: string; status?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "pos", p],
    queryFn: () => api.get<any>(`/financial-reports/po-register${qs(p)}`),
  });

export const useCapitationReport = (p: { academic_year_id?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "capitation", p],
    queryFn: () => api.get<any>(`/financial-reports/capitation${qs(p)}`),
  });

export const useBudgetVsActual = (p: { budget_id?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "bva", p],
    enabled: !!p.budget_id,
    queryFn: () => api.get<any>(`/financial-reports/budget-vs-actual${qs(p)}`),
  });

export const useBankReconciliationSummary = (p: { bank_account_id?: string }) =>
  useQuery({
    queryKey: ["fin-reports", "bank-rec", p],
    queryFn: () => api.get<any>(`/financial-reports/bank-reconciliation${qs(p)}`),
  });
