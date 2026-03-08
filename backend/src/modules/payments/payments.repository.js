const { query, queryOne } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const findAll = async (schoolId, { limit, offset, status, method }) => {
  let sql = `SELECT p.*, s.full_name as student_name, s.admission_number 
             FROM payments p LEFT JOIN students s ON s.id = p.student_id WHERE p.school_id = ?`;
  const params = [schoolId];
  if (status && status !== 'all') { sql += ' AND p.status = ?'; params.push(status); }
  if (method && method !== 'all') { sql += ' AND p.payment_method = ?'; params.push(method); }
  const countSql = sql.replace(/SELECT p\.\*.*?FROM/, 'SELECT COUNT(*) as count FROM');
  sql += ' ORDER BY p.received_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const [rows, countRows] = await Promise.all([query(sql, params), query(countSql, params.slice(0, -2))]);
  return { rows, total: countRows[0]?.count || 0 };
};

const findById = async (id, schoolId) => {
  return queryOne(
    'SELECT p.*, s.full_name as student_name FROM payments p LEFT JOIN students s ON s.id = p.student_id WHERE p.id = ? AND p.school_id = ?',
    [id, schoolId]
  );
};

const create = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO payments (id, school_id, student_id, amount, payment_method, reference_number, ledger_type, status, received_at, recorded_by, payer_phone, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.school_id, data.student_id, data.amount, data.payment_method, data.reference_number || null,
     data.ledger_type || 'fees', data.status || 'pending', data.received_at || new Date(), data.recorded_by || null,
     data.payer_phone || null, data.notes || null]
  );
  return queryOne('SELECT * FROM payments WHERE id = ?', [id]);
};

const voidPayment = async (id, schoolId, reason) => {
  await query('UPDATE payments SET status = ?, notes = CONCAT(COALESCE(notes, ""), ?) WHERE id = ? AND school_id = ?',
    ['reversed', `\n[VOIDED] ${reason}`, id, schoolId]);
  return queryOne('SELECT * FROM payments WHERE id = ?', [id]);
};

const findMpesaByCheckoutId = async (checkoutRequestId) => {
  return queryOne('SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?', [checkoutRequestId]);
};

module.exports = { findAll, findById, create, voidPayment, findMpesaByCheckoutId };
