import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export interface FinanceSettings {
  school_id?: string;
  fiscal_year_start_month: number;
}

const KEY = ["finance-settings"];

export function useFinanceSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<FinanceSettings>("/finance/settings"),
  });
}

export function useUpdateFinanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FinanceSettings) =>
      api.put<FinanceSettings>("/finance/settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ title: "Financial year updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Returns the from/to dates of a financial year, offset years back from the current one. */
export function fiscalYearRange(startMonth = 7, offset = 0) {
  const now = new Date();
  const m = Math.min(12, Math.max(1, startMonth || 7));
  const startYear =
    (now.getMonth() + 1 >= m ? now.getFullYear() : now.getFullYear() - 1) + offset;
  const from = new Date(Date.UTC(startYear, m - 1, 1));
  const to = new Date(Date.UTC(startYear + 1, m - 1, 0));
  return { from: iso(from), to: iso(to), label: `FY ${startYear}/${startYear + 1}` };
}
