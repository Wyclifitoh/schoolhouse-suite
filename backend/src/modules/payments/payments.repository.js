const { query } = require('../../config/database');

const findAll = async (schoolId, { limit, offset }) => {
  const result = await query(
    `SELECT p.*, s.full_name as student_name, s.admission_number FROM payments p LEFT JOIN students s ON s.id = p.student_id WHERE p.school_id = $1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`,
    [schoolId, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*) FROM payments WHERE school_id = $1`,
    [schoolId]
  );
  return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findById = async (id, schoolId) => {
  const result = await query(
    `SELECT p.*, s.full_name as student_name FROM payments p LEFT JOIN students s ON s.id = p.student_id WHERE p.id = $1 AND p.school_id = $2`,
    [id, schoolId]
  );
  return result.rows[0] || null;
};

const create = async (data) => {
  const result = await query(
    `INSERT INTO payments (school_id, student_id, amount, payment_method, reference_number, ledger_type, status, received_at, recorded_by, payer_phone, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [data.school_id, data.student_id, data.amount, data.payment_method, data.reference_number, data.ledger_type || 'fees', data.status || 'pending', data.received_at || new Date().toISOString(), data.recorded_by, data.payer_phone, data.notes]
  );
  return result.rows[0];
};

const findMpesaByCheckoutId = async (checkoutRequestId) => {
  const result = await query(
    `SELECT * FROM mpesa_transactions WHERE checkout_request_id = $1`,
    [checkoutRequestId]
  );
  return result.rows[0] || null;
};

const updateMpesaTransaction = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }
  values.push(id);
  const result = await query(
    `UPDATE mpesa_transactions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
};

module.exports = { findAll, findById, create, findMpesaByCheckoutId, updateMpesaTransaction };
