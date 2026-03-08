const { query, queryOne, queryCount } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const findByEmail = async (email) => {
  return queryOne('SELECT * FROM users WHERE email = ?', [email]);
};

const findById = async (id) => {
  return queryOne('SELECT id, email, full_name, phone, avatar_url, is_active, created_at FROM users WHERE id = ?', [id]);
};

const create = async ({ email, passwordHash, fullName }) => {
  const id = uuidv4();
  await query(
    'INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
    [id, email, passwordHash, fullName]
  );
  // Also create profile
  await query(
    'INSERT INTO profiles (id, email, first_name, last_name) VALUES (?, ?, ?, ?)',
    [id, email, fullName.split(' ')[0] || '', fullName.split(' ').slice(1).join(' ') || '']
  );
  return queryOne('SELECT id, email, full_name, created_at FROM users WHERE id = ?', [id]);
};

const assignRole = async (userId, schoolId, role) => {
  const id = uuidv4();
  await query(
    'INSERT IGNORE INTO user_roles (id, user_id, school_id, role) VALUES (?, ?, ?, ?)',
    [id, userId, schoolId, role]
  );
  return queryOne('SELECT * FROM user_roles WHERE user_id = ? AND school_id = ? AND role = ?', [userId, schoolId, role]);
};

const getUserRoles = async (userId) => {
  return query(
    `SELECT ur.role, ur.school_id, ur.is_active, s.name as school_name 
     FROM user_roles ur 
     LEFT JOIN schools s ON s.id = ur.school_id 
     WHERE ur.user_id = ? AND ur.is_active = TRUE`,
    [userId]
  );
};

const getProfile = async (userId) => {
  return queryOne('SELECT * FROM profiles WHERE id = ?', [userId]);
};

module.exports = { findByEmail, findById, create, assignRole, getUserRoles, getProfile };
