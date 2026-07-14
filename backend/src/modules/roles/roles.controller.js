const repo = require("./roles.repository");
const { success, error } = require("../../utils/response");
const { query } = require("../../config/database");

const ADMIN_ROLES = new Set(["super_admin", "admin", "school_admin"]);

const listRoles = async (req, res) => {
  try {
    // Built-in roles are now stored in role_catalog (seeded on boot).
    // This makes the API fully DB-driven — new built-ins added via SQL
    // or an admin UI appear without code changes.
    let builtinRows = [];
    try {
      builtinRows = await query(
        "SELECT code, label, description FROM role_catalog WHERE is_builtin = 1 ORDER BY sort_order ASC, label ASC",
      );
    } catch {
      builtinRows = [];
    }
    const builtin = await Promise.all(
      builtinRows.map(async (r) => {
        const perms = await repo
          .getRolePermissions(req.schoolId, r.code)
          .catch(() => []);
        return { ...r, builtin: true, permission_count: perms.length };
      }),
    );
    const custom = await repo.listCustomRoles(req.schoolId);
    const customWithCounts = await Promise.all(
      custom.map(async (r) => {
        const perms = await repo
          .getRolePermissions(req.schoolId, r.code)
          .catch(() => []);
        return { ...r, builtin: false, permission_count: perms.length };
      }),
    );
    return success(res, [...builtin, ...customWithCounts]);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const listPermissions = async (req, res) => {
  try {
    const rows = await repo.listPermissions();
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getRolePermissions = async (req, res) => {
  try {
    const rows = await repo.getRolePermissions(req.schoolId, req.params.role);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const setRolePermissions = async (req, res) => {
  try {
    const { permission_ids } = req.body || {};
    if (!Array.isArray(permission_ids)) {
      return error(res, "permission_ids array required", 400);
    }
    await repo.setRolePermissions(
      req.schoolId,
      req.params.role,
      permission_ids,
    );
    return success(res, {
      role: req.params.role,
      count: permission_ids.length,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// Permissions for the currently authenticated user in the current school.
// Admins receive a wildcard ("*") so the UI can short-circuit checks.
const getMyPermissions = async (req, res) => {
  try {
    if (!req.user) return error(res, "Auth required", 401);
    // Check user's roles in this school
    const { query } = require("../../config/database");
    let roles = [];
    try {
      roles = await query(
        "SELECT role FROM user_roles WHERE user_id = ? AND school_id = ?",
        [req.user.id, req.schoolId],
      );
    } catch {
      roles = [];
    }
    const isAdmin = roles.some((r) => ADMIN_ROLES.has(r.role));
    if (isAdmin) {
      return success(res, {
        permissions: ["*"],
        roles: roles.map((r) => r.role),
      });
    }
    const perms = await repo.getUserPermissions(req.user.id, req.schoolId);
    return success(res, {
      permissions: perms.map((p) => p.code),
      roles: roles.map((r) => r.role),
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const createCustomRole = async (req, res) => {
  try {
    const { code, label, description } = req.body || {};
    if (!code || !label) return error(res, "code and label are required", 400);
    const safeCode = String(code)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    const row = await repo.createCustomRole(req.schoolId, {
      code: safeCode,
      label,
      description,
    });
    return success(res, row, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const deleteCustomRole = async (req, res) => {
  try {
    await repo.deleteCustomRole(req.schoolId, req.params.id);
    return success(res, { deleted: true });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  listRoles,
  listPermissions,
  getRolePermissions,
  setRolePermissions,
  getMyPermissions,
  createCustomRole,
  deleteCustomRole,
};
