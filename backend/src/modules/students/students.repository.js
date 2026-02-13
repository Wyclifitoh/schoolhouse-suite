const { query } = require('../../config/database');

const findAll = async (schoolId, { limit, offset }) => {
  const result = await query(
    `SELECT * FROM students WHERE school_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [schoolId, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*) FROM students WHERE school_id = $1`,
    [schoolId]
  );
  return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findById = async (id, schoolId) => {
  const result = await query(
    `SELECT * FROM students WHERE id = $1 AND school_id = $2`,
    [id, schoolId]
  );
  return result.rows[0] || null;
};

const create = async (data) => {
  const result = await query(
    `INSERT INTO students (school_id, admission_number, full_name, grade_id, parent_id, current_term_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.school_id, data.admission_number, data.full_name, data.grade_id, data.parent_id, data.current_term_id, data.status || 'active']
  );
  return result.rows[0];
};

const update = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }

  values.push(id, schoolId);
  const result = await query(
    `UPDATE students SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND school_id = $${idx + 1} RETURNING *`,
    values
  );
  return result.rows[0];
};

module.exports = { findAll, findById, create, update };
