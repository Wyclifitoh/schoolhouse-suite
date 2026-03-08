import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-school-id',
};

interface FeeAssignmentRequest {
  student_ids: string[];
  fee_template_id: string;
  term_id: string;
  academic_year_id: string;
  ledger_type: 'fees' | 'transport' | 'pos';
  amount_override?: number;
  due_date?: string;
  assignment_mode?: 'bulk_auto' | 'individual_auto' | 'manual';
}

interface BulkFeeAssignmentRequest {
  grade_ids: string[];
  fee_template_ids: string[];
  term_id: string;
  academic_year_id: string;
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
    const path = url.pathname.split('/').pop();

    // POST /fee-assignment - Assign fees to specific students
    if (req.method === 'POST' && path === 'fee-assignment') {
      const body: FeeAssignmentRequest = await req.json();

      // Validate required fields
      if (!body.student_ids?.length || !body.fee_template_id || !body.term_id || !body.academic_year_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate UUIDs
      const invalidStudents = body.student_ids.filter(id => !validateUUID(id));
      if (invalidStudents.length > 0) {
        return new Response(JSON.stringify({ error: 'Invalid student IDs', invalid: invalidStudents }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get fee template details
      const { data: template, error: templateError } = await supabase
        .from('fee_templates')
        .select('id, name, amount, ledger_type')
        .eq('id', body.fee_template_id)
        .eq('school_id', schoolId)
        .single();

      if (templateError || !template) {
        console.error('[fee-assignment] Template not found:', templateError);
        return new Response(JSON.stringify({ error: 'Fee template not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const amount = body.amount_override ?? template.amount;
      const ledgerType = body.ledger_type ?? template.ledger_type ?? 'fees';

      // Check for existing assignments to prevent duplicates
      const { data: existing } = await supabase
        .from('student_fees')
        .select('student_id')
        .eq('school_id', schoolId)
        .eq('fee_template_id', body.fee_template_id)
        .eq('term_id', body.term_id)
        .in('student_id', body.student_ids);

      const existingStudentIds = new Set(existing?.map(e => e.student_id) || []);
      const newStudentIds = body.student_ids.filter(id => !existingStudentIds.has(id));

      if (newStudentIds.length === 0) {
        return new Response(JSON.stringify({ 
          message: 'All students already have this fee assigned',
          assigned: 0,
          skipped: body.student_ids.length 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create fee assignments
      const assignments = newStudentIds.map(studentId => ({
        school_id: schoolId,
        student_id: studentId,
        fee_template_id: body.fee_template_id,
        term_id: body.term_id,
        academic_year_id: body.academic_year_id,
        ledger_type: ledgerType,
        amount_due: amount,
        amount_paid: 0,
        brought_forward_amount: 0,
        brought_forward_credit: 0,
        status: 'pending',
        due_date: body.due_date || null,
        assigned_by: user.id,
        assignment_mode: body.assignment_mode || 'manual',
        assigned_at: new Date().toISOString(),
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('student_fees')
        .insert(assignments)
        .select('id, student_id');

      if (insertError) {
        console.error('[fee-assignment] Insert error:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to assign fees', details: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create audit log entries
      const auditLogs = inserted!.map(fee => ({
        school_id: schoolId,
        action: 'FEE_ASSIGNED',
        entity_type: 'student_fee',
        entity_id: fee.id,
        student_id: fee.student_id,
        amount_affected: amount,
        performed_by: user.id,
        metadata: {
          fee_template_id: body.fee_template_id,
          term_id: body.term_id,
          assignment_mode: body.assignment_mode || 'manual',
        },
      }));

      await supabase.from('finance_audit_logs').insert(auditLogs);

      // Auto-apply pending excess credits to newly assigned fees per student
      const uniqueStudents = [...new Set(inserted!.map(f => f.student_id))];
      const feeIdsByStudent: Record<string, string[]> = {};
      inserted!.forEach(f => {
        if (!feeIdsByStudent[f.student_id]) feeIdsByStudent[f.student_id] = [];
        feeIdsByStudent[f.student_id].push(f.id);
      });

      for (const studentId of uniqueStudents) {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/apply-excess-to-fee`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              student_id: studentId,
              school_id: schoolId,
              student_fee_ids: feeIdsByStudent[studentId],
              ledger_type: ledgerType,
            }),
          });
          const result = await res.json();
          if (result.applied > 0) {
            console.log(`[fee-assignment] Auto-applied ${result.applied} excess to student ${studentId}`);
          }
        } catch (err) {
          console.error(`[fee-assignment] Failed to auto-apply excess for student ${studentId}:`, err);
        }
      }

      console.log(`[fee-assignment] Assigned ${inserted!.length} fees for school ${schoolId}`);

      return new Response(JSON.stringify({
        success: true,
        assigned: inserted!.length,
        skipped: existingStudentIds.size,
        fee_ids: inserted!.map(f => f.id),
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /fee-assignment/bulk - Bulk assign fees by grade
    if (req.method === 'POST' && path === 'bulk') {
      const body: BulkFeeAssignmentRequest = await req.json();

      if (!body.grade_ids?.length || !body.fee_template_ids?.length || !body.term_id || !body.academic_year_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get students in the specified grades
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, grade_id')
        .eq('school_id', schoolId)
        .in('grade_id', body.grade_ids)
        .eq('status', 'active');

      if (studentsError) {
        console.error('[fee-assignment] Students query error:', studentsError);
        return new Response(JSON.stringify({ error: 'Failed to fetch students' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!students?.length) {
        return new Response(JSON.stringify({ message: 'No active students found in selected grades', assigned: 0 }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get fee templates
      const { data: templates, error: templatesError } = await supabase
        .from('fee_templates')
        .select('id, amount, ledger_type')
        .eq('school_id', schoolId)
        .in('id', body.fee_template_ids);

      if (templatesError || !templates?.length) {
        return new Response(JSON.stringify({ error: 'Fee templates not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check existing assignments
      const studentIds = students.map(s => s.id);
      const { data: existing } = await supabase
        .from('student_fees')
        .select('student_id, fee_template_id')
        .eq('school_id', schoolId)
        .eq('term_id', body.term_id)
        .in('student_id', studentIds)
        .in('fee_template_id', body.fee_template_ids);

      const existingSet = new Set(existing?.map(e => `${e.student_id}-${e.fee_template_id}`) || []);

      // Create assignments for each student-template combination
      const assignments: Array<Record<string, unknown>> = [];
      for (const student of students) {
        for (const template of templates) {
          const key = `${student.id}-${template.id}`;
          if (!existingSet.has(key)) {
            assignments.push({
              school_id: schoolId,
              student_id: student.id,
              fee_template_id: template.id,
              term_id: body.term_id,
              academic_year_id: body.academic_year_id,
              ledger_type: template.ledger_type || 'fees',
              amount_due: template.amount,
              amount_paid: 0,
              brought_forward_amount: 0,
              brought_forward_credit: 0,
              status: 'pending',
              assigned_by: user.id,
              assignment_mode: 'bulk_auto',
              assigned_at: new Date().toISOString(),
            });
          }
        }
      }

      if (assignments.length === 0) {
        return new Response(JSON.stringify({ 
          message: 'All fees already assigned',
          assigned: 0,
          total_combinations: students.length * templates.length,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert in batches of 500
      const batchSize = 500;
      let totalInserted = 0;
      
      for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize);
        const { error: batchError } = await supabase
          .from('student_fees')
          .insert(batch);

        if (batchError) {
          console.error(`[fee-assignment] Batch insert error at ${i}:`, batchError);
          continue;
        }
        totalInserted += batch.length;
      }

      console.log(`[fee-assignment] Bulk assigned ${totalInserted} fees for school ${schoolId}`);

      return new Response(JSON.stringify({
        success: true,
        assigned: totalInserted,
        skipped: existingSet.size,
        students_count: students.length,
        templates_count: templates.length,
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /fee-assignment/:id - Remove a fee assignment (with restrictions)
    if (req.method === 'DELETE') {
      const feeId = url.searchParams.get('id');
      if (!feeId || !validateUUID(feeId)) {
        return new Response(JSON.stringify({ error: 'Valid fee ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if fee exists and has no payments
      const { data: fee, error: feeError } = await supabase
        .from('student_fees')
        .select('id, amount_paid, status')
        .eq('id', feeId)
        .eq('school_id', schoolId)
        .single();

      if (feeError || !fee) {
        return new Response(JSON.stringify({ error: 'Fee not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (fee.amount_paid > 0) {
        return new Response(JSON.stringify({ error: 'Cannot delete fee with payments. Use cancellation instead.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: deleteError } = await supabase
        .from('student_fees')
        .delete()
        .eq('id', feeId);

      if (deleteError) {
        return new Response(JSON.stringify({ error: 'Failed to delete fee' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, deleted: feeId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[fee-assignment] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
