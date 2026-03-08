
-- =============================================
-- 1. CORE TABLES: schools, terms, academic_years
-- =============================================

CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  paybill_number TEXT,
  sms_sender_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 2. STUDENTS TABLE
-- =============================================

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  admission_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  grade TEXT,
  stream TEXT,
  gender TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  parent_phone TEXT,
  parent_name TEXT,
  date_of_birth DATE,
  current_term_id UUID REFERENCES public.terms(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, admission_number)
);

-- =============================================
-- 3. FEE TEMPLATES
-- =============================================

CREATE TABLE public.fee_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  fee_type TEXT NOT NULL DEFAULT 'tuition',
  ledger_type TEXT NOT NULL DEFAULT 'fees',
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  fine_type TEXT DEFAULT 'none',
  fine_amount DECIMAL(15,2) DEFAULT 0,
  fine_frequency TEXT DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 4. STUDENT FEES (assigned fees per student)
-- =============================================

CREATE TABLE public.student_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_template_id UUID NOT NULL REFERENCES public.fee_templates(id),
  term_id UUID REFERENCES public.terms(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  ledger_type TEXT NOT NULL DEFAULT 'fees',
  amount_due DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
  brought_forward_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  brought_forward_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
  balance DECIMAL(15,2) GENERATED ALWAYS AS (amount_due + brought_forward_amount - brought_forward_credit - amount_paid) STORED,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  assignment_mode TEXT NOT NULL DEFAULT 'manual',
  last_payment_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 5. PAYMENTS TABLE
-- =============================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  ledger_type TEXT NOT NULL DEFAULT 'fees',
  status TEXT NOT NULL DEFAULT 'pending',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID,
  mpesa_transaction_id UUID,
  payer_phone TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 6. PAYMENT ALLOCATIONS
-- =============================================

CREATE TABLE public.payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 7. MPESA TRANSACTIONS
-- =============================================

CREATE TABLE public.mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id),
  phone_number TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  account_reference TEXT NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'stk_push',
  status TEXT NOT NULL DEFAULT 'pending',
  ledger_type TEXT NOT NULL DEFAULT 'fees',
  fee_ids UUID[] DEFAULT '{}',
  term_id UUID REFERENCES public.terms(id),
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  mpesa_receipt_number TEXT,
  transaction_date TEXT,
  confirmed_amount DECIMAL(15,2),
  confirmed_phone TEXT,
  payer_name TEXT,
  initiated_by UUID,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  callback_received_at TIMESTAMPTZ,
  failure_reason TEXT,
  result_code INTEGER,
  raw_callback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique indexes for idempotency
CREATE UNIQUE INDEX idx_mpesa_receipt_unique ON public.mpesa_transactions(mpesa_receipt_number) WHERE mpesa_receipt_number IS NOT NULL;
CREATE UNIQUE INDEX idx_mpesa_checkout_unique ON public.mpesa_transactions(checkout_request_id) WHERE checkout_request_id IS NOT NULL;

-- =============================================
-- 8. FEE CARRY FORWARDS
-- =============================================

CREATE TABLE public.fee_carry_forwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  ledger_type TEXT NOT NULL DEFAULT 'fees',
  from_term_id UUID REFERENCES public.terms(id),
  to_term_id UUID REFERENCES public.terms(id),
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'arrears',
  status TEXT NOT NULL DEFAULT 'pending',
  source_payment_id UUID REFERENCES public.payments(id),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 9. RECEIPTS
-- =============================================

CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.receipt_sequences (
  school_id UUID PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL DEFAULT 'RCP',
  current_number BIGINT NOT NULL DEFAULT 0,
  fiscal_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 10. SMS LOGS
-- =============================================

CREATE TABLE public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT DEFAULT 'africastalking',
  provider_message_id TEXT,
  cost TEXT,
  triggered_by TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 11. FINANCE AUDIT LOGS
-- =============================================

CREATE TABLE public.finance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id),
  amount_affected DECIMAL(15,2) DEFAULT 0,
  performed_by TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 12. UNMATCHED PAYMENTS
-- =============================================

CREATE TABLE public.unmatched_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mpesa_transaction_id UUID REFERENCES public.mpesa_transactions(id),
  phone_number TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  account_reference TEXT,
  payer_name TEXT,
  received_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_review',
  suggested_matches JSONB DEFAULT '[]',
  reconciled_by UUID,
  reconciled_at TIMESTAMPTZ,
  reconciliation_notes TEXT,
  matched_student_id UUID REFERENCES public.students(id),
  resulting_payment_id UUID REFERENCES public.payments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 13. ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_carry_forwards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unmatched_payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 14. RLS POLICIES (service role bypasses RLS, 
--     authenticated users access via school membership)
-- =============================================

-- For now, allow authenticated users full access (will be refined with school membership)
CREATE POLICY "Authenticated users can read schools" ON public.schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read academic_years" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read terms" ON public.terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read fee_templates" ON public.fee_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read student_fees" ON public.student_fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read payment_allocations" ON public.payment_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read mpesa_transactions" ON public.mpesa_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read fee_carry_forwards" ON public.fee_carry_forwards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read receipts" ON public.receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read sms_logs" ON public.sms_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read finance_audit_logs" ON public.finance_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read unmatched_payments" ON public.unmatched_payments FOR SELECT TO authenticated USING (true);

-- Insert policies for operational tables
CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert student_fees" ON public.student_fees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update student_fees" ON public.student_fees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payment_allocations" ON public.payment_allocations FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.mpesa_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_fees;
