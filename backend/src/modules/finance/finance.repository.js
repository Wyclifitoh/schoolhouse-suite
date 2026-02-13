const { query } = require('../../config/database');

const findFeeTemplates = async (schoolId, { limit, offset }) => {
  const result = await query(
    `SELECT * FROM fee_templates WHERE school_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [schoolId, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*) FROM fee_templates WHERE school_id = $1`,
    [schoolId]
  );
  return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findStudentFees = async (studentId, schoolId) => {
  const result = await query(
    `SELECT sf.*, ft.name as fee_name, ft.fee_type FROM student_fees sf JOIN fee_templates ft ON ft.id = sf.fee_template_id WHERE sf.student_id = $1 AND sf.school_id = $2 ORDER BY sf.due_date ASC`,
    [studentId, schoolId]
  );
  return result.rows;
};

const findStudentFeeById = async (id, schoolId) => {
  const result = await query(
    `SELECT * FROM student_fees WHERE id = $1 AND school_id = $2`,
    [id, schoolId]
  );
  return result.rows[0] || null;
};

const createStudentFee = async (data) => {
  const result = await query(
    `INSERT INTO student_fees (school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, status, due_date, assigned_by, assignment_mode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [data.school_id, data.student_id, data.fee_template_id, data.term_id, data.academic_year_id, data.ledger_type, data.amount_due, 'pending', data.due_date, data.assigned_by, data.assignment_mode || 'manual']
  );
  return result.rows[0];
};

const updateStudentFee = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }
  values.push(id, schoolId);
  const result = await query(
    `UPDATE student_fees SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND school_id = $${idx + 1} RETURNING *`,
    values
  );
  return result.rows[0];
};

const getStudentBalance = async (studentId, schoolId) => {
  const result = await query(
    `SELECT ledger_type, COALESCE(SUM(amount_due), 0) as total_due, COALESCE(SUM(amount_paid), 0) as total_paid, COALESCE(SUM(amount_due - amount_paid), 0) as balance FROM student_fees WHERE student_id = $1 AND school_id = $2 AND status != 'cancelled' GROUP BY ledger_type`,
    [studentId, schoolId]
  );
  return result.rows;
};

const getCarryForwards = async (studentId, schoolId) => {
  const result = await query(
    `SELECT * FROM fee_carry_forwards WHERE student_id = $1 AND school_id = $2 ORDER BY created_at DESC`,
    [studentId, schoolId]
  );
  return result.rows;
};

module.exports = { findFeeTemplates, findStudentFees, findStudentFeeById, createStudentFee, updateStudentFee, getStudentBalance, getCarryForwards };
