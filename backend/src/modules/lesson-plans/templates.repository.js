const { query, queryOne, execute } = require("../../config/database");
const crypto = require("crypto");

const list = async (schoolId, { subject_id, grade_id } = {}) => {
  const where = ["school_id = ?"];
  const params = [schoolId];
  if (subject_id) { where.push("(subject_id = ? OR subject_id IS NULL)"); params.push(subject_id); }
  if (grade_id) { where.push("(grade_id = ? OR grade_id IS NULL)"); params.push(grade_id); }
  return query(
    `SELECT * FROM lesson_plan_templates WHERE ${where.join(" AND ")}
      ORDER BY is_global DESC, created_at DESC`,
    params,
  );
};

const findById = (id) =>
  queryOne(`SELECT * FROM lesson_plan_templates WHERE id = ?`, [id]);

const create = async (d) => {
  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO lesson_plan_templates
       (id, school_id, subject_id, grade_id, title, description, content, is_global, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, d.school_id, d.subject_id || null, d.grade_id || null,
     d.title, d.description || null, JSON.stringify(d.content || {}),
     d.is_global ? 1 : 0, d.created_by || null],
  );
  return findById(id);
};

const update = async (id, d) => {
  const fields = [];
  const params = [];
  for (const k of ["subject_id", "grade_id", "title", "description", "is_global"]) {
    if (d[k] !== undefined) { fields.push(`${k} = ?`); params.push(k === "is_global" ? (d[k] ? 1 : 0) : d[k]); }
  }
  if (d.content !== undefined) { fields.push("content = ?"); params.push(JSON.stringify(d.content)); }
  if (!fields.length) return findById(id);
  params.push(id);
  await execute(`UPDATE lesson_plan_templates SET ${fields.join(", ")} WHERE id = ?`, params);
  return findById(id);
};

const remove = (id) => execute(`DELETE FROM lesson_plan_templates WHERE id = ?`, [id]);

module.exports = { list, findById, create, update, remove };
