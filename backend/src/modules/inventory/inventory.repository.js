const { query } = require('../../config/database');

const findAll = async (schoolId, { limit, offset }) => {
  const result = await query(
    `SELECT * FROM inventory_items WHERE school_id = $1 ORDER BY name ASC LIMIT $2 OFFSET $3`,
    [schoolId, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*) FROM inventory_items WHERE school_id = $1`,
    [schoolId]
  );
  return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findById = async (id, schoolId) => {
  const result = await query(
    `SELECT * FROM inventory_items WHERE id = $1 AND school_id = $2`,
    [id, schoolId]
  );
  return result.rows[0] || null;
};

const create = async (data) => {
  const result = await query(
    `INSERT INTO inventory_items (school_id, name, category, quantity, unit_price, reorder_level) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.school_id, data.name, data.category, data.quantity || 0, data.unit_price, data.reorder_level || 0]
  );
  return result.rows[0];
};

const updateQuantity = async (id, schoolId, quantityChange) => {
  const result = await query(
    `UPDATE inventory_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 AND school_id = $3 RETURNING *`,
    [quantityChange, id, schoolId]
  );
  return result.rows[0];
};

module.exports = { findAll, findById, create, updateQuantity };
