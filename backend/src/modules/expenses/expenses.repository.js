const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

// ---------- Categories ----------
const listCategories = async (schoolId) => {
  return query(
    "SELECT * FROM expense_categories WHERE school_id = ? ORDER BY name ASC",
    [schoolId],
  );
};

const createCategory = async (data) => {
  const id = uuidv4();
  await query(
    "INSERT INTO expense_categories (id, school_id, name, description, budget) VALUES (?, ?, ?, ?, ?)",
    [
      id,
      data.school_id,
      data.name,
      data.description || null,
      Number(data.budget) || 0,
    ],
  );
  return queryOne("SELECT * FROM expense_categories WHERE id = ?", [id]);
};

const updateCategory = async (id, schoolId, data) => {
  const allowed = ["name", "description", "budget", "is_active"];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) {
    return queryOne(
      "SELECT * FROM expense_categories WHERE id = ? AND school_id = ?",
      [id, schoolId],
    );
  }
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => v);
  values.push(id, schoolId);
  await query(
    `UPDATE expense_categories SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne("SELECT * FROM expense_categories WHERE id = ?", [id]);
};

const deleteCategory = async (id, schoolId) => {
  await query(
    "DELETE FROM expense_categories WHERE id = ? AND school_id = ?",
    [id, schoolId],
  );
  return { deleted: true };
};

// ---------- Expenses ----------
const listExpenses = async (schoolId, filters = {}) => {
  let sql = `SELECT e.*, ec.name AS category_name
             FROM expenses e
             LEFT JOIN expense_categories ec ON ec.id = e.category_id
             WHERE e.school_id = ?`;
  const params = [schoolId];
  if (filters.status) {
    sql += " AND e.status = ?";
    params.push(filters.status);
  }
  if (filters.category_id) {
    sql += " AND e.category_id = ?";
    params.push(filters.category_id);
  }
  if (filters.start_date) {
    sql += " AND e.expense_date >= ?";
    params.push(filters.start_date);
  }
  if (filters.end_date) {
    sql += " AND e.expense_date <= ?";
    params.push(filters.end_date);
  }
  if (filters.search) {
    sql += " AND (e.title LIKE ? OR e.reference LIKE ?)";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  sql += " ORDER BY e.expense_date DESC, e.created_at DESC LIMIT 500";
  return query(sql, params);
};

const getExpense = async (id, schoolId) => {
  return queryOne(
    `SELECT e.*, ec.name AS category_name FROM expenses e
     LEFT JOIN expense_categories ec ON ec.id = e.category_id
     WHERE e.id = ? AND e.school_id = ?`,
    [id, schoolId],
  );
};

const createExpense = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO expenses
       (id, school_id, title, description, amount, category_id, expense_date,
        payment_method, reference, status, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.title,
      data.description || null,
      Number(data.amount) || 0,
      data.category_id || null,
      data.expense_date || new Date().toISOString().slice(0, 10),
      data.payment_method || "cash",
      data.reference || null,
      data.status || "pending",
      data.recorded_by || null,
    ],
  );
  return getExpense(id, data.school_id);
};

const updateExpense = async (id, schoolId, data) => {
  const allowed = [
    "title",
    "description",
    "amount",
    "category_id",
    "expense_date",
    "payment_method",
    "reference",
    "status",
  ];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return getExpense(id, schoolId);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  values.push(id, schoolId);
  await query(
    `UPDATE expenses SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return getExpense(id, schoolId);
};

const updateStatus = async (id, schoolId, status, approverId) => {
  await query(
    `UPDATE expenses SET status = ?, approved_by = ?
     WHERE id = ? AND school_id = ?`,
    [status, approverId || null, id, schoolId],
  );
  return getExpense(id, schoolId);
};

const deleteExpense = async (id, schoolId) => {
  await query("DELETE FROM expenses WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
  return { deleted: true };
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  updateStatus,
  deleteExpense,
};
