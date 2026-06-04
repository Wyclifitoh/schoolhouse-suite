const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

exports.list = (schoolId, { from, to, audience } = {}) => {
  const params = [schoolId];
  let where = "school_id=?";
  if (from) { where += " AND ends_at >= ?"; params.push(from); }
  if (to)   { where += " AND starts_at <= ?"; params.push(to); }
  if (audience) { where += " AND audience IN (?, 'all')"; params.push(audience); }
  return query(
    `SELECT * FROM calendar_events WHERE ${where} ORDER BY starts_at ASC`,
    params,
  );
};

exports.upcoming = (schoolId, limit = 5) =>
  query(
    `SELECT * FROM calendar_events
      WHERE school_id=? AND ends_at >= NOW()
      ORDER BY starts_at ASC LIMIT ?`,
    [schoolId, Number(limit)],
  );

exports.get = (id, schoolId) =>
  queryOne("SELECT * FROM calendar_events WHERE id=? AND school_id=?", [id, schoolId]);

exports.create = async (data) => {
  const id = uuid();
  await execute(
    `INSERT INTO calendar_events
      (id, school_id, title, description, location, starts_at, ends_at, all_day,
       color, category, audience, grade_id, stream_id, reminder_minutes, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, data.school_id, data.title, data.description || null,
      data.location || null, data.starts_at, data.ends_at,
      data.all_day ? 1 : 0, data.color || "#3b82f6",
      data.category || "general", data.audience || "all",
      data.grade_id || null, data.stream_id || null,
      Number(data.reminder_minutes ?? 60),
      data.created_by || null,
    ],
  );
  return queryOne("SELECT * FROM calendar_events WHERE id=?", [id]);
};

exports.update = async (id, schoolId, data) => {
  const fields = []; const values = [];
  for (const k of ["title","description","location","starts_at","ends_at","all_day","color","category","audience","grade_id","stream_id","reminder_minutes"]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(k === "all_day" ? (data[k] ? 1 : 0) : data[k]);
    }
  }
  if (!fields.length) return exports.get(id, schoolId);
  // Reset reminder_sent if time changed
  if (data.starts_at) fields.push("reminder_sent=0");
  values.push(id, schoolId);
  await execute(
    `UPDATE calendar_events SET ${fields.join(",")} WHERE id=? AND school_id=?`,
    values,
  );
  return exports.get(id, schoolId);
};

exports.remove = (id, schoolId) =>
  execute("DELETE FROM calendar_events WHERE id=? AND school_id=?", [id, schoolId]);

// --------- REMINDER DISPATCHER ---------
// Returns events whose reminder fires now (start - reminder_minutes <= NOW < start)
exports.dueReminders = () =>
  query(
    `SELECT * FROM calendar_events
      WHERE reminder_sent=0
        AND starts_at > NOW()
        AND DATE_SUB(starts_at, INTERVAL reminder_minutes MINUTE) <= NOW()`,
    [],
  );

exports.markReminderSent = (id) =>
  execute("UPDATE calendar_events SET reminder_sent=1 WHERE id=?", [id]);
