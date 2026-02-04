# CHUO Payment Processing Flow

## Overview

This document defines the complete payment processing architecture including M-Pesa integration, manual payments, receipt generation, and error handling strategies.

---

## 1. Payment Channel Architecture

### Supported Payment Methods

```typescript
enum PaymentMethod {
  MPESA_STK = 'mpesa_stk',      // STK Push initiated by system
  MPESA_PAYBILL = 'mpesa_c2b',  // Customer-initiated via Paybill
  BANK_TRANSFER = 'bank',       // Bank deposit/transfer
  CASH = 'cash',                // Physical cash payment
  CHEQUE = 'cheque',            // Cheque payment
  CARD = 'card',                // Card payment (future)
}

enum PaymentStatus {
  PENDING = 'pending',           // Awaiting confirmation
  PROCESSING = 'processing',     // Being processed
  COMPLETED = 'completed',       // Successfully processed
  FAILED = 'failed',             // Payment failed
  CANCELLED = 'cancelled',       // User cancelled
  REVERSED = 'reversed',         // Refunded/reversed
  STALE = 'stale',               // Timeout without confirmation
}
```

---

## 2. M-Pesa STK Push Flow

### 2.1 Initiation Sequence

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │  Edge Func  │     │  Safaricom  │     │   Parent    │
│   (Web/App) │     │  (Backend)  │     │   Daraja    │     │   Phone     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ POST /pay/stk     │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │                   │ Create pending    │                   │
       │                   │ mpesa_transaction │                   │
       │                   │───────┐           │                   │
       │                   │       │           │                   │
       │                   │<──────┘           │                   │
       │                   │                   │                   │
       │                   │ STK Push Request  │                   │
       │                   │──────────────────>│                   │
       │                   │                   │                   │
       │                   │ CheckoutRequestID │                   │
       │                   │<──────────────────│                   │
       │                   │                   │                   │
       │                   │ Update record     │                   │
       │                   │ with request_id   │                   │
       │                   │───────┐           │                   │
       │                   │<──────┘           │                   │
       │                   │                   │                   │
       │ { status: pending │                   │                   │
       │   reference: xxx }│                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │                   │                   │ STK Prompt        │
       │                   │                   │──────────────────>│
       │                   │                   │                   │
       │                   │                   │ User enters PIN   │
       │                   │                   │<──────────────────│
       │                   │                   │                   │
       │                   │ Callback (async)  │                   │
       │                   │<──────────────────│                   │
       │                   │                   │                   │
```

### 2.2 STK Push Request Handler

```typescript
// Edge Function: supabase/functions/mpesa-stk-push/index.ts

interface STKPushRequest {
  student_id: string;
  phone_number: string;
  amount: number;
  fee_ids?: string[];        // Optional: specific fees to pay
  account_reference?: string; // Auto-generated if not provided
}

interface STKPushResponse {
  success: boolean;
  transaction_id: string;
  checkout_request_id: string;
  message: string;
}

async function initiateSTKPush(
  req: STKPushRequest,
  context: AuthContext
): Promise<STKPushResponse> {
  const { student_id, phone_number, amount, fee_ids } = req;

  // 1. Validate request
  await validateSTKRequest(student_id, phone_number, amount, context);

  // 2. Generate unique reference
  const account_reference = generateAccountReference(student_id);
  const transaction_id = generateTransactionId();

  // 3. Create pending transaction record FIRST (before external call)
  const { data: txn, error } = await supabase
    .from('mpesa_transactions')
    .insert({
      id: transaction_id,
      school_id: context.school_id,
      student_id,
      phone_number: normalizePhoneNumber(phone_number),
      amount,
      account_reference,
      transaction_type: 'stk_push',
      status: 'pending',
      fee_ids: fee_ids || [],
      initiated_by: context.user_id,
      initiated_at: new Date().toISOString(),
      expires_at: addMinutes(new Date(), 5).toISOString(), // 5 min timeout
    })
    .select()
    .single();

  if (error) throw new PaymentError('RECORD_CREATE_FAILED', error.message);

  try {
    // 4. Get OAuth token
    const accessToken = await getMpesaAccessToken();

    // 5. Build STK Push payload
    const timestamp = formatMpesaTimestamp(new Date());
    const password = generateMpesaPassword(timestamp);

    const stkPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(amount), // M-Pesa requires integer
      PartyA: normalizePhoneNumber(phone_number),
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: normalizePhoneNumber(phone_number),
      CallBackURL: `${SUPABASE_URL}/functions/v1/mpesa-callback`,
      AccountReference: account_reference,
      TransactionDesc: `Fee payment for ${account_reference}`,
    };

    // 6. Send STK Push request
    const response = await fetch(MPESA_STK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const result = await response.json();

    // 7. Handle Safaricom response
    if (result.ResponseCode === '0') {
      // Update with checkout request ID
      await supabase
        .from('mpesa_transactions')
        .update({
          checkout_request_id: result.CheckoutRequestID,
          merchant_request_id: result.MerchantRequestID,
          status: 'processing',
        })
        .eq('id', transaction_id);

      return {
        success: true,
        transaction_id,
        checkout_request_id: result.CheckoutRequestID,
        message: 'STK Push sent. Please enter your M-Pesa PIN.',
      };
    } else {
      // Mark as failed
      await supabase
        .from('mpesa_transactions')
        .update({
          status: 'failed',
          failure_reason: result.errorMessage || result.ResponseDescription,
        })
        .eq('id', transaction_id);

      throw new PaymentError('STK_PUSH_FAILED', result.ResponseDescription);
    }
  } catch (error) {
    // Update record with failure
    await supabase
      .from('mpesa_transactions')
      .update({
        status: 'failed',
        failure_reason: error.message,
      })
      .eq('id', transaction_id);

    throw error;
  }
}
```

### 2.3 Account Reference Generation

```typescript
// Generates a unique, parseable reference for reconciliation
function generateAccountReference(student_id: string): string {
  // Format: ADM{admission_no}-{short_uuid}
  // Example: ADM2024001-A7B3
  const student = await getStudentAdmissionNo(student_id);
  const shortId = nanoid(4).toUpperCase();
  return `${student.admission_number}-${shortId}`;
}

// Parse reference to extract student info
function parseAccountReference(reference: string): {
  admission_number: string;
  suffix: string;
} | null {
  const match = reference.match(/^(.+)-([A-Z0-9]{4})$/);
  if (!match) return null;
  return {
    admission_number: match[1],
    suffix: match[2],
  };
}
```

---

## 3. M-Pesa C2B (Paybill) Flow

### 3.1 URL Registration

```typescript
// One-time setup: Register validation and confirmation URLs
async function registerC2BUrls(): Promise<void> {
  const accessToken = await getMpesaAccessToken();

  await fetch(MPESA_C2B_REGISTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ShortCode: MPESA_SHORTCODE,
      ResponseType: 'Completed', // or 'Cancelled'
      ConfirmationURL: `${SUPABASE_URL}/functions/v1/mpesa-c2b-confirm`,
      ValidationURL: `${SUPABASE_URL}/functions/v1/mpesa-c2b-validate`,
    }),
  });
}
```

### 3.2 Validation Webhook

```typescript
// Edge Function: supabase/functions/mpesa-c2b-validate/index.ts

interface C2BValidationRequest {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;    // Account reference entered by customer
  InvoiceNumber: string;
  MSISDN: string;           // Phone number
  FirstName: string;
  MiddleName: string;
  LastName: string;
}

async function validateC2BPayment(req: C2BValidationRequest): Promise<{
  ResultCode: string;
  ResultDesc: string;
}> {
  const { BillRefNumber, TransAmount, MSISDN, TransID } = req;

  try {
    // 1. Check for duplicate transaction
    const existing = await supabase
      .from('mpesa_transactions')
      .select('id')
      .eq('mpesa_receipt_number', TransID)
      .single();

    if (existing.data) {
      return { ResultCode: '0', ResultDesc: 'Accepted' }; // Idempotent
    }

    // 2. Parse and validate account reference
    const parsed = parseAccountReference(BillRefNumber);
    
    if (!parsed) {
      // Try fuzzy match on admission number
      const student = await findStudentByReference(BillRefNumber);
      if (!student) {
        // Log for manual reconciliation but accept payment
        await logUnmatchedPayment({
          trans_id: TransID,
          reference: BillRefNumber,
          amount: parseFloat(TransAmount),
          phone: MSISDN,
        });
        return { ResultCode: '0', ResultDesc: 'Accepted' };
      }
    }

    // 3. Validate amount is positive
    const amount = parseFloat(TransAmount);
    if (amount <= 0) {
      return { ResultCode: 'C2B00012', ResultDesc: 'Invalid Amount' };
    }

    // 4. Accept payment
    return { ResultCode: '0', ResultDesc: 'Accepted' };

  } catch (error) {
    console.error('Validation error:', error);
    // Accept anyway - don't block payments due to our errors
    return { ResultCode: '0', ResultDesc: 'Accepted' };
  }
}
```

### 3.3 Confirmation Webhook

```typescript
// Edge Function: supabase/functions/mpesa-c2b-confirm/index.ts

async function confirmC2BPayment(req: C2BValidationRequest): Promise<void> {
  const { TransID, BillRefNumber, TransAmount, MSISDN, TransTime, FirstName, LastName } = req;

  // 1. Idempotency check
  const existing = await supabase
    .from('mpesa_transactions')
    .select('id, status')
    .eq('mpesa_receipt_number', TransID)
    .single();

  if (existing.data?.status === 'completed') {
    return; // Already processed
  }

  // 2. Find or create transaction record
  let transaction_id: string;
  
  if (existing.data) {
    transaction_id = existing.data.id;
  } else {
    // Create new record for C2B payment
    const student = await findStudentByReference(BillRefNumber);
    
    const { data } = await supabase
      .from('mpesa_transactions')
      .insert({
        school_id: student?.school_id || await getDefaultSchoolId(MSISDN),
        student_id: student?.id,
        phone_number: MSISDN,
        amount: parseFloat(TransAmount),
        account_reference: BillRefNumber,
        transaction_type: 'c2b',
        status: 'processing',
        mpesa_receipt_number: TransID,
        transaction_date: parseMpesaTimestamp(TransTime),
        payer_name: `${FirstName} ${LastName}`.trim(),
      })
      .select('id')
      .single();

    transaction_id = data.id;
  }

  // 3. Process payment allocation
  await processPaymentAllocation(transaction_id);
}
```

---

## 4. Callback Processing & Idempotency

### 4.1 STK Push Callback Handler

```typescript
// Edge Function: supabase/functions/mpesa-callback/index.ts

interface STKCallbackBody {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: Array<{ Name: string; Value: string | number }>;
  };
}

async function handleSTKCallback(body: { Body: { stkCallback: STKCallbackBody } }): Promise<void> {
  const callback = body.Body.stkCallback;
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

  // 1. Find transaction by checkout request ID
  const { data: transaction, error } = await supabase
    .from('mpesa_transactions')
    .select('*')
    .eq('checkout_request_id', CheckoutRequestID)
    .single();

  if (!transaction) {
    console.error('Transaction not found:', CheckoutRequestID);
    return; // Log but don't error - Safaricom may retry
  }

  // 2. Idempotency: Check if already processed
  if (transaction.status === 'completed' || transaction.status === 'failed') {
    console.log('Transaction already processed:', transaction.id);
    return;
  }

  // 3. Process based on result code
  if (ResultCode === 0) {
    // Success - extract metadata
    const metadata = parseCallbackMetadata(CallbackMetadata?.Item || []);

    await supabase
      .from('mpesa_transactions')
      .update({
        status: 'completed',
        mpesa_receipt_number: metadata.MpesaReceiptNumber,
        transaction_date: metadata.TransactionDate,
        confirmed_amount: metadata.Amount,
        confirmed_phone: metadata.PhoneNumber,
        callback_received_at: new Date().toISOString(),
        raw_callback: callback,
      })
      .eq('id', transaction.id);

    // 4. Trigger payment allocation (async)
    EdgeRuntime.waitUntil(processPaymentAllocation(transaction.id));

  } else {
    // Failed
    await supabase
      .from('mpesa_transactions')
      .update({
        status: 'failed',
        failure_reason: ResultDesc,
        result_code: ResultCode,
        callback_received_at: new Date().toISOString(),
        raw_callback: callback,
      })
      .eq('id', transaction.id);
  }
}

function parseCallbackMetadata(items: Array<{ Name: string; Value: any }>): Record<string, any> {
  return items.reduce((acc, item) => {
    acc[item.Name] = item.Value;
    return acc;
  }, {} as Record<string, any>);
}
```

### 4.2 Idempotency Guarantees

```sql
-- Unique constraint on M-Pesa receipt number
ALTER TABLE mpesa_transactions
ADD CONSTRAINT unique_mpesa_receipt 
UNIQUE (mpesa_receipt_number) 
WHERE mpesa_receipt_number IS NOT NULL;

-- Unique constraint on checkout request ID
ALTER TABLE mpesa_transactions
ADD CONSTRAINT unique_checkout_request 
UNIQUE (checkout_request_id)
WHERE checkout_request_id IS NOT NULL;
```

```typescript
// Transaction processing with idempotency
async function processPaymentAllocation(mpesa_transaction_id: string): Promise<void> {
  // Use advisory lock to prevent concurrent processing
  const lockKey = hashToInt(mpesa_transaction_id);

  const { data: lockAcquired } = await supabase.rpc('try_advisory_lock', {
    lock_key: lockKey,
  });

  if (!lockAcquired) {
    console.log('Another process is handling this transaction');
    return;
  }

  try {
    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('mpesa_transaction_id', mpesa_transaction_id)
      .single();

    if (existingPayment) {
      console.log('Payment already created for transaction');
      return;
    }

    // Process payment...
    await createPaymentFromMpesa(mpesa_transaction_id);

  } finally {
    await supabase.rpc('advisory_unlock', { lock_key: lockKey });
  }
}
```

---

## 5. Manual Payment Recording

### 5.1 Cash/Bank Payment Handler

```typescript
// Edge Function: supabase/functions/record-manual-payment/index.ts

interface ManualPaymentRequest {
  student_id: string;
  amount: number;
  payment_method: 'cash' | 'bank' | 'cheque';
  reference_number?: string;       // Bank ref, cheque number
  payment_date: string;            // ISO date
  fee_ids?: string[];              // Specific fees to allocate
  notes?: string;
  attachments?: string[];          // Receipt scan URLs
}

async function recordManualPayment(
  req: ManualPaymentRequest,
  context: AuthContext
): Promise<{ payment_id: string; receipt_number: string }> {
  const { student_id, amount, payment_method, reference_number, payment_date, fee_ids, notes } = req;

  // 1. Permission check
  await requirePermission(context, 'finance:payments:create');

  // 2. Validate student belongs to school
  const student = await validateStudentInSchool(student_id, context.school_id);

  // 3. Check for duplicate (same amount, date, reference)
  if (reference_number) {
    const duplicate = await supabase
      .from('payments')
      .select('id, receipt_number')
      .eq('school_id', context.school_id)
      .eq('reference_number', reference_number)
      .eq('amount', amount)
      .single();

    if (duplicate.data) {
      throw new PaymentError(
        'DUPLICATE_PAYMENT',
        `Payment with reference ${reference_number} already exists (Receipt: ${duplicate.data.receipt_number})`
      );
    }
  }

  // 4. Start transaction
  const receipt_number = await generateReceiptNumber(context.school_id);

  const { data: payment, error } = await supabase.rpc('create_manual_payment', {
    p_school_id: context.school_id,
    p_student_id: student_id,
    p_amount: amount,
    p_payment_method: payment_method,
    p_reference_number: reference_number,
    p_payment_date: payment_date,
    p_receipt_number: receipt_number,
    p_recorded_by: context.user_id,
    p_fee_ids: fee_ids || [],
    p_notes: notes,
  });

  if (error) throw new PaymentError('PAYMENT_CREATE_FAILED', error.message);

  // 5. Audit log
  await logFinanceAction({
    school_id: context.school_id,
    action: 'payment_recorded',
    entity_type: 'payment',
    entity_id: payment.id,
    performed_by: context.user_id,
    details: {
      student_id,
      amount,
      payment_method,
      reference_number,
      receipt_number,
    },
  });

  // 6. Generate receipt (async)
  EdgeRuntime.waitUntil(generateAndStoreReceipt(payment.id));

  return {
    payment_id: payment.id,
    receipt_number,
  };
}
```

### 5.2 Database Function for Manual Payment

```sql
CREATE OR REPLACE FUNCTION create_manual_payment(
  p_school_id UUID,
  p_student_id UUID,
  p_amount DECIMAL(15,2),
  p_payment_method TEXT,
  p_reference_number TEXT,
  p_payment_date TIMESTAMPTZ,
  p_receipt_number TEXT,
  p_recorded_by UUID,
  p_fee_ids UUID[],
  p_notes TEXT DEFAULT NULL
) RETURNS payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payments;
  v_remaining DECIMAL(15,2);
  v_fee RECORD;
  v_allocation_amount DECIMAL(15,2);
BEGIN
  -- Create payment record
  INSERT INTO payments (
    school_id,
    student_id,
    amount,
    payment_method,
    reference_number,
    payment_date,
    receipt_number,
    recorded_by,
    notes,
    status
  ) VALUES (
    p_school_id,
    p_student_id,
    p_amount,
    p_payment_method,
    p_reference_number,
    p_payment_date,
    p_receipt_number,
    p_recorded_by,
    p_notes,
    'completed'
  ) RETURNING * INTO v_payment;

  -- Allocate to fees
  v_remaining := p_amount;

  IF array_length(p_fee_ids, 1) > 0 THEN
    -- Allocate to specific fees
    FOR v_fee IN
      SELECT id, balance
      FROM student_fees
      WHERE id = ANY(p_fee_ids)
        AND school_id = p_school_id
        AND student_id = p_student_id
        AND balance > 0
      ORDER BY due_date ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      
      v_allocation_amount := LEAST(v_remaining, v_fee.balance);
      
      INSERT INTO payment_allocations (
        payment_id,
        student_fee_id,
        amount,
        allocated_at
      ) VALUES (
        v_payment.id,
        v_fee.id,
        v_allocation_amount,
        NOW()
      );

      UPDATE student_fees
      SET amount_paid = amount_paid + v_allocation_amount
      WHERE id = v_fee.id;

      v_remaining := v_remaining - v_allocation_amount;
    END LOOP;
  ELSE
    -- FIFO allocation to oldest fees first
    FOR v_fee IN
      SELECT id, balance
      FROM student_fees
      WHERE school_id = p_school_id
        AND student_id = p_student_id
        AND balance > 0
      ORDER BY 
        brought_forward_amount > 0 DESC,  -- Arrears first
        due_date ASC,
        created_at ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      
      v_allocation_amount := LEAST(v_remaining, v_fee.balance);
      
      INSERT INTO payment_allocations (
        payment_id,
        student_fee_id,
        amount,
        allocated_at
      ) VALUES (
        v_payment.id,
        v_fee.id,
        v_allocation_amount,
        NOW()
      );

      UPDATE student_fees
      SET amount_paid = amount_paid + v_allocation_amount
      WHERE id = v_fee.id;

      v_remaining := v_remaining - v_allocation_amount;
    END LOOP;
  END IF;

  -- Handle overpayment as advance credit
  IF v_remaining > 0 THEN
    INSERT INTO fee_carry_forwards (
      school_id,
      student_id,
      from_term_id,
      amount,
      carry_forward_type,
      source_payment_id
    ) VALUES (
      p_school_id,
      p_student_id,
      (SELECT id FROM terms WHERE school_id = p_school_id AND is_current = true),
      v_remaining,
      'advance_credit',
      v_payment.id
    );
  END IF;

  RETURN v_payment;
END;
$$;
```

---

## 6. Receipt Generation

### 6.1 Receipt Number Generation

```typescript
// Atomic, sequential receipt number generation
async function generateReceiptNumber(school_id: string): Promise<string> {
  const { data, error } = await supabase.rpc('next_receipt_number', {
    p_school_id: school_id,
  });

  if (error) throw new Error('Failed to generate receipt number');
  return data;
}
```

```sql
-- Sequence table for receipt numbers
CREATE TABLE receipt_sequences (
  school_id UUID PRIMARY KEY REFERENCES schools(id),
  prefix TEXT NOT NULL DEFAULT 'RCP',
  current_number BIGINT NOT NULL DEFAULT 0,
  fiscal_year INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to get next receipt number
CREATE OR REPLACE FUNCTION next_receipt_number(p_school_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq receipt_sequences;
  v_receipt_number TEXT;
  v_current_year INTEGER;
BEGIN
  v_current_year := EXTRACT(YEAR FROM NOW());

  -- Lock and get/create sequence
  INSERT INTO receipt_sequences (school_id, fiscal_year)
  VALUES (p_school_id, v_current_year)
  ON CONFLICT (school_id) DO UPDATE
  SET 
    current_number = CASE 
      WHEN receipt_sequences.fiscal_year < v_current_year 
      THEN 0 
      ELSE receipt_sequences.current_number 
    END,
    fiscal_year = v_current_year,
    updated_at = NOW()
  RETURNING * INTO v_seq;

  -- Increment counter
  UPDATE receipt_sequences
  SET current_number = current_number + 1,
      updated_at = NOW()
  WHERE school_id = p_school_id
  RETURNING * INTO v_seq;

  -- Format: RCP-2024-000001
  v_receipt_number := FORMAT('%s-%s-%s',
    v_seq.prefix,
    v_seq.fiscal_year,
    LPAD(v_seq.current_number::TEXT, 6, '0')
  );

  RETURN v_receipt_number;
END;
$$;
```

### 6.2 Receipt PDF Generation

```typescript
// Edge Function: supabase/functions/generate-receipt/index.ts

interface ReceiptData {
  receipt_number: string;
  school: {
    name: string;
    logo_url: string;
    address: string;
    phone: string;
    email: string;
    paybill_number: string;
  };
  student: {
    name: string;
    admission_number: string;
    grade: string;
    stream: string;
  };
  payment: {
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number: string;
  };
  allocations: Array<{
    fee_name: string;
    amount: number;
  }>;
  balance_after: number;
  generated_at: string;
}

async function generateAndStoreReceipt(payment_id: string): Promise<string> {
  // 1. Fetch payment with all related data
  const receiptData = await fetchReceiptData(payment_id);

  // 2. Generate PDF using Puppeteer (via BullMQ job)
  const pdfBuffer = await generateReceiptPDF(receiptData);

  // 3. Store in Supabase Storage
  const fileName = `receipts/${receiptData.school.id}/${receiptData.receipt_number}.pdf`;
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw new Error('Failed to store receipt');

  // 4. Update payment with receipt URL
  const { data: urlData } = await supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  await supabase
    .from('payments')
    .update({ receipt_url: urlData.publicUrl })
    .eq('id', payment_id);

  return urlData.publicUrl;
}

// HTML template for receipt
const receiptTemplate = (data: ReceiptData): string => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica', sans-serif; padding: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; }
    .logo { width: 80px; }
    .school-info { text-align: right; }
    .receipt-title { text-align: center; font-size: 24px; margin: 20px 0; }
    .receipt-number { color: #666; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .allocations { margin: 20px 0; }
    .allocations table { width: 100%; border-collapse: collapse; }
    .allocations th, .allocations td { padding: 8px; border: 1px solid #ddd; }
    .total-row { font-weight: bold; background: #f5f5f5; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${data.school.logo_url}" class="logo" />
    <div class="school-info">
      <h2>${data.school.name}</h2>
      <p>${data.school.address}</p>
      <p>Tel: ${data.school.phone}</p>
    </div>
  </div>
  
  <h1 class="receipt-title">OFFICIAL RECEIPT</h1>
  <p class="receipt-number">Receipt No: ${data.receipt_number}</p>
  
  <div class="details-grid">
    <div>
      <strong>Student:</strong> ${data.student.name}<br/>
      <strong>Adm No:</strong> ${data.student.admission_number}<br/>
      <strong>Class:</strong> ${data.student.grade} ${data.student.stream}
    </div>
    <div>
      <strong>Date:</strong> ${formatDate(data.payment.payment_date)}<br/>
      <strong>Method:</strong> ${data.payment.payment_method}<br/>
      <strong>Reference:</strong> ${data.payment.reference_number || 'N/A'}
    </div>
  </div>
  
  <div class="allocations">
    <table>
      <thead>
        <tr><th>Fee Description</th><th>Amount (KES)</th></tr>
      </thead>
      <tbody>
        ${data.allocations.map(a => `
          <tr><td>${a.fee_name}</td><td>${formatCurrency(a.amount)}</td></tr>
        `).join('')}
        <tr class="total-row">
          <td>Total Paid</td>
          <td>${formatCurrency(data.payment.amount)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <p><strong>Balance After Payment:</strong> KES ${formatCurrency(data.balance_after)}</p>
  
  <div class="footer">
    <p>Thank you for your payment.</p>
    <p>Paybill: ${data.school.paybill_number} | Account: Student Admission Number</p>
    <p>Generated: ${data.generated_at}</p>
  </div>
</body>
</html>
`;
```

---

## 7. Error Handling & Recovery

### 7.1 Payment Error Types

```typescript
enum PaymentErrorCode {
  // Validation errors
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  STUDENT_NOT_FOUND = 'STUDENT_NOT_FOUND',
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',
  
  // M-Pesa errors
  STK_PUSH_FAILED = 'STK_PUSH_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  WRONG_PIN = 'WRONG_PIN',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
  
  // Processing errors
  ALLOCATION_FAILED = 'ALLOCATION_FAILED',
  RECORD_CREATE_FAILED = 'RECORD_CREATE_FAILED',
  RECEIPT_GENERATION_FAILED = 'RECEIPT_GENERATION_FAILED',
  
  // Reconciliation
  UNMATCHED_REFERENCE = 'UNMATCHED_REFERENCE',
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
}

class PaymentError extends Error {
  constructor(
    public code: PaymentErrorCode,
    public message: string,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}
```

### 7.2 Unmatched Payment Handling

```typescript
// When a payment cannot be automatically matched to a student
async function handleUnmatchedPayment(transaction: MpesaTransaction): Promise<void> {
  // 1. Create unmatched payment record
  const { data: unmatched } = await supabase
    .from('unmatched_payments')
    .insert({
      mpesa_transaction_id: transaction.id,
      phone_number: transaction.phone_number,
      amount: transaction.amount,
      account_reference: transaction.account_reference,
      payer_name: transaction.payer_name,
      received_at: transaction.transaction_date,
      status: 'pending_review',
      suggested_matches: await findPossibleMatches(transaction),
    })
    .select()
    .single();

  // 2. Notify finance team
  await sendNotification({
    type: 'unmatched_payment',
    recipients: await getFinanceTeamEmails(transaction.school_id),
    data: {
      amount: transaction.amount,
      reference: transaction.account_reference,
      phone: transaction.phone_number,
      review_url: `/admin/payments/unmatched/${unmatched.id}`,
    },
  });
}

// Find possible student matches
async function findPossibleMatches(transaction: MpesaTransaction): Promise<SuggestedMatch[]> {
  const suggestions: SuggestedMatch[] = [];

  // 1. Match by phone number (parent's registered phone)
  const { data: byPhone } = await supabase
    .from('students')
    .select(`
      id, 
      full_name, 
      admission_number,
      student_guardians!inner(
        guardians(phone_number)
      )
    `)
    .eq('student_guardians.guardians.phone_number', transaction.phone_number);

  if (byPhone?.length) {
    suggestions.push(...byPhone.map(s => ({
      student_id: s.id,
      student_name: s.full_name,
      admission_number: s.admission_number,
      match_type: 'phone_number',
      confidence: 0.9,
    })));
  }

  // 2. Fuzzy match on account reference
  const fuzzyMatches = await supabase.rpc('fuzzy_match_admission', {
    p_reference: transaction.account_reference,
    p_school_id: transaction.school_id,
  });

  if (fuzzyMatches.data?.length) {
    suggestions.push(...fuzzyMatches.data.map(s => ({
      student_id: s.id,
      student_name: s.full_name,
      admission_number: s.admission_number,
      match_type: 'fuzzy_reference',
      confidence: s.similarity_score,
    })));
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
```

### 7.3 Manual Reconciliation

```typescript
// Edge Function: supabase/functions/reconcile-payment/index.ts

interface ReconcileRequest {
  unmatched_payment_id: string;
  student_id: string;
  fee_ids?: string[];
  notes: string;
}

async function reconcileUnmatchedPayment(
  req: ReconcileRequest,
  context: AuthContext
): Promise<{ payment_id: string }> {
  await requirePermission(context, 'finance:payments:reconcile');

  const { unmatched_payment_id, student_id, fee_ids, notes } = req;

  // 1. Get unmatched payment
  const { data: unmatched } = await supabase
    .from('unmatched_payments')
    .select('*, mpesa_transactions(*)')
    .eq('id', unmatched_payment_id)
    .single();

  if (!unmatched || unmatched.status !== 'pending_review') {
    throw new PaymentError('INVALID_STATE', 'Payment already reconciled or invalid');
  }

  // 2. Update M-Pesa transaction with student
  await supabase
    .from('mpesa_transactions')
    .update({ student_id })
    .eq('id', unmatched.mpesa_transaction_id);

  // 3. Process allocation
  const payment = await createPaymentFromMpesa(unmatched.mpesa_transaction_id, fee_ids);

  // 4. Mark as reconciled
  await supabase
    .from('unmatched_payments')
    .update({
      status: 'reconciled',
      reconciled_by: context.user_id,
      reconciled_at: new Date().toISOString(),
      reconciliation_notes: notes,
      matched_student_id: student_id,
      resulting_payment_id: payment.id,
    })
    .eq('id', unmatched_payment_id);

  // 5. Audit log
  await logFinanceAction({
    action: 'payment_reconciled',
    entity_type: 'payment',
    entity_id: payment.id,
    performed_by: context.user_id,
    details: {
      original_reference: unmatched.account_reference,
      matched_student_id: student_id,
      notes,
    },
  });

  return { payment_id: payment.id };
}
```

### 7.4 Stale Transaction Cleanup

```typescript
// Cron job: Clean up stale pending transactions
async function cleanupStaleTransactions(): Promise<void> {
  const staleThreshold = subMinutes(new Date(), 10); // 10 minutes

  const { data: staleTransactions } = await supabase
    .from('mpesa_transactions')
    .update({ status: 'stale' })
    .eq('status', 'pending')
    .lt('initiated_at', staleThreshold.toISOString())
    .is('callback_received_at', null)
    .select();

  if (staleTransactions?.length) {
    console.log(`Marked ${staleTransactions.length} transactions as stale`);
    
    // Optionally query Safaricom for status
    for (const txn of staleTransactions) {
      EdgeRuntime.waitUntil(queryTransactionStatus(txn));
    }
  }
}

// Query Safaricom for final status
async function queryTransactionStatus(transaction: MpesaTransaction): Promise<void> {
  try {
    const accessToken = await getMpesaAccessToken();
    const timestamp = formatMpesaTimestamp(new Date());
    
    const response = await fetch(MPESA_QUERY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: generateMpesaPassword(timestamp),
        Timestamp: timestamp,
        CheckoutRequestID: transaction.checkout_request_id,
      }),
    });

    const result = await response.json();

    if (result.ResultCode === '0') {
      // Transaction succeeded - process it
      await supabase
        .from('mpesa_transactions')
        .update({
          status: 'completed',
          mpesa_receipt_number: result.MpesaReceiptNumber,
        })
        .eq('id', transaction.id);

      await processPaymentAllocation(transaction.id);
    } else if (result.ResultCode !== '1032') { // 1032 = still processing
      // Transaction failed
      await supabase
        .from('mpesa_transactions')
        .update({
          status: 'failed',
          failure_reason: result.ResultDesc,
        })
        .eq('id', transaction.id);
    }
  } catch (error) {
    console.error('Status query failed:', error);
  }
}
```

---

## 8. Transaction Status Polling (Client-Side)

```typescript
// Hook for polling payment status
function usePaymentStatus(transactionId: string | null) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) return;

    const channel = supabase
      .channel(`payment-${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mpesa_transactions',
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          setStatus(payload.new.status);
          if (payload.new.status === 'completed') {
            fetchReceipt(payload.new.id);
          }
        }
      )
      .subscribe();

    // Initial fetch
    fetchStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId]);

  return { status, receipt };
}
```

---

## 9. Payment Flow State Machine

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
               ┌────│   PENDING   │────┐
               │    └──────┬──────┘    │
               │           │           │
         timeout│    callback│    cancelled
               │           │           │
               ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  STALE   │ │PROCESSING│ │CANCELLED │
        └────┬─────┘ └────┬─────┘ └──────────┘
             │            │
      query_status   allocation
             │            │
             ▼            ▼
        ┌──────────┐ ┌──────────┐
        │ COMPLETED│ │ COMPLETED│
        │   or     │ └──────────┘
        │ FAILED   │
        └──────────┘
```

---

## 10. Monitoring & Alerts

```typescript
// Metrics to track
interface PaymentMetrics {
  total_transactions: number;
  successful_rate: number;
  average_processing_time_ms: number;
  unmatched_count: number;
  stale_count: number;
  failed_by_reason: Record<string, number>;
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  success_rate_min: 0.95,          // Alert if < 95% success
  processing_time_max_ms: 30000,   // Alert if > 30s average
  unmatched_max_daily: 10,         // Alert if > 10 unmatched/day
  stale_max_hourly: 5,             // Alert if > 5 stale/hour
};
```
