import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type AudienceType = "parents" | "teachers" | "staff" | "custom";
export type ParentRelationship = "all" | "father" | "mother" | "guardian";

export interface Audience {
  type: AudienceType;
  relationship?: ParentRelationship;
  custom?: { name?: string; phone?: string; email?: string }[];
}

export interface RecipientPreview {
  id: string | null;
  type: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface MessageLogRow {
  id: string;
  recipient_type: string;
  recipient_name: string | null;
  to_phone?: string;
  to_email?: string;
  subject?: string;
  message?: string;
  body?: string;
  status: "pending" | "sent" | "failed";
  error_message: string | null;
  sent_by_name: string | null;
  sent_at: string | null;
  created_at: string;
}

export function usePreviewRecipients() {
  return useMutation({
    mutationFn: (audience: Audience) =>
      api.post<{ count: number; recipients: RecipientPreview[] }>(
        "/communication/recipients/preview",
        audience,
      ),
  });
}

export function useSendSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { audience: Audience; message: string }) =>
      api.post<{ total: number; sent: number; failed: number }>(
        "/communication/sms",
        data,
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["sms-log"] });
      toast.success(`SMS: ${res.sent}/${res.total} sent${res.failed ? `, ${res.failed} failed` : ""}`);
    },
    onError: (err: Error) => toast.error(err.message || "SMS send failed"),
  });
}

export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { audience: Audience; subject: string; body: string }) =>
      api.post<{ total: number; sent: number; failed: number }>(
        "/communication/email",
        data,
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["email-log"] });
      toast.success(`Email: ${res.sent}/${res.total} sent${res.failed ? `, ${res.failed} failed` : ""}`);
    },
    onError: (err: Error) => toast.error(err.message || "Email send failed"),
  });
}

export function useSmsLog(params: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["sms-log", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      if (params.search) q.set("search", params.search);
      const data = await api.get<any>(`/communication/sms?${q}`);
      return (data?.data || []) as MessageLogRow[];
    },
  });
}

export function useEmailLog(params: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["email-log", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      if (params.search) q.set("search", params.search);
      const data = await api.get<any>(`/communication/email?${q}`);
      return (data?.data || []) as MessageLogRow[];
    },
  });
}
