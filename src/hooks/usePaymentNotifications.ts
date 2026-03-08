import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Real-time subscription for payment events in the current school.
 * Shows toast notifications and invalidates relevant queries.
 */
export function usePaymentNotifications(schoolId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!schoolId) return;

    const channel = supabase
      .channel(`payments:${schoolId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payments",
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          const newPayment = payload.new as {
            student_id: string;
            amount: number;
            payment_method: string;
            status: string;
          };

          // Invalidate relevant queries
          queryClient.invalidateQueries({
            queryKey: ["student-fees", newPayment.student_id],
          });
          queryClient.invalidateQueries({
            queryKey: ["student-balance", newPayment.student_id],
          });
          queryClient.invalidateQueries({
            queryKey: ["payments"],
          });
          queryClient.invalidateQueries({
            queryKey: ["daily-collections"],
          });

          // Show toast
          if (newPayment.status === "completed") {
            toast.success(
              `Payment received: KES ${newPayment.amount.toLocaleString()}`,
              {
                description: `Via ${newPayment.payment_method.replace("_", " ")}`,
              }
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mpesa_transactions",
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          const tx = payload.new as {
            status: string;
            student_id: string;
            amount: number;
          };

          if (tx.status === "completed") {
            queryClient.invalidateQueries({
              queryKey: ["student-fees", tx.student_id],
            });
            toast.success(
              `M-Pesa payment confirmed: KES ${tx.amount.toLocaleString()}`
            );
          } else if (tx.status === "failed") {
            toast.error("M-Pesa payment failed", {
              description: "The transaction was not completed.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, queryClient]);
}
