const { query } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

async function bootstrap() {
  // Platform users
  await query(`CREATE TABLE IF NOT EXISTS platform_users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('platform_admin','platform_support') NOT NULL DEFAULT 'platform_support',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Platform audit log
  await query(`CREATE TABLE IF NOT EXISTS platform_audit_log (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Subscription plans
  await query(`CREATE TABLE IF NOT EXISTS subscription_plans (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // School subscriptions
  await query(`CREATE TABLE IF NOT EXISTS school_subscriptions (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Subscription invoices
  await query(`CREATE TABLE IF NOT EXISTS subscription_invoices (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Assessment billing — per-exam charges (KSh 10/student/exam post-trial)
  await query(`CREATE TABLE IF NOT EXISTS assessment_billing (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    school_id CHAR(36) NOT NULL,
    assessment_id CHAR(36) NOT NULL,
    invoice_id CHAR(36) NULL,
    student_count INT NOT NULL DEFAULT 0,
    price_per_student DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (student_count * price_per_student) STORED,
    status ENUM('pending','paid','waived') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ab_school (school_id),
    INDEX idx_ab_assessment (assessment_id),
    INDEX idx_ab_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Safe ALTERs — idempotent
  try { await query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP NULL DEFAULT NULL`); } catch (_) {}
  try { await query(`UPDATE schools SET trial_started_at = created_at WHERE trial_started_at IS NULL`); } catch (_) {}
  try { await query(`ALTER TABLE subscription_plans MODIFY COLUMN billing_mode ENUM('per_student','module','free','flat') NOT NULL`); } catch (_) {}
  try { await query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS min_students INT NULL`); } catch (_) {}
  try { await query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_students INT NULL`); } catch (_) {}
  try { await query(`ALTER TABLE school_subscriptions ADD COLUMN IF NOT EXISTS assessment_price_per_student DECIMAL(10,2) NOT NULL DEFAULT 10.00`); } catch (_) {}

  // Fix collations for school_id joins against older tables
  try { await query(`ALTER TABLE school_subscriptions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`); } catch (_) {}
  try { await query(`ALTER TABLE subscription_invoices CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`); } catch (_) {}
  try { await query(`ALTER TABLE assessment_billing CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`); } catch (_) {}
  try { await query(`ALTER TABLE platform_audit_log CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`); } catch (_) {}

  // Seed plans
  await query(`INSERT IGNORE INTO subscription_plans
    (id, code, name, billing_mode, cycle, price_per_student, base_price, module_code, description, min_students, max_students, is_active)
    VALUES (UUID(),'starter_termly','Starter (Shared SaaS)','flat','termly',0,5000,NULL,
      'For small schools (1-50 learners). KSh 5,000 per term flat.',1,50,1)`);
  await query(`INSERT IGNORE INTO subscription_plans
    (id, code, name, billing_mode, cycle, price_per_student, base_price, module_code, description, min_students, max_students, is_active)
    VALUES (UUID(),'standard_termly','Standard (Shared SaaS)','per_student','termly',100,0,NULL,
      'For growing schools (51+ learners). KSh 100 per learner per term.',51,NULL,1)`);
  await query(`INSERT IGNORE INTO subscription_plans
    (id, code, name, billing_mode, cycle, price_per_student, base_price, description, is_active)
    VALUES (UUID(),'assessment_per_exam','Assessment Billing (KSh 10/student/exam)',
      'per_student','monthly',10.00,0,
      'KSh 10 per active student per exam created. Charged after 30-day trial.',1)`);

  // Auto-provision subscriptions for all existing schools (30-day trial from creation date)
  // This is safe for existing data — INSERT IGNORE won't touch schools that already have a subscription
  try {
    const schools = await query(
      `SELECT s.id, s.created_at FROM schools s
       WHERE NOT EXISTS (SELECT 1 FROM school_subscriptions ss WHERE ss.school_id COLLATE utf8mb4_unicode_ci = s.id COLLATE utf8mb4_unicode_ci)`
    );
    for (const s of schools) {
      const trialEnd = new Date(s.created_at);
      trialEnd.setDate(trialEnd.getDate() + 30);
      await query(
        `INSERT IGNORE INTO school_subscriptions (id, school_id, status, trial_ends_at, assessment_price_per_student)
         VALUES (?, ?, 'trial', ?, 10.00)`,
        [uuidv4(), s.id, trialEnd.toISOString().slice(0, 19).replace("T", " ")]
      );
    }
    if (schools.length > 0) {
      console.log(`[platform] auto-provisioned subscriptions for ${schools.length} existing school(s)`);
    }
  } catch (e) {
    console.warn("[platform] subscription auto-provision failed:", e.message);
  }
}

module.exports = { bootstrap };