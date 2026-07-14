-- ============================================================
-- Migration: Roles & Permissions overhaul (2026-06-12)
-- ============================================================
-- Adds support for:
--   * Custom per-school roles
--   * Per-school permission overrides
--   * The `action` column on permissions
-- Idempotent: safe to run multiple times. Same logic is also
-- executed automatically on server boot via
-- backend/src/utils/rolesBootstrap.js
-- ============================================================

-- 0. Ensure school_role_permissions exists (older DBs may not have it).
CREATE TABLE IF NOT EXISTS school_role_permissions (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  role VARCHAR(64) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  is_granted TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_school_role_perm (school_id, role, permission_id),
  INDEX idx_srp_school_role (school_id, role),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1. Relax ENUM role columns to VARCHAR(64) so custom roles work.
ALTER TABLE user_roles              MODIFY role VARCHAR(64) NOT NULL;
ALTER TABLE role_permissions        MODIFY role VARCHAR(64) NOT NULL;
ALTER TABLE school_role_permissions MODIFY role VARCHAR(64) NOT NULL;

-- 2. Add school_id to role_permissions (NULL = global default).
--    Use information_schema to stay idempotent.
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name   = 'role_permissions'
     AND column_name  = 'school_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE role_permissions ADD COLUMN school_id CHAR(36) NULL AFTER role',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Add `action` column to permissions (used by the UI to group CRUD).
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name   = 'permissions'
     AND column_name  = 'action'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE permissions ADD COLUMN action VARCHAR(64) NULL AFTER module',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Index for per-school override lookups.
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE()
     AND table_name   = 'school_role_permissions'
     AND index_name   = 'idx_srp_school_role'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_srp_school_role ON school_role_permissions (school_id, role)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Per-school custom roles.
CREATE TABLE IF NOT EXISTS custom_roles (
  id          CHAR(36)     PRIMARY KEY,
  school_id   CHAR(36)     NOT NULL,
  code        VARCHAR(64)  NOT NULL,
  label       VARCHAR(120) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_school_role_code (school_id, code),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: the permissions catalog and default per-role grants are seeded
-- automatically by backend/src/utils/rolesBootstrap.js on server boot,
-- and per-school defaults are copied into school_role_permissions on
-- first access of any school.