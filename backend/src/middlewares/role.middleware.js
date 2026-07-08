const { error } = require("../utils/response");
const { query } = require("../config/database");

// Canonical <-> legacy role aliases (HR redesign 2026-05-31).
// Granting a user any role in an alias group satisfies authorize() checks
// for any other role in the same group.
const ROLE_ALIAS_GROUPS = [
  ["accountant", "finance_officer"],
  ["admin", "school_admin"],
  ["receptionist", "front_office"],
  ["manager", "deputy_admin"],
];

function expandRoles(roles) {
  const out = new Set(roles);
  for (const r of roles) {
    for (const group of ROLE_ALIAS_GROUPS) {
      if (group.includes(r)) group.forEach((g) => out.add(g));
    }
  }
  return Array.from(out);
}

const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return error(res, "Authentication required", 401);
    }

    const schoolId = req.headers["x-school-id"] || req.params.schoolId;
    if (!schoolId) {
      return error(res, "X-School-ID header is required", 400);
    }

    try {
      const expanded = expandRoles(allowedRoles);
      const result = await query(
        `SELECT role FROM user_roles WHERE user_id = $1 AND school_id = $2 AND role = ANY($3::text[])`,
        [req.user.id, schoolId, expanded],
      );
      const rows = Array.isArray(result) ? result : result.rows || [];
      if (rows.length === 0) {
        return error(res, "Insufficient permissions", 403);
      }
      req.schoolId = schoolId;
      req.userRole = rows[0].role;
      next();
    } catch (err) {
      console.error("Authorization error:", err);
      return error(res, "Authorization check failed", 500);
    }
  };
};

/**
 * Authorize by permission code(s). Passes if the user holds ANY of the listed
 * permissions in the current school. Admin / super_admin always pass.
 * Use as: router.post('/x', requirePermission('expenses:create'), handler)
 */
const ADMIN_ROLES = ["super_admin", "admin", "school_admin"];

const requirePermission = (...codes) => {
  return async (req, res, next) => {
    if (!req.user) return error(res, "Authentication required", 401);
    const schoolId = req.headers["x-school-id"] || req.params.schoolId;
    if (!schoolId) return error(res, "X-School-ID header is required", 400);
    try {
      // Admins always pass.
      const adminCheck = await query(
        "SELECT 1 FROM user_roles WHERE user_id = ? AND school_id = ? AND role IN (?) LIMIT 1",
        [req.user.id, schoolId, ADMIN_ROLES],
      );
      const adminRows = Array.isArray(adminCheck)
        ? adminCheck
        : adminCheck.rows || [];
      if (adminRows.length) {
        req.schoolId = schoolId;
        return next();
      }
      const result = await query(
        `SELECT 1
           FROM user_roles ur
           JOIN permissions p ON p.id IN (
             SELECT srp.permission_id FROM school_role_permissions srp
               WHERE srp.role = ur.role AND srp.school_id = ur.school_id
                 AND srp.is_granted = 1
             UNION
             SELECT rp.permission_id FROM role_permissions rp
               WHERE rp.role = ur.role AND rp.school_id IS NULL
                 AND NOT EXISTS (
                   SELECT 1 FROM school_role_permissions s2
                     WHERE s2.role = ur.role AND s2.school_id = ur.school_id
                 )
           )
          WHERE ur.user_id = ? AND ur.school_id = ?
            AND p.code IN (?)
          LIMIT 1`,
        [req.user.id, schoolId, codes],
      );
      const rows = Array.isArray(result) ? result : result.rows || [];
      if (rows.length === 0) {
        return error(res, "Permission denied: " + codes.join(", "), 403);
      }
      req.schoolId = schoolId;
      next();
    } catch (err) {
      console.error("Permission check error:", err);
      return error(res, "Permission check failed", 500);
    }
  };
};

module.exports = { authorize, expandRoles, requirePermission };
