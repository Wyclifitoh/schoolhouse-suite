-- ============================================================
-- Role catalog table — makes built-in roles DB-driven.
-- Runtime API reads from this table instead of a hardcoded JS array.
-- Bootstrap (rolesBootstrap.js) will INSERT IGNORE the default rows
-- on every server boot, so this migration is purely for environments
-- that want to apply schema changes ahead of an app restart.
-- ============================================================

CREATE TABLE IF NOT EXISTS role_catalog (
  id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  description TEXT,
  is_builtin TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO role_catalog (id, code, label, description, is_builtin, sort_order) VALUES
  (UUID(), 'super_admin',  'Super Admin',  'Full unrestricted access',          1, 10),
  (UUID(), 'admin',        'School Admin', 'Full school management',            1, 20),
  (UUID(), 'manager',      'Manager',      'Deputy admin / operations',         1, 30),
  (UUID(), 'accountant',   'Accountant',   'Finance: fees, payments, expenses', 1, 40),
  (UUID(), 'teacher',      'Teacher',      'Class teaching & assessments',      1, 50),
  (UUID(), 'librarian',    'Librarian',    'Library books & lending',           1, 60),
  (UUID(), 'receptionist', 'Receptionist', 'Front desk operations',             1, 70);