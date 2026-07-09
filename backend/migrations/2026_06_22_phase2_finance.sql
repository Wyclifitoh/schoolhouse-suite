-- Phase 2: Petty Cash + Income module

CREATE TABLE IF NOT EXISTS petty_cash_accounts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  custodian_id CHAR(36) NULL,
  float_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pca_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS petty_cash_transactions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  account_id CHAR(36) NOT NULL,
  txn_type ENUM('issue','spend','return','reconcile','topup') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  description VARCHAR(500) NULL,
  reference VARCHAR(100) NULL,
  expense_id CHAR(36) NULL,
  category_id CHAR(36) NULL,
  performed_by CHAR(36) NULL,
  txn_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pct_school (school_id),
  INDEX idx_pct_acct (account_id),
  INDEX idx_pct_date (txn_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS income_categories (
  id CHAR(36) NOT NULL PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ic_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS income_entries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  source VARCHAR(150) NULL,
  payer_name VARCHAR(150) NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
  reference VARCHAR(100) NULL,
  income_date DATE NOT NULL,
  notes VARCHAR(1000) NULL,
  recorded_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ie_school (school_id),
  INDEX idx_ie_date (income_date),
  INDEX idx_ie_cat (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;