// =============================================================================
// PORTAL REPOSITORY — Parent/Student self-service.
// =============================================================================
const { query, queryOne, execute } = require("../../config/database");

exports.findAccount = (accountType, identifier) =>
  queryOne(
    `SELECT pa.*, s.name AS school_name
       FROM portal_accounts pa
       JOIN schools s ON s.id=pa.school_id
      WHERE pa.account_type=? AND pa.identifier=? AND pa.is_active=1
      LIMIT 1`,
    [accountType, identifier],
  );

exports.touchLogin = (id) =>
  execute("UPDATE portal_accounts SET last_login_at=NOW() WHERE id=?", [id]);

exports.setPin = (id, pin_hash) =>
  execute(
    "UPDATE portal_accounts SET pin_hash=?, must_change_pin=0 WHERE id=?",
    [pin_hash, id],
  );

// ---- Parent → children list ----
exports.parentChildren = (parentId) =>
  query(
    `SELECT s.id, s.first_name, s.last_name, s.admission_number, s.gender,
            s.current_grade_id, g.name AS grade_name,
            s.current_stream_id, st.name AS stream_name,
            sp.relationship, sp.is_primary_contact
       FROM student_parents sp
       JOIN students s ON s.id=sp.student_id
       LEFT JOIN grades g ON g.id=s.current_grade_id
       LEFT JOIN streams st ON st.id=s.current_stream_id
      WHERE sp.parent_id=? AND s.status='active'
      ORDER BY s.first_name`,
    [parentId],
  );

exports.getStudent = (id) =>
  queryOne(
    `SELECT s.id, s.first_name, s.last_name, s.admission_number, s.gender,
            s.current_grade_id, g.name AS grade_name,
            s.current_stream_id, st.name AS stream_name, s.school_id
       FROM students s
       LEFT JOIN grades g ON g.id=s.current_grade_id
       LEFT JOIN streams st ON st.id=s.current_stream_id
      WHERE s.id=?`,
    [id],
  );

// ---- Assert parent owns student ----
exports.parentOwnsStudent = async (parentId, studentId) => {
  const r = await queryOne(
    "SELECT 1 AS ok FROM student_parents WHERE parent_id=? AND student_id=? LIMIT 1",
    [parentId, studentId],
  );
  return !!r;
};

// ---- Attendance summary ----
exports.attendanceSummary = (studentId) =>
  queryOne(
    `SELECT
        SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) AS absent_days,
        SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) AS late_days,
        COUNT(*) AS total_days
       FROM attendance WHERE student_id=?`,
    [studentId],
  );

// ---- Fees summary (best effort; tolerates missing tables) ----
exports.feesSummary = async (studentId) => {
  try {
    const r = await queryOne(
      `SELECT COALESCE(SUM(amount),0) AS total_billed,
              COALESCE(SUM(paid),0) AS total_paid,
              COALESCE(SUM(amount - paid),0) AS balance
         FROM (
           SELECT sf.amount AS amount, COALESCE(sf.paid_amount,0) AS paid
             FROM student_fees sf WHERE sf.student_id=?
         ) t`,
      [studentId],
    );
    return r || { total_billed: 0, total_paid: 0, balance: 0 };
  } catch {
    return { total_billed: 0, total_paid: 0, balance: 0 };
  }
};
