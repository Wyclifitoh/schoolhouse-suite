const { query } = require('../../config/database');

const findByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await query('SELECT id, email, full_name, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const create = async ({ email, passwordHash, fullName }) => {
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at`,
    [email, passwordHash, fullName]
  );
  return result.rows[0];
};

const assignRole = async (userId, schoolId, role) => {
  const result = await query(
    `INSERT INTO user_roles (user_id, school_id, role) VALUES ($1, $2, $3) ON CONFLICT (user_id, school_id, role) DO NOTHING RETURNING *`,
    [userId, schoolId, role]
  );
  return result.rows[0];
};

const getUserRoles = async (userId) => {
  const result = await query(
    `SELECT ur.role, ur.school_id, s.name as school_name FROM user_roles ur JOIN schools s ON s.id = ur.school_id WHERE ur.user_id = $1`,
    [userId]
  );
  return result.rows;
};

module.exports = { findByEmail, findById, create, assignRole, getUserRoles };
