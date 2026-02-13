const { query } = require('../../config/database');

const findByClassAndDate = async (classId, schoolId, date) => {
  const result = await query(
    `SELECT a.*, s.full_name as student_name FROM attendance a JOIN students s ON s.id = a.student_id WHERE a.class_id = $1 AND a.school_id = $2 AND a.date = $3 ORDER BY s.full_name`,
    [classId, schoolId, date]
  );
  return result.rows;
};

const upsert = async (data) => {
  const result = await query(
    `INSERT INTO attendance (school_id, student_id, class_id, date, status, marked_by) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (student_id, class_id, date) DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, updated_at = NOW() RETURNING *`,
    [data.school_id, data.student_id, data.class_id, data.date, data.status, data.marked_by]
  );
  return result.rows[0];
};

const getStudentAttendance = async (studentId, schoolId, { limit, offset }) => {
  const result = await query(
    `SELECT * FROM attendance WHERE student_id = $1 AND school_id = $2 ORDER BY date DESC LIMIT $3 OFFSET $4`,
    [studentId, schoolId, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*) FROM attendance WHERE student_id = $1 AND school_id = $2`,
    [studentId, schoolId]
  );
  return { rows: result.rows, total: parseInt(countResult.rows[0].count, 10) };
};

module.exports = { findByClassAndDate, upsert, getStudentAttendance };
