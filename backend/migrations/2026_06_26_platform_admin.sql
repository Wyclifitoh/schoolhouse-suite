-- CHUO Platform Admin (super-admin internal console) — 2026-06-26

CREATE TABLE IF NOT EXISTS platform_users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('platform_admin','platform_support') NOT NULL DEFAULT 'platform_support',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS platform_audit_log (
  id CHAR(36) PRIMARY KEY,
  actor_id CHAR(36) NULL,
  actor_email VARCHAR(255) NULL,
  action VARCHAR(80) NOT NULL,
  target_school_id CHAR(36) NULL,
  payload JSON NULL,
  ip VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pal_school (target_school_id),
  INDEX idx_pal_actor (actor_id),
  INDEX idx_pal_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Extend subscription_plans with a flat billing mode + learner bands (Starter / Standard)
ALTER TABLE subscription_plans
  MODIFY COLUMN billing_mode ENUM('per_student','module','free','flat') NOT NULL;

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS min_students INT NULL,
  ADD COLUMN IF NOT EXISTS max_students INT NULL;

-- Seed Starter + Standard plans matching new CHUO pricing.
INSERT IGNORE INTO subscription_plans
  (id, code, name, billing_mode, cycle, price_per_student, base_price, module_code, description, min_students, max_students, is_active)
VALUES
  (UUID(), 'starter_termly', 'Starter (Shared SaaS)', 'flat', 'termly', 0, 5000,  NULL,
    'For small schools (1–50 learners). KSh 5,000 per term flat. All core modules included.', 1, 50, 1),
  (UUID(), 'standard_termly', 'Standard (Shared SaaS)', 'per_student', 'termly', 100, 0, NULL,
    'For growing schools (51+ learners). KSh 100 per learner per term. All Starter features + priority support.', 51, NULL, 1);

-- NOTE: create your first platform admin manually (one-off), e.g.:
--   INSERT INTO platform_users (id, email, password_hash, full_name, role)
--   VALUES (UUID(), 'you@chuo.co.ke', '<bcrypt hash>', 'CHUO Admin', 'platform_admin');