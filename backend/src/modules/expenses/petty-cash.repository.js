const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const listAccounts = (schoolId) =>
  query(
    `SELECT a.*, COALESCE(u.first_name, '') AS custodian_first,
            COALESCE(u.last_name, '') AS custodian_last
     FROM petty_cash_accounts a
     LEFT JOIN users u ON u.id = a.custodian_id
     WHERE a.school_id = ? ORDER BY a.created_at DESC`,
    [schoolId],
  );

const getAccount = (id, schoolId) =>
  queryOne(
    `SELECT * FROM petty_cash_accounts WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  );

const createAccount = async (data) => {
  const id = uuidv4();
  const floatAmt = Number(data.float_amount) || 0;
  await query(
    `INSERT INTO petty_cash_accounts
       (id, school_id, name, custodian_id, float_amount, balance)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.school_id, data.name, data.custodian_id || null, floatAmt, floatAmt],
  );
  return getAccount(id, data.school_id);
};

const updateAccount = async (id, schoolId, data) => {
  const allowed = ["name", "custodian_id", "float_amount", "is_active"];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (!entries.length) return getAccount(id, schoolId);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => v);
  values.push(id, schoolId);
  await query(
    `UPDATE petty_cash_accounts SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return getAccount(id, schoolId);
};

const deleteAccount = async (id, schoolId) => {
  await query(
    `DELETE FROM petty_cash_accounts WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  );
  return { deleted: true };
};

const listTransactions = (schoolId, filters = {}) => {
  let sql = `SELECT t.*, a.name AS account_name, c.name AS category_name
             FROM petty_cash_transactions t
             LEFT JOIN petty_cash_accounts a ON a.id = t.account_id
             LEFT JOIN expense_categories c ON c.id = t.category_id
             WHERE t.school_id = ?`;
  const params = [schoolId];
  if (filters.account_id) { sql += " AND t.account_id = ?"; params.push(filters.account_id); }
  if (filters.start_date) { sql += " AND t.txn_date >= ?"; params.push(filters.start_date); }
  if (filters.end_date)   { sql += " AND t.txn_date <= ?"; params.push(filters.end_date); }
  sql += " ORDER BY t.txn_date DESC, t.created_at DESC LIMIT 500";
  return query(sql, params);
};

// txn_type: issue/topup => +balance; spend => -balance; return => +balance; reconcile => set to amount
const recordTransaction = async (data) => {
  const account = await getAccount(data.account_id, data.school_id);
  if (!account) throw Object.assign(new Error("Petty cash account not found"), { statusCode: 404 });
  const id = uuidv4();
  const amount = Number(data.amount) || 0;
  const type = data.txn_type;
  let newBalance = Number(account.balance);
  if (type === "issue" || type === "topup" || type === "return") newBalance += amount;
  else if (type === "spend") newBalance -= amount;
  else if (type === "reconcile") newBalance = amount;
  else throw Object.assign(new Error("Invalid txn_type"), { statusCode: 400 });

  await query(
    `INSERT INTO petty_cash_transactions
       (id, school_id, account_id, txn_type, amount, description, reference,
        expense_id, category_id, performed_by, txn_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.school_id, data.account_id, type, amount,
      data.description || null, data.reference || null,
      data.expense_id || null, data.category_id || null,
      data.performed_by || null,
      data.txn_date || new Date().toISOString().slice(0, 10),
    ],
  );
  await query(
    `UPDATE petty_cash_accounts SET balance = ? WHERE id = ? AND school_id = ?`,
    [newBalance, data.account_id, data.school_id],
  );
  return queryOne(`SELECT * FROM petty_cash_transactions WHERE id = ?`, [id]);
};

module.exports = {
  listAccounts, createAccount, updateAccount, deleteAccount, getAccount,
  listTransactions, recordTransaction,
};