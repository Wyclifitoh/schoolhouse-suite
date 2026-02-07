import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKCallbackBody {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: Array<{ Name: string; Value: string | number }>;
  };
}

interface CallbackPayload {
  Body: {
    stkCallback: STKCallbackBody;
  };
}

function parseCallbackMetadata(items: Array<{ Name: string; Value: unknown }>): Record<string, unknown> {
  return items.reduce((acc, item) => {
    acc[item.Name] = item.Value;
    return acc;
  }, {} as Record<string, unknown>);
}

function hashToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: CallbackPayload = await req.json();
    const callback = payload.Body.stkCallback;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    console.log(`[mpesa-callback] Processing callback for ${CheckoutRequestID}, ResultCode: ${ResultCode}`);

    // 1. Find transaction by checkout request ID
    const { data: transaction, error: findError } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    if (findError || !transaction) {
      console.error(`[mpesa-callback] Transaction not found: ${CheckoutRequestID}`, findError);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Idempotency check
    if (transaction.status === 'completed' || transaction.status === 'failed') {
      console.log(`[mpesa-callback] Transaction already processed: ${transaction.id}`);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Try to acquire advisory lock for this transaction
    const lockKey = hashToInt(transaction.id);
    const { data: lockAcquired } = await supabase.rpc('try_advisory_lock', { lock_key: lockKey });

    if (!lockAcquired) {
      console.log(`[mpesa-callback] Could not acquire lock for ${transaction.id}, likely concurrent processing`);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      if (ResultCode === 0) {
        // Success - extract metadata
        const metadata = parseCallbackMetadata(CallbackMetadata?.Item || []);

        // Update transaction status
        const { error: updateError } = await supabase
          .from('mpesa_transactions')
          .update({
            status: 'completed',
            mpesa_receipt_number: metadata.MpesaReceiptNumber as string,
            transaction_date: metadata.TransactionDate as string,
            confirmed_amount: metadata.Amount as number,
            confirmed_phone: metadata.PhoneNumber as string,
            callback_received_at: new Date().toISOString(),
            raw_callback: callback,
          })
          .eq('id', transaction.id);

        if (updateError) {
          console.error(`[mpesa-callback] Failed to update transaction: ${updateError.message}`);
          throw updateError;
        }

        console.log(`[mpesa-callback] Transaction ${transaction.id} marked as completed`);

        // 4. Trigger payment allocation via separate function
        EdgeRuntime.waitUntil(
          fetch(`${supabaseUrl}/functions/v1/process-payment-allocation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ mpesa_transaction_id: transaction.id }),
          }).catch(err => console.error('[mpesa-callback] Allocation trigger failed:', err))
        );

      } else {
        // Failed transaction
        await supabase
          .from('mpesa_transactions')
          .update({
            status: 'failed',
            failure_reason: ResultDesc,
            result_code: ResultCode,
            callback_received_at: new Date().toISOString(),
            raw_callback: callback,
          })
          .eq('id', transaction.id);

        console.log(`[mpesa-callback] Transaction ${transaction.id} marked as failed: ${ResultDesc}`);
      }
    } finally {
      // Release advisory lock
      await supabase.rpc('release_advisory_lock', { lock_key: lockKey });
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[mpesa-callback] Error processing callback:', error);
    // Always return success to M-Pesa to prevent retries for our errors
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
