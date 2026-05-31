// =============================================================================
// ASSESSMENTS REPOSITORY — Phase 2
// CRUD for assessments, auto-generation of teacher tasks, status lifecycle.
// =============================================================================
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

// ---------- LIST ----------
exports.list = async (schoolId, { status, term_id, year_id, type_id, q } = {}) => {
  const params = [schoolId];
  let where = "a.school_id=?";
  if (status) { where += " AND a.status=?"; params.push(status); }
  if (term_id) { where += " AND a.term_id=?"; params.push(term_id); }
  if (year_id) { where += " AND a.academic_year_id=?"; params.push(year_id); }
  if (type_id) { where += " AND a.assessment_type_id=?"; params.push(type_id); }
  if (q) { where += " AND a.name LIKE ?"; params.push(`%${q}%`); }

  return query(
    `SELECT a.*, at.name AS type_name, at.code AS type_code, at.weight AS type_weight,
            (SELECT COUNT(*) FROM assessment_classes ac WHERE ac.assessment_id=a.id) AS class_count,
            (SELECT COUNT(*) FROM assessment_subjects asu WHERE asu.assessment_id=a.id) AS subject_count,
            (SELECT COUNT(*) FROM assessment_tasks t WHERE t.assessment_id=a.id) AS task_count,
            (SELECT COUNT(*) FROM assessment_tasks t WHERE t.assessment_id=a.id AND t.status IN ('submitted','approved','locked')) AS task_done
       FROM assessments a
       LEFT JOIN assessment_types at ON at.id=a.assessment_type_id
      WHERE ${where}
      ORDER BY a.created_at DESC`,
    params,
  );
};

// ---------- GET ONE ----------
exports.get = async (id, schoolId) => {
  const a = await queryOne(
    `SELECT a.*, at.name AS type_name, at.code AS type_code, at.weight AS type_weight
       FROM assessments a LEFT JOIN assessment_types at ON at.id=a.assessment_type_id
      WHERE a.id=? AND a.school_id=?`,
    [id, schoolId],
  );
  if (!a) return null;
  a.classes = await query(
    `SELECT ac.id, ac.grade_id, g.name AS grade_name
       FROM assessment_classes ac JOIN grades g ON g.id=ac.grade_id
      WHERE ac.assessment_id=? ORDER BY g.name`,
    [id],
  );
  a.subjects = await query(
    `SELECT asu.id, asu.grade_id, asu.subject_id, asu.out_of,
            g.name AS grade_name, s.name AS subject_name, s.code AS subject_code
       FROM assessment_subjects asu
       JOIN grades g ON g.id=asu.grade_id
       JOIN subjects s ON s.id=asu.subject_id
      WHERE asu.assessment_id=? ORDER BY g.name, s.name`,
    [id],
  );
  return a;
};

// ---------- CREATE ----------
exports.create = async (data) => {
  const id = uuid();
  await execute(
    `INSERT INTO assessments (id, school_id, academic_year_id, term_id, assessment_type_id,
        name, description, start_date, end_date, status, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.academic_year_id || null,
      data.term_id || null,
      data.assessment_type_id || null,
      data.name,
      data.description || null,
      data.start_date || null,
      data.end_date || null,
      data.status || "draft",
      data.created_by || null,
    ],
  );

  // attach classes
  const gradeIds = Array.isArray(data.grade_ids) ? data.grade_ids : [];
  for (const gid of gradeIds) {
    await execute(
      `INSERT INTO assessment_classes (id, assessment_id, grade_id) VALUES (?,?,?)`,
      [uuid(), id, gid],
    );
  }

  // auto-attach subjects from subject_allocations for each grade
  for (const gid of gradeIds) {
    const subs = await query(
      `SELECT subject_id FROM subject_allocations
        WHERE school_id=? AND grade_id=? AND is_active=1`,
      [data.school_id, gid],
    );
    for (const { subject_id } of subs) {
      await execute(
        `INSERT IGNORE INTO assessment_subjects (id, assessment_id, grade_id, subject_id, out_of)
         VALUES (?,?,?,?,?)`,
        [uuid(), id, gid, subject_id, data.out_of || 100],
      );
    }
  }

  return exports.get(id, data.school_id);
};

// ---------- UPDATE ----------
exports.update = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const k of [
    "name", "description", "start_date", "end_date",
    "assessment_type_id", "academic_year_id", "term_id", "status",
  ]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(data[k]);
    }
  }
  if (fields.length) {
    values.push(id, schoolId);
    await execute(
      `UPDATE assessments SET ${fields.join(",")} WHERE id=? AND school_id=?`,
      values,
    );
  }
  return exports.get(id, schoolId);
};

// ---------- DELETE ----------
exports.remove = (id, schoolId) =>
  execute("DELETE FROM assessments WHERE id=? AND school_id=?", [id, schoolId]);

// ---------- PUBLISH + AUTO-GENERATE TASKS ----------
exports.publish = async (id, schoolId) => {
  const a = await queryOne(
    "SELECT * FROM assessments WHERE id=? AND school_id=?",
    [id, schoolId],
  );
  if (!a) throw new Error("Assessment not found");

  // For every (grade, subject) on the assessment, generate tasks per stream
  // and pick the allocated teacher (if any).
  const subs = await query(
    `SELECT grade_id, subject_id FROM assessment_subjects WHERE assessment_id=?`,
    [id],
  );

  for (const { grade_id, subject_id } of subs) {
    const streams = await query(
      `SELECT id FROM streams WHERE grade_id=? AND (is_active=1 OR is_active IS NULL)`,
      [grade_id],
    );
    const targets = streams.length
      ? streams.map((s) => s.id)
      : [null]; // grade-only task when no streams

    for (const stream_id of targets) {
      // pick allocated teacher
      const teacher = await queryOne(
        `SELECT teacher_id FROM teacher_subject_allocations
          WHERE school_id=? AND subject_id=? AND grade_id=?
            AND (stream_id<=>? OR stream_id IS NULL)
            AND is_active=1
          ORDER BY (stream_id IS NULL) ASC LIMIT 1`,
        [schoolId, subject_id, grade_id, stream_id],
      );

      // skip if a task already exists for this slot
      const existing = await queryOne(
        `SELECT id FROM assessment_tasks
          WHERE assessment_id=? AND grade_id=? AND (stream_id<=>?) AND subject_id=?`,
        [id, grade_id, stream_id, subject_id],
      );
      if (existing) continue;

      await execute(
        `INSERT INTO assessment_tasks
          (id, assessment_id, grade_id, stream_id, subject_id, teacher_id, status)
         VALUES (?,?,?,?,?,?, 'pending')`,
        [uuid(), id, grade_id, stream_id, subject_id, teacher?.teacher_id || null],
      );
    }
  }

  await execute(
    `UPDATE assessments SET status='published', published_at=NOW() WHERE id=? AND school_id=?`,
    [id, schoolId],
  );
  return exports.get(id, schoolId);
};

// ---------- LOCK / UNLOCK / ARCHIVE ----------
exports.setStatus = async (id, schoolId, status) => {
  const map = {
    locked: `UPDATE assessments SET status='locked', locked_at=NOW() WHERE id=? AND school_id=?`,
    archived: `UPDATE assessments SET status='archived' WHERE id=? AND school_id=?`,
    in_progress: `UPDATE assessments SET status='in_progress' WHERE id=? AND school_id=?`,
    draft: `UPDATE assessments SET status='draft', published_at=NULL, locked_at=NULL WHERE id=? AND school_id=?`,
  };
  if (!map[status]) throw new Error("Invalid status");
  await execute(map[status], [id, schoolId]);
  return exports.get(id, schoolId);
};

// ---------- TASKS ----------
exports.listTasks = (schoolId, { assessment_id, teacher_id, status, grade_id } = {}) => {
  const params = [schoolId];
  let where = "a.school_id=?";
  if (assessment_id) { where += " AND t.assessment_id=?"; params.push(assessment_id); }
  if (teacher_id) { where += " AND t.teacher_id=?"; params.push(teacher_id); }
  if (status) { where += " AND t.status=?"; params.push(status); }
  if (grade_id) { where += " AND t.grade_id=?"; params.push(grade_id); }
  return query(
    `SELECT t.*, a.name AS assessment_name, a.status AS assessment_status,
            g.name AS grade_name, st.name AS stream_name,
            s.name AS subject_name, s.code AS subject_code,
            CONCAT(COALESCE(te.first_name,''),' ',COALESCE(te.last_name,'')) AS teacher_name,
            (SELECT COUNT(*) FROM students stu WHERE stu.grade_id=t.grade_id
                AND (stu.stream_id<=>t.stream_id OR t.stream_id IS NULL)
                AND stu.status='active') AS student_count,
            (SELECT COUNT(*) FROM assessment_marks m WHERE m.task_id=t.id AND m.score IS NOT NULL) AS marked_count
       FROM assessment_tasks t
       JOIN assessments a ON a.id=t.assessment_id
       JOIN grades g ON g.id=t.grade_id
       JOIN subjects s ON s.id=t.subject_id
       LEFT JOIN streams st ON st.id=t.stream_id
       LEFT JOIN teachers te ON te.id=t.teacher_id
      WHERE ${where}
      ORDER BY a.created_at DESC, g.name, s.name`,
    params,
  );
};

exports.reassignTask = (id, teacher_id) =>
  execute("UPDATE assessment_tasks SET teacher_id=? WHERE id=?", [teacher_id, id]);

exports.setTaskStatus = (id, status) =>
  execute(
    `UPDATE assessment_tasks SET status=?, submitted_at=CASE WHEN ?='submitted' THEN NOW() ELSE submitted_at END WHERE id=?`,
    [status, status, id],
  );
