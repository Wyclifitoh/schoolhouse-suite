const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

/**
 * Attendance is strictly session-scoped: every read filters by the active
 * (academic_year_id, term_id) tuple and every write stamps them.
 *
 * NOTE: backend uses MySQL — placeholders are `?`, not `$1`.
 */
const findByClassAndDate = async (classId, schoolId, date, session = {}) => {
  const params = [classId, schoolId, date];
  let sql = `SELECT a.*, s.full_name as student_name
             FROM attendance a
             JOIN students s ON s.id = a.student_id
             WHERE a.class_id = ? AND a.school_id = ? AND a.date = ?`;

  if (session.academicYearId) {
    sql += " AND a.academic_year_id = ?";
    params.push(session.academicYearId);
  }
  if (session.termId) {
    sql += " AND a.term_id = ?";
    params.push(session.termId);
  }

  sql += " ORDER BY s.full_name";
  const result = await query(sql, params);
  return result; // Assuming query() returns rows directly
};

const upsert = async (data, session = {}) => {
  // Check if record exists
  const existing = await queryOne(
    "SELECT id FROM attendance WHERE student_id = ? AND class_id = ? AND date = ?",
    [data.student_id, data.class_id, data.date],
  );

  if (existing) {
    // Update existing record
    await query(
      `UPDATE attendance 
       SET status = ?, 
           marked_by = ?, 
           academic_year_id = ?, 
           term_id = ?, 
           updated_at = NOW()
       WHERE id = ?`,
      [
        data.status,
        data.marked_by,
        session.academicYearId || null,
        session.termId || null,
        existing.id,
      ],
    );
    return queryOne("SELECT * FROM attendance WHERE id = ?", [existing.id]);
  }

  // Insert new record
  const id = uuidv4();
  await query(
    `INSERT INTO attendance
      (id, school_id, student_id, class_id, date, status, marked_by, academic_year_id, term_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.student_id,
      data.class_id,
      data.date,
      data.status,
      data.marked_by,
      session.academicYearId || null,
      session.termId || null,
    ],
  );
  return queryOne("SELECT * FROM attendance WHERE id = ?", [id]);
};

const getStudentAttendance = async (
  studentId,
  schoolId,
  { limit, offset },
  session = {},
) => {
  const params = [studentId, schoolId];
  let where = "student_id = ? AND school_id = ?";

  if (session.academicYearId) {
    where += " AND academic_year_id = ?";
    params.push(session.academicYearId);
  }
  if (session.termId) {
    where += " AND term_id = ?";
    params.push(session.termId);
  }

  // Get paginated results
  const rows = await query(
    `SELECT * FROM attendance WHERE ${where} ORDER BY date DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  // Get total count
  const countRows = await query(
    `SELECT COUNT(*) AS count FROM attendance WHERE ${where}`,
    params,
  );

  return {
    rows,
    total: Number(countRows[0]?.count || 0),
  };
};

const getAttendanceRegister = async (schoolId, date, gradeId) => {
  let sql = `
    SELECT 
      s.id AS student_id,
      CONCAT(s.first_name, ' ', COALESCE(s.middle_name, ''), ' ', s.last_name) AS student_name,
      s.admission_number,
      s.current_grade_id,
      a.id AS attendance_id,
      a.date,
      COALESCE(a.status, 'present') AS status, -- Defaults to present if unrecorded
      CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_marked
    FROM students s
    LEFT JOIN attendance a 
      ON s.id = a.student_id AND a.date = ?
    WHERE s.school_id = ?
  `;

  const params = [date, schoolId];

  // Dynamic grade filtering if specified
  if (gradeId && gradeId !== "all") {
    sql += ` AND s.current_grade_id = ?`;
    params.push(gradeId);
  }

  sql += ` ORDER BY s.first_name ASC`;
  return await query(sql, params);
};

const bulkSaveAttendance = async (records, session = {}) => {
  if (!records || records.length === 0) return 0;

  // Build values for bulk insert
  const values = records.map((r) => [
    uuidv4(),
    r.school_id,
    r.student_id,
    r.date,
    r.status,
    session.academicYearId || null,
    session.termId || null,
    r.marked_by || null,
  ]);

  const sql = `
    INSERT INTO attendance (id, school_id, student_id, date, status, academic_year_id, term_id, marked_by)
    VALUES ?
    ON DUPLICATE KEY UPDATE 
      status = VALUES(status),
      marked_by = VALUES(marked_by),
      updated_at = NOW()
  `;

  const result = await query(sql, [values]);
  return result.affectedRows;
};

module.exports = {
  findByClassAndDate,
  upsert,
  getStudentAttendance,
  getAttendanceRegister,
  bulkSaveAttendance,
};
