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
  await query("DELETE FROM expense_categories WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
  return { deleted: true };
};

// ---------- Expenses ----------
const listExpenses = async (schoolId, filters = {}) => {
  let sql = `SELECT e.*, ec.name AS category_name, sup.name AS supplier_name,
                    sup.tax_pin AS supplier_tax_pin
             FROM expenses e
             LEFT JOIN expense_categories ec ON ec.id = e.category_id
             LEFT JOIN inventory_suppliers sup ON sup.id = e.supplier_id
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
  if (filters.supplier_id) {
    sql += " AND e.supplier_id = ?";
    params.push(filters.supplier_id);
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
    `SELECT e.*, ec.name AS category_name, sup.name AS supplier_name,
            sup.tax_pin AS supplier_tax_pin
     FROM expenses e
     LEFT JOIN expense_categories ec ON ec.id = e.category_id
     LEFT JOIN inventory_suppliers sup ON sup.id = e.supplier_id
     WHERE e.id = ? AND e.school_id = ?`,
    [id, schoolId],
  );
};

const createExpense = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO expenses
       (id, school_id, title, description, amount, category_id, supplier_id,
        expense_date, payment_method, reference, status, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.title,
      data.description || null,
      Number(data.amount) || 0,
      data.category_id || null,
      data.supplier_id || null,
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
    "supplier_id",
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

const bulkImport = async (schoolId, rows, recordedBy) => {
  if (!Array.isArray(rows) || rows.length === 0)
    return { imported: 0, skipped: 0, errors: [] };

  // Pre-load suppliers + categories once for matching by name/PIN.
  const suppliers = await query(
    "SELECT id, name, tax_pin FROM inventory_suppliers WHERE school_id = ?",
    [schoolId],
  );
  const categories = await query(
    "SELECT id, name FROM expense_categories WHERE school_id = ?",
    [schoolId],
  );
  const supByName = new Map(
    suppliers.map((s) => [
      String(s.name || "")
        .toLowerCase()
        .trim(),
      s.id,
    ]),
  );
  const supByPin = new Map(
    suppliers
      .filter((s) => s.tax_pin)
      .map((s) => [String(s.tax_pin).toUpperCase().trim(), s.id]),
  );
  const catByName = new Map(
    categories.map((c) => [
      String(c.name || "")
        .toLowerCase()
        .trim(),
      c.id,
    ]),
  );

  let imported = 0;
  const errors = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {};
    try {
      if (!r.title && !r.Title) {
        errors.push({ row: i + 2, error: "title is required" });
        continue;
      }
      const title = r.title || r.Title;
      const amount = Number(r.amount ?? r.Amount ?? 0);
      if (!amount) {
        errors.push({ row: i + 2, error: "amount is required" });
        continue;
      }
      const supplierKey = String(
        r.supplier || r.Supplier || r.supplier_name || "",
      )
        .toLowerCase()
        .trim();
      const supplierPin = String(r.supplier_pin || r.Supplier_PIN || "")
        .toUpperCase()
        .trim();
      const supplier_id =
        (supplierPin && supByPin.get(supplierPin)) ||
        (supplierKey && supByName.get(supplierKey)) ||
        null;
      const catKey = String(r.category || r.Category || "")
        .toLowerCase()
        .trim();
      const category_id = (catKey && catByName.get(catKey)) || null;

      await createExpense({
        school_id: schoolId,
        title,
        description: r.description || r.Description || null,
        amount,
        category_id,
        supplier_id,
        expense_date:
          r.expense_date ||
          r.date ||
          r.Date ||
          new Date().toISOString().slice(0, 10),
        payment_method: r.payment_method || r.method || "cash",
        reference: r.reference || r.Reference || null,
        status: r.status || "pending",
        recorded_by: recordedBy || null,
      });
      imported++;
    } catch (e) {
      errors.push({ row: i + 2, error: e.message });
    }
  }
  return { imported, skipped: rows.length - imported, errors };
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
  bulkImport,
};
