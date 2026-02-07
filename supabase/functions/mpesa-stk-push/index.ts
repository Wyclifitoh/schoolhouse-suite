import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  student_id: string;
  phone_number: string;
  amount: number;
  fee_ids?: string[];
  ledger_type?: 'fees' | 'transport' | 'pos';
}

function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('0')) {
    normalized = '254' + normalized.slice(1);
  } else if (!normalized.startsWith('254')) {
    normalized = '254' + normalized;
  }
  return normalized;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${shortcode}${passkey}${timestamp}`);
  return btoa(String.fromCharCode(...data));
}

function generateShortId(length = 4): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const mpesaConsumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
  const mpesaConsumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
  const mpesaShortcode = Deno.env.get('MPESA_SHORTCODE');
  const mpesaPasskey = Deno.env.get('MPESA_PASSKEY');
  const mpesaEnvironment = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Validate auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { student_id, phone_number, amount, fee_ids, ledger_type = 'fees' }: STKPushRequest = await req.json();

    // Validate input
    if (!student_id || !phone_number || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be positive' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[mpesa-stk-push] Initiating STK push for student ${student_id}, amount: ${amount}`);

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, admission_number, school_id, current_term_id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone_number);
    const accountReference = `${student.admission_number}-${generateShortId()}`;
    const transactionId = crypto.randomUUID();

    // 1. Create pending transaction record FIRST
    const { data: txn, error: txnError } = await supabase
      .from('mpesa_transactions')
      .insert({
        id: transactionId,
        school_id: student.school_id,
        student_id: student_id,
        phone_number: normalizedPhone,
        amount: Math.floor(amount),
        account_reference: accountReference,
        transaction_type: 'stk_push',
        status: 'pending',
        ledger_type: ledger_type,
        fee_ids: fee_ids || [],
        term_id: student.current_term_id,
        initiated_by: user.id,
        initiated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (txnError) {
      console.error(`[mpesa-stk-push] Failed to create transaction record: ${txnError.message}`);
      return new Response(JSON.stringify({ error: 'Failed to initiate payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if M-Pesa is configured
    if (!mpesaConsumerKey || !mpesaConsumerSecret || !mpesaShortcode || !mpesaPasskey) {
      console.log('[mpesa-stk-push] M-Pesa not configured, returning mock response');
      
      await supabase
        .from('mpesa_transactions')
        .update({ status: 'pending', checkout_request_id: `MOCK-${transactionId}` })
        .eq('id', transactionId);

      return new Response(JSON.stringify({
        success: true,
        transaction_id: transactionId,
        checkout_request_id: `MOCK-${transactionId}`,
        message: '[DEV] STK Push simulated. Configure M-Pesa credentials for production.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get OAuth token
    const baseUrl = mpesaEnvironment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    const authString = btoa(`${mpesaConsumerKey}:${mpesaConsumerSecret}`);
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${authString}` },
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to get M-Pesa access token');
    }

    // 3. Build and send STK Push request
    const timestamp = generateTimestamp();
    const password = generatePassword(mpesaShortcode, mpesaPasskey, timestamp);

    const stkPayload = {
      BusinessShortCode: mpesaShortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(amount),
      PartyA: normalizedPhone,
      PartyB: mpesaShortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: `${supabaseUrl}/functions/v1/mpesa-callback`,
      AccountReference: accountReference,
      TransactionDesc: `Fee payment for ${accountReference}`,
    };

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const stkResult = await stkResponse.json();

    if (stkResult.ResponseCode === '0') {
      // Success - update with checkout request ID
      await supabase
        .from('mpesa_transactions')
        .update({
          checkout_request_id: stkResult.CheckoutRequestID,
          merchant_request_id: stkResult.MerchantRequestID,
          status: 'processing',
        })
        .eq('id', transactionId);

      console.log(`[mpesa-stk-push] STK push sent successfully: ${stkResult.CheckoutRequestID}`);

      return new Response(JSON.stringify({
        success: true,
        transaction_id: transactionId,
        checkout_request_id: stkResult.CheckoutRequestID,
        message: 'STK Push sent. Please enter your M-Pesa PIN.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Failed
      await supabase
        .from('mpesa_transactions')
        .update({
          status: 'failed',
          failure_reason: stkResult.errorMessage || stkResult.ResponseDescription,
        })
        .eq('id', transactionId);

      console.error(`[mpesa-stk-push] STK push failed: ${stkResult.ResponseDescription}`);

      return new Response(JSON.stringify({
        success: false,
        error: stkResult.ResponseDescription || 'STK Push failed',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('[mpesa-stk-push] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
