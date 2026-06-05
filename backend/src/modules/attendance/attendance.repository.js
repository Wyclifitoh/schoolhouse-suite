const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const { sessionFilterSql, stampSession } = require("../../utils/sessionScope");

/**
 * Student attendance lives in `student_attendance` and is uniquely keyed by
 * (student_id, date). Default mode is "all present" — only exceptions are
 * normally upserted, but the bulk endpoint accepts the full roster too.
 */

const findByClassAndDate = async (classId, schoolId, date, session) => {
  // classId here is treated as a grade_id (frontend sends grade id)
  const sf = sessionFilterSql("a", session);
  return query(
    `SELECT a.*, CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) AS student_name
       FROM student_attendance a
       JOIN students s ON s.id = a.student_id
      WHERE s.current_grade_id = ? AND a.school_id = ? AND a.date = ?${sf.sql}
      ORDER BY s.first_name`,
    [classId, schoolId, date, ...sf.params],
  );
};

const upsert = async (data, session) => {
  data = stampSession(data, session);
  const existing = await queryOne(
    "SELECT id FROM student_attendance WHERE student_id = ? AND date = ?",
    [data.student_id, data.date],
  );
  if (existing) {
    await query(
      `UPDATE student_attendance
          SET status = ?, remarks = ?, marked_by = ?,
              term_id = COALESCE(term_id, ?), academic_year_id = COALESCE(academic_year_id, ?)
        WHERE id = ?`,
      [
        data.status,
        data.remarks || null,
        data.marked_by || null,
        data.term_id || null,
        data.academic_year_id || null,
        existing.id,
      ],
    );
    return queryOne("SELECT * FROM student_attendance WHERE id = ?", [
      existing.id,
    ]);
  }
  const id = uuidv4();
  await query(
    `INSERT INTO student_attendance
       (id, school_id, student_id, date, status, remarks, marked_by, term_id, academic_year_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.student_id,
      data.date,
      data.status,
      data.remarks || null,
      data.marked_by || null,
      data.term_id || null,
      data.academic_year_id || null,
    ],
  );
  return queryOne("SELECT * FROM student_attendance WHERE id = ?", [id]);
};

const getStudentAttendance = async (
  studentId,
  schoolId,
  { limit, offset, session } = {},
) => {
  const sf = sessionFilterSql("", session);
  const rows = await query(
    `SELECT * FROM student_attendance
      WHERE student_id = ? AND school_id = ?${sf.sql}
      ORDER BY date DESC LIMIT ? OFFSET ?`,
    [studentId, schoolId, ...sf.params, limit, offset],
  );
  const countRows = await query(
    `SELECT COUNT(*) AS count FROM student_attendance
      WHERE student_id = ? AND school_id = ?${sf.sql}`,
    [studentId, schoolId, ...sf.params],
  );
  return { rows, total: Number(countRows[0]?.count || 0) };
};

const getAttendanceRegister = async (schoolId, date, gradeId, session) => {
  const sf = sessionFilterSql("a", session);
  let sql = `
    SELECT
      s.id AS student_id,
      CONCAT(s.first_name, ' ',
        COALESCE(CONCAT(s.middle_name,' '), ''),
        COALESCE(s.last_name, '')) AS student_name,
      s.admission_number,
      s.current_grade_id,
      s.current_stream_id,
      g.name AS grade_name,
      st.name AS stream_name,
      a.id AS attendance_id,
      a.date,
      COALESCE(a.status, 'present') AS status,
      a.remarks,
      CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS is_marked
    FROM students s
    LEFT JOIN student_attendance a
      ON a.student_id = s.id AND a.date = ? AND a.school_id = s.school_id${sf.sql.replace(/^ AND /, " AND ")}
    LEFT JOIN grades g ON g.id = s.current_grade_id
    LEFT JOIN streams st ON st.id = s.current_stream_id
    WHERE s.school_id = ? AND s.status = 'active'
  `;
  const params = [date, ...sf.params, schoolId];
  if (gradeId && gradeId !== "all") {
    sql += " AND s.current_grade_id = ?";
    params.push(gradeId);
  }
  sql += " ORDER BY g.order_index, st.name, s.first_name";
  return query(sql, params);
};

/**
 * Bulk save: upserts every record by (student_id, date) using the unique key.
 * Records that don't change can still safely be sent — ON DUPLICATE KEY UPDATE
 * just refreshes status/remarks/marked_by.
 */
const bulkSaveAttendance = async (records, session) => {
  if (!records || records.length === 0) return 0;

  const values = records.map((r) => {
    const s = stampSession(r, session);
    return [
      uuidv4(),
      s.school_id,
      s.student_id,
      s.date,
      s.status || "present",
      s.remarks || null,
      s.marked_by || null,
      s.term_id || null,
      s.academic_year_id || null,
    ];
  });

  const sql = `
    INSERT INTO student_attendance
      (id, school_id, student_id, date, status, remarks, marked_by, term_id, academic_year_id)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      remarks = VALUES(remarks),
      marked_by = VALUES(marked_by),
      term_id = COALESCE(term_id, VALUES(term_id)),
      academic_year_id = COALESCE(academic_year_id, VALUES(academic_year_id))
  `;
  const result = await query(sql, [values]);
  return result.affectedRows;
};

const getMonthlySummary = async (schoolId, year, month, gradeId) => {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const params = [start, end, schoolId];
  let where = "s.school_id = ? AND s.status = 'active'";
  if (gradeId && gradeId !== "all") {
    where += " AND s.current_grade_id = ?";
    params.push(gradeId);
  }
  return query(
    `SELECT
        s.id AS student_id,
        CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) AS student_name,
        s.admission_number,
        g.name AS grade_name, st.name AS stream_name,
        SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN a.status='absent'  THEN 1 ELSE 0 END) AS absent_days,
        SUM(CASE WHEN a.status='late'    THEN 1 ELSE 0 END) AS late_days,
        SUM(CASE WHEN a.status='excused' THEN 1 ELSE 0 END) AS excused_days,
        COUNT(a.id) AS total_marked
       FROM students s
       LEFT JOIN student_attendance a
         ON a.student_id = s.id AND a.date BETWEEN ? AND ?
       LEFT JOIN grades g  ON g.id  = s.current_grade_id
       LEFT JOIN streams st ON st.id = s.current_stream_id
      WHERE ${where}
      GROUP BY s.id, s.first_name, s.last_name, s.admission_number, g.name, st.name
      ORDER BY g.name, st.name, s.first_name`,
    params,
  );
};

const deleteAttendance = async (id, schoolId) =>
  query("DELETE FROM student_attendance WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);

module.exports = {
  findByClassAndDate,
  upsert,
  getStudentAttendance,
  getAttendanceRegister,
  bulkSaveAttendance,
  getMonthlySummary,
  deleteAttendance,
};
