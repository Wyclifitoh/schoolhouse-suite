import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const unwrap = <T>(r: any): T => (r?.data ?? r) as T;

export interface PaymentVoucher {
  id: string;
  voucher_no: string;
  supplier_id: string;
  supplier_name?: string;
  supplier_invoice_id?: string | null;
  invoice_no?: string | null;
  bank_account_id?: string | null;
  bank_account_name?: string | null;
  payment_date: string;
  payment_method: string;
  reference?: string | null;
  amount: number;
  narration?: string | null;
  status: "draft" | "approved" | "paid" | "cancelled";
  posting_ref?: string | null;
  posted_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
}

export const usePaymentVouchers = (
  params: { status?: string; supplier_id?: string } = {},
) =>
  useQuery({
    queryKey: ["payment-vouchers", params],
    queryFn: async () => {
      const qs = new URLSearchParams(params as any).toString();
      return unwrap<PaymentVoucher[]>(
        await api.get<any>(`/payment-vouchers${qs ? `?${qs}` : ""}`),
      );
    },
  });

export const usePaymentVoucherMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["payment-vouchers"] });
    qc.invalidateQueries({ queryKey: ["supplier-invoices"] });
    qc.invalidateQueries({ queryKey: ["supplier-profile"] });
  };
  return {
    create: useMutation({
      mutationFn: (body: any) =>
        api.post<any>("/payment-vouchers", body).then(unwrap<PaymentVoucher>),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        api
          .patch<any>(`/payment-vouchers/${id}/status`, { status })
          .then(unwrap<PaymentVoucher>),
      onSuccess: invalidate,
    }),
  };
};