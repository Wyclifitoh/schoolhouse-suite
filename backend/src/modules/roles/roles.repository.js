const { query, getClient } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const { ensureSchoolRolesSeeded } = require("../../utils/rolesBootstrap");

const listPermissions = async () => {
  try {
    return await query(
      "SELECT id, code, module, action, description FROM permissions ORDER BY module ASC, action ASC",
    );
  } catch {
    return [];
  }
};

const getRolePermissions = async (schoolId, role) => {
  try {
    await ensureSchoolRolesSeeded(schoolId).catch(() => {});
    // Per-school overrides take precedence. If ANY row exists for this
    // (school, role) in school_role_permissions, treat that as the source
    // of truth — even an empty grant set is a legitimate "cleared" state
    // and must NOT fall back to defaults.
    const overrideCount = await query(
      "SELECT COUNT(*) AS c FROM school_role_permissions WHERE school_id = ? AND role = ?",
      [schoolId, role],
    );
    const hasOverride = overrideCount && Number(overrideCount[0]?.c || 0) > 0;
    if (hasOverride) {
      return await query(
        `SELECT p.id, p.code, p.module, p.action, p.description
           FROM school_role_permissions srp
           JOIN permissions p ON p.id = srp.permission_id
          WHERE srp.school_id = ? AND srp.role = ? AND srp.is_granted = 1
          ORDER BY p.module ASC, p.action ASC`,
        [schoolId, role],
      );
    }
    return await query(
      `SELECT p.id, p.code, p.module, p.action, p.description
         FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role = ? AND rp.school_id IS NULL
        ORDER BY p.module ASC, p.action ASC`,
      [role],
    );
  } catch {
    return [];
  }
};

const setRolePermissions = async (schoolId, role, permissionIds) => {
  // Filter to permission IDs that actually exist to avoid FK violations
  // silently rolling back the whole insert.
  const uniqueIds = Array.from(new Set((permissionIds || []).filter(Boolean)));
  let validIds = [];
  if (uniqueIds.length) {
    const rows = await query(`SELECT id FROM permissions WHERE id IN (?)`, [
      uniqueIds,
    ]);
    validIds = rows.map((r) => r.id);
  }

  const conn = await getClient();
  try {
    await conn.beginTransaction();
    await conn.query(
      "DELETE FROM school_role_permissions WHERE role = ? AND school_id = ?",
      [role, schoolId],
    );
    if (validIds.length) {
      // Insert one row at a time so any FK / collation error surfaces
      // clearly instead of a silent multi-row failure.
      for (const pid of validIds) {
        await conn.query(
          `INSERT INTO school_role_permissions (id, school_id, role, permission_id, is_granted)
           VALUES (?, ?, ?, ?, 1)`,
          [uuidv4(), schoolId, role, pid],
        );
      }
    } else {
      // Explicit "cleared" marker so getRolePermissions won't fall back
      // to global defaults. Uses is_granted=0 with a real permission_id
      // (the first available) to satisfy FK. If no permissions exist yet,
      // we simply skip — defaults will apply, which is the desired result.
      const first = await conn.query(
        "SELECT id FROM permissions ORDER BY code LIMIT 1",
      );
      const firstId = first[0]?.[0]?.id || first[0]?.id;
      if (firstId) {
        await conn.query(
          `INSERT INTO school_role_permissions (id, school_id, role, permission_id, is_granted)
           VALUES (?, ?, ?, ?, 0)`,
          [uuidv4(), schoolId, role, firstId],
        );
      }
    }
    await conn.commit();
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}
    console.error("[roles] setRolePermissions failed:", err.message, {
      schoolId,
      role,
      count: validIds.length,
    });
    throw err;
  } finally {
    conn.release();
  }
};

// Permissions held by a user in a school (union across all their roles).
const getUserPermissions = async (userId, schoolId) => {
  try {
    await ensureSchoolRolesSeeded(schoolId).catch(() => {});
    // Get all roles the user holds in this school.
    const roleRows = await query(
      "SELECT role FROM user_roles WHERE user_id = ? AND school_id = ?",
      [userId, schoolId],
    );
    if (!roleRows.length) return [];
    const roles = roleRows.map((r) => r.role);

    // For each role, prefer per-school overrides; fall back to global
    // defaults only when the role has NO override row in this school.
    const byCode = new Map();
    for (const role of roles) {
      const overrideCount = await query(
        "SELECT COUNT(*) AS c FROM school_role_permissions WHERE school_id = ? AND role = ?",
        [schoolId, role],
      );
      const hasOverride = overrideCount && Number(overrideCount[0]?.c || 0) > 0;
      if (hasOverride) {
        const overrides = await query(
          `SELECT p.code, p.module, p.action
             FROM school_role_permissions srp
             JOIN permissions p ON p.id = srp.permission_id
            WHERE srp.school_id = ? AND srp.role = ? AND srp.is_granted = 1`,
          [schoolId, role],
        );
        for (const p of overrides) byCode.set(p.code, p);
        continue;
      }
      const defaults = await query(
        `SELECT p.code, p.module, p.action
           FROM role_permissions rp
           JOIN permissions p ON p.id = rp.permission_id
          WHERE rp.role = ? AND rp.school_id IS NULL`,
        [role],
      );
      for (const p of defaults) byCode.set(p.code, p);
    }
    return Array.from(byCode.values());
  } catch {
    return [];
  }
};

// Custom roles for a school
const listCustomRoles = async (schoolId) => {
  try {
    return await query(
      "SELECT id, code, label, description FROM custom_roles WHERE school_id = ? ORDER BY label",
      [schoolId],
    );
  } catch {
    return [];
  }
};

const createCustomRole = async (schoolId, { code, label, description }) => {
  const id = uuidv4();
  await query(
    "INSERT INTO custom_roles (id, school_id, code, label, description) VALUES (?, ?, ?, ?, ?)",
    [id, schoolId, code, label, description || null],
  );
  return { id, code, label, description };
};

const deleteCustomRole = async (schoolId, id) => {
  await query("DELETE FROM custom_roles WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
  return { deleted: true };
};

module.exports = {
  listPermissions,
  getRolePermissions,
  setRolePermissions,
  getUserPermissions,
  listCustomRoles,
  createCustomRole,
  deleteCustomRole,
};
