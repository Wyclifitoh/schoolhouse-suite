import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

export interface ManualPaymentInput {
  student_id: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  payment_date: string;
  fee_ids: string[];
  notes?: string;
}

export interface STKPushInput {
  student_id: string;
  phone_number: string;
  amount: number;
  fee_ids?: string[];
}

// ============================================
// MANUAL PAYMENT HOOK
// ============================================

export function useRecordManualPayment() {
  const queryClient = useQueryClient();
  const schoolId = useSchoolId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ManualPaymentInput) => {
      if (!schoolId || !user) throw new Error("Missing school or user context");

      // Generate receipt number first
      const { data: receiptNumber, error: receiptError } = await supabase.rpc(
        "next_receipt_number",
        { p_school_id: schoolId }
      );

      if (receiptError) throw receiptError;

      // Create payment with allocation
      const { data, error } = await supabase.rpc("create_manual_payment", {
        p_school_id: schoolId,
        p_student_id: input.student_id,
        p_amount: input.amount,
        p_payment_method: input.payment_method,
        p_reference_number: input.reference_number,
        p_payment_date: input.payment_date,
        p_receipt_number: receiptNumber as string,
        p_recorded_by: user.id,
        p_fee_ids: input.fee_ids,
        p_notes: input.notes || null,
      });

      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["student-fees", input.student_id],
      });
    },
    onSuccess: (_, input) => {
      toast.success("Payment recorded successfully");

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["student-fees", input.student_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-balance", input.student_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["payments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["daily-collections"],
      });
    },
    onError: (error: Error) => {
      toast.error(`Payment failed: ${error.message}`);
    },
  });
}

// ============================================
// STK PUSH HOOK
// ============================================

export function useSTKPush() {
  const queryClient = useQueryClient();
  const schoolId = useSchoolId();

  return useMutation({
    mutationFn: async (input: STKPushInput) => {
      if (!schoolId) throw new Error("Missing school context");

      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          school_id: schoolId,
          student_id: input.student_id,
          phone_number: input.phone_number,
          amount: input.amount,
          fee_ids: input.fee_ids || [],
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("STK Push sent! Check phone for M-Pesa prompt.");
    },
    onError: (error: Error) => {
      toast.error(`M-Pesa request failed: ${error.message}`);
    },
  });
}

// ============================================
// VOID PAYMENT HOOK
// ============================================

export function useVoidPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const { data, error } = await supabase.rpc("reverse_payment", {
        _payment_id: paymentId,
        _reason: reason,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Failed to reverse payment");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Payment reversed successfully");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["student-fees"] });
      queryClient.invalidateQueries({ queryKey: ["student-balance"] });
    },
    onError: (error: Error) => {
      toast.error(`Reversal failed: ${error.message}`);
    },
  });
}
