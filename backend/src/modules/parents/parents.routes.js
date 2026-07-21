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

// ---- GET children of a parent (robust, always returns rich data) ----
router.get("/:id/children", async (req, res) => {
  try {
    const rows = await repo.findChildren(req.params.id);
    return success(res, { count: rows.length, children: rows });
  } catch (e) {
    return error(res, e.message, 500);
  }
});

// ---- Helper: priority for auto-promoting a new primary contact ----
const PRIMARY_PRIORITY = { mother: 1, father: 2, guardian: 3, other: 4 };

async function autoPromoteNewPrimaryIfNeeded(studentId) {
  // If student still has a primary, do nothing.
  const primary = await queryOne(
    `SELECT id FROM student_parents WHERE student_id = ? AND is_primary_contact = 1 LIMIT 1`,
    [studentId],
  );
  if (primary) return null;

  // Pick next link by priority (mother → father → guardian → other → oldest)
  const candidates = await query(
    `SELECT id, relationship FROM student_parents WHERE student_id = ? ORDER BY created_at ASC`,
    [studentId],
  );
  if (!candidates.length) return null;
  candidates.sort(
    (a, b) =>
      (PRIMARY_PRIORITY[a.relationship] || 9) -
      (PRIMARY_PRIORITY[b.relationship] || 9),
  );
  const next = candidates[0];
  await query(
    `UPDATE student_parents SET is_primary_contact = 1 WHERE id = ?`,
    [next.id],
  );
  return next.id;
}

// ---- Unlink one or many students from a parent (admin only) ----
// body: { student_ids: ["..."] }
router.post("/:id/unlink-students", requireAdmin, async (req, res) => {
  try {
    const parentId = req.params.id;
    const ids = Array.isArray(req.body?.student_ids)
      ? req.body.student_ids
      : [];
    if (!ids.length) return error(res, "student_ids required", 400);

    const results = { unlinked: 0, promoted: [], failed: [] };
    for (const studentId of ids) {
      try {
        const link = await queryOne(
          `SELECT sp.id, sp.is_primary_contact FROM student_parents sp
             JOIN parents p ON p.id = sp.parent_id
            WHERE sp.parent_id = ? AND sp.student_id = ? AND p.school_id = ?
            LIMIT 1`,
          [parentId, studentId, req.schoolId],
        );
        if (!link) {
          results.failed.push({ student_id: studentId, reason: "not linked" });
          continue;
        }
        await query(`DELETE FROM student_parents WHERE id = ?`, [link.id]);
        results.unlinked += 1;
        if (link.is_primary_contact) {
          const promoted = await autoPromoteNewPrimaryIfNeeded(studentId);
          if (promoted)
            results.promoted.push({ student_id: studentId, link_id: promoted });
        }
      } catch (e) {
        results.failed.push({ student_id: studentId, reason: e.message });
      }
    }
    return success(res, results);
  } catch (e) {
    return error(res, e.message, 500);
  }
});

// ---- Transfer linked students from one parent to another (admin only) ----
// body: { student_ids: ["..."], target_parent_id, relationship?: 'father'|'mother'|'guardian'|'other', keep_primary?: bool }
router.post("/:id/transfer-students", requireAdmin, async (req, res) => {
  try {
    const fromParentId = req.params.id;
    const { student_ids, target_parent_id, relationship, keep_primary } =
      req.body || {};
    if (!target_parent_id) return error(res, "target_parent_id required", 400);
    if (target_parent_id === fromParentId)
      return error(res, "Target parent must differ from source", 400);
    if (!Array.isArray(student_ids) || !student_ids.length)
      return error(res, "student_ids required", 400);

    const target = await repo.findById(target_parent_id, req.schoolId);
    if (!target)
      return error(res, "Target parent not found in this school", 404);

    const results = { transferred: 0, merged: 0, failed: [] };
    for (const studentId of student_ids) {
      try {
        const oldLink = await queryOne(
          `SELECT sp.id, sp.relationship, sp.is_primary_contact, sp.is_fee_payer
             FROM student_parents sp
             JOIN parents p ON p.id = sp.parent_id
            WHERE sp.parent_id = ? AND sp.student_id = ? AND p.school_id = ?
            LIMIT 1`,
          [fromParentId, studentId, req.schoolId],
        );
        if (!oldLink) {
          results.failed.push({ student_id: studentId, reason: "not linked" });
          continue;
        }

        const newRel = relationship || oldLink.relationship || "guardian";
        const isPrimary =
          keep_primary === false ? 0 : oldLink.is_primary_contact ? 1 : 0;

        const existing = await queryOne(
          `SELECT id FROM student_parents WHERE student_id = ? AND parent_id = ? LIMIT 1`,
          [studentId, target_parent_id],
        );

        if (existing) {
          // Merge: update relationship/primary on existing link
          await query(
            `UPDATE student_parents SET relationship = ?, is_primary_contact = ?, is_fee_payer = ? WHERE id = ?`,
            [newRel, isPrimary, oldLink.is_fee_payer, existing.id],
          );
          results.merged += 1;
        } else {
          await query(
            `INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact, is_fee_payer)
             VALUES (UUID(), ?, ?, ?, ?, ?)`,
            [
              studentId,
              target_parent_id,
              newRel,
              isPrimary,
              oldLink.is_fee_payer,
            ],
          );
          results.transferred += 1;
        }

        // If target took primary, ensure only one primary remains.
        if (isPrimary) {
          await query(
            `UPDATE student_parents SET is_primary_contact = 0
              WHERE student_id = ? AND parent_id <> ?`,
            [studentId, target_parent_id],
          );
        }

        // Remove old link.
        await query(`DELETE FROM student_parents WHERE id = ?`, [oldLink.id]);

        // If we removed primary and target didn't become primary, auto-promote.
        await autoPromoteNewPrimaryIfNeeded(studentId);
      } catch (e) {
        results.failed.push({ student_id: studentId, reason: e.message });
      }
    }
    return success(res, results);
  } catch (e) {
    return error(res, e.message, 500);
  }
});

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
