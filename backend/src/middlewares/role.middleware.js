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

      if (result.rows.length === 0) {
        return error(res, "Insufficient permissions", 403);
      }

      req.schoolId = schoolId;
      req.userRole = result.rows[0].role;
      next();
    } catch (err) {
      console.error("Authorization error:", err);
      return error(res, "Authorization check failed", 500);
    }
  };
};

module.exports = { authorize, expandRoles };
