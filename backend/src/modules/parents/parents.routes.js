const router = require("express").Router();
const c = require("./parents.controller");
const repo = require("./parents.repository");
const portal = require("../portal/portal.repository");
const { query, queryOne } = require("../../config/database");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const { success, error } = require("../../utils/response");

// ---- middleware: role-gated for write actions ----
async function requireAdmin(req, res, next) {
  try {
    const rows = await query(
      `SELECT role FROM user_roles WHERE user_id = ? AND school_id = ? AND is_active = 1`,
      [req.user.id, req.schoolId],
    );
    const roles = rows.map((r) => r.role);
    const allowed = ["super_admin", "admin", "school_admin"];
    if (!roles.some((r) => allowed.includes(r))) {
      return error(res, "Only admins can perform this action", 403);
    }
    req.userRoles = roles;
    next();
  } catch (e) {
    return error(res, e.message, 500);
  }
}

function requireSuperAdmin(req, res, next) {
  if (!req.userRoles?.includes("super_admin")) {
    return error(res, "Only super admins can perform this action", 403);
  }
  next();
}

router.get("/lookup", c.lookup);
router.get("/", c.list);
router.get("/:id", c.getById);
router.post("/", c.create);
router.put("/:id", requireAdmin, c.update);

// ---- DELETE parent (super_admin only; block if children unless force) ----
router.delete("/:id", requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const force = req.query.force === "1";
    const linked = await queryOne(
      "SELECT COUNT(*) AS c FROM student_parents WHERE parent_id = ?",
      [req.params.id],
    );
    if (linked?.c > 0 && !force) {
      return error(
        res,
        `Parent is linked to ${linked.c} student(s). Use ?force=1 to delete anyway.`,
        409,
      );
    }
    await query("DELETE FROM student_parents WHERE parent_id = ?", [
      req.params.id,
    ]);
    await query("DELETE FROM portal_accounts WHERE parent_id = ?", [
      req.params.id,
    ]);
    await query("DELETE FROM parents WHERE id = ? AND school_id = ?", [
      req.params.id,
      req.schoolId,
    ]);
    return success(res, { deleted: true });
  } catch (e) {
    return error(res, e.message, 500);
  }
});

// ---- GET portal account status for a parent ----
router.get("/:id/portal-account", async (req, res) => {
  try {
    const acc = await queryOne(
      `SELECT id, identifier, is_active, must_change_pin, last_login_at, created_at
         FROM portal_accounts
        WHERE parent_id = ? AND account_type='parent' LIMIT 1`,
      [req.params.id],
    );
    return success(res, acc || null);
  } catch (e) {
    return error(res, e.message, 500);
  }
});

// ---- CREATE portal account (admin only) ----
router.post("/:id/portal-account", requireAdmin, async (req, res) => {
  try {
    const parent = await repo.findById(req.params.id, req.schoolId);
    if (!parent) return error(res, "Parent not found", 404);
    if (!parent.phone)
      return error(res, "Parent phone required for portal account", 400);

    const existing = await queryOne(
      `SELECT id FROM portal_accounts WHERE parent_id = ? LIMIT 1`,
      [parent.id],
    );
    if (existing)
      return error(
        res,
        "Portal account already exists. Use Reset PIN instead.",
        409,
      );

    const phoneDigits = String(parent.phone).replace(/\D/g, "");
    const pin = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : "0000";
    const hash = await bcrypt.hash(pin, 10);
    const id = uuid();
    await query(
      `INSERT INTO portal_accounts
         (id, school_id, account_type, identifier, pin_hash, parent_id, is_active, must_change_pin)
       VALUES (?, ?, 'parent', ?, ?, ?, 1, 1)`,
      [id, req.schoolId, parent.phone, hash, parent.id],
    );
    return success(
      res,
      { id, identifier: parent.phone, pin, must_change_pin: true },
      201,
    );
  } catch (e) {
    return error(res, e.message, 500);
  }
});

// ---- RESET PIN (admin only) ----
router.post("/:id/portal-account/reset-pin", requireAdmin, async (req, res) => {
  try {
    const acc = await queryOne(
      `SELECT pa.*, p.phone FROM portal_accounts pa
         JOIN parents p ON p.id = pa.parent_id
        WHERE pa.parent_id = ? LIMIT 1`,
      [req.params.id],
    );
    if (!acc)
      return error(res, "No portal account exists. Create one first.", 404);
    const phoneDigits = String(acc.phone || "").replace(/\D/g, "");
    const pin =
      req.body?.pin ||
      (phoneDigits.length >= 4 ? phoneDigits.slice(-4) : "0000");
    const hash = await bcrypt.hash(String(pin), 10);
    await query(
      `UPDATE portal_accounts SET pin_hash=?, must_change_pin=1, is_active=1 WHERE id=?`,
      [hash, acc.id],
    );
    return success(res, { reset: true, pin, identifier: acc.identifier });
  } catch (e) {
    return error(res, e.message, 500);
  }
});

// ---- TOGGLE account active state ----
router.post("/:id/portal-account/toggle", requireAdmin, async (req, res) => {
  try {
    const acc = await queryOne(
      `SELECT id, is_active FROM portal_accounts WHERE parent_id = ? LIMIT 1`,
      [req.params.id],
    );
    if (!acc) return error(res, "No portal account", 404);
    const next = acc.is_active ? 0 : 1;
    await query(`UPDATE portal_accounts SET is_active=? WHERE id=?`, [
      next,
      acc.id,
    ]);
    return success(res, { is_active: !!next });
  } catch (e) {
    return error(res, e.message, 500);
  }
});

module.exports = router;
