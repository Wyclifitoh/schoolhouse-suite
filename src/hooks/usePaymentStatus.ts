import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed' | 'stale';

interface UsePaymentStatusReturn {
  status: PaymentStatus | null;
  receiptNumber: string | null;
  isLoading: boolean;
  error: string | null;
}

export function usePaymentStatus(transactionId: string | null): UsePaymentStatusReturn {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) return;

    setIsLoading(true);

    // Initial fetch
    const fetchStatus = async () => {
      const { data, error: fetchError } = await supabase
        .from('mpesa_transactions')
        .select('status')
        .eq('id', transactionId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setStatus(data.status as PaymentStatus);
      }
      setIsLoading(false);
    };

    fetchStatus();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`payment-${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mpesa_transactions',
          filter: `id=eq.${transactionId}`,
        },
        async (payload) => {
          const newStatus = payload.new.status as PaymentStatus;
          setStatus(newStatus);

          if (newStatus === 'completed') {
            // Fetch receipt
            const { data: payments } = await supabase
              .from('payments')
              .select('id')
              .eq('mpesa_transaction_id', transactionId)
              .limit(1);

            if (payments?.[0]) {
              const { data: receipt } = await supabase
                .from('receipts')
                .select('receipt_number')
                .eq('payment_id', payments[0].id)
                .limit(1);

              if (receipt?.[0]) {
                setReceiptNumber(receipt[0].receipt_number);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId]);

  return { status, receiptNumber, isLoading, error };
}
