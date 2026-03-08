import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-school-id',
};

function validateUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const schoolId = req.headers.get('X-School-ID');
    if (!schoolId || !validateUUID(schoolId)) {
      return new Response(JSON.stringify({ error: 'Valid X-School-ID header required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { student_fee_id, adjustment_type, amount, reason, approved_by } = await req.json();

    if (!student_fee_id || !adjustment_type || !reason) {
      return new Response(JSON.stringify({ error: 'Missing required fields: student_fee_id, adjustment_type, reason' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['increase', 'decrease', 'waive'].includes(adjustment_type)) {
      return new Response(JSON.stringify({ error: 'Invalid adjustment_type. Must be: increase, decrease, or waive' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (adjustment_type !== 'waive' && (!amount || amount <= 0)) {
      return new Response(JSON.stringify({ error: 'Amount must be positive for increase/decrease' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check automation config for approval requirements
    const { data: config } = await supabase
      .from('finance_automation_config')
      .select('require_approval_for_adjustments, max_adjustment_without_approval')
      .eq('school_id', schoolId)
      .maybeSingle();

    if (config?.require_approval_for_adjustments && amount > (config.max_adjustment_without_approval || 0) && !approved_by) {
      return new Response(JSON.stringify({ error: 'This adjustment requires approval', requires_approval: true }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply adjustment via DB function
    const { error: adjustError } = await supabase.rpc('apply_fee_adjustment', {
      p_student_fee_id: student_fee_id,
      p_school_id: schoolId,
      p_adjustment_type: adjustment_type,
      p_amount: adjustment_type === 'waive' ? 0 : amount,
      p_reason: reason,
      p_created_by: user.id,
      p_approved_by: approved_by || null,
    });

    if (adjustError) {
      console.error('[fee-adjustment] Error:', adjustError);
      return new Response(JSON.stringify({ error: adjustError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[fee-adjustment] Applied ${adjustment_type} of ${amount} to fee ${student_fee_id}`);

    return new Response(JSON.stringify({ success: true, student_fee_id, adjustment_type, amount }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[fee-adjustment] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
