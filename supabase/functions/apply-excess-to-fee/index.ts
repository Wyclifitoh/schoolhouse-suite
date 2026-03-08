import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Auto-applies pending advance credits when a new fee is assigned to a student.
 * Called after fee assignment to automatically deduct from excess.
 * 
 * Flow: Parent pays 20K → 17K allocated to fees → 3K excess → 
 *       School adds Computer Fee 2K → This function deducts 2K from excess → 1K excess remains
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { student_id, school_id, student_fee_ids, ledger_type } = await req.json();

    if (!student_id || !school_id) {
      return new Response(JSON.stringify({ error: 'student_id and school_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[apply-excess] Checking excess for student ${student_id}, ledger ${ledger_type || 'all'}`);

    // 1. Get all pending advance credits for this student
    let query = supabase
      .from('fee_carry_forwards')
      .select('*')
      .eq('student_id', student_id)
      .eq('school_id', school_id)
      .eq('type', 'advance_credit')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (ledger_type) {
      query = query.eq('ledger_type', ledger_type);
    }

    const { data: credits, error: creditsError } = await query;

    if (creditsError) {
      console.error('[apply-excess] Failed to fetch credits:', creditsError);
      throw creditsError;
    }

    if (!credits || credits.length === 0) {
      console.log('[apply-excess] No pending advance credits found');
      return new Response(JSON.stringify({
        success: true,
        applied: 0,
        message: 'No excess credits available',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalAvailableCredit = credits.reduce((sum, c) => sum + Number(c.amount), 0);
    console.log(`[apply-excess] Found ${credits.length} credits totaling ${totalAvailableCredit}`);

    // 2. Get the newly assigned fees (or all outstanding fees if no specific IDs)
    let feesQuery = supabase
      .from('student_fees')
      .select('id, amount_due, amount_paid, balance, status, ledger_type')
      .eq('student_id', student_id)
      .eq('school_id', school_id)
      .gt('balance', 0)
      .not('status', 'in', '("cancelled","waived")')
      .order('due_date', { ascending: true });

    if (student_fee_ids?.length > 0) {
      feesQuery = feesQuery.in('id', student_fee_ids);
    }

    const { data: fees, error: feesError } = await feesQuery;

    if (feesError) {
      console.error('[apply-excess] Failed to fetch fees:', feesError);
      throw feesError;
    }

    if (!fees || fees.length === 0) {
      console.log('[apply-excess] No outstanding fees to apply credits to');
      return new Response(JSON.stringify({
        success: true,
        applied: 0,
        message: 'No outstanding fees',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. FIFO allocation: apply credits to fees
    let remainingCredit = totalAvailableCredit;
    const allocations: Array<{ fee_id: string; credit_id: string; amount: number }> = [];
    let creditIdx = 0;
    let currentCreditRemaining = Number(credits[0].amount);

    for (const fee of fees) {
      if (remainingCredit <= 0 || creditIdx >= credits.length) break;

      const feeBalance = Number(fee.balance);
      let allocToThisFee = 0;

      while (allocToThisFee < feeBalance && creditIdx < credits.length) {
        const canAllocate = Math.min(currentCreditRemaining, feeBalance - allocToThisFee);
        
        allocations.push({
          fee_id: fee.id,
          credit_id: credits[creditIdx].id,
          amount: canAllocate,
        });

        allocToThisFee += canAllocate;
        currentCreditRemaining -= canAllocate;
        remainingCredit -= canAllocate;

        if (currentCreditRemaining <= 0) {
          creditIdx++;
          if (creditIdx < credits.length) {
            currentCreditRemaining = Number(credits[creditIdx].amount);
          }
        }
      }

      // Apply to fee
      if (allocToThisFee > 0) {
        await supabase.rpc('increment_fee_payment', {
          fee_id: fee.id,
          payment_amount: allocToThisFee,
        });
        console.log(`[apply-excess] Applied ${allocToThisFee} to fee ${fee.id}`);
      }
    }

    // 4. Update credit records
    const totalApplied = totalAvailableCredit - remainingCredit;
    
    // Group allocations by credit
    const creditAllocations: Record<string, number> = {};
    for (const alloc of allocations) {
      creditAllocations[alloc.credit_id] = (creditAllocations[alloc.credit_id] || 0) + alloc.amount;
    }

    for (const credit of credits) {
      const allocated = creditAllocations[credit.id] || 0;
      if (allocated >= Number(credit.amount)) {
        // Fully consumed
        await supabase
          .from('fee_carry_forwards')
          .update({ status: 'applied', applied_at: new Date().toISOString() })
          .eq('id', credit.id);
      } else if (allocated > 0) {
        // Partially consumed — reduce amount
        await supabase
          .from('fee_carry_forwards')
          .update({ amount: Number(credit.amount) - allocated })
          .eq('id', credit.id);
      }
    }

    // 5. Audit log
    if (totalApplied > 0) {
      await supabase.from('finance_audit_logs').insert({
        school_id,
        action: 'ADVANCE_CREDIT_CREATED',
        entity_type: 'carry_forward',
        entity_id: credits[0].id,
        student_id,
        amount_affected: totalApplied,
        performed_by: 'system',
        metadata: {
          source: 'auto_excess_application',
          allocations,
          total_applied: totalApplied,
          remaining_excess: remainingCredit,
        },
      });
    }

    console.log(`[apply-excess] Applied ${totalApplied} from excess, ${remainingCredit} remaining`);

    return new Response(JSON.stringify({
      success: true,
      applied: totalApplied,
      remaining_excess: remainingCredit,
      allocations_count: allocations.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[apply-excess] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
