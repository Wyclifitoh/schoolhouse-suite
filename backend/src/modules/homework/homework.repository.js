const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const findAll = async (schoolId, params = {}) => {
  let sql = "SELECT * FROM homework WHERE school_id = ?";
  const args = [schoolId];
  if (params.class_name) {
    sql += " AND class_name = ?";
    args.push(params.class_name);
  }
  if (params.status) {
    sql += " AND status = ?";
    args.push(params.status);
  }
  sql += " ORDER BY created_at DESC LIMIT 500";
  return query(sql, args);
};

const findById = (id, schoolId) =>
  queryOne("SELECT * FROM homework WHERE id = ? AND school_id = ?", [id, schoolId]);

const create = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO homework (id, school_id, title, description, subject, class_name, section, assigned_by, assigned_date, due_date, max_marks, attachment_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_DATE), ?, ?, ?, 'active')`,
    [
      id,
      data.school_id,
      data.title,
      data.description || null,
      data.subject,
      data.class_name,
      data.section || null,
      data.assigned_by || null,
      data.assigned_date || null,
      data.due_date,
      data.max_marks || 100,
      data.attachment_url || null,
    ],
  );
  return findById(id, data.school_id);
};

const update = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (!fields.length) return findById(id, schoolId);
  values.push(id, schoolId);
  await query(
    `UPDATE homework SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ? AND school_id = ?`,
    values,
  );
  return findById(id, schoolId);
};

const remove = async (id, schoolId) => {
  await query("DELETE FROM homework_submissions WHERE homework_id = ? AND school_id = ?", [id, schoolId]);
  await query("DELETE FROM homework WHERE id = ? AND school_id = ?", [id, schoolId]);
  return { id };
};

const findSubmissions = (homeworkId, schoolId) =>
  query(
    `SELECT hs.*, s.full_name AS student_full_name, s.first_name, s.last_name, s.admission_number
     FROM homework_submissions hs
     LEFT JOIN students s ON s.id = hs.student_id
     WHERE hs.homework_id = ? AND hs.school_id = ?
     ORDER BY hs.created_at DESC LIMIT 1000`,
    [homeworkId, schoolId],
  );

const createSubmission = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO homework_submissions (id, homework_id, student_id, school_id, submission_date, content, attachment_url, status)
     VALUES (?, ?, ?, ?, NOW(), ?, ?, COALESCE(?, 'submitted'))`,
    [
      id,
      data.homework_id,
      data.student_id,
      data.school_id,
      data.content || null,
      data.attachment_url || null,
      data.status || null,
    ],
  );
  return queryOne("SELECT * FROM homework_submissions WHERE id = ?", [id]);
};

const updateSubmission = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (data.status === "evaluated") {
    fields.push("evaluated_at = NOW()");
  }
  if (!fields.length)
    return queryOne("SELECT * FROM homework_submissions WHERE id = ? AND school_id = ?", [id, schoolId]);
  values.push(id, schoolId);
  await query(
    `UPDATE homework_submissions SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne("SELECT * FROM homework_submissions WHERE id = ? AND school_id = ?", [id, schoolId]);
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  findSubmissions,
  createSubmission,
  updateSubmission,
};