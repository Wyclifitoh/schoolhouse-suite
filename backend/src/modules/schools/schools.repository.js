const { query } = require('../../config/database');

const findSchoolsByUser = async (userId) => {
  return query(
    `SELECT DISTINCT s.id, s.name, s.code, s.email, s.phone, s.logo_url, s.address, s.curriculum_type, s.paybill_number
     FROM schools s JOIN user_roles ur ON ur.school_id = s.id
     WHERE ur.user_id = ? AND ur.is_active = TRUE`,
    [userId]
  );
};

const findTerms = async (schoolId) => {
  return query('SELECT * FROM terms WHERE school_id = ? ORDER BY start_date DESC', [schoolId]);
};

const findAcademicYears = async (schoolId) => {
  return query('SELECT * FROM academic_years WHERE school_id = ? ORDER BY start_date DESC', [schoolId]);
};

const getDashboardStats = async (schoolId) => {
  const [students, parents, staff, payments, fees, expenses] = await Promise.all([
    query('SELECT id, status FROM students WHERE school_id = ?', [schoolId]),
    query('SELECT COUNT(*) as count FROM parents WHERE school_id = ?', [schoolId]),
    query('SELECT COUNT(*) as count FROM staff WHERE school_id = ? AND status = ?', [schoolId, 'active']),
    query(
      `SELECT p.id, p.amount, p.payment_method, p.reference_number, p.received_at, p.status, s.full_name as student_name
       FROM payments p LEFT JOIN students s ON s.id = p.student_id
       WHERE p.school_id = ? AND p.status = ? ORDER BY p.received_at DESC LIMIT 10`,
      [schoolId, 'completed']
    ),
    query(
      `SELECT amount_due, amount_paid, (amount_due - amount_paid) as balance, status FROM student_fees
       WHERE school_id = ? AND status NOT IN ('cancelled','waived')`,
      [schoolId]
    ),
    query('SELECT amount FROM expenses WHERE school_id = ? AND status = ?', [schoolId, 'paid']),
  ]);

  const activeStudents = students.filter(s => s.status === 'active').length;
  const totalDue = fees.reduce((s, f) => s + Number(f.amount_due || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + Number(f.amount_paid || 0), 0);
  const totalOutstanding = fees.reduce((s, f) => s + Number(f.balance || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return {
    totalStudents: students.length,
    activeStudents,
    totalParents: parents[0]?.count || 0,
    totalStaff: staff[0]?.count || 0,
    totalRevenue: totalPaid,
    totalExpenses,
    totalOutstanding,
    collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0,
    attendanceRate: 95,
    recentPayments: payments.map(p => ({
      id: p.id, student_name: p.student_name || 'Unknown', amount: p.amount,
      payment_method: p.payment_method, reference_number: p.reference_number,
      received_at: p.received_at, status: p.status,
    })),
  };
};

module.exports = { findSchoolsByUser, findTerms, findAcademicYears, getDashboardStats };
