
-- =============================================
-- DATABASE FUNCTIONS for payment processing
-- =============================================

-- 1. Advisory lock functions
CREATE OR REPLACE FUNCTION public.try_advisory_lock(lock_key INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pg_try_advisory_lock(lock_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_advisory_lock(lock_key INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pg_advisory_unlock(lock_key);
END;
$$;

-- 2. Increment fee payment (atomic update)
CREATE OR REPLACE FUNCTION public.increment_fee_payment(fee_id UUID, payment_amount DECIMAL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee RECORD;
  v_new_paid DECIMAL;
  v_new_status TEXT;
BEGIN
  SELECT amount_due, amount_paid INTO v_fee
  FROM student_fees WHERE id = fee_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fee not found: %', fee_id;
  END IF;

  v_new_paid := v_fee.amount_paid + payment_amount;
  
  IF v_new_paid >= v_fee.amount_due THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE student_fees
  SET amount_paid = v_new_paid,
      status = v_new_status,
      last_payment_at = NOW(),
      updated_at = NOW()
  WHERE id = fee_id;
END;
$$;

-- 3. Next receipt number (atomic sequential)
CREATE OR REPLACE FUNCTION public.next_receipt_number(p_school_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq RECORD;
  v_receipt_number TEXT;
  v_current_year INTEGER;
BEGIN
  v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

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

  UPDATE receipt_sequences
  SET current_number = current_number + 1,
      updated_at = NOW()
  WHERE school_id = p_school_id
  RETURNING * INTO v_seq;

  v_receipt_number := FORMAT('%s-%s-%s',
    v_seq.prefix,
    v_seq.fiscal_year,
    LPAD(v_seq.current_number::TEXT, 6, '0')
  );

  RETURN v_receipt_number;
END;
$$;

-- 4. Get student balance
CREATE OR REPLACE FUNCTION public.get_student_balance(p_student_id UUID, p_ledger_type TEXT DEFAULT 'fees')
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT COALESCE(SUM(balance), 0) INTO v_balance
  FROM student_fees
  WHERE student_id = p_student_id
    AND ledger_type = p_ledger_type
    AND status NOT IN ('cancelled', 'waived');

  RETURN v_balance;
END;
$$;

-- 5. Generate receipt (creates receipt record with sequential number)
CREATE OR REPLACE FUNCTION public.generate_receipt(p_payment_id UUID, p_school_id UUID)
RETURNS TABLE(receipt_number TEXT, receipt_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipt_number TEXT;
  v_receipt_id UUID;
BEGIN
  -- Check if receipt already exists
  SELECT r.id, r.receipt_number INTO v_receipt_id, v_receipt_number
  FROM receipts r WHERE r.payment_id = p_payment_id;

  IF v_receipt_id IS NOT NULL THEN
    RETURN QUERY SELECT v_receipt_number, v_receipt_id;
    RETURN;
  END IF;

  v_receipt_number := next_receipt_number(p_school_id);
  
  INSERT INTO receipts (school_id, payment_id, receipt_number, generated_at)
  VALUES (p_school_id, p_payment_id, v_receipt_number, NOW())
  RETURNING id INTO v_receipt_id;

  RETURN QUERY SELECT v_receipt_number, v_receipt_id;
END;
$$;

-- 6. Create manual payment with FIFO allocation (from doc section 5.2)
CREATE OR REPLACE FUNCTION public.create_manual_payment(
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
    school_id, student_id, amount, payment_method, reference_number,
    received_at, recorded_by, notes, status, ledger_type
  ) VALUES (
    p_school_id, p_student_id, p_amount, p_payment_method, p_reference_number,
    p_payment_date, p_recorded_by, p_notes, 'completed', 'fees'
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
      
      INSERT INTO payment_allocations (payment_id, student_fee_id, amount, allocated_at)
      VALUES (v_payment.id, v_fee.id, v_allocation_amount, NOW());

      UPDATE student_fees
      SET amount_paid = amount_paid + v_allocation_amount,
          status = CASE WHEN amount_paid + v_allocation_amount >= amount_due THEN 'paid' ELSE 'partial' END,
          last_payment_at = NOW(),
          updated_at = NOW()
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
        brought_forward_amount > 0 DESC,
        due_date ASC,
        created_at ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      
      v_allocation_amount := LEAST(v_remaining, v_fee.balance);
      
      INSERT INTO payment_allocations (payment_id, student_fee_id, amount, allocated_at)
      VALUES (v_payment.id, v_fee.id, v_allocation_amount, NOW());

      UPDATE student_fees
      SET amount_paid = amount_paid + v_allocation_amount,
          status = CASE WHEN amount_paid + v_allocation_amount >= amount_due THEN 'paid' ELSE 'partial' END,
          last_payment_at = NOW(),
          updated_at = NOW()
      WHERE id = v_fee.id;

      v_remaining := v_remaining - v_allocation_amount;
    END LOOP;
  END IF;

  -- Handle overpayment as advance credit
  IF v_remaining > 0 THEN
    INSERT INTO fee_carry_forwards (
      school_id, student_id, from_term_id, amount, type, status, source_payment_id, ledger_type
    ) VALUES (
      p_school_id, p_student_id,
      (SELECT id FROM terms WHERE school_id = p_school_id AND is_current = true LIMIT 1),
      v_remaining, 'advance_credit', 'pending', v_payment.id, 'fees'
    );
  END IF;

  -- Create receipt
  INSERT INTO receipts (school_id, payment_id, receipt_number, generated_at)
  VALUES (p_school_id, v_payment.id, p_receipt_number, NOW());

  RETURN v_payment;
END;
$$;

-- 7. Fuzzy match admission number
CREATE OR REPLACE FUNCTION public.fuzzy_match_admission(p_reference TEXT, p_school_id UUID)
RETURNS TABLE(id UUID, full_name TEXT, admission_number TEXT, similarity_score REAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.full_name, s.admission_number,
    similarity(LOWER(s.admission_number), LOWER(p_reference)) AS similarity_score
  FROM students s
  WHERE s.school_id = p_school_id
    AND similarity(LOWER(s.admission_number), LOWER(p_reference)) > 0.3
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$;

-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
