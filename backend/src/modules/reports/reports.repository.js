const db = require("../../config/database");

// NOTE: db.query() returns rows directly (already unwrapped). Do NOT destructure.

const getFinanceReport = async (schoolId, filters = {}) => {
  const { start_date, end_date } = filters;

  const balanceFees = await db.query(
    `SELECT s.id as student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
       s.admission_number as admission_no, g.name as class_name,
       COALESCE(SUM(sf.amount_due), 0) as total_fees,
       COALESCE(SUM(sf.amount_paid), 0) as paid,
       COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) as balance
     FROM students s
     LEFT JOIN grades g ON s.current_grade_id = g.id
     LEFT JOIN student_fees sf ON sf.student_id = s.id
     WHERE s.school_id = ?
     GROUP BY s.id, s.first_name, s.last_name, s.admission_number, g.name
     HAVING balance > 0
     ORDER BY balance DESC
     LIMIT 100`,
    [schoolId],
  );

  const feeStatements = await db.query(
    `SELECT s.id, CONCAT(s.first_name, ' ', s.last_name) as student_name,
       s.admission_number as admission_no, g.name as class_name,
       COALESCE(SUM(sf.amount_due), 0) as total_fee,
       COALESCE(SUM(sf.amount_paid), 0) as paid,
       COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) as balance,
       CASE
         WHEN COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) <= 0 THEN 'paid'
         WHEN COALESCE(SUM(sf.amount_paid), 0) = 0 THEN 'overdue'
         ELSE 'partial'
       END as status
     FROM students s
     LEFT JOIN grades g ON s.current_grade_id = g.id
     LEFT JOIN student_fees sf ON sf.student_id = s.id
     WHERE s.school_id = ?
     GROUP BY s.id, s.first_name, s.last_name, s.admission_number, g.name
     ORDER BY s.first_name
     LIMIT 200`,
    [schoolId],
  );

  let dailyQuery = `
    SELECT DATE(received_at) as date,
      SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END) as cash,
      SUM(CASE WHEN payment_method LIKE 'mpesa%' THEN amount ELSE 0 END) as mpesa,
      SUM(CASE WHEN payment_method IN ('bank','bank_transfer') THEN amount ELSE 0 END) as bank,
      SUM(amount) as total,
      COUNT(*) as transactions
    FROM payments
    WHERE school_id = ? AND status = 'completed'`;
  const dailyParams = [schoolId];
  if (start_date) {
    dailyQuery += " AND received_at >= ?";
    dailyParams.push(start_date);
  }
  if (end_date) {
    dailyQuery += " AND received_at <= ?";
    dailyParams.push(end_date);
  }
  dailyQuery += " GROUP BY DATE(received_at) ORDER BY date DESC LIMIT 30";
  const dailyCollections = await db.query(dailyQuery, dailyParams);

  let incomeByCategory = [];
  try {
    incomeByCategory = await db.query(
      `SELECT fc.name as category, SUM(pa.amount) as amount
         FROM payment_allocations pa
         JOIN student_fees sf ON pa.student_fee_id = sf.id
         JOIN fee_templates ft ON sf.fee_template_id = ft.id
         LEFT JOIN fee_categories fc ON ft.fee_type = fc.name
         JOIN payments p ON pa.payment_id = p.id
        WHERE p.school_id = ? AND p.status = 'completed'
        GROUP BY fc.name
        ORDER BY amount DESC`,
      [schoolId],
    );
  } catch {
    /* table layout may vary */
  }

  const expenses = await db
    .query(
      `SELECT e.*, ec.name as category_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.school_id = ?
      ORDER BY e.expense_date DESC LIMIT 100`,
      [schoolId],
    )
    .catch(() => []);

  const payrollSummary = await db
    .query(
      `SELECT CONCAT(pp.year, '-', LPAD(pp.month, 2, '0')) AS payroll_month,
            COUNT(pr.id) AS employees,
            SUM(COALESCE(pr.basic_salary, 0)) AS total_basic_salary,
            SUM(COALESCE(pr.total_allowances, 0)) AS total_allowances,
            SUM(COALESCE(pr.total_deductions, 0)) AS total_deductions,
            SUM(COALESCE(pr.net_salary, 0)) AS total_net_salary,
            pp.status
       FROM payroll_runs pr
       INNER JOIN payroll_periods pp ON pp.id = pr.payroll_period_id
      WHERE pr.school_id = ?
      GROUP BY pp.id, pp.year, pp.month, pp.status
      ORDER BY pp.year DESC, pp.month DESC
      LIMIT 12`,
      [schoolId],
    )
    .catch(() => []);

  return {
    balanceFees,
    feeStatements,
    dailyCollections,
    incomeByCategory,
    expenses,
    payrollSummary,
  };
};

const getPaymentsReport = async (schoolId, filters = {}) => {
  const { start_date, end_date, method } = filters;
  let q = `
    SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) as student_name
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
     WHERE p.school_id = ?`;
  const params = [schoolId];
  if (start_date) {
    q += " AND p.received_at >= ?";
    params.push(start_date);
  }
  if (end_date) {
    q += " AND p.received_at <= ?";
    params.push(end_date);
  }
  if (method) {
    q += " AND p.payment_method = ?";
    params.push(method);
  }
  q += " ORDER BY p.received_at DESC LIMIT 200";
  const payments = await db.query(q, params);

  const mpesaPayments = await db
    .query(
      `SELECT mt.*, CONCAT(s.first_name, ' ', s.last_name) as student_name
       FROM mpesa_transactions mt
       LEFT JOIN students s ON mt.student_id = s.id
      WHERE mt.school_id = ?
      ORDER BY mt.created_at DESC LIMIT 100`,
      [schoolId],
    )
    .catch(() => []);

  return { payments, mpesaPayments };
};

const getStudentReport = async (schoolId, filters = {}) => {
  const { class_id, year } = filters || {};
  const params = [schoolId];
  let where = "WHERE s.school_id = ?";

  if (class_id) {
    where += " AND s.current_grade_id = ?";
    params.push(class_id);
  }

  if (year) {
    where += " AND YEAR(s.created_at) = ?";
    params.push(year);
  }

  const students = await db.query(
    `SELECT s.*, g.name as grade_name, st.name as stream_name
       FROM students s
       LEFT JOIN grades g ON s.current_grade_id = g.id
       LEFT JOIN streams st ON s.current_stream_id = st.id  -- Fixed: changed from s.stream_id to s.current_stream_id
       ${where}
       ORDER BY s.first_name LIMIT 1000`,
    params,
  );

  const guardians = await db
    .query(
      `SELECT p.*
       FROM parents p
       WHERE p.school_id = ?
       ORDER BY p.first_name LIMIT 1000`,
      [schoolId],
    )
    .catch(() => []);

  // Best-effort history from student_history / student_status_log if available
  let history = [];
  try {
    history = await db.query(
      `SELECT sh.*, CONCAT(s.first_name,' ',s.last_name) as student_name
         FROM student_history sh
         JOIN students s ON s.id = sh.student_id
        WHERE sh.school_id = ?
        ORDER BY sh.created_at DESC LIMIT 200`,
      [schoolId],
    );
  } catch {
    history = [];
  }

  const total = students.length;
  const male = students.filter((s) => /^m/i.test(s.gender || "")).length;
  const female = students.filter((s) => /^f/i.test(s.gender || "")).length;
  const active = students.filter((s) => s.status === "active").length;

  return {
    students,
    guardians,
    history,
    summary: { total, male, female, active },
  };
};

const getAttendanceReport = async (schoolId, filters = {}) => {
  try {
    const studentAttendance = await db.query(
      `SELECT sa.*, CONCAT(s.first_name, ' ', s.last_name) as student_name,
              s.admission_number as admission_no, g.name as grade_name
         FROM student_attendance sa
         JOIN students s ON sa.student_id = s.id
         LEFT JOIN grades g ON s.current_grade_id = g.id
        WHERE sa.school_id = ?
        ORDER BY sa.date DESC LIMIT 500`,
      [schoolId],
    );

    const present = studentAttendance.filter(
      (a) => a.status === "present",
    ).length;
    const absent = studentAttendance.filter(
      (a) => a.status === "absent",
    ).length;
    const late = studentAttendance.filter((a) => a.status === "late").length;
    const total = studentAttendance.length;

    return {
      studentAttendance,
      staffAttendance: [],
      dailySummary: [],
      typeSummary: [],
      summary: {
        present,
        absent,
        late,
        total,
        rate: total ? ((present / total) * 100).toFixed(1) : 0,
      },
    };
  } catch {
    return {
      studentAttendance: [],
      staffAttendance: [],
      dailySummary: [],
      typeSummary: [],
      summary: { present: 0, absent: 0, late: 0, total: 0, rate: 0 },
    };
  }
};

const getExamReport = async (schoolId, filters = {}) => {
  try {
    const exams = await db.query(
      "SELECT * FROM exams WHERE school_id = ? ORDER BY created_at DESC",
      [schoolId],
    );

    let marksRegister = [];
    if (filters.exam_id) {
      marksRegister = await db.query(
        `SELECT em.*, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.admission_number as admission_no
           FROM exam_marks em
           JOIN students s ON em.student_id = s.id
          WHERE em.exam_id = ? AND em.school_id = ?
          ORDER BY em.total DESC`,
        [filters.exam_id, schoolId],
      );
    }

    const count = marksRegister.length;
    const percentages = marksRegister.map((m) => Number(m.percentage) || 0);

    return {
      exams,
      marksRegister,
      summary: {
        count,
        highest: percentages.length ? Math.max(...percentages) : 0,
        average: percentages.length
          ? (percentages.reduce((a, b) => a + b, 0) / count).toFixed(1)
          : 0,
        lowest: percentages.length ? Math.min(...percentages) : 0,
      },
    };
  } catch {
    return {
      exams: [],
      marksRegister: [],
      summary: { count: 0, highest: 0, average: 0, lowest: 0 },
    };
  }
};

const getHRReport = async (schoolId) => {
  const staff = await db.query(
    `SELECT s.*, d.name AS department_name, ds.name AS designation_name
       FROM staff s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN designations ds ON s.designation_id = ds.id
      WHERE s.school_id = ? ORDER BY s.first_name LIMIT 1000`,
    [schoolId],
  );
  const leaves = await db
    .query(
      `SELECT l.*, s.first_name, s.last_name FROM leaves l
       LEFT JOIN staff s ON s.id = l.staff_id
      WHERE l.school_id = ? ORDER BY l.created_at DESC LIMIT 200`,
      [schoolId],
    )
    .catch(() => []);
  const attendance = await db
    .query(
      `SELECT * FROM staff_attendance WHERE school_id = ? ORDER BY date DESC LIMIT 200`,
      [schoolId],
    )
    .catch(() => []);
  const totalStaff = staff.length;
  const active = staff.filter((s) => s.status === "active").length;
  return {
    staff,
    leaves,
    attendance,
    summary: { total: totalStaff, active, inactive: totalStaff - active },
  };
};

// Audit + user activity logs
const getAuditTrail = async (schoolId, { limit = 200 } = {}) => {
  const lim = parseInt(limit, 10) || 200;
  try {
    return await db.query(
      `SELECT a.*, CONCAT(u.first_name,' ',u.last_name) AS user_name
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
        WHERE a.school_id = ?
        ORDER BY a.created_at DESC
        LIMIT ${lim}`,
      [schoolId],
    );
  } catch {
    return [];
  }
};

const getUserLogs = async (schoolId, { limit = 200 } = {}) => {
  const lim = parseInt(limit, 10) || 200;
  try {
    return await db.query(
      `SELECT ul.*, CONCAT(u.first_name,' ',u.last_name) AS user_name, u.role
         FROM user_activity_logs ul
         LEFT JOIN users u ON u.id = ul.user_id
        WHERE ul.school_id = ?
        ORDER BY ul.created_at DESC
        LIMIT ${lim}`,
      [schoolId],
    );
  } catch {
    // Fallback: derive from audit_logs
    try {
      return await db.query(
        `SELECT a.id, a.user_id, a.action, a.created_at, a.ip_address,
                CONCAT(u.first_name,' ',u.last_name) AS user_name, u.role
           FROM audit_logs a
           LEFT JOIN users u ON u.id = a.user_id
          WHERE a.school_id = ?
          ORDER BY a.created_at DESC
          LIMIT ${lim}`,
        [schoolId],
      );
    } catch {
      return [];
    }
  }
};

module.exports = {
  getFinanceReport,
  getPaymentsReport,
  getStudentReport,
  getAttendanceReport,
  getExamReport,
  getHRReport,
  getAuditTrail,
  getUserLogs,
};
