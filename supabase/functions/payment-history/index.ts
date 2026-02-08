import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-school-id',
};

function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const schoolId = req.headers.get('X-School-ID');
    if (!schoolId || !validateUUID(schoolId)) {
      return new Response(JSON.stringify({ error: 'Valid X-School-ID header required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const studentId = url.searchParams.get('student_id');
    const paymentMethod = url.searchParams.get('payment_method');
    const ledgerType = url.searchParams.get('ledger_type');
    const status = url.searchParams.get('status');
    const fromDate = url.searchParams.get('from_date');
    const toDate = url.searchParams.get('to_date');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('payments')
      .select(`
        id,
        student_id,
        amount,
        payment_method,
        ledger_type,
        reference_number,
        mpesa_transaction_id,
        payer_phone,
        status,
        received_at,
        notes,
        created_at,
        students!inner(
          first_name,
          last_name,
          admission_number
        ),
        receipts(
          receipt_number,
          pdf_url
        ),
        payment_allocations(
          id,
          amount,
          student_fee_id,
          student_fees(
            fee_template_id,
            fee_templates(name)
          )
        )
      `, { count: 'exact' })
      .eq('school_id', schoolId)
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (studentId) {
      if (!validateUUID(studentId)) {
        return new Response(JSON.stringify({ error: 'Invalid student_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      query = query.eq('student_id', studentId);
    }

    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }

    if (ledgerType) {
      query = query.eq('ledger_type', ledgerType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (fromDate) {
      query = query.gte('received_at', fromDate);
    }

    if (toDate) {
      query = query.lte('received_at', toDate);
    }

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('[payment-history] Query error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch payments' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform data for response
    const transformedPayments = payments?.map(payment => {
      const studentData = payment.students as unknown as { first_name: string; last_name: string; admission_number: string };
      const receiptData = payment.receipts as unknown as Array<{ receipt_number: string; pdf_url?: string }>;
      const allocationsData = payment.payment_allocations as unknown as Array<{
        id: string;
        amount: number;
        student_fee_id: string;
        student_fees?: { fee_template_id: string; fee_templates?: { name: string } };
      }>;

      return {
        id: payment.id,
        student_id: payment.student_id,
        student_name: studentData ? `${studentData.first_name} ${studentData.last_name}` : null,
        admission_number: studentData?.admission_number,
        amount: payment.amount,
        payment_method: payment.payment_method,
        ledger_type: payment.ledger_type,
        reference_number: payment.reference_number,
        mpesa_transaction_id: payment.mpesa_transaction_id,
        payer_phone: payment.payer_phone,
        status: payment.status,
        received_at: payment.received_at,
        notes: payment.notes,
        receipt_number: receiptData?.[0]?.receipt_number,
        receipt_url: receiptData?.[0]?.pdf_url,
        allocations: allocationsData?.map(a => ({
          id: a.id,
          amount: a.amount,
          fee_name: a.student_fees?.fee_templates?.name,
        })) || [],
      };
    });

    return new Response(JSON.stringify({
      payments: transformedPayments,
      total: count,
      limit,
      offset,
      has_more: (count || 0) > offset + limit,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[payment-history] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
