const { query, queryOne } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

// ---- Fee Templates ----
const findFeeTemplates = async (schoolId, { limit, offset }) => {
  const rows = await query('SELECT * FROM fee_templates WHERE school_id = ? AND is_active = TRUE ORDER BY priority ASC LIMIT ? OFFSET ?', [schoolId, limit, offset]);
  const countRows = await query('SELECT COUNT(*) as count FROM fee_templates WHERE school_id = ? AND is_active = TRUE', [schoolId]);
  return { rows, total: countRows[0]?.count || 0 };
};

// ---- Fee Categories ----
const findFeeCategories = async (schoolId) => {
  return query('SELECT * FROM fee_categories WHERE school_id = ? ORDER BY name', [schoolId]);
};

const createFeeCategory = async (schoolId, data) => {
  const id = uuidv4();
  await query('INSERT INTO fee_categories (id, school_id, name, type, description, gl_code, is_optional) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, schoolId, data.name, data.type || 'tuition', data.description || null, data.gl_code || null, data.is_optional || false]);
  return queryOne('SELECT * FROM fee_categories WHERE id = ?', [id]);
};

// ---- Fee Structures ----
const findFeeStructures = async (schoolId) => {
  return query(
    `SELECT fs.*, fc.name as category_name, fc.type as category_type, g.name as grade_name
     FROM fee_structures fs
     LEFT JOIN fee_categories fc ON fc.id = fs.fee_category_id
     LEFT JOIN grades g ON g.id = fs.grade_id
     WHERE fs.school_id = ? ORDER BY fs.created_at DESC`,
    [schoolId]
  );
};

const createFeeStructure = async (schoolId, data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO fee_structures (id, school_id, name, fee_category_id, academic_year_id, amount, grade_id, term_id, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, schoolId, data.name, data.fee_category_id, data.academic_year_id, data.amount || 0,
     data.grade_id || null, data.term_id || null, data.due_date || null]);
  return queryOne('SELECT * FROM fee_structures WHERE id = ?', [id]);
};

const updateFeeStructure = async (id, schoolId, data) => {
  const allowed = ['name', 'fee_category_id', 'amount', 'grade_id', 'term_id', 'academic_year_id', 'due_date', 'is_active'];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return queryOne('SELECT * FROM fee_structures WHERE id = ? AND school_id = ?', [id, schoolId]);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  values.push(id, schoolId);
  await query(`UPDATE fee_structures SET ${fields.join(', ')} WHERE id = ? AND school_id = ?`, values);
  return queryOne('SELECT * FROM fee_structures WHERE id = ?', [id]);
};

const deleteFeeStructure = async (id, schoolId) => {
  await query('DELETE FROM fee_structures WHERE id = ? AND school_id = ?', [id, schoolId]);
  return { deleted: true };
};

// ---- Fee Discounts ----
const findFeeDiscounts = async (schoolId) => {
  return query('SELECT * FROM fee_discounts WHERE school_id = ? AND is_active = TRUE ORDER BY priority', [schoolId]);
};

const createFeeDiscount = async (schoolId, data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO fee_discounts (id, school_id, name, type, value, code, description, applicable_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, schoolId, data.name, data.type || 'percentage', data.value || 0,
     data.code || null, data.description || null, data.applicable_to || null]);
  return queryOne('SELECT * FROM fee_discounts WHERE id = ?', [id]);
};

// ---- Student Fees ----
const findStudentFees = async (studentId, schoolId) => {
  return query(
    `SELECT sf.*,
            COALESCE(fs.name, ft.name) AS fee_name,
            COALESCE(fc.type, ft.fee_type) AS fee_type,
            sf.amount_due AS amount,
            sf.amount_paid AS paid,
            (sf.amount_due - sf.amount_paid) AS balance,
            sf.discount_amount AS discount
     FROM student_fees sf
     LEFT JOIN fee_templates ft   ON ft.id = sf.fee_template_id
     LEFT JOIN fee_structures fs  ON fs.id = sf.fee_structure_id
     LEFT JOIN fee_categories fc  ON fc.id = fs.fee_category_id
     WHERE sf.student_id = ? AND sf.school_id = ?
     ORDER BY sf.due_date ASC, sf.created_at ASC`,
    [studentId, schoolId]
  );
};

// Find which students already have a given fee (structure) in a term
const findFeeAssignments = async (schoolId, { feeStructureId, termId }) => {
  try {
    return await query(
      `SELECT id, student_id, amount_due, amount_paid, status
       FROM student_fees
       WHERE school_id = ? AND fee_structure_id = ? AND term_id <=> ? AND status NOT IN ('cancelled')`,
      [schoolId, feeStructureId, termId || null]
    );
  } catch {
    return query(
      `SELECT id, student_id, amount_due, amount_paid, status
       FROM student_fees
       WHERE school_id = ? AND fee_template_id = ? AND term_id <=> ? AND status NOT IN ('cancelled')`,
      [schoolId, feeStructureId, termId || null]
    );
  }
};

const bulkAssignFee = async ({ schoolId, studentIds, feeStructure, termId, academicYearId, discountAmount, assignedBy }) => {
  const created = [];
  for (const studentId of studentIds) {
    let existing = null;
    try {
      existing = await queryOne(
        `SELECT id FROM student_fees WHERE school_id = ? AND student_id = ? AND fee_structure_id = ? AND term_id <=> ?`,
        [schoolId, studentId, feeStructure.id, termId || null]
      );
    } catch {
      existing = await queryOne(
        `SELECT id FROM student_fees WHERE school_id = ? AND student_id = ? AND fee_template_id = ? AND term_id <=> ?`,
        [schoolId, studentId, feeStructure.id, termId || null]
      );
    }
    if (existing) continue;
    const id = uuidv4();
    const amount = Math.max(0, Number(feeStructure.amount || 0) - Number(discountAmount || 0));
    try {
      await query(
        `INSERT INTO student_fees (id, school_id, student_id, fee_structure_id, term_id, academic_year_id, ledger_type, amount_due, discount_amount, status, due_date, assigned_by, assignment_mode)
         VALUES (?, ?, ?, ?, ?, ?, 'fees', ?, ?, 'pending', ?, ?, 'bulk')`,
        [id, schoolId, studentId, feeStructure.id, termId || null, academicYearId || null, amount, discountAmount || 0, feeStructure.due_date || null, assignedBy || null]
      );
    } catch {
      await query(
        `INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, discount_amount, status, due_date, assigned_by, assignment_mode)
         VALUES (?, ?, ?, ?, ?, ?, 'fees', ?, ?, 'pending', ?, ?, 'bulk')`,
        [id, schoolId, studentId, feeStructure.id, termId || null, academicYearId || null, amount, discountAmount || 0, feeStructure.due_date || null, assignedBy || null]
      );
    }
    created.push(id);
  }
  return { created: created.length };
};

const bulkUnassignFee = async ({ schoolId, studentIds, feeStructureId, termId }) => {
  if (!studentIds.length) return { removed: 0 };
  const placeholders = studentIds.map(() => '?').join(',');
  let result;
  try {
    result = await query(
      `DELETE FROM student_fees WHERE school_id = ? AND fee_structure_id = ? AND term_id <=> ?
         AND student_id IN (${placeholders}) AND amount_paid = 0`,
      [schoolId, feeStructureId, termId || null, ...studentIds]
    );
  } catch {
    result = await query(
      `DELETE FROM student_fees WHERE school_id = ? AND fee_template_id = ? AND term_id <=> ?
         AND student_id IN (${placeholders}) AND amount_paid = 0`,
      [schoolId, feeStructureId, termId || null, ...studentIds]
    );
  }
  return { removed: result.affectedRows || 0 };
};

const findStudentFeeById = async (id, schoolId) => {
  return queryOne('SELECT * FROM student_fees WHERE id = ? AND school_id = ?', [id, schoolId]);
};

const createStudentFee = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, status, due_date, assigned_by, assignment_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [id, data.school_id, data.student_id, data.fee_template_id, data.term_id, data.academic_year_id, data.ledger_type || 'fees', data.amount_due, data.due_date, data.assigned_by, data.assignment_mode || 'manual']
  );
  return queryOne('SELECT * FROM student_fees WHERE id = ?', [id]);
};

const updateStudentFee = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return findStudentFeeById(id, schoolId);
  values.push(id, schoolId);
  await query(`UPDATE student_fees SET ${fields.join(', ')} WHERE id = ? AND school_id = ?`, values);
  return queryOne('SELECT * FROM student_fees WHERE id = ?', [id]);
};

const getStudentBalance = async (studentId, schoolId) => {
  return query(
    `SELECT ledger_type, COALESCE(SUM(amount_due), 0) as total_due, COALESCE(SUM(amount_paid), 0) as total_paid, COALESCE(SUM(amount_due - amount_paid), 0) as balance
     FROM student_fees WHERE student_id = ? AND school_id = ? AND status NOT IN ('cancelled', 'waived') GROUP BY ledger_type`,
    [studentId, schoolId]
  );
};

const getCarryForwards = async (schoolId) => {
  return query(
    `SELECT cf.*, s.full_name as student_name, t1.name as from_term_name, t2.name as to_term_name
     FROM fee_carry_forwards cf
     LEFT JOIN students s ON s.id = cf.student_id
     LEFT JOIN terms t1 ON t1.id = cf.from_term_id
     LEFT JOIN terms t2 ON t2.id = cf.to_term_id
     WHERE cf.school_id = ? ORDER BY cf.created_at DESC`,
    [schoolId]
  );
};

const getStudentFeesList = async (schoolId, { search, termId }) => {
  let sql = `SELECT s.id, s.first_name, s.last_name, s.full_name, s.admission_number, s.grade, s.stream,
    s.parent_name, s.parent_phone,
    COALESCE(SUM(sf.amount_due), 0) as total_fee,
    COALESCE(SUM(sf.discount_amount), 0) as discount,
    COALESCE(SUM(sf.fine_amount), 0) as fine,
    COALESCE(SUM(sf.amount_paid), 0) as paid,
    COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) as balance,
    COALESCE(SUM(CASE WHEN (sf.amount_due - sf.amount_paid) > 0 THEN 1 ELSE 0 END), 0) as fee_count,
    COALESCE(SUM(CASE WHEN sf.due_date IS NOT NULL AND sf.due_date < CURRENT_DATE() AND (sf.amount_due - sf.amount_paid) > 0 THEN 1 ELSE 0 END), 0) as overdue_count
    FROM students s
    LEFT JOIN student_fees sf ON sf.student_id = s.id AND sf.school_id = s.school_id AND sf.status NOT IN ('cancelled','waived')`;

  const params = [schoolId];
  if (termId) {
    sql += ' AND sf.term_id = ?';
    params.push(termId);
  }
  sql += ' WHERE s.school_id = ? AND s.status = ?';
  params.push(schoolId, 'active');

  if (search) {
    sql += ' AND (s.full_name LIKE ? OR s.admission_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  sql += ' GROUP BY s.id ORDER BY s.full_name LIMIT 200';
  return query(sql, params);
};

const findExpenses = async (schoolId) => {
  return query(
    `SELECT e.*, ec.name as category_name FROM expenses e LEFT JOIN expense_categories ec ON ec.id = e.category_id WHERE e.school_id = ? ORDER BY e.expense_date DESC`,
    [schoolId]
  );
};

const findExpenseCategories = async (schoolId) => {
  return query('SELECT * FROM expense_categories WHERE school_id = ? ORDER BY name', [schoolId]);
};

const logBulkFeeAudit = async ({ schoolId, action, feeStructureId, termId, studentIds, performedBy, extra }) => {
  try {
    await query(
      `INSERT INTO finance_audit_logs
        (id, school_id, action, entity_type, entity_id, performed_by, metadata)
       VALUES (?, ?, ?, 'fee_structure', ?, ?, ?)`,
      [uuidv4(), schoolId, action, feeStructureId, String(performedBy || 'system'),
       JSON.stringify({ termId, studentIds, ...extra })]
    );
  } catch (e) { /* non-fatal */ }
};

const getAuditLogs = async (schoolId, { limit = 100, action, studentId } = {}) => {
  let sql = `SELECT fal.*, s.full_name AS student_name
             FROM finance_audit_logs fal
             LEFT JOIN students s ON s.id = fal.student_id
             WHERE fal.school_id = ?`;
  const params = [schoolId];
  if (action) { sql += ' AND fal.action = ?'; params.push(action); }
  if (studentId) { sql += ' AND fal.student_id = ?'; params.push(studentId); }
  sql += ' ORDER BY fal.created_at DESC LIMIT ?';
  params.push(Number(limit));
  return query(sql, params);
};

module.exports = {
  findFeeTemplates, findFeeCategories, createFeeCategory,
  findFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  findFeeDiscounts, createFeeDiscount,
  findStudentFees, findStudentFeeById, createStudentFee, updateStudentFee,
  getStudentBalance, getCarryForwards, getStudentFeesList,
  findExpenses, findExpenseCategories,
  findFeeAssignments, bulkAssignFee, bulkUnassignFee, logBulkFeeAudit, getAuditLogs,
};
