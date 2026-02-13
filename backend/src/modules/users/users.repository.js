const { query } = require('../../config/database');

const findAll = async (schoolId, { limit, offset }) => {
  const result = await query(
    `SELECT u.id, u.email, u.full_name, u.created_at, ur.role FROM users u JOIN user_roles ur ON ur.user_id = u.id WHERE ur.school_id = $1 ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`,
    [schoolId, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*) FROM user_roles WHERE school_id = $1`,
    [schoolId]
  );
  return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findById = async (id, schoolId) => {
  const result = await query(
    `SELECT u.id, u.email, u.full_name, u.created_at, ur.role FROM users u JOIN user_roles ur ON ur.user_id = u.id WHERE u.id = $1 AND ur.school_id = $2`,
    [id, schoolId]
  );
  return result.rows[0] || null;
};

module.exports = { findAll, findById };
