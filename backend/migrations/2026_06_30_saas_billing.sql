-- ============================================================
-- CHUO SaaS Billing — 2026-06-30
-- Assessment-based billing: KSH 10 per student per exam
-- Adds: school_subscriptions (if missing), assessment_billing,
--       platform_users bootstrap columns, safe ALTERs only.
-- ============================================================

-- 1. Ensure core SaaS tables exist (idempotent)
-- subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  billing_mode ENUM('per_student','module','free','flat') NOT NULL DEFAULT 'per_student',
  cycle ENUM('monthly','termly','yearly') NOT NULL DEFAULT 'termly',
  price_per_student DECIMAL(10,2) NOT NULL DEFAULT 0,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  module_code VARCHAR(50) NULL,
  description TEXT NULL,
  min_students INT NULL,
  max_students INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- school_subscriptions
CREATE TABLE IF NOT EXISTS school_subscriptions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NULL,
  status ENUM('trial','active','past_due','locked','cancelled') NOT NULL DEFAULT 'trial',
  billing_mode VARCHAR(30) NULL,
  cycle VARCHAR(20) NULL,
  price_per_student DECIMAL(10,2) NULL DEFAULT 10,
  modules JSON NULL,
  trial_ends_at TIMESTAMP NULL,
  current_period_start DATE NULL,
  current_period_end DATE NULL,
  assessment_price_per_student DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_school_sub (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- subscription_invoices
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  subscription_id CHAR(36) NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'KES',
  status ENUM('pending','paid','failed','void') NOT NULL DEFAULT 'pending',
  period_start DATE NULL,
  period_end DATE NULL,
  student_count INT NULL,
  mpesa_reference VARCHAR(100) NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_si_school (school_id),
  INDEX idx_si_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Assessment billing ledger — tracks per-assessment invoice amounts
-- One row per assessment that was created after trial expiry
CREATE TABLE IF NOT EXISTS assessment_billing (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  assessment_id CHAR(36) NOT NULL,
  invoice_id CHAR(36) NULL,        -- linked subscription_invoice once generated
  student_count INT NOT NULL DEFAULT 0,
  price_per_student DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (student_count * price_per_student) STORED,
  status ENUM('pending','paid','waived') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ab_school (school_id),
  INDEX idx_ab_assessment (assessment_id),
  INDEX idx_ab_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Safe ADD COLUMN on schools (may already exist)
ALTER TABLE schools
  ADD COLUMN trial_started_at TIMESTAMP NULL DEFAULT NULL;

-- 4. Back-fill trial_started_at for existing schools (use created_at)
UPDATE schools SET trial_started_at = created_at WHERE trial_started_at IS NULL;

-- 5. Ensure school_subscriptions exist for every school already in DB
INSERT IGNORE INTO school_subscriptions (id, school_id, status, trial_ends_at)
SELECT UUID(), s.id, 'trial', DATE_ADD(s.created_at, INTERVAL 30 DAY)
FROM schools s
WHERE NOT EXISTS (
  SELECT 1 
  FROM school_subscriptions ss 
  -- Force both sides to use the same collation for the comparison
  WHERE ss.school_id COLLATE utf8mb4_unicode_ci = s.id COLLATE utf8mb4_unicode_ci
);

-- 6. Seed assessment pricing plan if not present
INSERT IGNORE INTO subscription_plans
  (id, code, name, billing_mode, cycle, price_per_student, base_price, description, is_active)
VALUES
  (UUID(), 'assessment_per_exam', 'Assessment Billing (KSh 10/student/exam)',
   'per_student', 'monthly', 10.00, 0, 'KSh 10 per active student per exam created. Charged after 30-day trial.', 1);
