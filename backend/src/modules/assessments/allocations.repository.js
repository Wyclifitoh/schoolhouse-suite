const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

// ----- Subject Allocations (class -> subjects) -----
exports.listSubjectAllocations = (schoolId, gradeId) => {
  const params = [schoolId];
  let where = "sa.school_id=?";
  if (gradeId) {
    where += " AND sa.grade_id=?";
    params.push(gradeId);
  }
  return query(
    `SELECT sa.id, sa.grade_id, sa.subject_id, sa.is_active,
            g.name AS grade_name, s.name AS subject_name, s.code AS subject_code, s.category AS subject_category
     FROM subject_allocations sa
     JOIN grades g ON g.id=sa.grade_id
     JOIN subjects s ON s.id=sa.subject_id
     WHERE ${where}
     ORDER BY g.name, s.name`,
    params,
  );
};

exports.allocateSubjects = async ({ school_id, grade_id, subject_ids }) => {
  // replace all allocations for that grade
  await execute(
    "DELETE FROM subject_allocations WHERE school_id=? AND grade_id=?",
    [school_id, grade_id],
  );
  for (const subject_id of subject_ids || []) {
    await execute(
      `INSERT INTO subject_allocations (id, school_id, grade_id, subject_id, is_active)
       VALUES (?,?,?,?,1)`,
      [uuid(), school_id, grade_id, subject_id],
    );
  }
  return exports.listSubjectAllocations(school_id, grade_id);
};

exports.removeSubjectAllocation = (id, schoolId) =>
  execute("DELETE FROM subject_allocations WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);

exports.subjectsForGrade = (schoolId, gradeId) =>
  query(
    `SELECT s.* FROM subject_allocations sa
     JOIN subjects s ON s.id=sa.subject_id
     WHERE sa.school_id=? AND sa.grade_id=? AND sa.is_active=1 AND s.status='active'
     ORDER BY s.name`,
    [schoolId, gradeId],
  );

// ----- Teacher Allocations -----
exports.listTeacherAllocations = (schoolId, { teacher_id, grade_id } = {}) => {
  const params = [schoolId];
  let where = "ta.school_id=?";
  if (teacher_id) {
    where += " AND ta.teacher_id=?";
    params.push(teacher_id);
  }
  if (grade_id) {
    where += " AND ta.grade_id=?";
    params.push(grade_id);
  }
  return query(
    `SELECT ta.id, ta.teacher_id, ta.subject_id, ta.grade_id, ta.stream_id, ta.is_active,
            CONCAT(COALESCE(t.first_name,''),' ',COALESCE(t.last_name,'')) AS teacher_name,
            s.name AS subject_name,
            g.name AS grade_name,
            st.name AS stream_name
     FROM teacher_subject_allocations ta
     JOIN teachers t ON t.id=ta.teacher_id
     JOIN subjects s ON s.id=ta.subject_id
     JOIN grades g ON g.id=ta.grade_id
     LEFT JOIN streams st ON st.id=ta.stream_id
     WHERE ${where}
     ORDER BY teacher_name, g.name, s.name`,
    params,
  );
};

exports.createTeacherAllocation = async (data) => {
  const id = uuid();
  await execute(
    `INSERT INTO teacher_subject_allocations (id, school_id, teacher_id, subject_id, grade_id, stream_id, is_active)
     VALUES (?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE is_active=1`,
    [
      id,
      data.school_id,
      data.teacher_id,
      data.subject_id,
      data.grade_id,
      data.stream_id || null,
      data.is_active !== false ? 1 : 0,
    ],
  );
  return queryOne(
    "SELECT * FROM teacher_subject_allocations WHERE teacher_id=? AND subject_id=? AND grade_id=? AND (stream_id<=>?)",
    [data.teacher_id, data.subject_id, data.grade_id, data.stream_id || null],
  );
};

exports.deleteTeacherAllocation = (id, schoolId) =>
  execute(
    "DELETE FROM teacher_subject_allocations WHERE id=? AND school_id=?",
    [id, schoolId],
  );
