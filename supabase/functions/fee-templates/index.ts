import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-school-id',
};

interface FeeTemplateRequest {
  name: string;
  amount: number;
  ledger_type: 'fees' | 'transport' | 'pos';
  description?: string;
  is_mandatory?: boolean;
  applicable_grades?: string[];
}

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

    const url = new URL(req.url);

    // GET - List fee templates
    if (req.method === 'GET') {
      const ledgerType = url.searchParams.get('ledger_type');
      const isActive = url.searchParams.get('is_active') !== 'false';

      let query = supabase
        .from('fee_templates')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');

      if (ledgerType) {
        query = query.eq('ledger_type', ledgerType);
      }
      if (isActive) {
        query = query.eq('is_active', true);
      }

      const { data: templates, error } = await query;

      if (error) {
        console.error('[fee-templates] Query error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch templates' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ templates }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Create fee template
    if (req.method === 'POST') {
      const body: FeeTemplateRequest = await req.json();

      // Validate required fields
      if (!body.name?.trim()) {
        return new Response(JSON.stringify({ error: 'Name is required' }), {
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

      const validLedgers = ['fees', 'transport', 'pos'];
      if (!validLedgers.includes(body.ledger_type)) {
        return new Response(JSON.stringify({ error: 'Invalid ledger type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check for duplicate name
      const { data: existing } = await supabase
        .from('fee_templates')
        .select('id')
        .eq('school_id', schoolId)
        .eq('name', body.name.trim())
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Template with this name already exists' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: template, error } = await supabase
        .from('fee_templates')
        .insert({
          school_id: schoolId,
          name: body.name.trim(),
          amount: body.amount,
          ledger_type: body.ledger_type,
          description: body.description?.trim() || null,
          is_mandatory: body.is_mandatory ?? true,
          applicable_grades: body.applicable_grades || null,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('[fee-templates] Insert error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create template' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ template }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update fee template
    if (req.method === 'PUT') {
      const templateId = url.searchParams.get('id');
      if (!templateId || !validateUUID(templateId)) {
        return new Response(JSON.stringify({ error: 'Valid template ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body: Partial<FeeTemplateRequest> = await req.json();

      // Check if template exists
      const { data: existing } = await supabase
        .from('fee_templates')
        .select('id')
        .eq('id', templateId)
        .eq('school_id', schoolId)
        .single();

      if (!existing) {
        return new Response(JSON.stringify({ error: 'Template not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check name uniqueness if changing
      if (body.name) {
        const { data: duplicate } = await supabase
          .from('fee_templates')
          .select('id')
          .eq('school_id', schoolId)
          .eq('name', body.name.trim())
          .neq('id', templateId)
          .single();

        if (duplicate) {
          return new Response(JSON.stringify({ error: 'Template with this name already exists' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.name) updateData.name = body.name.trim();
      if (body.amount !== undefined) updateData.amount = body.amount;
      if (body.ledger_type) updateData.ledger_type = body.ledger_type;
      if (body.description !== undefined) updateData.description = body.description?.trim() || null;
      if (body.is_mandatory !== undefined) updateData.is_mandatory = body.is_mandatory;
      if (body.applicable_grades !== undefined) updateData.applicable_grades = body.applicable_grades;

      const { data: template, error } = await supabase
        .from('fee_templates')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.error('[fee-templates] Update error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update template' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ template }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Soft delete (deactivate) template
    if (req.method === 'DELETE') {
      const templateId = url.searchParams.get('id');
      if (!templateId || !validateUUID(templateId)) {
        return new Response(JSON.stringify({ error: 'Valid template ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if template is in use
      const { data: inUse } = await supabase
        .from('student_fees')
        .select('id')
        .eq('fee_template_id', templateId)
        .limit(1)
        .single();

      if (inUse) {
        // Soft delete - just deactivate
        await supabase
          .from('fee_templates')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', templateId)
          .eq('school_id', schoolId);

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Template deactivated (in use by student fees)' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Hard delete if not in use
      const { error } = await supabase
        .from('fee_templates')
        .delete()
        .eq('id', templateId)
        .eq('school_id', schoolId);

      if (error) {
        console.error('[fee-templates] Delete error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete template' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, deleted: templateId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[fee-templates] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
