const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

/* role -> audience buckets this user belongs to (besides 'all') */
const audiencesForRoles = (roles = []) => {
  const set = new Set(["all"]);
  for (const r of roles) {
    if (r === "parent") set.add("parents");
    else if (r === "student") set.add("students");
    else if (r === "teacher") {
      set.add("teachers");
      set.add("staff");
    } else {
      // any admin/finance/front_office/store/etc.
      set.add("staff");
    }
  }
  return [...set];
};

const create = async ({
  schoolId,
  userId = null,
  audience = "all",
  type = "system",
  title,
  body = null,
  link = null,
  priority = "normal",
  meta = null,
  sourceType = null,
  sourceId = null,
  expiresAt = null,
}) => {
  const id = uuidv4();
  await query(
    `INSERT INTO notifications
      (id, school_id, user_id, audience, type, title, body, link, priority, meta, source_type, source_id, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, schoolId, userId, audience, type, title, body, link, priority,
      meta ? JSON.stringify(meta) : null,
      sourceType, sourceId, expiresAt,
    ],
  );
  return queryOne("SELECT * FROM notifications WHERE id = ?", [id]);
};

const list = async (schoolId, userId, roles, { limit = 20, offset = 0, unreadOnly = false } = {}) => {
  const auds = audiencesForRoles(roles);
  const placeholders = auds.map(() => "?").join(",");
  const base = `
    FROM notifications n
    LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_id = ?
    WHERE n.school_id = ?
      AND (n.expires_at IS NULL OR n.expires_at > NOW())
      AND (n.user_id = ? OR (n.user_id IS NULL AND n.audience IN (${placeholders})))
      ${unreadOnly ? "AND r.read_at IS NULL" : ""}
  `;
  const params = [userId, schoolId, userId, ...auds];

  const rows = await query(
    `SELECT n.*, r.read_at ${base} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)],
  );
  const countRows = await query(`SELECT COUNT(*) AS count ${base}`, params);
  return { rows, total: countRows[0]?.count || 0 };
};

const unreadCount = async (schoolId, userId, roles) => {
  const { total } = await list(schoolId, userId, roles, { limit: 0, offset: 0, unreadOnly: true });
  return total;
};

const markRead = async (userId, notificationId) => {
  await query(
    `INSERT IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)`,
    [notificationId, userId],
  );
  return { id: notificationId, read: true };
};

const markAllRead = async (schoolId, userId, roles) => {
  const auds = audiencesForRoles(roles);
  const placeholders = auds.map(() => "?").join(",");
  await query(
    `INSERT IGNORE INTO notification_reads (notification_id, user_id)
     SELECT n.id, ?
     FROM notifications n
     LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_id = ?
     WHERE n.school_id = ?
       AND (n.expires_at IS NULL OR n.expires_at > NOW())
       AND (n.user_id = ? OR (n.user_id IS NULL AND n.audience IN (${placeholders})))
       AND r.read_at IS NULL`,
    [userId, userId, schoolId, userId, ...auds],
  );
  return { ok: true };
};

const remove = (id, schoolId) =>
  query("DELETE FROM notifications WHERE id = ? AND school_id = ?", [id, schoolId]);

/* convenience for in-process emitters */
const broadcast = (args) => create({ ...args, userId: null });
const toUser = (userId, args) => create({ ...args, userId });

module.exports = { create, list, unreadCount, markRead, markAllRead, remove, broadcast, toUser };
