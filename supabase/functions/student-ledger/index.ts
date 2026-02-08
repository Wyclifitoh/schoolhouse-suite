import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-school-id',
};

interface LedgerEntry {
  id: string;
  date: string;
  type: 'fee' | 'payment' | 'credit' | 'adjustment';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
  term_name?: string;
}

interface LedgerResponse {
  student_id: string;
  student_name: string;
  admission_number: string;
  ledger_type: string;
  opening_balance: number;
  entries: LedgerEntry[];
  closing_balance: number;
  total_debits: number;
  total_credits: number;
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
    const ledgerType = url.searchParams.get('ledger_type') || 'fees';
    const fromDate = url.searchParams.get('from_date');
    const toDate = url.searchParams.get('to_date');
    const termId = url.searchParams.get('term_id');

    if (!studentId || !validateUUID(studentId)) {
      return new Response(JSON.stringify({ error: 'Valid student_id required' }), {
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

    // Get fees (debits)
    let feesQuery = supabase
      .from('student_fees')
      .select(`
        id,
        amount_due,
        brought_forward_amount,
        assigned_at,
        term_id,
        fee_template_id,
        fee_templates(name),
        terms(name)
      `)
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .eq('ledger_type', ledgerType)
      .not('status', 'eq', 'cancelled')
      .order('assigned_at', { ascending: true });

    if (termId) {
      feesQuery = feesQuery.eq('term_id', termId);
    }
    if (fromDate) {
      feesQuery = feesQuery.gte('assigned_at', fromDate);
    }
    if (toDate) {
      feesQuery = feesQuery.lte('assigned_at', toDate);
    }

    const { data: fees, error: feesError } = await feesQuery;

    if (feesError) {
      console.error('[student-ledger] Fees query error:', feesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch fees' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get payments with allocations
    let paymentsQuery = supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        reference_number,
        received_at,
        payment_allocations(
          id,
          amount,
          student_fee_id
        )
      `)
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .eq('ledger_type', ledgerType)
      .eq('status', 'completed')
      .order('received_at', { ascending: true });

    if (fromDate) {
      paymentsQuery = paymentsQuery.gte('received_at', fromDate);
    }
    if (toDate) {
      paymentsQuery = paymentsQuery.lte('received_at', toDate);
    }

    const { data: payments, error: paymentsError } = await paymentsQuery;

    if (paymentsError) {
      console.error('[student-ledger] Payments query error:', paymentsError);
    }

    // Get carry forwards (credits and brought forward)
    const { data: carryForwards } = await supabase
      .from('fee_carry_forwards')
      .select('id, amount, type, created_at')
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .eq('ledger_type', ledgerType);

    // Build ledger entries
    const entries: LedgerEntry[] = [];

    // Add fee entries (debits)
    for (const fee of fees || []) {
      const amount = fee.amount_due + (fee.brought_forward_amount || 0);
      const feeData = fee as { fee_templates?: { name: string }; terms?: { name: string } };
      
      entries.push({
        id: fee.id,
        date: fee.assigned_at,
        type: 'fee',
        description: feeData.fee_templates?.name || 'Fee',
        debit: amount,
        credit: 0,
        balance: 0, // Will be calculated later
        term_name: feeData.terms?.name,
      });

      // Add brought forward as separate entry if exists
      if (fee.brought_forward_amount > 0) {
        entries.push({
          id: `${fee.id}-bf`,
          date: fee.assigned_at,
          type: 'fee',
          description: `Brought Forward - ${feeData.fee_templates?.name || 'Fee'}`,
          debit: fee.brought_forward_amount,
          credit: 0,
          balance: 0,
          term_name: feeData.terms?.name,
        });
      }
    }

    // Add payment entries (credits)
    for (const payment of payments || []) {
      entries.push({
        id: payment.id,
        date: payment.received_at,
        type: 'payment',
        description: `Payment - ${payment.payment_method.toUpperCase()}`,
        debit: 0,
        credit: payment.amount,
        balance: 0,
        reference: payment.reference_number || undefined,
      });
    }

    // Add advance credit entries
    for (const cf of carryForwards || []) {
      if (cf.type === 'advance_credit') {
        entries.push({
          id: cf.id,
          date: cf.created_at,
          type: 'credit',
          description: 'Advance Credit',
          debit: 0,
          credit: cf.amount,
          balance: 0,
        });
      }
    }

    // Sort entries by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      totalDebits += entry.debit;
      totalCredits += entry.credit;
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    }

    const response: LedgerResponse = {
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      admission_number: student.admission_number,
      ledger_type: ledgerType,
      opening_balance: 0,
      entries,
      closing_balance: runningBalance,
      total_debits: totalDebits,
      total_credits: totalCredits,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[student-ledger] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
