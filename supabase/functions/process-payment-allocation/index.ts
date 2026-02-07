import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AllocationResult {
  allocations: Array<{
    payment_id: string;
    student_fee_id: string;
    amount: number;
  }>;
  remaining_amount: number;
  fully_paid_fees: string[];
  partially_paid_fees: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { mpesa_transaction_id, payment_id } = await req.json();

    console.log(`[process-allocation] Starting allocation for ${mpesa_transaction_id || payment_id}`);

    // Get transaction details
    let transaction;
    if (mpesa_transaction_id) {
      const { data, error } = await supabase
        .from('mpesa_transactions')
        .select('*')
        .eq('id', mpesa_transaction_id)
        .eq('status', 'completed')
        .single();

      if (error || !data) {
        console.error(`[process-allocation] Transaction not found or not completed: ${mpesa_transaction_id}`);
        return new Response(JSON.stringify({ error: 'Transaction not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      transaction = data;
    }

    const studentId = transaction.student_id;
    const amount = transaction.confirmed_amount || transaction.amount;
    const ledgerType = transaction.ledger_type || 'fees';

    // 1. Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        school_id: transaction.school_id,
        student_id: studentId,
        amount: amount,
        payment_method: transaction.transaction_type === 'stk_push' ? 'mpesa_stk' : 'mpesa_c2b',
        reference_number: transaction.mpesa_receipt_number,
        ledger_type: ledgerType,
        status: 'completed',
        received_at: transaction.transaction_date || new Date().toISOString(),
        mpesa_transaction_id: transaction.id,
        payer_phone: transaction.confirmed_phone || transaction.phone_number,
      })
      .select()
      .single();

    if (paymentError) {
      console.error(`[process-allocation] Failed to create payment: ${paymentError.message}`);
      throw paymentError;
    }

    console.log(`[process-allocation] Created payment ${payment.id}`);

    // 2. Get outstanding fees for this student (FIFO order)
    const { data: outstandingFees, error: feesError } = await supabase
      .from('student_fees')
      .select('*')
      .eq('student_id', studentId)
      .eq('ledger_type', ledgerType)
      .gt('balance', 0)
      .order('brought_forward_amount', { ascending: false }) // Arrears first
      .order('due_date', { ascending: true }); // Then oldest first

    if (feesError) {
      console.error(`[process-allocation] Failed to get outstanding fees: ${feesError.message}`);
      throw feesError;
    }

    // 3. Allocate payment using FIFO algorithm
    const allocations: AllocationResult['allocations'] = [];
    let remainingAmount = amount;
    const fullyPaidFees: string[] = [];
    const partiallyPaidFees: string[] = [];

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

    // 4. Insert allocation records
    if (allocations.length > 0) {
      const { error: allocError } = await supabase
        .from('payment_allocations')
        .insert(allocations.map(a => ({
          ...a,
          allocated_at: new Date().toISOString(),
        })));

      if (allocError) {
        console.error(`[process-allocation] Failed to insert allocations: ${allocError.message}`);
        throw allocError;
      }

      // 5. Update student_fee.amount_paid for each allocation
      for (const alloc of allocations) {
        await supabase.rpc('increment_fee_payment', {
          fee_id: alloc.student_fee_id,
          payment_amount: alloc.amount,
        });
      }
    }

    // 6. Handle overpayment (advance credit)
    if (remainingAmount > 0) {
      const { error: creditError } = await supabase
        .from('fee_carry_forwards')
        .insert({
          student_id: studentId,
          school_id: transaction.school_id,
          ledger_type: ledgerType,
          from_term_id: transaction.term_id,
          amount: remainingAmount,
          type: 'advance_credit',
          status: 'pending',
          source_payment_id: payment.id,
        });

      if (creditError) {
        console.error(`[process-allocation] Failed to create advance credit: ${creditError.message}`);
      } else {
        console.log(`[process-allocation] Created advance credit of ${remainingAmount}`);
      }
    }

    // 7. Generate receipt
    const { data: receipt, error: receiptError } = await supabase.rpc('generate_receipt', {
      p_payment_id: payment.id,
      p_school_id: transaction.school_id,
    });

    if (receiptError) {
      console.error(`[process-allocation] Receipt generation failed: ${receiptError.message}`);
    } else {
      console.log(`[process-allocation] Generated receipt: ${receipt?.receipt_number}`);
    }

    // 8. Queue SMS notification
    EdgeRuntime.waitUntil(
      fetch(`${supabaseUrl}/functions/v1/send-payment-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          student_id: studentId,
          payment_id: payment.id,
          receipt_number: receipt?.receipt_number,
          amount: amount,
        }),
      }).catch(err => console.error('[process-allocation] SMS trigger failed:', err))
    );

    // 9. Create audit log
    await supabase.from('finance_audit_logs').insert({
      action: 'PAYMENT_ALLOCATED',
      entity_type: 'payment',
      entity_id: payment.id,
      student_id: studentId,
      school_id: transaction.school_id,
      amount_affected: amount,
      performed_by: 'system',
      metadata: {
        source: 'mpesa_callback',
        allocations,
        advance_credit: remainingAmount,
        fully_paid_fees: fullyPaidFees,
        partially_paid_fees: partiallyPaidFees,
      },
    });

    console.log(`[process-allocation] Completed allocation for payment ${payment.id}`);

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      allocations,
      remaining_amount: remainingAmount,
      fully_paid_fees: fullyPaidFees,
      partially_paid_fees: partiallyPaidFees,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[process-allocation] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
