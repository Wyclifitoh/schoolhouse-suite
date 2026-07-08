-- Phase 4: Public Payment Recording API

CREATE TABLE IF NOT EXISTS api_keys (
  id CHAR(36) NOT NULL PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  label VARCHAR(150) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  key_hash CHAR(64) NOT NULL,
  scopes VARCHAR(500) NOT NULL DEFAULT 'payments:write',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_used_at TIMESTAMP NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  UNIQUE KEY uq_api_key_hash (key_hash),
  INDEX idx_api_keys_school (school_id),
  INDEX idx_api_keys_prefix (key_prefix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_key_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  api_key_id CHAR(36) NULL,
  school_id CHAR(36) NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  idempotency_key VARCHAR(150) NULL,
  request_body MEDIUMTEXT NULL,
  response_status INT NULL,
  response_body MEDIUMTEXT NULL,
  ip_address VARCHAR(64) NULL,
  duration_ms INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_akl_key (api_key_id),
  INDEX idx_akl_school (school_id),
  INDEX idx_akl_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;