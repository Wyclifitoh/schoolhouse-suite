import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface C2BValidationRequest {
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
    const body: C2BValidationRequest = await req.json();
    const { BillRefNumber, TransAmount, MSISDN, TransID } = body;

    console.log(`[mpesa-c2b-validate] Validating: TransID=${TransID}, Ref=${BillRefNumber}, Amount=${TransAmount}`);

    // 1. Idempotency - check for duplicate transaction
    const { data: existing } = await supabase
      .from('mpesa_transactions')
      .select('id')
      .eq('mpesa_receipt_number', TransID)
      .maybeSingle();

    if (existing) {
      console.log(`[mpesa-c2b-validate] Duplicate transaction ${TransID}, accepting idempotently`);
      return new Response(JSON.stringify({ ResultCode: '0', ResultDesc: 'Accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate amount is positive
    const amount = parseFloat(TransAmount);
    if (amount <= 0) {
      return new Response(JSON.stringify({ ResultCode: 'C2B00012', ResultDesc: 'Invalid Amount' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Try to match student by reference
    const { data: student } = await supabase
      .from('students')
      .select('id, admission_number')
      .eq('admission_number', BillRefNumber)
      .maybeSingle();

    if (!student) {
      // Try fuzzy match
      const { data: fuzzyMatches } = await supabase.rpc('fuzzy_match_admission', {
        p_reference: BillRefNumber,
        p_school_id: '00000000-0000-0000-0000-000000000000', // Will need school context
      });

      if (!fuzzyMatches?.length) {
        // Log for manual reconciliation but still accept payment
        console.log(`[mpesa-c2b-validate] No match for ref ${BillRefNumber}, will log for reconciliation`);
      }
    }

    // 4. Accept payment - never reject due to our errors
    return new Response(JSON.stringify({ ResultCode: '0', ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[mpesa-c2b-validate] Error:', error);
    // Accept anyway - don't block payments due to our errors
    return new Response(JSON.stringify({ ResultCode: '0', ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
