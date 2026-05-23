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

const ROLE_RANK = { student: 0, parent: 0, teacher: 1, hod: 2, academic: 3, admin: 4 };

const TRANSITIONS = {
  DRAFT:     { submit:  ["teacher", "hod", "academic", "admin"] },
  SUBMITTED: { review:  ["hod", "academic", "admin"],
               reopen:  ["hod", "academic", "admin"] },
  REVIEWED:  { approve: ["academic", "admin"],
               reopen:  ["academic", "admin"] },
  APPROVED:  { lock:    ["admin"],
               archive: ["admin"],
               reopen:  ["admin"] },
  LOCKED:    { reopen:  ["admin"],
               archive: ["admin"] },
};

const NEXT_STATUS = {
  submit:  "SUBMITTED",
  review:  "REVIEWED",
  approve: "APPROVED",
  lock:    "LOCKED",
  reopen:  "DRAFT",
  archive: "ARCHIVED",
};

function normalizeStatus(s) {
  if (!s) return "DRAFT";
  const upper = String(s).toUpperCase();
  if (["DRAFT","SUBMITTED","REVIEWED","APPROVED","LOCKED","ARCHIVED"].includes(upper)) return upper;
  // legacy lowercase rollover
  if (["published","completed"].includes(s)) return "APPROVED";
  if (["ongoing","scheduled"].includes(s))   return "DRAFT";
  return "DRAFT";
}

function assertTransition(currentStatus, action, role) {
  const status = normalizeStatus(currentStatus);
  const allowed = TRANSITIONS[status]?.[action];
  if (!allowed) {
    const err = new Error(`Action '${action}' not allowed from status '${status}'`);
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
const requireExamRole = (minRole) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return error(res, "Authentication required", 401);
  if ((ROLE_RANK[role] ?? -1) < (ROLE_RANK[minRole] ?? 99)) {
    return error(res, `Requires ${minRole} or higher`, 403);
  }
  next();
};

module.exports = { normalizeStatus, assertTransition, requireExamRole, ROLE_RANK };
