
-- =============================================
-- CARRY FORWARD & DISCOUNT DB FUNCTIONS
-- =============================================

-- 1. Calculate brought forward for a student entering a new term
CREATE OR REPLACE FUNCTION public.calculate_brought_forward(
  p_student_id UUID,
  p_ledger_type TEXT,
  p_new_term_id UUID
) RETURNS TABLE(arrears DECIMAL, credit DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev_term_id UUID;
  v_total_arrears DECIMAL := 0;
  v_total_credit DECIMAL := 0;
BEGIN
  -- Get previous term
  SELECT t2.id INTO v_prev_term_id
  FROM terms t1
  JOIN terms t2 ON t2.school_id = t1.school_id
    AND t2.end_date < t1.start_date
  WHERE t1.id = p_new_term_id
  ORDER BY t2.end_date DESC
  LIMIT 1;

  IF v_prev_term_id IS NULL THEN
    RETURN QUERY SELECT 0::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;

  -- Calculate unpaid fees from previous term
  SELECT COALESCE(SUM(sf.balance), 0) INTO v_total_arrears
  FROM student_fees sf
  JOIN fee_templates ft ON ft.id = sf.fee_template_id
  WHERE sf.student_id = p_student_id
    AND ft.ledger_type = p_ledger_type
    AND sf.term_id = v_prev_term_id
    AND sf.balance > 0
    AND sf.status NOT IN ('cancelled', 'waived');

  -- Calculate available advance credits
  SELECT COALESCE(SUM(amount), 0) INTO v_total_credit
  FROM fee_carry_forwards
  WHERE student_id = p_student_id
    AND ledger_type = p_ledger_type
    AND type = 'advance_credit'
    AND status = 'pending';

  RETURN QUERY SELECT v_total_arrears, v_total_credit;
END;
$$;

-- 2. Apply carry forwards when transitioning to new term
CREATE OR REPLACE FUNCTION public.apply_carry_forwards_for_term(
  p_school_id UUID,
  p_from_term_id UUID,
  p_to_term_id UUID
) RETURNS TABLE(applied_count INTEGER, failed_count INTEGER, total_arrears DECIMAL, total_credits DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_arrears DECIMAL;
  v_credit DECIMAL;
  v_applied INTEGER := 0;
  v_failed INTEGER := 0;
  v_total_arrears DECIMAL := 0;
  v_total_credits DECIMAL := 0;
BEGIN
  -- Process each active student in the school
  FOR v_student IN
    SELECT id FROM students WHERE school_id = p_school_id AND status = 'active'
  LOOP
    BEGIN
      -- Calculate arrears from previous term
      SELECT COALESCE(SUM(balance), 0) INTO v_arrears
      FROM student_fees
      WHERE student_id = v_student.id
        AND term_id = p_from_term_id
        AND balance > 0
        AND status NOT IN ('cancelled', 'waived');

      -- Create arrears carry forward record
      IF v_arrears > 0 THEN
        INSERT INTO fee_carry_forwards (
          school_id, student_id, ledger_type, from_term_id, to_term_id,
          amount, type, status, applied_at
        ) VALUES (
          p_school_id, v_student.id, 'fees', p_from_term_id, p_to_term_id,
          v_arrears, 'arrears', 'applied', NOW()
        );
        v_total_arrears := v_total_arrears + v_arrears;
      END IF;

      -- Apply pending advance credits
      UPDATE fee_carry_forwards
      SET to_term_id = p_to_term_id, status = 'applied', applied_at = NOW()
      WHERE student_id = v_student.id
        AND type = 'advance_credit'
        AND status = 'pending';

      SELECT COALESCE(SUM(amount), 0) INTO v_credit
      FROM fee_carry_forwards
      WHERE student_id = v_student.id
        AND to_term_id = p_to_term_id
        AND type = 'advance_credit'
        AND status = 'applied';

      v_total_credits := v_total_credits + v_credit;
      v_applied := v_applied + 1;

      -- Audit log
      IF v_arrears > 0 OR v_credit > 0 THEN
        INSERT INTO finance_audit_logs (
          school_id, action, entity_type, entity_id, student_id,
          amount_affected, performed_by, metadata
        ) VALUES (
          p_school_id, 'ARREARS_CARRIED_FORWARD', 'carry_forward', v_student.id::TEXT,
          v_student.id, v_arrears, 'system',
          jsonb_build_object('from_term', p_from_term_id, 'to_term', p_to_term_id, 'arrears', v_arrears, 'credit', v_credit)
        );
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_applied, v_failed, v_total_arrears, v_total_credits;
END;
$$;

-- 3. Apply discount to a student fee
CREATE OR REPLACE FUNCTION public.apply_fee_discount(
  p_student_fee_id UUID,
  p_discount_id UUID,
  p_applied_by UUID
) RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee RECORD;
  v_discount RECORD;
  v_discount_amount DECIMAL := 0;
BEGIN
  SELECT * INTO v_fee FROM student_fees WHERE id = p_student_fee_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fee not found'; END IF;

  SELECT * INTO v_discount FROM fee_discounts WHERE id = p_discount_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Discount not found or inactive'; END IF;

  -- Calculate discount
  CASE v_discount.type
    WHEN 'percentage' THEN
      v_discount_amount := v_fee.amount_due * (v_discount.value / 100);
    WHEN 'fixed_amount' THEN
      v_discount_amount := LEAST(v_discount.value, v_fee.amount_due);
    WHEN 'fee_waiver' THEN
      v_discount_amount := v_fee.amount_due;
    ELSE
      v_discount_amount := 0;
  END CASE;

  -- Apply discount
  UPDATE student_fees
  SET discount_amount = discount_amount + v_discount_amount,
      amount_due = GREATEST(amount_due - v_discount_amount, 0),
      updated_at = NOW()
  WHERE id = p_student_fee_id;

  -- Record applied discount
  INSERT INTO student_fee_discounts (
    student_fee_id, fee_discount_id, discount_name, discount_type,
    original_value, calculated_amount, applied_by, reason
  ) VALUES (
    p_student_fee_id, p_discount_id, v_discount.name, v_discount.type,
    v_discount.value, v_discount_amount, p_applied_by, v_discount.description
  );

  RETURN v_discount_amount;
END;
$$;

-- 4. Apply fee adjustment
CREATE OR REPLACE FUNCTION public.apply_fee_adjustment(
  p_student_fee_id UUID,
  p_school_id UUID,
  p_adjustment_type TEXT,
  p_amount DECIMAL,
  p_reason TEXT,
  p_created_by UUID,
  p_approved_by UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee RECORD;
  v_new_amount DECIMAL;
BEGIN
  SELECT * INTO v_fee FROM student_fees WHERE id = p_student_fee_id AND school_id = p_school_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fee not found'; END IF;

  CASE p_adjustment_type
    WHEN 'increase' THEN v_new_amount := v_fee.amount_due + p_amount;
    WHEN 'decrease' THEN v_new_amount := GREATEST(v_fee.amount_due - p_amount, 0);
    WHEN 'waive' THEN v_new_amount := 0;
    ELSE RAISE EXCEPTION 'Invalid adjustment type';
  END CASE;

  -- Update fee
  UPDATE student_fees
  SET amount_due = v_new_amount,
      adjusted_at = NOW(),
      adjusted_by = p_created_by,
      status = CASE WHEN v_new_amount = 0 THEN 'waived' ELSE status END,
      updated_at = NOW()
  WHERE id = p_student_fee_id;

  -- Record adjustment
  INSERT INTO fee_adjustments (
    school_id, student_fee_id, previous_amount, new_amount,
    adjustment_type, reason, approved_by, created_by
  ) VALUES (
    p_school_id, p_student_fee_id, v_fee.amount_due, v_new_amount,
    p_adjustment_type, p_reason, p_approved_by, p_created_by
  );

  -- Audit log
  INSERT INTO finance_audit_logs (
    school_id, action, entity_type, entity_id, student_id,
    amount_affected, performed_by, metadata
  ) VALUES (
    p_school_id, 'FEE_ADJUSTED', 'student_fee', p_student_fee_id::TEXT,
    v_fee.student_id, p_amount, p_created_by::TEXT,
    jsonb_build_object('adjustment_type', p_adjustment_type, 'previous', v_fee.amount_due, 'new', v_new_amount, 'reason', p_reason)
  );
END;
$$;
