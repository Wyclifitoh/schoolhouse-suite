-- Phase 3: Payment in Kind + Bulk Sponsorship/Bursary

CREATE TABLE IF NOT EXISTS in_kind_payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  kind ENUM('supplier_offset','parent_goods') NOT NULL,
  supplier_id CHAR(36) NULL,
  student_id CHAR(36) NULL,
  goods_description VARCHAR(500) NOT NULL,
  quantity DECIMAL(14,2) NOT NULL DEFAULT 1,
  unit VARCHAR(50) NULL,
  assessed_value DECIMAL(14,2) NOT NULL,
  approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  approved_by CHAR(36) NULL,
  approved_at TIMESTAMP NULL,
  linked_expense_id CHAR(36) NULL,
  linked_payment_id CHAR(36) NULL,
  reference VARCHAR(100) NULL,
  notes VARCHAR(1000) NULL,
  recorded_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ikp_school (school_id),
  INDEX idx_ikp_student (student_id),
  INDEX idx_ikp_supplier (supplier_id),
  INDEX idx_ikp_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bulk_payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  sponsor_name VARCHAR(200) NOT NULL,
  sponsor_contact VARCHAR(150) NULL,
  total_amount DECIMAL(14,2) NOT NULL,
  reference VARCHAR(100) NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'bank',
  payment_date DATE NOT NULL,
  notes VARCHAR(1000) NULL,
  status ENUM('draft','committed','reversed') NOT NULL DEFAULT 'draft',
  committed_at TIMESTAMP NULL,
  committed_by CHAR(36) NULL,
  recorded_by CHAR(36) NULL,
  term_id CHAR(36) NULL,
  academic_year_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bp_school (school_id),
  INDEX idx_bp_status (status),
  INDEX idx_bp_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bulk_payment_allocations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  bulk_payment_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  payment_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bpa_school (school_id),
  INDEX idx_bpa_bulk (bulk_payment_id),
  INDEX idx_bpa_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;