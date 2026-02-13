const { query } = require('../../config/database');

const findAll = async (schoolId, { limit, offset }) => {
  const result = await query(
    `SELECT * FROM parents WHERE school_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [schoolId, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*) FROM parents WHERE school_id = $1`,
    [schoolId]
  );
  return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findById = async (id, schoolId) => {
  const result = await query(
    `SELECT * FROM parents WHERE id = $1 AND school_id = $2`,
    [id, schoolId]
  );
  return result.rows[0] || null;
};

const create = async (data) => {
  const result = await query(
    `INSERT INTO parents (school_id, full_name, phone_number, email, id_number) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.school_id, data.full_name, data.phone_number, data.email, data.id_number]
  );
  return result.rows[0];
};

module.exports = { findAll, findById, create };
