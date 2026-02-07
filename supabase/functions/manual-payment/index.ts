import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManualPaymentRequest {
  student_id: string;
  amount: number;
  payment_method: 'cash' | 'bank' | 'cheque';
  reference_number?: string;
  ledger_type?: 'fees' | 'transport' | 'pos';
  fee_allocations?: Array<{ fee_id: string; amount: number }>;
  notes?: string;
  received_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Validate auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const {
      student_id,
      amount,
      payment_method,
      reference_number,
      ledger_type = 'fees',
      fee_allocations,
      notes,
      received_at,
    }: ManualPaymentRequest = await req.json();

    // Validate input
    if (!student_id || !amount || !payment_method) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be positive' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[manual-payment] Recording ${payment_method} payment of ${amount} for student ${student_id}`);

    // 1. Check user permission
    const { data: hasPermission } = await supabase.rpc('has_permission', {
      p_user_id: user.id,
      p_permission: 'payments.record',
    });

    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get student and school details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, admission_number, school_id, current_term_id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Duplicate detection (same amount, reference, within 5 minutes)
    if (reference_number) {
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('reference_number', reference_number)
        .eq('student_id', student_id)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ 
          error: 'Duplicate payment detected',
          existing_payment_id: existing.id,
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        school_id: student.school_id,
        student_id: student_id,
        amount: amount,
        payment_method: payment_method,
        reference_number: reference_number,
        ledger_type: ledger_type,
        status: 'completed',
        received_at: received_at || new Date().toISOString(),
        recorded_by: user.id,
        notes: notes,
      })
      .select()
      .single();

    if (paymentError) {
      console.error(`[manual-payment] Failed to create payment: ${paymentError.message}`);
      throw paymentError;
    }

    console.log(`[manual-payment] Created payment ${payment.id}`);

    // 5. Allocate payment
    let allocations: Array<{ payment_id: string; student_fee_id: string; amount: number }> = [];
    let remainingAmount = amount;
    const fullyPaidFees: string[] = [];
    const partiallyPaidFees: string[] = [];

    if (fee_allocations && fee_allocations.length > 0) {
      // Manual allocation mode
      for (const alloc of fee_allocations) {
        if (remainingAmount <= 0) break;

        const { data: fee } = await supabase
          .from('student_fees')
          .select('id, balance')
          .eq('id', alloc.fee_id)
          .single();

        if (!fee) continue;

        const allocatableAmount = Math.min(alloc.amount, remainingAmount, fee.balance);

        allocations.push({
          payment_id: payment.id,
          student_fee_id: fee.id,
          amount: allocatableAmount,
        });

        remainingAmount -= allocatableAmount;

        if (allocatableAmount >= fee.balance) {
          fullyPaidFees.push(fee.id);
        } else {
          partiallyPaidFees.push(fee.id);
        }
      }
    } else {
      // FIFO allocation
      const { data: outstandingFees } = await supabase
        .from('student_fees')
        .select('id, balance')
        .eq('student_id', student_id)
        .eq('ledger_type', ledger_type)
        .gt('balance', 0)
        .order('brought_forward_amount', { ascending: false })
        .order('due_date', { ascending: true });

      for (const fee of outstandingFees || []) {
        if (remainingAmount <= 0) break;

        const allocatableAmount = Math.min(remainingAmount, fee.balance);

        allocations.push({
          payment_id: payment.id,
          student_fee_id: fee.id,
          amount: allocatableAmount,
        });

        remainingAmount -= allocatableAmount;

        if (allocatableAmount >= fee.balance) {
          fullyPaidFees.push(fee.id);
        } else {
          partiallyPaidFees.push(fee.id);
        }
      }
    }

    // 6. Insert allocations and update fees
    if (allocations.length > 0) {
      await supabase
        .from('payment_allocations')
        .insert(allocations.map(a => ({
          ...a,
          allocated_at: new Date().toISOString(),
        })));

      for (const alloc of allocations) {
        await supabase.rpc('increment_fee_payment', {
          fee_id: alloc.student_fee_id,
          payment_amount: alloc.amount,
        });
      }
    }

    // 7. Handle overpayment
    if (remainingAmount > 0) {
      await supabase.from('fee_carry_forwards').insert({
        student_id: student_id,
        school_id: student.school_id,
        ledger_type: ledger_type,
        from_term_id: student.current_term_id,
        amount: remainingAmount,
        type: 'advance_credit',
        status: 'pending',
        source_payment_id: payment.id,
      });
    }

    // 8. Generate receipt
    const { data: receipt } = await supabase.rpc('generate_receipt', {
      p_payment_id: payment.id,
      p_school_id: student.school_id,
    });

    // 9. Audit log
    await supabase.from('finance_audit_logs').insert({
      action: 'MANUAL_PAYMENT_RECORDED',
      entity_type: 'payment',
      entity_id: payment.id,
      student_id: student_id,
      school_id: student.school_id,
      amount_affected: amount,
      performed_by: user.id,
      metadata: {
        payment_method,
        reference_number,
        allocations,
        advance_credit: remainingAmount,
        notes,
      },
    });

    console.log(`[manual-payment] Completed recording payment ${payment.id}`);

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      receipt_number: receipt?.receipt_number,
      allocations,
      advance_credit: remainingAmount,
      fully_paid_fees: fullyPaidFees,
      partially_paid_fees: partiallyPaidFees,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[manual-payment] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
