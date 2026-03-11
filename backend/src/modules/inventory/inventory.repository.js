const { query, queryOne } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

// Items
const findAllItems = async (schoolId, { limit, offset, search, categoryId }) => {
  let sql = 'SELECT i.*, c.name as category_name FROM inventory_items i LEFT JOIN inventory_categories c ON c.id = i.category_id WHERE i.school_id = ?';
  const params = [schoolId];
  if (search) { sql += ' AND (i.name LIKE ? OR i.sku LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
  if (categoryId) { sql += ' AND i.category_id = ?'; params.push(categoryId); }
  sql += ' ORDER BY i.name ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const countSql = sql.replace(/SELECT .+? FROM/, 'SELECT COUNT(*) as count FROM').replace(/ORDER BY .+$/, '');
  const [rows, countRows] = await Promise.all([query(sql, params), query(countSql, params.slice(0, -2))]);
  return { rows, total: countRows[0]?.count || 0 };
};

const findItemById = async (id, schoolId) => {
  return queryOne('SELECT * FROM inventory_items WHERE id = ? AND school_id = ?', [id, schoolId]);
};

const createItem = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO inventory_items (id, school_id, name, sku, description, category_id, cost_price, selling_price, quantity_in_stock, reorder_level, unit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.school_id, data.name, data.sku, data.description || null, data.category_id || null,
     data.cost_price || 0, data.selling_price || 0, data.quantity_in_stock || 0, data.reorder_level || 10, data.unit || null]
  );
  return queryOne('SELECT * FROM inventory_items WHERE id = ?', [id]);
};

const updateItemQuantity = async (id, schoolId, quantityChange) => {
  await query('UPDATE inventory_items SET quantity_in_stock = quantity_in_stock + ? WHERE id = ? AND school_id = ?', [quantityChange, id, schoolId]);
  return queryOne('SELECT * FROM inventory_items WHERE id = ?', [id]);
};

// Categories
const findAllCategories = async (schoolId) => {
  return query('SELECT * FROM inventory_categories WHERE school_id = ? ORDER BY name ASC', [schoolId]);
};

const createCategory = async (data) => {
  const id = uuidv4();
  await query('INSERT INTO inventory_categories (id, school_id, name, description) VALUES (?, ?, ?, ?)',
    [id, data.school_id, data.name, data.description || null]);
  return queryOne('SELECT * FROM inventory_categories WHERE id = ?', [id]);
};

// Transactions (sales, purchases)
const findTransactions = async (schoolId, { limit, offset, type }) => {
  let sql = 'SELECT t.*, i.name as item_name, i.sku FROM inventory_transactions t JOIN inventory_items i ON i.id = t.item_id WHERE t.school_id = ?';
  const params = [schoolId];
  if (type) { sql += ' AND t.type = ?'; params.push(type); }
  sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return query(sql, params);
};

const createTransaction = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO inventory_transactions (id, school_id, item_id, type, quantity, unit_price, total_amount, reference_type, reference_id, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.school_id, data.item_id, data.type, data.quantity, data.unit_price || null,
     data.total_amount || null, data.reference_type || null, data.reference_id || null,
     data.notes || null, data.recorded_by || null]
  );
  // Update stock
  const qtyChange = data.type === 'sale' ? -data.quantity : data.quantity;
  await query('UPDATE inventory_items SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?', [qtyChange, data.item_id]);
  return queryOne('SELECT * FROM inventory_transactions WHERE id = ?', [id]);
};

module.exports = {
  findAllItems, findItemById, createItem, updateItemQuantity,
  findAllCategories, createCategory,
  findTransactions, createTransaction
};
