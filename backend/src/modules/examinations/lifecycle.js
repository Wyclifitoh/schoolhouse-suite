const { error } = require("../../utils/response");

/**
 * Exam lifecycle state machine.
 *
 *   DRAFT ─► SUBMITTED ─► REVIEWED ─► APPROVED ─► LOCKED
 *                                           │
 *                                           └─► ARCHIVED
 *
 * Allowed actors per transition (role from JWT `req.user.role`):
 *   submit   : teacher, hod, academic, admin
 *   review   : hod, academic, admin
 *   approve  : academic, admin
 *   lock     : admin
 *   reopen   : admin   (LOCKED|APPROVED -> DRAFT, requires reason, audited)
 *   archive  : admin
 *
 * `published` / `completed` / `ongoing` / `scheduled` legacy lowercase
 * statuses are treated as terminal-for-edit but readable, and are
 * normalized to APPROVED on the first lifecycle transition.
 */

const ROLE_RANK = {
  student: 0,
  parent: 0,
  teacher: 1,
  hod: 2,
  academic: 3,
  admin: 4,
  super_admin: 5,
};

const TRANSITIONS = {
  DRAFT: { submit: ["teacher", "hod", "academic", "admin", "super_admin"] },
  SUBMITTED: {
    review: ["hod", "academic", "admin", "super_admin"],
    reopen: ["hod", "academic", "admin", "super_admin"],
  },
  REVIEWED: {
    approve: ["academic", "admin", "super_admin"],
    reopen: ["academic", "admin", "super_admin"],
  },
  APPROVED: {
    lock: ["admin"],
    archive: ["admin"],
    reopen: ["admin", "super_admin"],
  },
  LOCKED: {
    reopen: ["admin", "super_admin"],
    archive: ["admin", "super_admin"],
  },
};

const NEXT_STATUS = {
  submit: "SUBMITTED",
  review: "REVIEWED",
  approve: "APPROVED",
  lock: "LOCKED",
  reopen: "DRAFT",
  archive: "ARCHIVED",
};

function normalizeStatus(s) {
  if (!s) return "DRAFT";
  const upper = String(s).toUpperCase();
  if (
    [
      "DRAFT",
      "SUBMITTED",
      "REVIEWED",
      "APPROVED",
      "LOCKED",
      "ARCHIVED",
    ].includes(upper)
  )
    return upper;
  // legacy lowercase rollover
  if (["published", "completed"].includes(s)) return "APPROVED";
  if (["ongoing", "scheduled"].includes(s)) return "DRAFT";
  return "DRAFT";
}

function assertTransition(currentStatus, action, role) {
  const status = normalizeStatus(currentStatus);
  const allowed = TRANSITIONS[status]?.[action];
  if (!allowed) {
    const err = new Error(
      `Action '${action}' not allowed from status '${status}'`,
    );
    err.statusCode = 409;
    throw err;
  }
  if (!allowed.includes(role)) {
    const err = new Error(`Role '${role}' cannot perform '${action}'`);
    err.statusCode = 403;
    throw err;
  }
  return NEXT_STATUS[action];
}

/**
 * Express middleware: requires the JWT role to outrank or equal the given role.
 *   requireExamRole('hod')   -> hod | academic | admin
 *   requireExamRole('admin') -> admin only
 */
const resolveUserRole = async (req) => {
  if (req.user?.role) return req.user.role;
  const schoolId = req.schoolId || req.headers["x-school-id"];
  let roles = req.user?.roles;
  // Fallback: legacy JWT without roles → fetch from DB
  if (!Array.isArray(roles) && req.user?.id) {
    try {
      const authRepo = require("../auth/auth.repository");
      roles = await authRepo.getUserRoles(req.user.id);
      req.user.roles = roles;
    } catch {
      roles = [];
    }
  }
  if (!Array.isArray(roles)) return null;
  const scoped = roles.filter((r) => !schoolId || r.school_id === schoolId);
  const pool = scoped.length ? scoped : roles;
  let best = null;
  for (const r of pool) {
    if (r.is_active === false) continue;
    const rank = ROLE_RANK[r.role] ?? -1;
    if (!best || rank > (ROLE_RANK[best] ?? -1)) best = r.role;
  }
  if (best) req.user.role = best;
  return best;
};

const requireExamRole = (minRole) => async (req, res, next) => {
  try {
    const role = await resolveUserRole(req);
    if (!role) return error(res, "Authentication required", 401);
    if ((ROLE_RANK[role] ?? -1) < (ROLE_RANK[minRole] ?? 99)) {
      return error(res, `Requires ${minRole} or higher`, 403);
    }
    next();
  } catch (e) {
    return error(res, e.message || "Auth check failed", 500);
  }
};

module.exports = {
  normalizeStatus,
  assertTransition,
  requireExamRole,
  resolveUserRole,
  ROLE_RANK,
};
