-- ============================================
-- CHUO School Management System — MySQL Schema
-- Run this file to create all tables from scratch
-- ============================================

CREATE DATABASE IF NOT EXISTS chuo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chuo;

-- ============================================
-- 1. CORE / TENANCY
-- ============================================

CREATE TABLE schools (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(30),
  logo_url TEXT,
  address TEXT,
  curriculum_type VARCHAR(20) DEFAULT 'CBC',
  paybill_number VARCHAR(30),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  school_id CHAR(36),
  role ENUM('super_admin','school_admin','deputy_admin','teacher','finance_officer','front_office','transport_officer','store_manager','pos_attendant','student','parent','auditor') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_school_role (user_id, school_id, role)
);

CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36),
  first_name VARCHAR(100) DEFAULT '',
  last_name VARCHAR(100) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(30),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- ============================================
-- 2. PERMISSIONS
-- ============================================

CREATE TABLE permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  module VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role ENUM('super_admin','school_admin','deputy_admin','teacher','finance_officer','front_office','transport_officer','store_manager','pos_attendant','student','parent','auditor') NOT NULL,
  permission_id CHAR(36) NOT NULL,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_role_perm (role, permission_id)
);

CREATE TABLE school_role_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  role ENUM('super_admin','school_admin','deputy_admin','teacher','finance_officer','front_office','transport_officer','store_manager','pos_attendant','student','parent','auditor') NOT NULL,
  permission_id CHAR(36) NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ============================================
-- 3. ACADEMIC STRUCTURE
-- ============================================

CREATE TABLE academic_years (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE terms (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  academic_year_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);

CREATE TABLE grades (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  level ENUM('pre_primary','primary','junior_secondary','senior_secondary') NOT NULL,
  order_index INT DEFAULT 0,
  curriculum_type VARCHAR(20) DEFAULT 'CBC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE streams (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  grade_id CHAR(36) NOT NULL,
  academic_year_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  capacity INT,
  class_teacher_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);

CREATE TABLE subjects (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- ============================================
-- 4. STUDENTS
-- ============================================

CREATE TABLE parents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  alt_phone VARCHAR(30),
  email VARCHAR(255),
  id_number VARCHAR(50),
  occupation VARCHAR(255),
  employer VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE students (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  admission_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(300) GENERATED ALWAYS AS (CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) STORED,
  date_of_birth DATE,
  gender ENUM('Male','Female','Other'),
  religion VARCHAR(50),
  nationality VARCHAR(50) DEFAULT 'Kenyan',
  grade VARCHAR(50),
  stream VARCHAR(50),
  current_grade_id CHAR(36),
  current_stream_id CHAR(36),
  current_term_id CHAR(36),
  status ENUM('active','inactive','graduated','transferred','suspended') DEFAULT 'active',
  admission_date DATE,
  previous_school VARCHAR(255),
  medical_info JSON,
  special_needs TEXT,
  photo_url TEXT,
  upi VARCHAR(50),
  parent_name VARCHAR(255),
  parent_phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (current_grade_id) REFERENCES grades(id) ON DELETE SET NULL,
  FOREIGN KEY (current_stream_id) REFERENCES streams(id) ON DELETE SET NULL,
  UNIQUE KEY uq_school_admission (school_id, admission_number)
);

CREATE TABLE student_parents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id CHAR(36) NOT NULL,
  parent_id CHAR(36) NOT NULL,
  relationship ENUM('father','mother','guardian','other') DEFAULT 'guardian',
  is_primary_contact BOOLEAN DEFAULT FALSE,
  is_fee_payer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_parent (student_id, parent_id)
);

-- ============================================
-- 5. STAFF / HR
-- ============================================

CREATE TABLE departments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  head_staff_id CHAR(36),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE designations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE staff (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  employee_number VARCHAR(50),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(30),
  gender ENUM('Male','Female','Other'),
  date_of_birth DATE,
  join_date DATE,
  department_id CHAR(36),
  designation_id CHAR(36),
  qualification VARCHAR(255),
  experience_years INT DEFAULT 0,
  salary DECIMAL(15,2) DEFAULT 0,
  status ENUM('active','inactive','on_leave','terminated') DEFAULT 'active',
  photo_url TEXT,
  address TEXT,
  id_number VARCHAR(50),
  kra_pin VARCHAR(50),
  nhif_number VARCHAR(50),
  nssf_number VARCHAR(50),
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL
);

CREATE TABLE leave_types (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  max_days INT,
  is_paid BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE leave_applications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  staff_id CHAR(36) NOT NULL,
  leave_type_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT DEFAULT 1,
  reason TEXT,
  status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  approved_by CHAR(36),
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
);

-- ============================================
-- 6. ATTENDANCE
-- ============================================

CREATE TABLE student_attendance (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  status ENUM('present','absent','late','excused') DEFAULT 'present',
  remarks TEXT,
  marked_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_date (student_id, date)
);

CREATE TABLE staff_attendance (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  staff_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  status ENUM('present','absent','late','on_leave','half_day') DEFAULT 'present',
  check_in TIME,
  check_out TIME,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  UNIQUE KEY uq_staff_date (staff_id, date)
);

-- ============================================
-- 7. FINANCE — FEE SETUP
-- ============================================

CREATE TABLE fee_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'tuition',
  description TEXT,
  gl_code VARCHAR(50),
  is_optional BOOLEAN DEFAULT FALSE,
  is_refundable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE fee_templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  fee_type VARCHAR(50) DEFAULT 'mandatory',
  ledger_type ENUM('fees','transport','pos') DEFAULT 'fees',
  amount DECIMAL(15,2) DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT TRUE,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_grades JSON,
  priority INT DEFAULT 0,
  fine_type VARCHAR(20),
  fine_amount DECIMAL(15,2),
  fine_frequency VARCHAR(20),
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE fee_structures (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  academic_year_id CHAR(36) NOT NULL,
  fee_category_id CHAR(36) NOT NULL,
  grade_id CHAR(36),
  term_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  due_date DATE,
  is_mandatory BOOLEAN DEFAULT TRUE,
  applies_to_new_students BOOLEAN DEFAULT TRUE,
  applies_to_continuing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE SET NULL,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL
);

CREATE TABLE fee_discounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  type ENUM('percentage','fixed_amount','fee_waiver') DEFAULT 'percentage',
  value DECIMAL(15,2) DEFAULT 0,
  applicable_to VARCHAR(100),
  condition_type VARCHAR(50),
  condition_params JSON,
  priority INT DEFAULT 0,
  stackable BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- ============================================
-- 8. FINANCE — STUDENT FEES
-- ============================================

CREATE TABLE student_fees (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  fee_template_id CHAR(36),
  term_id CHAR(36),
  academic_year_id CHAR(36),
  ledger_type ENUM('fees','transport','pos') DEFAULT 'fees',
  amount_due DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  balance DECIMAL(15,2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  fine_amount DECIMAL(15,2) DEFAULT 0,
  brought_forward_amount DECIMAL(15,2) DEFAULT 0,
  status ENUM('pending','partial','paid','waived','cancelled') DEFAULT 'pending',
  due_date DATE,
  last_payment_at TIMESTAMP NULL,
  adjusted_at TIMESTAMP NULL,
  adjusted_by CHAR(36),
  assigned_by CHAR(36),
  assignment_mode VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_template_id) REFERENCES fee_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);

CREATE TABLE student_fee_discounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_fee_id CHAR(36) NOT NULL,
  fee_discount_id CHAR(36),
  discount_name VARCHAR(255),
  discount_type VARCHAR(50),
  original_value DECIMAL(15,2),
  calculated_amount DECIMAL(15,2),
  applied_by CHAR(36),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_fee_id) REFERENCES student_fees(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_discount_id) REFERENCES fee_discounts(id) ON DELETE SET NULL
);

CREATE TABLE fee_adjustments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  student_fee_id CHAR(36) NOT NULL,
  adjustment_type VARCHAR(50) NOT NULL,
  previous_amount DECIMAL(15,2) NOT NULL,
  new_amount DECIMAL(15,2) NOT NULL,
  reason TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(20),
  approved_by CHAR(36),
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_fee_id) REFERENCES student_fees(id) ON DELETE CASCADE
);

-- ============================================
-- 9. PAYMENTS
-- ============================================

CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('mpesa_stk','mpesa_c2b','cash','bank','cheque','card') NOT NULL,
  reference_number VARCHAR(100),
  ledger_type ENUM('fees','transport','pos') DEFAULT 'fees',
  status ENUM('pending','processing','completed','failed','cancelled','reversed') DEFAULT 'pending',
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by CHAR(36),
  payer_name VARCHAR(255),
  payer_phone VARCHAR(30),
  mpesa_receipt VARCHAR(100),
  mpesa_phone VARCHAR(30),
  mpesa_transaction_id CHAR(36),
  bank_name VARCHAR(100),
  bank_reference VARCHAR(100),
  cheque_number VARCHAR(50),
  cheque_date DATE,
  notes TEXT,
  parent_id CHAR(36),
  receipt_url TEXT,
  transaction_date TIMESTAMP NULL,
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMP NULL,
  reconciled_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE payment_allocations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  payment_id CHAR(36) NOT NULL,
  student_fee_id CHAR(36) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  allocation_order INT,
  is_auto_allocated BOOLEAN DEFAULT TRUE,
  allocated_by CHAR(36),
  allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_fee_id) REFERENCES student_fees(id) ON DELETE CASCADE
);

CREATE TABLE receipts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  payment_id CHAR(36) NOT NULL,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE TABLE receipt_sequences (
  school_id CHAR(36) PRIMARY KEY,
  prefix VARCHAR(10) DEFAULT 'RCT',
  current_number INT DEFAULT 0,
  fiscal_year INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- ============================================
-- 10. M-PESA
-- ============================================

CREATE TABLE mpesa_transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36),
  term_id CHAR(36),
  transaction_type VARCHAR(20) DEFAULT 'stk_push',
  phone_number VARCHAR(30) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  account_reference VARCHAR(100) NOT NULL,
  ledger_type ENUM('fees','transport','pos') DEFAULT 'fees',
  status ENUM('pending','processing','completed','failed','cancelled','stale') DEFAULT 'pending',
  checkout_request_id VARCHAR(100),
  merchant_request_id VARCHAR(100),
  mpesa_receipt_number VARCHAR(100),
  result_code INT,
  payer_name VARCHAR(255),
  confirmed_amount DECIMAL(15,2),
  confirmed_phone VARCHAR(30),
  transaction_date TIMESTAMP NULL,
  failure_reason TEXT,
  raw_callback JSON,
  callback_received_at TIMESTAMP NULL,
  initiated_by CHAR(36),
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fee_ids JSON,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- ============================================
-- 11. CARRY FORWARDS
-- ============================================

CREATE TABLE fee_carry_forwards (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  from_term_id CHAR(36),
  to_term_id CHAR(36),
  ledger_type ENUM('fees','transport','pos') DEFAULT 'fees',
  amount DECIMAL(15,2) NOT NULL,
  type ENUM('arrears','advance_credit') DEFAULT 'arrears',
  status ENUM('pending','applied','cancelled') DEFAULT 'pending',
  source_payment_id CHAR(36),
  applied_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (from_term_id) REFERENCES terms(id) ON DELETE SET NULL,
  FOREIGN KEY (to_term_id) REFERENCES terms(id) ON DELETE SET NULL
);

-- ============================================
-- 12. EXPENSES
-- ============================================

CREATE TABLE expense_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE expenses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) DEFAULT 0,
  category_id CHAR(36),
  expense_date DATE DEFAULT (CURRENT_DATE),
  payment_method VARCHAR(50) DEFAULT 'cash',
  reference VARCHAR(100),
  status ENUM('pending','approved','paid','rejected') DEFAULT 'pending',
  recorded_by CHAR(36),
  approved_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
);

-- ============================================
-- 13. INVENTORY
-- ============================================

CREATE TABLE inventory_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE inventory_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  description TEXT,
  category_id CHAR(36),
  cost_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) DEFAULT 0,
  quantity_in_stock INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  unit VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE SET NULL
);

CREATE TABLE inventory_transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  item_id CHAR(36) NOT NULL,
  type ENUM('purchase','sale','adjustment','return') NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  reference_type VARCHAR(50),
  reference_id CHAR(36),
  notes TEXT,
  recorded_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- ============================================
-- 14. HOMEWORK
-- ============================================

CREATE TABLE homework (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100) NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  section VARCHAR(50),
  assigned_by CHAR(36),
  assigned_date DATE DEFAULT (CURRENT_DATE),
  due_date DATE NOT NULL,
  max_marks INT,
  attachment_url TEXT,
  status ENUM('active','closed','draft') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE homework_submissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  homework_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  content TEXT,
  attachment_url TEXT,
  submission_date DATE,
  status ENUM('pending','submitted','evaluated','late') DEFAULT 'pending',
  marks INT,
  remarks TEXT,
  evaluated_by CHAR(36),
  evaluated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================
-- 15. NOTIFICATIONS
-- ============================================

CREATE TABLE notification_templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  channel ENUM('sms','email','push') DEFAULT 'sms',
  subject VARCHAR(500),
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36) NOT NULL,
  recipient_id CHAR(36) NOT NULL,
  recipient_type VARCHAR(50) NOT NULL,
  recipient_contact VARCHAR(255) NOT NULL,
  channel ENUM('sms','email','push') DEFAULT 'sms',
  template_id CHAR(36),
  subject VARCHAR(500),
  body TEXT NOT NULL,
  status ENUM('queued','sent','delivered','failed') DEFAULT 'queued',
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL
);

-- ============================================
-- 16. AUDIT
-- ============================================

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36),
  user_id CHAR(36),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

CREATE TABLE finance_audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  school_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  student_id CHAR(36),
  amount_affected DECIMAL(15,2),
  performed_by VARCHAR(255) NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- ============================================
-- 17. CONFIG
-- ============================================

CREATE TABLE finance_automation_config (
  school_id CHAR(36) PRIMARY KEY,
  auto_allocate_payments BOOLEAN DEFAULT TRUE,
  auto_assign_fees_on_enrollment BOOLEAN DEFAULT FALSE,
  auto_assign_fees_on_term_start BOOLEAN DEFAULT FALSE,
  auto_carry_forward_arrears BOOLEAN DEFAULT TRUE,
  auto_apply_advance_credits BOOLEAN DEFAULT TRUE,
  auto_apply_eligible_discounts BOOLEAN DEFAULT FALSE,
  default_allocation_strategy VARCHAR(50) DEFAULT 'fifo_by_due_date',
  allow_manual_allocation BOOLEAN DEFAULT TRUE,
  allow_fee_adjustments BOOLEAN DEFAULT TRUE,
  allow_manual_discounts BOOLEAN DEFAULT TRUE,
  require_approval_for_adjustments BOOLEAN DEFAULT TRUE,
  require_approval_for_discounts BOOLEAN DEFAULT TRUE,
  require_approval_for_carry_forward BOOLEAN DEFAULT FALSE,
  require_approval_for_bulk_assignment BOOLEAN DEFAULT TRUE,
  max_adjustment_without_approval DECIMAL(15,2),
  max_discount_percent_without_approval DECIMAL(5,2),
  send_payment_confirmation_sms BOOLEAN DEFAULT TRUE,
  send_balance_reminder_sms BOOLEAN DEFAULT FALSE,
  reminder_days_before_due JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_grade ON students(current_grade_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_student_fees_student ON student_fees(student_id);
CREATE INDEX idx_student_fees_school ON student_fees(school_id);
CREATE INDEX idx_student_fees_term ON student_fees(term_id);
CREATE INDEX idx_payments_school ON payments(school_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_school ON user_roles(school_id);
CREATE INDEX idx_attendance_student ON student_attendance(student_id);
CREATE INDEX idx_attendance_date ON student_attendance(date);
CREATE INDEX idx_staff_school ON staff(school_id);
CREATE INDEX idx_parents_school ON parents(school_id);
CREATE INDEX idx_expenses_school ON expenses(school_id);
