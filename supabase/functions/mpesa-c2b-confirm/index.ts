import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface C2BConfirmRequest {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  InvoiceNumber: string;
  MSISDN: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: C2BConfirmRequest = await req.json();
    const { TransID, BillRefNumber, TransAmount, MSISDN, TransTime, FirstName, LastName } = body;

    console.log(`[mpesa-c2b-confirm] Confirming: TransID=${TransID}, Ref=${BillRefNumber}, Amount=${TransAmount}`);

    // 1. Idempotency check
    const { data: existing } = await supabase
      .from('mpesa_transactions')
      .select('id, status')
      .eq('mpesa_receipt_number', TransID)
      .maybeSingle();

    if (existing?.status === 'completed') {
      console.log(`[mpesa-c2b-confirm] Already processed: ${TransID}`);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Find student by reference
    const { data: student } = await supabase
      .from('students')
      .select('id, school_id, current_term_id')
      .eq('admission_number', BillRefNumber)
      .maybeSingle();

    // 3. Create or update transaction record
    let transactionId: string;

    if (existing) {
      transactionId = existing.id;
      await supabase
        .from('mpesa_transactions')
        .update({
          status: 'completed',
          mpesa_receipt_number: TransID,
          transaction_date: TransTime,
          confirmed_amount: parseFloat(TransAmount),
          confirmed_phone: MSISDN,
          payer_name: `${FirstName} ${LastName}`.trim(),
          callback_received_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      const { data: newTxn } = await supabase
        .from('mpesa_transactions')
        .insert({
          school_id: student?.school_id,
          student_id: student?.id,
          phone_number: MSISDN,
          amount: parseFloat(TransAmount),
          account_reference: BillRefNumber,
          transaction_type: 'c2b',
          status: 'completed',
          ledger_type: 'fees',
          mpesa_receipt_number: TransID,
          transaction_date: TransTime,
          confirmed_amount: parseFloat(TransAmount),
          confirmed_phone: MSISDN,
          payer_name: `${FirstName} ${LastName}`.trim(),
          term_id: student?.current_term_id,
          callback_received_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      transactionId = newTxn!.id;
    }

    // 4. If student found, trigger payment allocation
    if (student) {
      EdgeRuntime.waitUntil(
        fetch(`${supabaseUrl}/functions/v1/process-payment-allocation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ mpesa_transaction_id: transactionId }),
        }).catch(err => console.error('[mpesa-c2b-confirm] Allocation trigger failed:', err))
      );
    } else {
      // 5. Log as unmatched for manual reconciliation
      console.log(`[mpesa-c2b-confirm] No student match for ref: ${BillRefNumber}`);

      await supabase.from('unmatched_payments').insert({
        mpesa_transaction_id: transactionId,
        phone_number: MSISDN,
        amount: parseFloat(TransAmount),
        account_reference: BillRefNumber,
        payer_name: `${FirstName} ${LastName}`.trim(),
        received_at: new Date().toISOString(),
        status: 'pending_review',
        suggested_matches: [],
      });
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[mpesa-c2b-confirm] Error:', error);
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
