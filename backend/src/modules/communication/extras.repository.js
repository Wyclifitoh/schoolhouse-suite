const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const notifyRepo = require("../notifications/notifications.repository");

const fanOutNotice = async (schoolId, notice) => {
  if (!notice || notice.status !== "published") return;
  try {
    await notifyRepo.broadcast({
      schoolId,
      audience: notice.audience || "all",
      type: "notice",
      title: notice.title,
      body: notice.message,
      link: "/communication",
      priority: notice.priority || "normal",
      sourceType: "notice",
      sourceId: notice.id,
      expiresAt: notice.expires_at || null,
    });
  } catch (e) {
    // never block the notice CRUD on notification failure
    console.error("notice fan-out failed:", e.message);
  }
};

/* ---------- SMS TEMPLATES ---------- */
const listTemplates = async (schoolId, { search, category } = {}) => {
  let sql = "SELECT * FROM sms_templates WHERE school_id = ?";
  const p = [schoolId];
  if (category) {
    sql += " AND category = ?";
    p.push(category);
  }
  if (search) {
    sql += " AND (name LIKE ? OR body LIKE ?)";
    p.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY is_active DESC, name ASC";
  return query(sql, p);
};

const getTemplate = (schoolId, id) =>
  queryOne("SELECT * FROM sms_templates WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);

const createTemplate = async (schoolId, data, userId) => {
  const id = uuidv4();
  await query(
    `INSERT INTO sms_templates (id, school_id, name, body, description, category, is_active, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      schoolId,
      data.name,
      data.body,
      data.description || null,
      data.category || null,
      data.is_active !== false,
      userId || null,
    ],
  );
  return getTemplate(schoolId, id);
};

const updateTemplate = async (schoolId, id, data, userId) => {
  const fields = [];
  const params = [];
  for (const k of ["name", "body", "description", "category", "is_active"]) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`);
      params.push(data[k]);
    }
  }
  if (!fields.length) return getTemplate(schoolId, id);
  fields.push("updated_by = ?");
  params.push(userId || null);
  params.push(id, schoolId);
  await query(
    `UPDATE sms_templates SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  );
  return getTemplate(schoolId, id);
};

const deleteTemplate = (schoolId, id) =>
  query("DELETE FROM sms_templates WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);

/* ---------- NOTICES ---------- */
const listNotices = async (
  schoolId,
  { status, audience, search, limit = 50, offset = 0 } = {},
) => {
  let sql =
    "SELECT n.*, u.full_name AS created_by_name FROM notices n LEFT JOIN users u ON u.id = n.created_by WHERE n.school_id = ?";
  const p = [schoolId];
  if (status) {
    sql += " AND n.status = ?";
    p.push(status);
  }
  if (audience) {
    sql += " AND (n.audience = ? OR n.audience = 'all')";
    p.push(audience);
  }
  if (search) {
    sql += " AND (n.title LIKE ? OR n.message LIKE ?)";
    p.push(`%${search}%`, `%${search}%`);
  }
  const countRows = await query(
    sql.replace(
      "SELECT n.*, u.full_name AS created_by_name",
      "SELECT COUNT(*) AS count",
    ),
    p,
  );
  sql += " ORDER BY n.pinned DESC, n.created_at DESC LIMIT ? OFFSET ?";
  p.push(limit, offset);
  const rows = await query(sql, p);
  return { rows, total: countRows[0]?.count || 0 };
};

const getNotice = (schoolId, id) =>
  queryOne("SELECT * FROM notices WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);

const createNotice = async (schoolId, data, userId) => {
  const id = uuidv4();
  await query(
    `INSERT INTO notices (id, school_id, title, message, audience, priority, status, pinned, publish_at, expires_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      schoolId,
      data.title,
      data.message,
      data.audience || "all",
      data.priority || "normal",
      data.status || "draft",
      !!data.pinned,
      data.publish_at || null,
      data.expires_at || null,
      userId || null,
      userId || null,
    ],
  );
  const row = await getNotice(schoolId, id);
  await fanOutNotice(schoolId, row);
  return row;
};

const updateNotice = async (schoolId, id, data, userId) => {
  const before = await getNotice(schoolId, id);
  const fields = [];
  const params = [];
  for (const k of [
    "title",
    "message",
    "audience",
    "priority",
    "status",
    "pinned",
    "publish_at",
    "expires_at",
  ]) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`);
      params.push(data[k]);
    }
  }
  if (!fields.length) return before;
  fields.push("updated_by = ?");
  params.push(userId || null);
  params.push(id, schoolId);
  await query(
    `UPDATE notices SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  );
  const after = await getNotice(schoolId, id);
  if (before?.status !== "published" && after?.status === "published") {
    await fanOutNotice(schoolId, after);
  }
  return after;
};

const deleteNotice = (schoolId, id) =>
  query("DELETE FROM notices WHERE id = ? AND school_id = ?", [id, schoolId]);

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listNotices,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
};
