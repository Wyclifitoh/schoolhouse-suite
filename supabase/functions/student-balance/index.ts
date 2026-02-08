import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-school-id',
};

interface BalanceSummary {
  student_id: string;
  student_name: string;
  admission_number: string;
  total_fees_due: number;
  total_paid: number;
  total_balance: number;
  advance_credit: number;
  net_balance: number;
  by_ledger: {
    fees: { due: number; paid: number; balance: number };
    transport: { due: number; paid: number; balance: number };
    pos: { due: number; paid: number; balance: number };
  };
  by_term?: Array<{
    term_id: string;
    term_name: string;
    due: number;
    paid: number;
    balance: number;
  }>;
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

    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const studentId = url.searchParams.get('student_id');
    const termId = url.searchParams.get('term_id');
    const includeBreakdown = url.searchParams.get('include_breakdown') === 'true';

    // Single student balance
    if (studentId) {
      if (!validateUUID(studentId)) {
        return new Response(JSON.stringify({ error: 'Invalid student_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get student info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      if (studentError || !student) {
        return new Response(JSON.stringify({ error: 'Student not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build fees query
      let feesQuery = supabase
        .from('student_fees')
        .select(`
          id,
          ledger_type,
          amount_due,
          amount_paid,
          brought_forward_amount,
          brought_forward_credit,
          status,
          term_id,
          terms(name)
        `)
        .eq('school_id', schoolId)
        .eq('student_id', studentId)
        .not('status', 'eq', 'cancelled');

      if (termId) {
        feesQuery = feesQuery.eq('term_id', termId);
      }

      const { data: fees, error: feesError } = await feesQuery;

      if (feesError) {
        console.error('[student-balance] Fees query error:', feesError);
        return new Response(JSON.stringify({ error: 'Failed to fetch fees' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get advance credits
      const { data: credits } = await supabase
        .from('fee_carry_forwards')
        .select('amount')
        .eq('school_id', schoolId)
        .eq('student_id', studentId)
        .eq('type', 'advance_credit')
        .eq('status', 'pending');

      const advanceCredit = credits?.reduce((sum, c) => sum + c.amount, 0) || 0;

      // Calculate totals
      const byLedger = {
        fees: { due: 0, paid: 0, balance: 0 },
        transport: { due: 0, paid: 0, balance: 0 },
        pos: { due: 0, paid: 0, balance: 0 },
      };

      const byTerm = new Map<string, { term_id: string; term_name: string; due: number; paid: number; balance: number }>();

      for (const fee of fees || []) {
        const ledger = fee.ledger_type as keyof typeof byLedger;
        const effectiveDue = fee.amount_due + (fee.brought_forward_amount || 0) - (fee.brought_forward_credit || 0);
        const balance = effectiveDue - fee.amount_paid;

        if (byLedger[ledger]) {
          byLedger[ledger].due += effectiveDue;
          byLedger[ledger].paid += fee.amount_paid;
          byLedger[ledger].balance += balance;
        }

        if (includeBreakdown && fee.term_id) {
          const termData = byTerm.get(fee.term_id) || {
            term_id: fee.term_id,
            term_name: (fee as { terms?: { name: string } }).terms?.name || 'Unknown',
            due: 0,
            paid: 0,
            balance: 0,
          };
          termData.due += effectiveDue;
          termData.paid += fee.amount_paid;
          termData.balance += balance;
          byTerm.set(fee.term_id, termData);
        }
      }

      const totalDue = byLedger.fees.due + byLedger.transport.due + byLedger.pos.due;
      const totalPaid = byLedger.fees.paid + byLedger.transport.paid + byLedger.pos.paid;
      const totalBalance = byLedger.fees.balance + byLedger.transport.balance + byLedger.pos.balance;

      const summary: BalanceSummary = {
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        admission_number: student.admission_number,
        total_fees_due: totalDue,
        total_paid: totalPaid,
        total_balance: totalBalance,
        advance_credit: advanceCredit,
        net_balance: totalBalance - advanceCredit,
        by_ledger: byLedger,
      };

      if (includeBreakdown) {
        summary.by_term = Array.from(byTerm.values());
      }

      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bulk balance for multiple students (grade/class filter)
    const gradeId = url.searchParams.get('grade_id');
    const hasBalance = url.searchParams.get('has_balance') === 'true';
    const minBalance = parseFloat(url.searchParams.get('min_balance') || '0');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get students
    let studentsQuery = supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, grade_id')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    if (gradeId) {
      studentsQuery = studentsQuery.eq('grade_id', gradeId);
    }

    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error('[student-balance] Students query error:', studentsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch students' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!students?.length) {
      return new Response(JSON.stringify({ students: [], total: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const studentIds = students.map(s => s.id);

    // Get all fees for these students
    let feesQuery = supabase
      .from('student_fees')
      .select('student_id, ledger_type, amount_due, amount_paid, brought_forward_amount, brought_forward_credit')
      .eq('school_id', schoolId)
      .in('student_id', studentIds)
      .not('status', 'eq', 'cancelled');

    if (termId) {
      feesQuery = feesQuery.eq('term_id', termId);
    }

    const { data: allFees } = await feesQuery;

    // Get advance credits
    const { data: allCredits } = await supabase
      .from('fee_carry_forwards')
      .select('student_id, amount')
      .eq('school_id', schoolId)
      .in('student_id', studentIds)
      .eq('type', 'advance_credit')
      .eq('status', 'pending');

    // Build credit map
    const creditMap = new Map<string, number>();
    for (const credit of allCredits || []) {
      creditMap.set(credit.student_id, (creditMap.get(credit.student_id) || 0) + credit.amount);
    }

    // Calculate balances per student
    const balanceMap = new Map<string, { due: number; paid: number; balance: number }>();
    for (const fee of allFees || []) {
      const current = balanceMap.get(fee.student_id) || { due: 0, paid: 0, balance: 0 };
      const effectiveDue = fee.amount_due + (fee.brought_forward_amount || 0) - (fee.brought_forward_credit || 0);
      current.due += effectiveDue;
      current.paid += fee.amount_paid;
      current.balance += effectiveDue - fee.amount_paid;
      balanceMap.set(fee.student_id, current);
    }

    // Build result
    let results = students.map(student => {
      const fees = balanceMap.get(student.id) || { due: 0, paid: 0, balance: 0 };
      const credit = creditMap.get(student.id) || 0;
      return {
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        admission_number: student.admission_number,
        grade_id: student.grade_id,
        total_due: fees.due,
        total_paid: fees.paid,
        balance: fees.balance,
        advance_credit: credit,
        net_balance: fees.balance - credit,
      };
    });

    // Apply filters
    if (hasBalance) {
      results = results.filter(r => r.net_balance > 0);
    }
    if (minBalance > 0) {
      results = results.filter(r => r.net_balance >= minBalance);
    }

    // Sort by balance descending
    results.sort((a, b) => b.net_balance - a.net_balance);

    return new Response(JSON.stringify({
      students: results,
      total: results.length,
      offset,
      limit,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[student-balance] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
