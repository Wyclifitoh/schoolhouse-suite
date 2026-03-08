import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconcileRequest {
  unmatched_payment_id: string;
  student_id: string;
  fee_ids?: string[];
  notes: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { unmatched_payment_id, student_id, fee_ids, notes }: ReconcileRequest = await req.json();

    // 1. Get unmatched payment
    const { data: unmatched, error: findError } = await supabase
      .from('unmatched_payments')
      .select('*, mpesa_transactions(*)')
      .eq('id', unmatched_payment_id)
      .single();

    if (findError || !unmatched) {
      return new Response(JSON.stringify({ error: 'Unmatched payment not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (unmatched.status !== 'pending_review') {
      return new Response(JSON.stringify({ error: 'Payment already reconciled' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Update M-Pesa transaction with student
    await supabase
      .from('mpesa_transactions')
      .update({ student_id })
      .eq('id', unmatched.mpesa_transaction_id);

    // 3. Trigger allocation
    const allocResponse = await fetch(`${supabaseUrl}/functions/v1/process-payment-allocation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        mpesa_transaction_id: unmatched.mpesa_transaction_id,
        fee_ids,
      }),
    });

    const allocResult = await allocResponse.json();

    // 4. Mark as reconciled
    await supabase
      .from('unmatched_payments')
      .update({
        status: 'reconciled',
        reconciled_by: user.id,
        reconciled_at: new Date().toISOString(),
        reconciliation_notes: notes,
        matched_student_id: student_id,
        resulting_payment_id: allocResult.payment_id,
      })
      .eq('id', unmatched_payment_id);

    // 5. Audit log
    await supabase.from('finance_audit_logs').insert({
      action: 'PAYMENT_RECONCILED',
      entity_type: 'payment',
      entity_id: allocResult.payment_id || unmatched.mpesa_transaction_id,
      student_id,
      school_id: unmatched.mpesa_transactions?.school_id,
      amount_affected: unmatched.amount,
      performed_by: user.id,
      metadata: {
        original_reference: unmatched.account_reference,
        matched_student_id: student_id,
        notes,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      payment_id: allocResult.payment_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[reconcile-payment] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
