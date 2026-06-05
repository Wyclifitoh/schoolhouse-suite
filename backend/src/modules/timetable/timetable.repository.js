const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

// ============ PERIODS ============
exports.listPeriods = (schoolId) =>
  query(
    "SELECT * FROM timetable_periods WHERE school_id = ? ORDER BY position ASC, start_time ASC",
    [schoolId],
  );

exports.createPeriod = async (data) => {
  const id = uuid();
  await execute(
    `INSERT INTO timetable_periods (id, school_id, label, start_time, end_time, position, kind, is_active)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.label,
      data.start_time,
      data.end_time,
      data.position ?? 0,
      data.kind || "lesson",
      data.is_active === false ? 0 : 1,
    ],
  );
  return queryOne("SELECT * FROM timetable_periods WHERE id = ?", [id]);
};

exports.updatePeriod = async (id, schoolId, data) => {
  const allowed = [
    "label",
    "start_time",
    "end_time",
    "position",
    "kind",
    "is_active",
  ];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (!entries.length)
    return queryOne(
      "SELECT * FROM timetable_periods WHERE id = ? AND school_id = ?",
      [id, schoolId],
    );
  await execute(
    `UPDATE timetable_periods SET ${entries
      .map(([k]) => `${k} = ?`)
      .join(", ")} WHERE id = ? AND school_id = ?`,
    [...entries.map(([, v]) => v), id, schoolId],
  );
  return queryOne("SELECT * FROM timetable_periods WHERE id = ?", [id]);
};

exports.deletePeriod = (id, schoolId) =>
  execute("DELETE FROM timetable_periods WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);

// ============ REQUIREMENTS ============
exports.listRequirements = (schoolId, gradeId) => {
  let sql = `SELECT r.*, s.name AS subject_name, s.code AS subject_code, g.name AS grade_name
             FROM subject_lesson_requirements r
             JOIN subjects s ON s.id = r.subject_id
             JOIN grades   g ON g.id = r.grade_id
             WHERE r.school_id = ?`;
  const params = [schoolId];
  if (gradeId) {
    sql += " AND r.grade_id = ?";
    params.push(gradeId);
  }
  sql += " ORDER BY g.order_index, s.name";
  return query(sql, params);
};

exports.upsertRequirement = async ({
  school_id,
  grade_id,
  subject_id,
  lessons_per_week,
  double_periods = 0,
}) => {
  const existing = await queryOne(
    "SELECT id FROM subject_lesson_requirements WHERE school_id=? AND grade_id=? AND subject_id=?",
    [school_id, grade_id, subject_id],
  );
  if (existing) {
    await execute(
      "UPDATE subject_lesson_requirements SET lessons_per_week=?, double_periods=? WHERE id=?",
      [lessons_per_week, double_periods, existing.id],
    );
    return existing.id;
  }
  const id = uuid();
  await execute(
    `INSERT INTO subject_lesson_requirements (id, school_id, grade_id, subject_id, lessons_per_week, double_periods)
     VALUES (?,?,?,?,?,?)`,
    [id, school_id, grade_id, subject_id, lessons_per_week, double_periods],
  );
  return id;
};

exports.deleteRequirement = (id, schoolId) =>
  execute(
    "DELETE FROM subject_lesson_requirements WHERE id = ? AND school_id = ?",
    [id, schoolId],
  );

// ============ ENTRIES ============
exports.listEntries = (schoolId, { stream_id, teacher_id, grade_id }) => {
  let sql = `SELECT t.*, s.name AS subject, g.name AS class_name, st.name AS section,
             CONCAT(IFNULL(stf.first_name,''),' ',IFNULL(stf.last_name,'')) AS teacher
             FROM timetable_entries t
             LEFT JOIN subjects s ON s.id = t.subject_id
             LEFT JOIN grades   g ON g.id = t.grade_id
             LEFT JOIN streams  st ON st.id = t.stream_id
             LEFT JOIN staff    stf ON stf.id = t.teacher_id
             WHERE t.school_id = ?`;
  const params = [schoolId];
  if (stream_id)  { sql += " AND t.stream_id = ?";  params.push(stream_id); }
  if (teacher_id) { sql += " AND t.teacher_id = ?"; params.push(teacher_id); }
  if (grade_id)   { sql += " AND t.grade_id = ?";   params.push(grade_id); }
  sql +=
    ' ORDER BY FIELD(t.day,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"), t.period ASC';
  return query(sql, params);
};

exports.clearForStreams = async (schoolId, streamIds) => {
  if (!streamIds.length) return 0;
  const placeholders = streamIds.map(() => "?").join(",");
  const r = await execute(
    `DELETE FROM timetable_entries WHERE school_id = ? AND stream_id IN (${placeholders})`,
    [schoolId, ...streamIds],
  );
  return r.affectedRows || 0;
};

exports.bulkInsertEntries = async (schoolId, rows) => {
  if (!rows.length) return 0;
  const values = [];
  const placeholders = rows
    .map(() => "(?,?,?,?,?,?,?,?,?,?,?)")
    .join(",");
  for (const r of rows) {
    values.push(
      uuid(),
      schoolId,
      r.grade_id,
      r.stream_id,
      r.subject_id,
      r.teacher_id || null,
      r.day,
      r.period,
      r.start_time || null,
      r.end_time || null,
      r.room || null,
    );
  }
  await execute(
    `INSERT INTO timetable_entries (id, school_id, grade_id, stream_id, subject_id, teacher_id, day, period, start_time, end_time, room)
     VALUES ${placeholders}`,
    values,
  );
  return rows.length;
};

// ============ HELPERS for generator ============
exports.getStreamsForGrades = (schoolId, gradeIds) => {
  if (!gradeIds.length) return [];
  const ph = gradeIds.map(() => "?").join(",");
  return query(
    `SELECT s.id, s.name, s.grade_id, g.name AS grade_name
     FROM streams s JOIN grades g ON g.id = s.grade_id
     WHERE s.school_id = ? AND s.grade_id IN (${ph})
     ORDER BY g.order_index, s.name`,
    [schoolId, ...gradeIds],
  );
};

exports.getTeacherAllocations = (schoolId, gradeIds) => {
  if (!gradeIds.length) return [];
  const ph = gradeIds.map(() => "?").join(",");
  return query(
    `SELECT ta.teacher_id, ta.subject_id, ta.grade_id, ta.stream_id
     FROM teacher_subject_allocations ta
     WHERE ta.school_id = ? AND ta.is_active = 1 AND ta.grade_id IN (${ph})`,
    [schoolId, ...gradeIds],
  );
};

exports.detectClashes = async (schoolId) => {
  const teacherClashes = await query(
    `SELECT teacher_id, day, period, COUNT(*) c,
            GROUP_CONCAT(CONCAT(grade_id,'/',stream_id)) AS slots
     FROM timetable_entries
     WHERE school_id = ? AND teacher_id IS NOT NULL
     GROUP BY teacher_id, day, period HAVING c > 1`,
    [schoolId],
  );
  const classClashes = await query(
    `SELECT stream_id, day, period, COUNT(*) c
     FROM timetable_entries
     WHERE school_id = ?
     GROUP BY stream_id, day, period HAVING c > 1`,
    [schoolId],
  );
  return { teacherClashes, classClashes };
};
