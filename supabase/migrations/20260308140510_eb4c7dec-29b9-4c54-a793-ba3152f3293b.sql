
-- =============================================
-- MISSING FINANCE TABLES & COLUMNS
-- =============================================

-- 1. Add missing columns to fee_templates
ALTER TABLE public.fee_templates
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS applicable_grades TEXT[],
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- 2. Fee Discounts (discount definitions)
CREATE TABLE public.fee_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed_amount, fee_waiver, conditional
  value DECIMAL(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  applicable_to TEXT, -- category: staff_child, sibling, scholarship, rte, early_admission, custom
  condition_type TEXT, -- sibling_enrolled, early_payment, staff_child, scholarship, custom
  condition_params JSONB DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 0,
  stackable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Student Fee Discounts (applied discounts per student_fee)
CREATE TABLE public.student_fee_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
  fee_discount_id UUID REFERENCES public.fee_discounts(id),
  discount_name TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  original_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  calculated_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  applied_by UUID,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Fee Adjustments (manual adjustments with audit trail)
CREATE TABLE public.fee_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
  previous_amount DECIMAL(15,2) NOT NULL,
  new_amount DECIMAL(15,2) NOT NULL,
  adjustment_type TEXT NOT NULL, -- increase, decrease, waive
  reason TEXT NOT NULL,
  approved_by UUID,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_status TEXT DEFAULT 'approved', -- pending, approved, rejected
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Finance Automation Config (per-school settings)
CREATE TABLE public.finance_automation_config (
  school_id UUID PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  auto_assign_fees_on_enrollment BOOLEAN NOT NULL DEFAULT false,
  auto_assign_fees_on_term_start BOOLEAN NOT NULL DEFAULT false,
  require_approval_for_bulk_assignment BOOLEAN NOT NULL DEFAULT false,
  auto_allocate_payments BOOLEAN NOT NULL DEFAULT true,
  default_allocation_strategy TEXT NOT NULL DEFAULT 'fifo',
  allow_manual_allocation BOOLEAN NOT NULL DEFAULT true,
  auto_carry_forward_arrears BOOLEAN NOT NULL DEFAULT true,
  auto_apply_advance_credits BOOLEAN NOT NULL DEFAULT true,
  require_approval_for_carry_forward BOOLEAN NOT NULL DEFAULT false,
  auto_apply_eligible_discounts BOOLEAN NOT NULL DEFAULT true,
  allow_manual_discounts BOOLEAN NOT NULL DEFAULT true,
  require_approval_for_discounts BOOLEAN NOT NULL DEFAULT false,
  max_discount_percent_without_approval INTEGER DEFAULT 100,
  allow_fee_adjustments BOOLEAN NOT NULL DEFAULT true,
  require_approval_for_adjustments BOOLEAN NOT NULL DEFAULT true,
  max_adjustment_without_approval DECIMAL(15,2) DEFAULT 0,
  send_payment_confirmation_sms BOOLEAN NOT NULL DEFAULT true,
  send_balance_reminder_sms BOOLEAN NOT NULL DEFAULT true,
  reminder_days_before_due INTEGER[] DEFAULT '{7,3,1}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Add adjusted columns to student_fees
ALTER TABLE public.student_fees
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adjusted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS adjusted_by UUID;

-- 7. RLS
ALTER TABLE public.fee_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_automation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fee_discounts" ON public.fee_discounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read student_fee_discounts" ON public.student_fee_discounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read fee_adjustments" ON public.fee_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read finance_automation_config" ON public.finance_automation_config FOR SELECT TO authenticated USING (true);
