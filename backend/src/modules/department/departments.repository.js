const { query, queryOne } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const create = async (data) => {
  const id = uuidv4();
  const { school_id, name, description } = data;
  
  await query(
    'INSERT INTO departments (id, school_id, name, description) VALUES (?, ?, ?, ?)',
    [id, school_id, name, description]
  );
  
  return { id, ...data };
};

const findAll = async (schoolId, { limit, offset }) => {
  const rows = await query(
    'SELECT * FROM departments WHERE school_id = ? ORDER BY name ASC LIMIT ? OFFSET ?',
    [schoolId, limit, offset]
  );
  
  const countResult = await query(
    'SELECT COUNT(*) as count FROM departments WHERE school_id = ?',
    [schoolId]
  );
  
  return { 
    rows, 
    total: countResult[0]?.count || 0 
  };
};

const findById = async (id, schoolId) => {
  return queryOne(
    'SELECT * FROM departments WHERE id = ? AND school_id = ?',
    [id, schoolId]
  );
};

module.exports = {
  create,
  findAll,
  findById
};