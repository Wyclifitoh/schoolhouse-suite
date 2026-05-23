const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const createSmsLog = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO sms_messages
     (id, school_id, recipient_type, recipient_id, to_phone, recipient_name, message, status, provider_response, error_message, sent_by, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.recipient_type,
      data.recipient_id || null,
      data.to_phone,
      data.recipient_name || null,
      data.message,
      data.status,
      data.provider_response ? JSON.stringify(data.provider_response) : null,
      data.error_message || null,
      data.sent_by || null,
      data.status === "sent" ? new Date() : null,
    ],
  );
  return queryOne("SELECT * FROM sms_messages WHERE id = ?", [id]);
};

const createEmailLog = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO email_messages
     (id, school_id, recipient_type, recipient_id, to_email, recipient_name, subject, body, status, provider_response, error_message, sent_by, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.recipient_type,
      data.recipient_id || null,
      data.to_email,
      data.recipient_name || null,
      data.subject,
      data.body,
      data.status,
      data.provider_response ? JSON.stringify(data.provider_response) : null,
      data.error_message || null,
      data.sent_by || null,
      data.status === "sent" ? new Date() : null,
    ],
  );
  return queryOne("SELECT * FROM email_messages WHERE id = ?", [id]);
};

const listSms = async (schoolId, { limit, offset, status, search }) => {
  let sql = `SELECT m.*, u.full_name AS sent_by_name
             FROM sms_messages m
             LEFT JOIN users u ON u.id = m.sent_by
             WHERE m.school_id = ?`;
  const params = [schoolId];
  if (status) {
    sql += " AND m.status = ?";
    params.push(status);
  }
  if (search) {
    sql += " AND (m.to_phone LIKE ? OR m.recipient_name LIKE ? OR m.message LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  const countSql = sql.replace("SELECT m.*, u.full_name AS sent_by_name", "SELECT COUNT(*) AS count");
  sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const [rows, countRows] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, -2)),
  ]);
  return { rows, total: countRows[0]?.count || 0 };
};

const listEmail = async (schoolId, { limit, offset, status, search }) => {
  let sql = `SELECT m.*, u.full_name AS sent_by_name
             FROM email_messages m
             LEFT JOIN users u ON u.id = m.sent_by
             WHERE m.school_id = ?`;
  const params = [schoolId];
  if (status) {
    sql += " AND m.status = ?";
    params.push(status);
  }
  if (search) {
    sql += " AND (m.to_email LIKE ? OR m.recipient_name LIKE ? OR m.subject LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  const countSql = sql.replace("SELECT m.*, u.full_name AS sent_by_name", "SELECT COUNT(*) AS count");
  sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const [rows, countRows] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, -2)),
  ]);
  return { rows, total: countRows[0]?.count || 0 };
};

/* Recipient resolvers — pull contacts based on audience selection */
const getParentContacts = async (schoolId, relationship) => {
  // relationship: 'father' | 'mother' | 'guardian' | null (=> all)
  let sql = `SELECT DISTINCT p.id, p.first_name, p.last_name, p.phone, p.email, sp.relationship
             FROM parents p
             JOIN student_parents sp ON sp.parent_id = p.id
             WHERE p.school_id = ?`;
  const params = [schoolId];
  if (relationship && relationship !== "all") {
    sql += " AND sp.relationship = ?";
    params.push(relationship);
  }
  return query(sql, params);
};

const getTeacherContacts = async (schoolId) => {
  return query(
    `SELECT id, first_name, last_name, phone, email
     FROM staff WHERE school_id = ? AND role = 'teacher' AND status = 'active'`,
    [schoolId],
  );
};

const getStaffContacts = async (schoolId) => {
  return query(
    `SELECT id, first_name, last_name, phone, email, role
     FROM staff WHERE school_id = ? AND status = 'active'`,
    [schoolId],
  );
};

module.exports = {
  createSmsLog,
  createEmailLog,
  listSms,
  listEmail,
  getParentContacts,
  getTeacherContacts,
  getStaffContacts,
};
