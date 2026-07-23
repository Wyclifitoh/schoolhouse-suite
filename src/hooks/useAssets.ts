import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const unwrap = <T,>(r: any): T => (r?.data ?? r) as T;

export type AssetStatus = "active" | "disposed" | "written_off" | "under_repair";
export type DepMethod = "straight_line" | "reducing_balance" | "none";

export interface AssetCategory {
  id: string;
  name: string;
  description?: string | null;
  useful_life_years: number;
  depreciation_method: DepMethod;
  depreciation_rate?: number | null;
  coa_asset_account_id?: string | null;
  coa_accumulated_depreciation_id?: string | null;
  coa_depreciation_expense_id?: string | null;
  coa_disposal_gain_id?: string | null;
  coa_disposal_loss_id?: string | null;
  is_active: boolean | number;
  asset_count?: number;
}

export interface Asset {
  id: string;
  category_id?: string | null;
  category_name?: string | null;
  tag_number: string;
  name: string;
  description?: string | null;
  acquisition_date: string;
  cost: number;
  salvage_value: number;
  useful_life_years?: number | null;
  accumulated_depreciation: number;
  book_value: number;
  location?: string | null;
  custodian_id?: string | null;
  custodian_first_name?: string | null;
  custodian_last_name?: string | null;
  supplier_id?: string | null;
  vote_head_id?: string | null;
  purchase_ref?: string | null;
  serial_number?: string | null;
  status: AssetStatus;
  notes?: string | null;
}

export interface AssetMovement {
  id: string;
  movement_date: string;
  from_location?: string | null;
  to_location?: string | null;
  from_first?: string; from_last?: string;
  to_first?: string; to_last?: string;
  reason?: string | null;
}

export interface AssetDepreciation {
  id: string;
  period_start: string;
  period_end: string;
  amount: number;
  method: string;
  posting_ref?: string | null;
  notes?: string | null;
}

export interface AssetDisposal {
  id: string;
  disposal_date: string;
  method: string;
  proceeds: number;
  gain_loss: number;
  bank_account_id?: string | null;
  bank_account_name?: string | null;
  buyer?: string | null;
  reason?: string | null;
  posting_ref?: string | null;
}

export interface AssetDetail extends Asset {
  movements: AssetMovement[];
  depreciations: AssetDepreciation[];
  disposal: AssetDisposal | null;
}

export interface AssetSummary {
  totals: {
    total_assets: number;
    total_cost: number;
    total_accumulated: number;
    total_book_value: number;
    active: number;
    disposed: number;
    written_off: number;
    under_repair: number;
  };
  by_category: Array<{
    id: string; name: string;
    asset_count: number; total_cost: number; total_book_value: number;
  }>;
}

export const useAssetCategories = () =>
  useQuery({
    queryKey: ["asset-categories"],
    queryFn: async () =>
      unwrap<AssetCategory[]>(await api.get<any>("/assets/categories")),
  });

export const useAssetSummary = () =>
  useQuery({
    queryKey: ["asset-summary"],
    queryFn: async () =>
      unwrap<AssetSummary>(await api.get<any>("/assets/summary")),
  });

export const useAssets = (params: Record<string, string> = {}) =>
  useQuery({
    queryKey: ["assets", params],
    queryFn: async () => {
      const qs = new URLSearchParams(params).toString();
      const raw = await api.get<any>(`/assets${qs ? `?${qs}` : ""}`);
      return unwrap<{
        data: Asset[]; total: number; page: number; limit: number;
        totals: Record<string, number>;
      }>(raw);
    },
  });

export const useAsset = (id?: string) =>
  useQuery({
    queryKey: ["asset", id],
    enabled: !!id,
    queryFn: async () =>
      unwrap<AssetDetail>(await api.get<any>(`/assets/${id}`)),
  });

export const useAssetMutations = (id?: string) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["assets"] });
    qc.invalidateQueries({ queryKey: ["asset-summary"] });
    qc.invalidateQueries({ queryKey: ["asset-categories"] });
    if (id) qc.invalidateQueries({ queryKey: ["asset", id] });
  };
  const onErr = (e: Error) =>
    toast({ title: "Action failed", description: e.message, variant: "destructive" });

  return {
    createCategory: useMutation({
      mutationFn: (b: Partial<AssetCategory>) =>
        api.post<any>("/assets/categories", b).then(unwrap<AssetCategory>),
      onSuccess: () => { invalidate(); toast({ title: "Category saved" }); },
      onError: onErr,
    }),
    updateCategory: useMutation({
      mutationFn: (b: Partial<AssetCategory> & { id: string }) =>
        api.put<any>(`/assets/categories/${b.id}`, b).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Category saved" }); },
      onError: onErr,
    }),
    removeCategory: useMutation({
      mutationFn: (cid: string) => api.delete<any>(`/assets/categories/${cid}`).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Category removed" }); },
      onError: onErr,
    }),
    createAsset: useMutation({
      mutationFn: (b: Partial<Asset>) => api.post<any>("/assets", b).then(unwrap<Asset>),
      onSuccess: () => { invalidate(); toast({ title: "Asset created" }); },
      onError: onErr,
    }),
    updateAsset: useMutation({
      mutationFn: (b: Partial<Asset> & { id: string }) =>
        api.put<any>(`/assets/${b.id}`, b).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Asset saved" }); },
      onError: onErr,
    }),
    removeAsset: useMutation({
      mutationFn: (aid: string) => api.delete<any>(`/assets/${aid}`).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Asset removed" }); },
      onError: onErr,
    }),
    addMovement: useMutation({
      mutationFn: (b: {
        to_location?: string; to_custodian_id?: string;
        movement_date?: string; reason?: string;
      }) => api.post<any>(`/assets/${id}/movements`, b).then(unwrap),
      onSuccess: () => { invalidate(); toast({ title: "Movement recorded" }); },
      onError: onErr,
    }),
    depreciate: useMutation({
      mutationFn: (b: {
        period_start: string; period_end: string;
        amount?: number; notes?: string;
      }) => api.post<any>(`/assets/${id}/depreciate`, b).then(unwrap),
      onSuccess: () => {
        invalidate();
        toast({ title: "Depreciation posted", description: "Book value updated" });
      },
      onError: onErr,
    }),
    dispose: useMutation({
      mutationFn: (b: {
        disposal_date?: string; method?: string; proceeds?: number;
        bank_account_id?: string; buyer?: string; reason?: string;
      }) => api.post<any>(`/assets/${id}/dispose`, b).then(unwrap),
      onSuccess: () => {
        invalidate();
        toast({ title: "Asset disposed" });
      },
      onError: onErr,
    }),
  };
};