const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

/* ============================ CAMPAIGNS ============================ */
const listCampaigns = async (schoolId, { status, search } = {}) => {
  let sql = `SELECT c.*, u.full_name AS created_by_name, t.name AS template_name
             FROM communication_campaigns c
             LEFT JOIN users u ON u.id = c.created_by
             LEFT JOIN sms_templates t ON t.id = c.template_id
             WHERE c.school_id = ?`;
  const p = [schoolId];
  if (status) { sql += " AND c.status = ?"; p.push(status); }
  if (search) {
    sql += " AND (c.name LIKE ? OR c.description LIKE ?)";
    p.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY c.created_at DESC";
  return query(sql, p);
};

const getCampaign = (schoolId, id) =>
  queryOne(
    `SELECT c.*, u.full_name AS created_by_name
     FROM communication_campaigns c
     LEFT JOIN users u ON u.id = c.created_by
     WHERE c.id = ? AND c.school_id = ?`,
    [id, schoolId],
  );

const createCampaign = async (schoolId, data, userId) => {
  const id = uuidv4();
  await query(
    `INSERT INTO communication_campaigns
     (id, school_id, name, description, channel, template_id, subject, body, audience, status, scheduled_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, schoolId,
      data.name, data.description || null,
      data.channel || "sms",
      data.template_id || null,
      data.subject || null,
      data.body || "",
      JSON.stringify(data.audience || {}),
      data.status || "draft",
      data.scheduled_at || null,
      userId || null,
    ],
  );
  return getCampaign(schoolId, id);
};

const updateCampaign = async (schoolId, id, data) => {
  const fields = [];
  const params = [];
  for (const k of ["name","description","channel","template_id","subject","body","status","scheduled_at","started_at","completed_at"]) {
    if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(data[k]); }
  }
  if (data.audience !== undefined) { fields.push("audience = ?"); params.push(JSON.stringify(data.audience)); }
  if (data.stats !== undefined) { fields.push("stats = ?"); params.push(JSON.stringify(data.stats)); }
  if (!fields.length) return getCampaign(schoolId, id);
  params.push(id, schoolId);
  await query(`UPDATE communication_campaigns SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`, params);
  return getCampaign(schoolId, id);
};

const deleteCampaign = (schoolId, id) =>
  query("DELETE FROM communication_campaigns WHERE id = ? AND school_id = ?", [id, schoolId]);

/* ============================ SCHEDULED ============================ */
const listScheduled = async (schoolId, { status } = {}) => {
  let sql = `SELECT s.*, u.full_name AS created_by_name
             FROM communication_scheduled s
             LEFT JOIN users u ON u.id = s.created_by
             WHERE s.school_id = ?`;
  const p = [schoolId];
  if (status) { sql += " AND s.status = ?"; p.push(status); }
  sql += " ORDER BY s.scheduled_at DESC";
  return query(sql, p);
};

const getScheduled = (schoolId, id) =>
  queryOne("SELECT * FROM communication_scheduled WHERE id = ? AND school_id = ?", [id, schoolId]);

const createScheduled = async (schoolId, data, userId) => {
  const id = uuidv4();
  await query(
    `INSERT INTO communication_scheduled
     (id, school_id, channel, audience, subject, body, scheduled_at, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      id, schoolId,
      data.channel || "sms",
      JSON.stringify(data.audience || {}),
      data.subject || null,
      data.body || "",
      data.scheduled_at,
      userId || null,
    ],
  );
  return getScheduled(schoolId, id);
};

const updateScheduled = async (schoolId, id, data) => {
  const fields = []; const params = [];
  for (const k of ["channel","subject","body","scheduled_at","status","error"]) {
    if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(data[k]); }
  }
  if (data.audience !== undefined) { fields.push("audience = ?"); params.push(JSON.stringify(data.audience)); }
  if (data.stats !== undefined) { fields.push("stats = ?"); params.push(JSON.stringify(data.stats)); }
  if (!fields.length) return getScheduled(schoolId, id);
  params.push(id, schoolId);
  await query(`UPDATE communication_scheduled SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`, params);
  return getScheduled(schoolId, id);
};

const deleteScheduled = (schoolId, id) =>
  query("DELETE FROM communication_scheduled WHERE id = ? AND school_id = ?", [id, schoolId]);

const dueScheduled = async () =>
  query(
    `SELECT * FROM communication_scheduled
     WHERE status = 'pending' AND scheduled_at <= NOW()
     ORDER BY scheduled_at ASC LIMIT 20`,
  );

/* ============================ AUTOMATIONS ============================ */
const AUTOMATION_TRIGGERS = [
  { key: "student_admitted", label: "Student Admitted", description: "When a new student is admitted" },
  { key: "results_published", label: "Results Published", description: "When assessment results are published" },
  { key: "fee_reminder", label: "Fee Reminder", description: "Periodic fee balance reminders" },
  { key: "attendance_alert", label: "Attendance Alert", description: "When a student is marked absent" },
  { key: "homework_assigned", label: "Homework Assigned", description: "When new homework is created" },
  { key: "birthday_greeting", label: "Birthday Greeting", description: "On student/staff birthdays" },
  { key: "payment_received", label: "Payment Received", description: "Confirmation when a payment is recorded" },
  { key: "exam_scheduled", label: "Exam Scheduled", description: "When an exam is scheduled" },
];

const listAutomations = async (schoolId) => {
  const rows = await query(
    "SELECT * FROM communication_automations WHERE school_id = ?",
    [schoolId],
  );
  const byKey = new Map(rows.map((r) => [r.trigger_key, r]));
  return AUTOMATION_TRIGGERS.map((t) => {
    const row = byKey.get(t.key);
    return row
      ? { ...t, ...row, audience: row.audience, config: row.config }
      : { ...t, id: null, school_id: schoolId, trigger_key: t.key, channel: "sms", template_id: null, audience: null, enabled: 0, config: null };
  });
};

const upsertAutomation = async (schoolId, triggerKey, data) => {
  const existing = await queryOne(
    "SELECT id FROM communication_automations WHERE school_id = ? AND trigger_key = ?",
    [schoolId, triggerKey],
  );
  if (existing) {
    const fields = []; const params = [];
    for (const k of ["channel","template_id","enabled"]) {
      if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(k === "enabled" ? (data[k] ? 1 : 0) : data[k]); }
    }
    if (data.audience !== undefined) { fields.push("audience = ?"); params.push(data.audience ? JSON.stringify(data.audience) : null); }
    if (data.config !== undefined) { fields.push("config = ?"); params.push(data.config ? JSON.stringify(data.config) : null); }
    if (fields.length) {
      params.push(existing.id);
      await query(`UPDATE communication_automations SET ${fields.join(", ")} WHERE id = ?`, params);
    }
    return queryOne("SELECT * FROM communication_automations WHERE id = ?", [existing.id]);
  }
  const id = uuidv4();
  await query(
    `INSERT INTO communication_automations
     (id, school_id, trigger_key, channel, template_id, audience, enabled, config)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, schoolId, triggerKey,
      data.channel || "sms",
      data.template_id || null,
      data.audience ? JSON.stringify(data.audience) : null,
      data.enabled ? 1 : 0,
      data.config ? JSON.stringify(data.config) : null,
    ],
  );
  return queryOne("SELECT * FROM communication_automations WHERE id = ?", [id]);
};

/* ============================ SETTINGS ============================ */
const DEFAULT_SETTINGS = {
  sms: { provider: "wikiteq", sender_id: "", retry_attempts: 2 },
  email: { sender_name: "", reply_to: "", provider: "brevo" },
  notices: { default_visibility: "all", default_expiry_days: 30 },
  general: { queue_batch_size: 25, retry_attempts: 2 },
};

const getSettings = async (schoolId) => {
  const row = await queryOne(
    "SELECT * FROM communication_settings WHERE school_id = ?",
    [schoolId],
  );
  if (!row) return { school_id: schoolId, ...DEFAULT_SETTINGS };
  return {
    school_id: schoolId,
    sms: row.sms || DEFAULT_SETTINGS.sms,
    email: row.email || DEFAULT_SETTINGS.email,
    notices: row.notices || DEFAULT_SETTINGS.notices,
    general: row.general || DEFAULT_SETTINGS.general,
    updated_at: row.updated_at,
  };
};

const saveSettings = async (schoolId, data) => {
  const current = await getSettings(schoolId);
  const merged = {
    sms: { ...current.sms, ...(data.sms || {}) },
    email: { ...current.email, ...(data.email || {}) },
    notices: { ...current.notices, ...(data.notices || {}) },
    general: { ...current.general, ...(data.general || {}) },
  };
  await query(
    `INSERT INTO communication_settings (school_id, sms, email, notices, general)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE sms = VALUES(sms), email = VALUES(email), notices = VALUES(notices), general = VALUES(general)`,
    [
      schoolId,
      JSON.stringify(merged.sms),
      JSON.stringify(merged.email),
      JSON.stringify(merged.notices),
      JSON.stringify(merged.general),
    ],
  );
  return getSettings(schoolId);
};

/* ============================ HISTORY (unified) ============================ */
const listHistory = async (schoolId, { channel, status, search, limit = 25, offset = 0 } = {}) => {
  const smsWhere = ["m.school_id = ?"]; const smsParams = [schoolId];
  const emailWhere = ["m.school_id = ?"]; const emailParams = [schoolId];
  if (status) { smsWhere.push("m.status = ?"); smsParams.push(status); emailWhere.push("m.status = ?"); emailParams.push(status); }
  if (search) {
    const s = `%${search}%`;
    smsWhere.push("(m.to_phone LIKE ? OR m.recipient_name LIKE ? OR m.message LIKE ?)");
    smsParams.push(s, s, s);
    emailWhere.push("(m.to_email LIKE ? OR m.recipient_name LIKE ? OR m.subject LIKE ?)");
    emailParams.push(s, s, s);
  }
  const smsRows = channel === "email" ? [] : await query(
    `SELECT m.id, 'sms' AS channel, m.to_phone AS recipient, m.recipient_name, m.recipient_type,
            m.message AS body, NULL AS subject, m.status, m.error_message,
            m.sent_at, m.created_at, u.full_name AS sent_by_name
     FROM sms_messages m LEFT JOIN users u ON u.id = m.sent_by
     WHERE ${smsWhere.join(" AND ")}`,
    smsParams,
  );
  const emailRows = channel === "sms" ? [] : await query(
    `SELECT m.id, 'email' AS channel, m.to_email AS recipient, m.recipient_name, m.recipient_type,
            m.body, m.subject, m.status, m.error_message,
            m.sent_at, m.created_at, u.full_name AS sent_by_name
     FROM email_messages m LEFT JOIN users u ON u.id = m.sent_by
     WHERE ${emailWhere.join(" AND ")}`,
    emailParams,
  );
  const all = [...smsRows, ...emailRows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
  const total = all.length;
  const rows = all.slice(Number(offset) || 0, (Number(offset) || 0) + (Number(limit) || 25));
  return { rows, total };
};

/* ============================ DASHBOARD ============================ */
const dashboardStats = async (schoolId) => {
  const [smsToday] = await query(
    "SELECT COUNT(*) AS c FROM sms_messages WHERE school_id = ? AND DATE(created_at) = CURDATE()",
    [schoolId],
  );
  const [emailToday] = await query(
    "SELECT COUNT(*) AS c FROM email_messages WHERE school_id = ? AND DATE(created_at) = CURDATE()",
    [schoolId],
  );
  const [smsFail] = await query(
    "SELECT COUNT(*) AS c FROM sms_messages WHERE school_id = ? AND status = 'failed' AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)",
    [schoolId],
  );
  const [emailFail] = await query(
    "SELECT COUNT(*) AS c FROM email_messages WHERE school_id = ? AND status = 'failed' AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)",
    [schoolId],
  );
  const [smsSent] = await query(
    "SELECT COUNT(*) AS c FROM sms_messages WHERE school_id = ? AND status = 'sent' AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)",
    [schoolId],
  );
  const [emailSent] = await query(
    "SELECT COUNT(*) AS c FROM email_messages WHERE school_id = ? AND status = 'sent' AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)",
    [schoolId],
  );
  const [scheduled] = await query(
    "SELECT COUNT(*) AS c FROM communication_scheduled WHERE school_id = ? AND status = 'pending'",
    [schoolId],
  );
  const totalRecent = (smsSent?.c || 0) + (emailSent?.c || 0) + (smsFail?.c || 0) + (emailFail?.c || 0);
  const successRate = totalRecent
    ? Math.round(((smsSent.c + emailSent.c) / totalRecent) * 100)
    : 100;
  return {
    sms_today: smsToday?.c || 0,
    email_today: emailToday?.c || 0,
    scheduled: scheduled?.c || 0,
    failed_30d: (smsFail?.c || 0) + (emailFail?.c || 0),
    success_rate: successRate,
    sms_sent_30d: smsSent?.c || 0,
    email_sent_30d: emailSent?.c || 0,
  };
};

module.exports = {
  AUTOMATION_TRIGGERS,
  listCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign,
  listScheduled, getScheduled, createScheduled, updateScheduled, deleteScheduled, dueScheduled,
  listAutomations, upsertAutomation,
  getSettings, saveSettings,
  listHistory, dashboardStats,
};