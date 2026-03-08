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

    const { student_fee_id, discount_id } = await req.json();

    if (!student_fee_id || !discount_id) {
      return new Response(JSON.stringify({ error: 'student_fee_id and discount_id are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check automation config
    const { data: config } = await supabase
      .from('finance_automation_config')
      .select('require_approval_for_discounts, max_discount_percent_without_approval')
      .eq('school_id', schoolId)
      .maybeSingle();

    // Get discount to check value
    const { data: discount } = await supabase
      .from('fee_discounts')
      .select('value, type')
      .eq('id', discount_id)
      .single();

    if (config?.require_approval_for_discounts && discount?.type === 'percentage' &&
        discount.value > (config.max_discount_percent_without_approval || 100)) {
      return new Response(JSON.stringify({ error: 'This discount requires approval', requires_approval: true }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply via DB function
    const { data: discountAmount, error: discountError } = await supabase.rpc('apply_fee_discount', {
      p_student_fee_id: student_fee_id,
      p_discount_id: discount_id,
      p_applied_by: user.id,
    });

    if (discountError) {
      console.error('[apply-discount] Error:', discountError);
      return new Response(JSON.stringify({ error: discountError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Audit log
    await supabase.from('finance_audit_logs').insert({
      school_id: schoolId,
      action: 'DISCOUNT_APPLIED',
      entity_type: 'student_fee',
      entity_id: student_fee_id,
      amount_affected: discountAmount,
      performed_by: user.id,
      metadata: { discount_id, discount_amount: discountAmount },
    });

    return new Response(JSON.stringify({ success: true, discount_amount: discountAmount }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[apply-discount] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
