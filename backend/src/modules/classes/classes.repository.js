const { query } = require('../../config/database');

const findAll = async (schoolId, { limit, offset }) => {
  const result = await query(
    `SELECT * FROM classes WHERE school_id = $1 ORDER BY name ASC LIMIT $2 OFFSET $3`,
    [schoolId, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*) FROM classes WHERE school_id = $1`,
    [schoolId]
  );
  return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findById = async (id, schoolId) => {
  const result = await query(
    `SELECT * FROM classes WHERE id = $1 AND school_id = $2`,
    [id, schoolId]
  );
  return result.rows[0] || null;
};

const create = async (data) => {
  const result = await query(
    `INSERT INTO classes (school_id, name, grade_level, teacher_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.school_id, data.name, data.grade_level, data.teacher_id]
  );
  return result.rows[0];
};

module.exports = { findAll, findById, create };
