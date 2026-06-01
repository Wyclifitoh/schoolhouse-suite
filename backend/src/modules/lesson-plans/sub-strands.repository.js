const { query, queryOne, execute } = require("../../config/database");
const crypto = require("crypto");

const list = async (schoolId, { strand_id, subject_id, grade_id } = {}) => {
  const where = ["ss.school_id = ?"];
  const params = [schoolId];
  if (strand_id) { where.push("ss.strand_id = ?"); params.push(strand_id); }
  if (subject_id) { where.push("s.subject_id = ?"); params.push(subject_id); }
  if (grade_id) { where.push("s.grade_id = ?"); params.push(grade_id); }
  return query(
    `SELECT ss.*, s.name AS strand_name, s.subject_id, s.grade_id
       FROM cbc_sub_strands ss
       JOIN cbc_strands s ON s.id = ss.strand_id
      WHERE ${where.join(" AND ")}
      ORDER BY ss.sort_order, ss.name`,
    params,
  );
};

const findById = (id) =>
  queryOne(`SELECT * FROM cbc_sub_strands WHERE id = ?`, [id]);

const create = async (data) => {
  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO cbc_sub_strands
       (id, school_id, strand_id, name, description, sort_order, expected_lessons, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      id, data.school_id, data.strand_id, data.name,
      data.description || null,
      data.sort_order || 0,
      data.expected_lessons || 1,
    ],
  );
  return findById(id);
};

const update = async (id, data) => {
  const fields = [];
  const params = [];
  for (const k of ["name", "description", "sort_order", "expected_lessons", "is_active"]) {
    if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(data[k]); }
  }
  if (!fields.length) return findById(id);
  params.push(id);
  await execute(`UPDATE cbc_sub_strands SET ${fields.join(", ")} WHERE id = ?`, params);
  return findById(id);
};

const remove = (id) => execute(`DELETE FROM cbc_sub_strands WHERE id = ?`, [id]);

module.exports = { list, findById, create, update, remove };
