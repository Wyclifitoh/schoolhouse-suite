const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

// ── Categories ──
const listCategories = (schoolId) =>
  query(
    `SELECT * FROM income_categories WHERE school_id = ? ORDER BY name ASC`,
    [schoolId],
  );

const createCategory = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO income_categories (id, school_id, name, description) VALUES (?, ?, ?, ?)`,
    [id, data.school_id, data.name, data.description || null],
  );
  return queryOne(`SELECT * FROM income_categories WHERE id = ?`, [id]);
};

const updateCategory = async (id, schoolId, data) => {
  const allowed = ["name", "description", "is_active"];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (!entries.length)
    return queryOne(`SELECT * FROM income_categories WHERE id = ?`, [id]);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => v);
  values.push(id, schoolId);
  await query(
    `UPDATE income_categories SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne(`SELECT * FROM income_categories WHERE id = ?`, [id]);
};

const deleteCategory = async (id, schoolId) => {
  await query(
    `DELETE FROM income_categories WHERE id = ? AND school_id = ? AND is_system = 0`,
    [id, schoolId],
  );
  return { deleted: true };
};

// ── Entries ──
const listEntries = (schoolId, filters = {}) => {
  let sql = `SELECT e.*, c.name AS category_name
             FROM income_entries e
             LEFT JOIN income_categories c ON c.id = e.category_id
             WHERE e.school_id = ?`;
  const params = [schoolId];
  if (filters.category_id) { sql += " AND e.category_id = ?"; params.push(filters.category_id); }
  if (filters.start_date)  { sql += " AND e.income_date >= ?"; params.push(filters.start_date); }
  if (filters.end_date)    { sql += " AND e.income_date <= ?"; params.push(filters.end_date); }
  if (filters.search)      { sql += " AND (e.title LIKE ? OR e.reference LIKE ?)"; params.push(`%${filters.search}%`, `%${filters.search}%`); }
  sql += " ORDER BY e.income_date DESC, e.created_at DESC LIMIT 500";
  return query(sql, params);
};

const createEntry = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO income_entries
       (id, school_id, category_id, title, amount, source, payer_name,
        payment_method, reference, income_date, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.school_id, data.category_id || null, data.title,
      Number(data.amount) || 0, data.source || null, data.payer_name || null,
      data.payment_method || "cash", data.reference || null,
      data.income_date || new Date().toISOString().slice(0, 10),
      data.notes || null, data.recorded_by || null,
    ],
  );
  return queryOne(
    `SELECT e.*, c.name AS category_name FROM income_entries e
     LEFT JOIN income_categories c ON c.id = e.category_id WHERE e.id = ?`,
    [id],
  );
};

const updateEntry = async (id, schoolId, data) => {
  const allowed = ["category_id","title","amount","source","payer_name","payment_method","reference","income_date","notes"];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (!entries.length) return queryOne(`SELECT * FROM income_entries WHERE id = ?`, [id]);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  values.push(id, schoolId);
  await query(
    `UPDATE income_entries SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne(
    `SELECT e.*, c.name AS category_name FROM income_entries e
     LEFT JOIN income_categories c ON c.id = e.category_id WHERE e.id = ?`,
    [id],
  );
};

const deleteEntry = async (id, schoolId) => {
  await query(
    `DELETE FROM income_entries WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  );
  return { deleted: true };
};

// ── Reports ──
// Returns combined finance picture: manual income entries + fees collected (from payments).
const report = async (schoolId, filters = {}) => {
  const start = filters.start_date || null;
  const end   = filters.end_date || null;

  const byCat = await query(
    `SELECT COALESCE(c.name, 'Uncategorised') AS category, SUM(e.amount) AS total
     FROM income_entries e
     LEFT JOIN income_categories c ON c.id = e.category_id
     WHERE e.school_id = ?
       ${start ? " AND e.income_date >= ?" : ""}
       ${end ? " AND e.income_date <= ?" : ""}
     GROUP BY c.name`,
    [schoolId, ...(start ? [start] : []), ...(end ? [end] : [])],
  );

  // Fees collected from payments table (auto-link)
  const fees = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM payments
     WHERE school_id = ? AND status = 'completed'
       ${start ? " AND payment_date >= ?" : ""}
       ${end ? " AND payment_date <= ?" : ""}`,
    [schoolId, ...(start ? [start] : []), ...(end ? [end] : [])],
  ).catch(() => [{ total: 0 }]);

  // Expenses
  const exp = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE school_id = ?
       ${start ? " AND expense_date >= ?" : ""}
       ${end ? " AND expense_date <= ?" : ""}`,
    [schoolId, ...(start ? [start] : []), ...(end ? [end] : [])],
  );

  const manualTotal = byCat.reduce((s, r) => s + Number(r.total || 0), 0);
  const feesTotal = Number(fees[0]?.total || 0);
  const expTotal = Number(exp[0]?.total || 0);

  return {
    by_category: [
      ...byCat.map((r) => ({ category: r.category, total: Number(r.total) })),
      { category: "Fees (Auto)", total: feesTotal, system: true },
    ],
    totals: {
      income: manualTotal + feesTotal,
      manual_income: manualTotal,
      fees: feesTotal,
      expenses: expTotal,
      net: manualTotal + feesTotal - expTotal,
    },
  };
};

module.exports = {
  listCategories, createCategory, updateCategory, deleteCategory,
  listEntries, createEntry, updateEntry, deleteEntry,
  report,
};