const { v4: uuidv4 } = require("uuid");
const { query } = require("../config/database");

/**
 * Write a generic audit log entry. Never throws — audit must not break the
 * business operation that triggered it.
 */
const writeAudit = async ({
  schoolId = null,
  userId = null,
  action,
  entityType = "system",
  entityId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
} = {}) => {
  try {
    await query(
      `INSERT INTO audit_logs
         (id, school_id, user_id, action, entity_type, entity_id,
          old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        schoolId,
        userId,
        action ? action.substring(0, 50) : "UNKNOWN",
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
      ],
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[audit] write failed:", e.message);
  }
};

/** Convenience wrapper that pulls context out of an express req object. */
const auditFromReq = (req, fields) =>
  writeAudit({
    schoolId: req?.schoolId || null,
    userId: req?.user?.id || null,
    ipAddress:
      req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req?.ip ||
      null,
    userAgent: req?.headers?.["user-agent"] || null,
    ...fields,
  });

module.exports = { writeAudit, auditFromReq };
