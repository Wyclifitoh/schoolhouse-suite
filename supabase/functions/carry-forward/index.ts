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

    const { from_term_id, to_term_id } = await req.json();

    if (!from_term_id || !to_term_id) {
      return new Response(JSON.stringify({ error: 'from_term_id and to_term_id are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate terms belong to school
    const { data: terms } = await supabase
      .from('terms')
      .select('id')
      .eq('school_id', schoolId)
      .in('id', [from_term_id, to_term_id]);

    if (!terms || terms.length < 2) {
      return new Response(JSON.stringify({ error: 'Invalid term IDs for this school' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[carry-forward] Processing carry forwards from ${from_term_id} to ${to_term_id} for school ${schoolId}`);

    // Execute carry forward via DB function
    const { data: result, error: cfError } = await supabase.rpc('apply_carry_forwards_for_term', {
      p_school_id: schoolId,
      p_from_term_id: from_term_id,
      p_to_term_id: to_term_id,
    });

    if (cfError) {
      console.error('[carry-forward] Error:', cfError);
      return new Response(JSON.stringify({ error: cfError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[carry-forward] Completed. Result:`, result);

    return new Response(JSON.stringify({
      success: true,
      from_term_id,
      to_term_id,
      result: result?.[0] || { applied_count: 0, failed_count: 0, total_arrears: 0, total_credits: 0 },
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[carry-forward] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
