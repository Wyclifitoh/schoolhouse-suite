import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-school-id',
};

type PaymentMethod = 'mpesa_stk' | 'mpesa_c2b' | 'cash' | 'bank' | 'cheque' | 'card';
type LedgerType = 'fees' | 'transport' | 'pos';

interface RecordPaymentRequest {
  student_id: string;
  amount: number;
  payment_method: PaymentMethod;
  ledger_type: LedgerType;
  reference_number?: string;
  payer_phone?: string;
  notes?: string;
  received_at?: string;
  fee_ids?: string[]; // Specific fees to allocate to
}

function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
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

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: RecordPaymentRequest = await req.json();

    // Validate required fields
    if (!body.student_id || !validateUUID(body.student_id)) {
      return new Response(JSON.stringify({ error: 'Valid student_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.amount || body.amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be positive' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validMethods: PaymentMethod[] = ['mpesa_stk', 'mpesa_c2b', 'cash', 'bank', 'cheque', 'card'];
    if (!validMethods.includes(body.payment_method)) {
      return new Response(JSON.stringify({ error: 'Invalid payment method' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validLedgers: LedgerType[] = ['fees', 'transport', 'pos'];
    const ledgerType = body.ledger_type || 'fees';
    if (!validLedgers.includes(ledgerType)) {
      return new Response(JSON.stringify({ error: 'Invalid ledger type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify student exists in school
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, admission_number')
      .eq('id', body.student_id)
      .eq('school_id', schoolId)
      .single();

    if (studentError || !student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate reference number (for non-cash payments)
    if (body.reference_number && body.payment_method !== 'cash') {
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('school_id', schoolId)
        .eq('reference_number', body.reference_number)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Duplicate reference number' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Acquire advisory lock for this student to prevent race conditions
    const lockKey = hashToInt(`payment-${body.student_id}`);
    const { data: lockAcquired } = await supabase.rpc('try_advisory_lock', { lock_key: lockKey });

    if (!lockAcquired) {
      return new Response(JSON.stringify({ error: 'Payment processing in progress, please retry' }), {
        status: 423,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          school_id: schoolId,
          student_id: body.student_id,
          amount: body.amount,
          payment_method: body.payment_method,
          ledger_type: ledgerType,
          reference_number: body.reference_number || null,
          payer_phone: body.payer_phone || null,
          notes: body.notes || null,
          status: 'completed',
          received_at: body.received_at || new Date().toISOString(),
          recorded_by: user.id,
        })
        .select()
        .single();

      if (paymentError || !payment) {
        console.error('[record-payment] Payment insert error:', paymentError);
        return new Response(JSON.stringify({ error: 'Failed to record payment' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[record-payment] Payment ${payment.id} created for student ${body.student_id}`);

      // FIFO allocation to outstanding fees
      let remainingAmount = body.amount;
      const allocations: Array<{ fee_id: string; amount: number; fee_name?: string }> = [];

      // Get outstanding fees, optionally filtered by fee_ids
      let feesQuery = supabase
        .from('student_fees')
        .select(`
          id,
          amount_due,
          amount_paid,
          fee_template_id,
          fee_templates!inner(name)
        `)
        .eq('school_id', schoolId)
        .eq('student_id', body.student_id)
        .eq('ledger_type', ledgerType)
        .in('status', ['pending', 'partial'])
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (body.fee_ids?.length) {
        feesQuery = feesQuery.in('id', body.fee_ids);
      }

      const { data: fees, error: feesError } = await feesQuery;

      if (feesError) {
        console.error('[record-payment] Fees query error:', feesError);
      }

      if (fees && fees.length > 0) {
        for (const fee of fees) {
          if (remainingAmount <= 0) break;

          const balance = fee.amount_due - fee.amount_paid;
          if (balance <= 0) continue;

          const allocationAmount = Math.min(balance, remainingAmount);
          remainingAmount -= allocationAmount;

          // Update student_fee
          const newPaid = fee.amount_paid + allocationAmount;
          const newStatus = newPaid >= fee.amount_due ? 'paid' : 'partial';

          await supabase
            .from('student_fees')
            .update({
              amount_paid: newPaid,
              status: newStatus,
              last_payment_at: new Date().toISOString(),
            })
            .eq('id', fee.id);

          // Create allocation record
          const { data: allocation } = await supabase
            .from('payment_allocations')
            .insert({
              payment_id: payment.id,
              student_fee_id: fee.id,
              amount: allocationAmount,
              allocated_at: new Date().toISOString(),
            })
            .select()
            .single();

          allocations.push({
            fee_id: fee.id,
            amount: allocationAmount,
            fee_name: (fee as { fee_templates?: { name: string } }).fee_templates?.name,
          });

          console.log(`[record-payment] Allocated ${allocationAmount} to fee ${fee.id}`);
        }
      }

      // Handle overpayment as advance credit
      if (remainingAmount > 0) {
        await supabase
          .from('fee_carry_forwards')
          .insert({
            school_id: schoolId,
            student_id: body.student_id,
            ledger_type: ledgerType,
            amount: remainingAmount,
            type: 'advance_credit',
            status: 'pending',
            source_payment_id: payment.id,
          });

        console.log(`[record-payment] Created advance credit of ${remainingAmount} for student ${body.student_id}`);
      }

      // Create audit log
      await supabase.from('finance_audit_logs').insert({
        school_id: schoolId,
        action: 'PAYMENT_RECEIVED',
        entity_type: 'payment',
        entity_id: payment.id,
        student_id: body.student_id,
        amount_affected: body.amount,
        performed_by: user.id,
        metadata: {
          payment_method: body.payment_method,
          reference_number: body.reference_number,
          allocations_count: allocations.length,
          advance_credit: remainingAmount > 0 ? remainingAmount : 0,
        },
      });

      // Generate receipt number
      const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
      await supabase
        .from('receipts')
        .insert({
          school_id: schoolId,
          payment_id: payment.id,
          receipt_number: receiptNumber,
          generated_at: new Date().toISOString(),
        });

      return new Response(JSON.stringify({
        success: true,
        payment_id: payment.id,
        receipt_number: receiptNumber,
        amount: body.amount,
        allocated: body.amount - remainingAmount,
        advance_credit: remainingAmount > 0 ? remainingAmount : 0,
        allocations,
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      // Release advisory lock
      await supabase.rpc('release_advisory_lock', { lock_key: lockKey });
    }

  } catch (error) {
    console.error('[record-payment] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
