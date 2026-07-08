/**
 * Roles & Permissions Bootstrap
 * ----------------------------------------------------------
 * Idempotent. Runs on server boot. Responsibilities:
 *   1. Ensures `custom_roles` table exists.
 *   2. Relaxes ENUM columns on role_permissions / school_role_permissions
 *      / user_roles to VARCHAR(64) so custom roles are usable.
 *   3. Seeds the global permissions catalog (INSERT IGNORE).
 *   4. Seeds default global role_permissions for built-in roles.
 *   5. For every existing school missing per-school overrides,
 *      copies the global defaults into school_role_permissions.
 *
 * Also exports `ensureSchoolRolesSeeded(schoolId)` so the school
 * onboarding flow (or any first-access path) can call it directly.
 */
const { query, queryOne } = require("../config/database");

// ---------------------------------------------------------------
// Built-in roles (must mirror frontend role catalog)
// ---------------------------------------------------------------
const BUILTIN_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "accountant",
  "teacher",
  "librarian",
  "receptionist",
];

// Built-in role metadata seeded into role_catalog. Edit a row in the DB
// (or via future admin UI) to change label/description without code changes.
const BUILTIN_ROLE_META = [
  ["super_admin", "Super Admin", "Full unrestricted access", 10],
  ["admin", "School Admin", "Full school management", 20],
  ["manager", "Manager", "Deputy admin / operations", 30],
  ["accountant", "Accountant", "Finance: fees, payments, expenses", 40],
  ["teacher", "Teacher", "Class teaching & assessments", 50],
  ["librarian", "Librarian", "Library books & lending", 60],
  ["receptionist", "Receptionist", "Front desk operations", 70],
];

// ---------------------------------------------------------------
// Permission catalog (code, module, action, description)
// Keep this list in sync with src/hooks/usePermission.ts
// ---------------------------------------------------------------
const PERMISSIONS = [
  // Students
  ["students:create", "students", "create", "Create new students"],
  ["students:read", "students", "read", "View students"],
  ["students:update", "students", "update", "Edit students"],
  ["students:delete", "students", "delete", "Delete students"],
  ["students:export", "students", "export", "Export student lists"],
  ["students:import", "students", "import", "Bulk import students"],
  ["students:promote", "students", "promote", "Promote students"],
  ["students:transfer", "students", "transfer", "Transfer students"],
  // Parents
  ["parents:create", "parents", "create", "Create parents"],
  ["parents:read", "parents", "read", "View parents"],
  ["parents:update", "parents", "update", "Edit parents"],
  ["parents:delete", "parents", "delete", "Delete parents"],
  // Staff
  ["staff:create", "staff", "create", "Create staff"],
  ["staff:read", "staff", "read", "View staff"],
  ["staff:update", "staff", "update", "Edit staff"],
  ["staff:delete", "staff", "delete", "Delete staff"],
  // Classes
  ["classes:create", "classes", "create", "Create classes"],
  ["classes:read", "classes", "read", "View classes"],
  ["classes:update", "classes", "update", "Edit classes"],
  ["classes:delete", "classes", "delete", "Delete classes"],
  // Finance — fees
  ["finance:fees:read", "fees", "read", "View fees"],
  ["finance:fees:create", "fees", "create", "Create fee items"],
  ["finance:fees:update", "fees", "update", "Edit fees"],
  ["finance:fees:delete", "fees", "delete", "Delete fees"],
  ["finance:fees:assign", "fees", "assign", "Assign fees to students"],
  ["finance:fees:waive", "fees", "waive", "Waive / adjust fees"],
  // Payments
  ["payments:create", "payments", "create", "Record payments"],
  ["payments:read", "payments", "read", "View payments"],
  ["payments:update", "payments", "update", "Edit payments"],
  ["payments:delete", "payments", "delete", "Delete payments"],
  ["payments:import", "payments", "import", "Import payments"],
  ["payments:receipt", "payments", "receipt", "Print receipts"],
  ["payments:reverse", "payments", "reverse", "Reverse payments"],
  // Expenses
  ["expenses:create", "expenses", "create", "Create expenses"],
  ["expenses:read", "expenses", "read", "View expenses"],
  ["expenses:update", "expenses", "update", "Edit expenses"],
  ["expenses:delete", "expenses", "delete", "Delete expenses"],
  ["expenses:approve", "expenses", "approve", "Approve expenses"],
  ["expenses:import", "expenses", "import", "Import expenses"],
  // Attendance
  ["attendance:create", "attendance", "create", "Mark attendance"],
  ["attendance:read", "attendance", "read", "View attendance"],
  ["attendance:update", "attendance", "update", "Edit attendance"],
  ["attendance:delete", "attendance", "delete", "Delete attendance"],
  // Exams / Assessments
  ["exams:create", "exams", "create", "Create exams"],
  ["exams:read", "exams", "read", "View exams"],
  ["exams:update", "exams", "update", "Edit exams"],
  ["exams:delete", "exams", "delete", "Delete exams"],
  ["exams:publish", "exams", "publish", "Publish exam results"],
  ["assessments:bands:manage", "assessments", "manage", "Manage remark bands"],
  // Communication
  ["communication:create", "communication", "create", "Send communications"],
  ["communication:read", "communication", "read", "View communications"],
  // Inventory
  ["inventory:create", "inventory", "create", "Create inventory items"],
  ["inventory:read", "inventory", "read", "View inventory"],
  ["inventory:update", "inventory", "update", "Edit inventory"],
  ["inventory:delete", "inventory", "delete", "Delete inventory"],
  ["suppliers:manage", "suppliers", "manage", "Manage suppliers"],
  // Reports / audit
  ["reports:read", "reports", "read", "View reports"],
  ["reports:export", "reports", "export", "Export reports"],
  ["audit:read", "audit", "read", "View audit trail"],
  // Events
  ["events:create", "events", "create", "Create events"],
  ["events:read", "events", "read", "View events"],
  ["events:update", "events", "update", "Edit events"],
  ["events:delete", "events", "delete", "Delete events"],
  // Settings / roles
  ["settings:read", "settings", "read", "View settings"],
  ["settings:update", "settings", "update", "Edit settings"],
  ["users:manage", "users", "manage", "Manage users"],
  ["roles:manage", "roles", "manage", "Manage roles & permissions"],
];

// ---------------------------------------------------------------
// Default permission grants per built-in role.
// "*" means: every permission.
// ---------------------------------------------------------------
const DEFAULT_GRANTS = {
  super_admin: ["*"],
  admin: ["*"],
  manager: [
    "students:*",
    "parents:*",
    "staff:read",
    "classes:*",
    "attendance:*",
    "exams:*",
    "assessments:bands:manage",
    "communication:*",
    "events:*",
    "reports:read",
    "reports:export",
    "audit:read",
    "settings:read",
    "finance:fees:read",
    "payments:read",
    "expenses:read",
  ],
  accountant: [
    "students:read",
    "parents:read",
    "finance:fees:*",
    "payments:*",
    "expenses:*",
    "reports:read",
    "reports:export",
    "audit:read",
  ],
  teacher: [
    "students:read",
    "parents:read",
    "classes:read",
    "attendance:create",
    "attendance:read",
    "attendance:update",
    "exams:create",
    "exams:read",
    "exams:update",
    "communication:read",
    "events:read",
    "reports:read",
  ],
  librarian: [
    "students:read",
    "inventory:*",
    "suppliers:manage",
    "reports:read",
  ],
  receptionist: [
    "students:read",
    "students:create",
    "parents:*",
    "payments:create",
    "payments:read",
    "payments:receipt",
    "communication:create",
    "communication:read",
    "events:read",
    "reports:read",
  ],
};

function expandPattern(pattern, allCodes) {
  if (pattern === "*") return [...allCodes];
  if (!pattern.endsWith(":*")) return [pattern];
  const prefix = pattern.slice(0, -1); // keep trailing ':'
  return allCodes.filter((c) => c.startsWith(prefix));
}

function resolveRoleDefaults(role, allCodes) {
  const patterns = DEFAULT_GRANTS[role] || [];
  const set = new Set();
  for (const p of patterns) {
    expandPattern(p, allCodes).forEach((c) => set.add(c));
  }
  return [...set];
}

// ---------------------------------------------------------------
// 1. Schema bootstrap
// ---------------------------------------------------------------
async function ensureSchema() {
  // Detect collation of schools.id so FK column types match exactly.
  // Different MySQL/MariaDB defaults (utf8mb4_general_ci vs utf8mb4_unicode_ci
  // vs utf8mb4_0900_ai_ci) cause ERROR 3780 when collations don't match.
  let idCollation = "utf8mb4_general_ci";
  let idCharset = "utf8mb4";
  try {
    const row = await queryOne(
      `SELECT CHARACTER_SET_NAME cs, COLLATION_NAME co
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'schools' AND COLUMN_NAME = 'id'`,
    );
    if (row && row.co) {
      idCollation = row.co;
      idCharset = row.cs || idCharset;
    }
  } catch (_) {}
  const idType = `CHAR(36) CHARACTER SET ${idCharset} COLLATE ${idCollation}`;

  // role_catalog — the system-wide catalog of role definitions.
  // Built-in roles live here too (is_builtin=1) so the API can be 100% DB-driven.
  await query(`
    CREATE TABLE IF NOT EXISTS role_catalog (
      id ${idType} PRIMARY KEY,
      code VARCHAR(64) NOT NULL UNIQUE,
      label VARCHAR(120) NOT NULL,
      description TEXT,
      is_builtin TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=${idCharset} COLLATE=${idCollation}`);

  // custom_roles table
  await query(`
    CREATE TABLE IF NOT EXISTS custom_roles (
      id ${idType} PRIMARY KEY,
      school_id ${idType} NOT NULL,
      code VARCHAR(64) NOT NULL,
      label VARCHAR(120) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_school_role_code (school_id, code),
      FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=${idCharset} COLLATE=${idCollation}`);

  // school_role_permissions (per-school overrides). May be missing on older DBs.
  await query(`
    CREATE TABLE IF NOT EXISTS school_role_permissions (
      id ${idType} PRIMARY KEY,
      school_id ${idType} NOT NULL,
      role VARCHAR(64) NOT NULL,
      permission_id ${idType} NOT NULL,
      is_granted TINYINT(1) DEFAULT 1,
      UNIQUE KEY uq_school_role_perm (school_id, role, permission_id),
      INDEX idx_srp_school_role (school_id, role),
      FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=${idCharset} COLLATE=${idCollation}`);

  // Relax ENUM constraints to VARCHAR so custom roles can be used.
  // Wrapped individually because MODIFY on ENUM→VARCHAR is idempotent
  // but may fail if data contains invalid values; we ignore failures.
  const alters = [
    "ALTER TABLE role_permissions MODIFY role VARCHAR(64) NOT NULL",
    "ALTER TABLE school_role_permissions MODIFY role VARCHAR(64) NOT NULL",
    "ALTER TABLE user_roles MODIFY role VARCHAR(64) NOT NULL",
  ];
  for (const sql of alters) {
    try {
      await query(sql);
    } catch (e) {
      console.warn("[roles-bootstrap] alter skipped:", e.message);
    }
  }

  // Add a (role, school_id) index for school_role_permissions if missing
  try {
    await query(
      "CREATE INDEX idx_srp_school_role ON school_role_permissions (school_id, role)",
    );
  } catch (_) {
    /* exists */
  }

  // Add school_id NULL support to role_permissions if not present
  try {
    const cols = await query(
      "SHOW COLUMNS FROM role_permissions LIKE 'school_id'",
    );
    if (!cols.length) {
      await query(
        "ALTER TABLE role_permissions ADD COLUMN school_id CHAR(36) NULL AFTER role",
      );
    }
  } catch (e) {
    console.warn("[roles-bootstrap] add school_id col skipped:", e.message);
  }

  // Ensure permissions table has the `action` column the API/UI expect
  try {
    const acols = await query("SHOW COLUMNS FROM permissions LIKE 'action'");
    if (!acols.length) {
      await query(
        "ALTER TABLE permissions ADD COLUMN action VARCHAR(64) NULL AFTER module",
      );
    }
  } catch (e) {
    console.warn("[roles-bootstrap] add action col skipped:", e.message);
  }

  // Ensure permissions table has the `name` column (older DBs may lack it)
  try {
    const ncols = await query("SHOW COLUMNS FROM permissions LIKE 'name'");
    if (!ncols.length) {
      await query(
        "ALTER TABLE permissions ADD COLUMN name VARCHAR(255) NULL AFTER code",
      );
    }
  } catch (e) {
    console.warn("[roles-bootstrap] add name col skipped:", e.message);
  }

  // Ensure permissions table has the `description` column
  try {
    const dcols = await query(
      "SHOW COLUMNS FROM permissions LIKE 'description'",
    );
    if (!dcols.length) {
      await query("ALTER TABLE permissions ADD COLUMN description TEXT NULL");
    }
  } catch (e) {
    console.warn("[roles-bootstrap] add description col skipped:", e.message);
  }
}

// ---------------------------------------------------------------
// 2. Seed global permissions + default role_permissions
// ---------------------------------------------------------------
async function seedPermissions() {
  // Detect which optional columns actually exist so older DBs don't blow up.
  const colRows = await query("SHOW COLUMNS FROM permissions");
  const cols = new Set(colRows.map((r) => r.Field));
  const has = (c) => cols.has(c);

  for (const [code, module, action, description] of PERMISSIONS) {
    const fields = ["id", "code"];
    const values = ["UUID()", "?"];
    const params = [code];
    if (has("name")) {
      fields.push("name");
      values.push("?");
      params.push(`${module}:${action}`);
    }
    if (has("module")) {
      fields.push("module");
      values.push("?");
      params.push(module);
    }
    if (has("action")) {
      fields.push("action");
      values.push("?");
      params.push(action);
    }
    if (has("description")) {
      fields.push("description");
      values.push("?");
      params.push(description);
    }
    await query(
      `INSERT IGNORE INTO permissions (${fields.join(",")}) VALUES (${values.join(",")})`,
      params,
    );
    if (has("action")) {
      await query(
        "UPDATE permissions SET action = ? WHERE code = ? AND (action IS NULL OR action = '')",
        [action, code],
      );
    }
  }

  // Build code -> id map
  const allRows = await query("SELECT id, code FROM permissions");
  const codeToId = new Map(allRows.map((r) => [r.code, r.id]));
  const allCodes = [...codeToId.keys()];

  // Seed global role_permissions (school_id IS NULL) for each builtin role
  for (const role of BUILTIN_ROLES) {
    const codes = resolveRoleDefaults(role, allCodes);
    for (const code of codes) {
      const pid = codeToId.get(code);
      if (!pid) continue;
      await query(
        `INSERT IGNORE INTO role_permissions (id, role, school_id, permission_id)
         VALUES (UUID(), ?, NULL, ?)`,
        [role, pid],
      );
    }
  }
}

// Seed the role_catalog table with built-in roles. INSERT IGNORE so
// edits to label/description by admins are preserved across restarts.
async function seedRoleCatalog() {
  for (const [code, label, description, sort_order] of BUILTIN_ROLE_META) {
    await query(
      `INSERT IGNORE INTO role_catalog (id, code, label, description, is_builtin, sort_order)
       VALUES (UUID(), ?, ?, ?, 1, ?)`,
      [code, label, description, sort_order],
    );
  }
}

// ---------------------------------------------------------------
// 3. Per-school seeding: copy defaults into school_role_permissions
// ---------------------------------------------------------------
async function ensureSchoolRolesSeeded(schoolId) {
  if (!schoolId) return;
  const existing = await queryOne(
    "SELECT COUNT(*) AS c FROM school_role_permissions WHERE school_id = ?",
    [schoolId],
  );
  if (existing && Number(existing.c) > 0) return;

  const defaults = await query(
    "SELECT role, permission_id FROM role_permissions WHERE school_id IS NULL",
  );
  if (!defaults.length) return;

  // Bulk insert
  for (const row of defaults) {
    await query(
      `INSERT IGNORE INTO school_role_permissions
         (id, school_id, role, permission_id, is_granted)
       VALUES (UUID(), ?, ?, ?, 1)`,
      [schoolId, row.role, row.permission_id],
    );
  }
}

async function seedAllExistingSchools() {
  try {
    const schools = await query("SELECT id FROM schools");
    for (const s of schools) await ensureSchoolRolesSeeded(s.id);
  } catch (e) {
    console.warn("[roles-bootstrap] seedAllExistingSchools:", e.message);
  }
}

// ---------------------------------------------------------------
// Entry: called from server.js on boot. Non-fatal.
// ---------------------------------------------------------------
async function bootstrapRolesAndPermissions() {
  try {
    await ensureSchema();
    await seedPermissions();
    await seedRoleCatalog();
    await seedAllExistingSchools();
    console.log("[roles-bootstrap] OK");
  } catch (e) {
    console.error("[roles-bootstrap] failed:", e.message);
  }
}

module.exports = {
  bootstrapRolesAndPermissions,
  ensureSchoolRolesSeeded,
  BUILTIN_ROLES,
  PERMISSIONS,
};
