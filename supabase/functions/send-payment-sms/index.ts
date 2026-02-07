import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  student_id: string;
  payment_id: string;
  receipt_number: string;
  amount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const africastalkingApiKey = Deno.env.get('AFRICASTALKING_API_KEY');
  const africastalkingUsername = Deno.env.get('AFRICASTALKING_USERNAME');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { student_id, payment_id, receipt_number, amount }: SMSRequest = await req.json();

    console.log(`[send-payment-sms] Processing SMS for payment ${payment_id}`);

    // 1. Get student and parent contact details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        admission_number,
        parent_phone,
        school:schools(name, sms_sender_id)
      `)
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      console.error(`[send-payment-sms] Student not found: ${student_id}`);
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!student.parent_phone) {
      console.log(`[send-payment-sms] No parent phone for student ${student_id}`);
      return new Response(JSON.stringify({ message: 'No phone number available' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get current balance
    const { data: balanceData } = await supabase.rpc('get_student_balance', {
      p_student_id: student_id,
      p_ledger_type: 'fees',
    });

    const balance = balanceData || 0;

    // 3. Format SMS message
    const schoolName = student.school?.name || 'School';
    const studentName = `${student.first_name} ${student.last_name}`;
    const formattedAmount = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
    const formattedBalance = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(balance);

    const message = `${schoolName}: Payment of ${formattedAmount} received for ${studentName} (${student.admission_number}). Receipt: ${receipt_number}. Balance: ${formattedBalance}. Thank you.`;

    // 4. Send SMS via Africa's Talking (or log if not configured)
    if (africastalkingApiKey && africastalkingUsername) {
      const smsResponse = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': africastalkingApiKey,
        },
        body: new URLSearchParams({
          username: africastalkingUsername,
          to: student.parent_phone,
          message: message,
          from: student.school?.sms_sender_id || '',
        }),
      });

      const smsResult = await smsResponse.json();
      console.log(`[send-payment-sms] SMS sent:`, smsResult);

      // 5. Log SMS in database
      await supabase.from('sms_logs').insert({
        student_id: student_id,
        school_id: student.school_id,
        phone_number: student.parent_phone,
        message: message,
        status: smsResult.SMSMessageData?.Recipients?.[0]?.status || 'sent',
        provider: 'africastalking',
        provider_message_id: smsResult.SMSMessageData?.Recipients?.[0]?.messageId,
        cost: smsResult.SMSMessageData?.Recipients?.[0]?.cost,
        triggered_by: 'payment_confirmation',
        reference_type: 'payment',
        reference_id: payment_id,
      });

    } else {
      console.log(`[send-payment-sms] SMS provider not configured. Message would be: ${message}`);
      
      // Log as pending/not-sent
      await supabase.from('sms_logs').insert({
        student_id: student_id,
        phone_number: student.parent_phone,
        message: message,
        status: 'not_configured',
        triggered_by: 'payment_confirmation',
        reference_type: 'payment',
        reference_id: payment_id,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'SMS processed',
      phone: student.parent_phone,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[send-payment-sms] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
