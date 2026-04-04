const db = require('../../config/database');

const getFinanceReport = async (schoolId, filters = {}) => {
  const { class_id, start_date, end_date } = filters;

  // Balance fees per student
  let balanceQuery = `
    SELECT s.id as student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
      s.admission_no, g.name as class_name,
      COALESCE(SUM(sf.amount), 0) as total_fees,
      COALESCE(SUM(sf.paid_amount), 0) as paid,
      COALESCE(SUM(sf.amount - sf.paid_amount), 0) as balance
    FROM students s
    LEFT JOIN grades g ON s.grade_id = g.id
    LEFT JOIN student_fees sf ON sf.student_id = s.id
    WHERE s.school_id = ?
    GROUP BY s.id, s.first_name, s.last_name, s.admission_no, g.name
    HAVING balance > 0
    ORDER BY balance DESC
    LIMIT 100
  `;
  const [balanceFees] = await db.query(balanceQuery, [schoolId]);

  // Fee statements
  let stmtQuery = `
    SELECT s.id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
      s.admission_no, g.name as class_name,
      COALESCE(SUM(sf.amount), 0) as total_fee,
      COALESCE(SUM(sf.paid_amount), 0) as paid,
      COALESCE(SUM(sf.amount - sf.paid_amount), 0) as balance,
      CASE
        WHEN COALESCE(SUM(sf.amount - sf.paid_amount), 0) <= 0 THEN 'paid'
        WHEN COALESCE(SUM(sf.paid_amount), 0) = 0 THEN 'overdue'
        ELSE 'partial'
      END as status
    FROM students s
    LEFT JOIN grades g ON s.grade_id = g.id
    LEFT JOIN student_fees sf ON sf.student_id = s.id
    WHERE s.school_id = ?
    GROUP BY s.id, s.first_name, s.last_name, s.admission_no, g.name
    ORDER BY s.first_name
    LIMIT 200
  `;
  const [feeStatements] = await db.query(stmtQuery, [schoolId]);

  // Daily collections
  let dailyQuery = `
    SELECT DATE(received_at) as date,
      SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END) as cash,
      SUM(CASE WHEN payment_method = 'mpesa' THEN amount ELSE 0 END) as mpesa,
      SUM(CASE WHEN payment_method = 'bank' THEN amount ELSE 0 END) as bank,
      SUM(amount) as total,
      COUNT(*) as transactions
    FROM payments
    WHERE school_id = ? AND status = 'completed'
  `;
  const dailyParams = [schoolId];
  if (start_date) { dailyQuery += ' AND received_at >= ?'; dailyParams.push(start_date); }
  if (end_date) { dailyQuery += ' AND received_at <= ?'; dailyParams.push(end_date); }
  dailyQuery += ' GROUP BY DATE(received_at) ORDER BY date DESC LIMIT 30';
  const [dailyCollections] = await db.query(dailyQuery, dailyParams);

  // Income by category
  const [incomeByCategory] = await db.query(`
    SELECT fc.name as category, SUM(pa.amount) as amount
    FROM payment_allocations pa
    JOIN student_fees sf ON pa.student_fee_id = sf.id
    JOIN fee_templates ft ON sf.fee_template_id = ft.id
    LEFT JOIN fee_categories fc ON ft.fee_type = fc.name
    JOIN payments p ON pa.payment_id = p.id
    WHERE p.school_id = ? AND p.status = 'completed'
    GROUP BY fc.name
    ORDER BY amount DESC
  `, [schoolId]).catch(() => [[]]);

  // Expenses
  const [expenses] = await db.query(`
    SELECT e.*, ec.name as category_name
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
    WHERE e.school_id = ?
    ORDER BY e.expense_date DESC LIMIT 100
  `, [schoolId]);

  // Payroll summary
  const [payrollSummary] = await db.query(`
    SELECT CONCAT(year, '-', LPAD(month, 2, '0')) as month,
      SUM(basic_salary) as basic, SUM(COALESCE(allowances, 0)) as allowances,
      SUM(COALESCE(deductions, 0)) as deductions, SUM(net_salary) as net,
      payment_status as status
    FROM payroll WHERE school_id = ?
    GROUP BY year, month, payment_status
    ORDER BY year DESC, month DESC LIMIT 12
  `, [schoolId]);

  return { balanceFees, feeStatements, dailyCollections, incomeByCategory, expenses, payrollSummary };
};

const getPaymentsReport = async (schoolId, filters = {}) => {
  const { start_date, end_date, method } = filters;
  let query = `
    SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) as student_name
    FROM payments p
    LEFT JOIN students s ON p.student_id = s.id
    WHERE p.school_id = ?
  `;
  const params = [schoolId];
  if (start_date) { query += ' AND p.received_at >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND p.received_at <= ?'; params.push(end_date); }
  if (method) { query += ' AND p.payment_method = ?'; params.push(method); }
  query += ' ORDER BY p.received_at DESC LIMIT 200';
  const [payments] = await db.query(query, params);

  const [mpesaPayments] = await db.query(`
    SELECT mt.*, CONCAT(s.first_name, ' ', s.last_name) as student_name
    FROM mpesa_transactions mt
    LEFT JOIN students s ON mt.student_id = s.id
    WHERE mt.school_id = ?
    ORDER BY mt.created_at DESC LIMIT 100
  `, [schoolId]);

  return { payments, mpesaPayments };
};

const getStudentReport = async (schoolId, filters = {}) => {
  const [students] = await db.query(`
    SELECT s.*, g.name as grade_name, st.name as stream_name
    FROM students s
    LEFT JOIN grades g ON s.grade_id = g.id
    LEFT JOIN streams st ON s.stream_id = st.id
    WHERE s.school_id = ?
    ORDER BY s.first_name LIMIT 500
  `, [schoolId]);

  const [guardians] = await db.query(`
    SELECT * FROM parents WHERE school_id = ? ORDER BY first_name LIMIT 500
  `, [schoolId]);

  const total = students.length;
  const male = students.filter(s => s.gender === 'Male' || s.gender === 'male').length;
  const female = students.filter(s => s.gender === 'Female' || s.gender === 'female').length;
  const active = students.filter(s => s.status === 'active').length;

  return { students, guardians, history: [], summary: { total, male, female, active } };
};

const getAttendanceReport = async (schoolId, filters = {}) => {
  // Try to get attendance data, return empty if table doesn't exist
  try {
    const [studentAttendance] = await db.query(`
      SELECT sa.*, CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.admission_no, g.name as grade_name
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      LEFT JOIN grades g ON s.grade_id = g.id
      WHERE sa.school_id = ?
      ORDER BY sa.date DESC LIMIT 200
    `, [schoolId]);

    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const late = studentAttendance.filter(a => a.status === 'late').length;
    const total = studentAttendance.length;

    return {
      studentAttendance, staffAttendance: [], dailySummary: [], typeSummary: [],
      summary: { present, absent, late, total, rate: total ? ((present / total) * 100).toFixed(1) : 0 }
    };
  } catch {
    return { studentAttendance: [], staffAttendance: [], dailySummary: [], typeSummary: [], summary: { present: 0, absent: 0, late: 0, total: 0, rate: 0 } };
  }
};

const getExamReport = async (schoolId, filters = {}) => {
  try {
    const [exams] = await db.query('SELECT * FROM exams WHERE school_id = ? ORDER BY created_at DESC', [schoolId]);
    
    let marksRegister = [];
    if (filters.exam_id) {
      const [marks] = await db.query(`
        SELECT em.*, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.admission_no
        FROM exam_marks em
        JOIN students s ON em.student_id = s.id
        WHERE em.exam_id = ? AND em.school_id = ?
        ORDER BY em.total DESC
      `, [filters.exam_id, schoolId]);
      marksRegister = marks;
    }

    const count = marksRegister.length;
    const percentages = marksRegister.map(m => m.percentage || 0);
    
    return {
      exams, marksRegister,
      summary: {
        count,
        highest: percentages.length ? Math.max(...percentages) : 0,
        average: percentages.length ? (percentages.reduce((a, b) => a + b, 0) / count).toFixed(1) : 0,
        lowest: percentages.length ? Math.min(...percentages) : 0,
      }
    };
  } catch {
    return { exams: [], marksRegister: [], summary: { count: 0, highest: 0, average: 0, lowest: 0 } };
  }
};

module.exports = { getFinanceReport, getPaymentsReport, getStudentReport, getAttendanceReport, getExamReport };
