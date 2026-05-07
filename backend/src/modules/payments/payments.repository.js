const { query, queryOne } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const findAll = async (schoolId, { limit, offset, status, method, studentId }) => {
  let sql = `SELECT p.*, s.full_name as student_name, s.admission_number 
             FROM payments p LEFT JOIN students s ON s.id = p.student_id WHERE p.school_id = ?`;
  const params = [schoolId];
  if (status && status !== 'all') { sql += ' AND p.status = ?'; params.push(status); }
  if (method && method !== 'all') { sql += ' AND p.payment_method = ?'; params.push(method); }
  if (studentId) { sql += ' AND p.student_id = ?'; params.push(studentId); }
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

/**
 * Record a payment and allocate it to outstanding fees.
 * - If feeIds provided: allocate in that order (priority).
 * - Otherwise FIFO over student's outstanding fees in current term first, then older.
 * - Overpayment → fee_carry_forwards as advance_credit.
 */
const recordPaymentWithAllocation = async ({
  schoolId, studentId, amount, paymentMethod, referenceNumber,
  ledgerType = 'fees', recordedBy, payerPhone, notes, feeIds = [], termId = null,
}) => {
  const paymentId = uuidv4();
  await query(
    `INSERT INTO payments
      (id, school_id, student_id, amount, payment_method, reference_number,
       ledger_type, status, received_at, recorded_by, payer_phone, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', NOW(), ?, ?, ?)`,
    [paymentId, schoolId, studentId, amount, paymentMethod, referenceNumber || null,
     ledgerType, recordedBy || null, payerPhone || null, notes || null]
  );

  // Pick target fees
  let targetFees;
  if (Array.isArray(feeIds) && feeIds.length > 0) {
    const ph = feeIds.map(() => '?').join(',');
    targetFees = await query(
      `SELECT id, amount_due, amount_paid, (amount_due - amount_paid) AS balance
       FROM student_fees
       WHERE school_id = ? AND student_id = ? AND id IN (${ph})
         AND status NOT IN ('cancelled','waived') AND (amount_due - amount_paid) > 0
       ORDER BY FIELD(id, ${ph})`,
      [schoolId, studentId, ...feeIds, ...feeIds]
    );
  } else {
    // FIFO: current term first if provided, then by due date / created
    targetFees = await query(
      `SELECT id, amount_due, amount_paid, (amount_due - amount_paid) AS balance
       FROM student_fees
       WHERE school_id = ? AND student_id = ?
         AND status NOT IN ('cancelled','waived') AND (amount_due - amount_paid) > 0
       ORDER BY (term_id <=> ?) DESC, due_date ASC, created_at ASC`,
      [schoolId, studentId, termId]
    );
  }

  let remaining = Number(amount);
  let order = 1;
  for (const fee of targetFees) {
    if (remaining <= 0) break;
    const bal = Number(fee.balance);
    if (bal <= 0) continue;
    const alloc = Math.min(bal, remaining);
    await query(
      `INSERT INTO payment_allocations
        (id, payment_id, student_fee_id, amount, allocation_order, is_auto_allocated, allocated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), paymentId, fee.id, alloc, order++, feeIds.length === 0, recordedBy || null]
    );
    const newPaid = Number(fee.amount_paid) + alloc;
    const newStatus = newPaid >= Number(fee.amount_due) ? 'paid' : 'partial';
    await query(
      `UPDATE student_fees SET amount_paid = ?, status = ?, last_payment_at = NOW() WHERE id = ?`,
      [newPaid, newStatus, fee.id]
    );
    remaining -= alloc;
  }

  // Excess → carry-forward as advance_credit
  if (remaining > 0) {
    try {
      await query(
        `INSERT INTO fee_carry_forwards
          (id, school_id, student_id, ledger_type, from_term_id, amount, type, status, source_payment_id)
         VALUES (?, ?, ?, ?, ?, ?, 'advance_credit', 'pending', ?)`,
        [uuidv4(), schoolId, studentId, ledgerType, termId, remaining, paymentId]
      );
    } catch (e) { /* table may not exist in some setups */ }
  }

  return queryOne('SELECT * FROM payments WHERE id = ?', [paymentId]);
};

module.exports = { findAll, findById, create, voidPayment, findMpesaByCheckoutId, recordPaymentWithAllocation };
