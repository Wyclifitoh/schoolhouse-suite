// =============================================================================
// ASSESSMENT MARKS REPOSITORY — Phase 2
// Bulk entry with automatic score -> Achievement Level + Band conversion,
// auto-status (present when score present) and auto-remarks (from configured
// subject_remark_bands).
// =============================================================================
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");
const remarkBands = require("./remark-bands.repository");

// Convert raw score (relative to out_of) into the school's AL + band + points.
async function scoreToAL(schoolId, score, outOf) {
  if (score === null || score === undefined) return null;
  const pct = outOf > 0 ? (Number(score) / Number(outOf)) * 100 : 0;
  const level = await queryOne(
    `SELECT code, band_code, points FROM achievement_levels
      WHERE school_id=? AND is_active=1 AND ? BETWEEN min_score AND max_score
      ORDER BY points DESC LIMIT 1`,
    [schoolId, pct],
  );
  return level || null;
}

// ---------- LIST MARKS ----------
exports.list = (
  schoolId,
  { assessment_id, task_id, grade_id, stream_id, subject_id, student_id } = {},
) => {
  const params = [schoolId];
  let where = "a.school_id=?";
  if (assessment_id) {
    where += " AND m.assessment_id=?";
    params.push(assessment_id);
  }
  if (task_id) {
    where += " AND m.task_id=?";
    params.push(task_id);
  }
  if (subject_id) {
    where += " AND m.subject_id=?";
    params.push(subject_id);
  }
  if (student_id) {
    where += " AND m.student_id=?";
    params.push(student_id);
  }
  if (grade_id) {
    where += " AND stu.grade_id=?";
    params.push(grade_id);
  }
  if (stream_id) {
    where += " AND stu.stream_id=?";
    params.push(stream_id);
  }

  return query(
    `SELECT m.*, stu.first_name, stu.last_name, stu.admission_number,
            stu.grade_id, stu.stream_id, s.name AS subject_name, s.code AS subject_code
       FROM assessment_marks m
       JOIN assessments a ON a.id=m.assessment_id
       JOIN students stu ON stu.id=m.student_id
       JOIN subjects s ON s.id=m.subject_id
      WHERE ${where}
      ORDER BY stu.first_name, stu.last_name`,
    params,
  );
};

// ---------- ROSTER FOR A TASK ----------
// Returns every active student in the task's class (+ stream) with the current
// mark (if any) — used by the marks-entry UI.
exports.roster = async (schoolId, taskId) => {
  const t = await queryOne(
    `SELECT t.*, a.school_id AS a_school FROM assessment_tasks t
       JOIN assessments a ON a.id = t.assessment_id
      WHERE t.id=? AND a.school_id=?`,
    [taskId, schoolId],
  );
  if (!t) throw new Error("Task not found");

  // Use current_grade_id and current_stream_id instead of grade_id and stream_id
  const params = [t.grade_id];
  let where = "current_grade_id = ? AND status = 'active'";
  if (t.stream_id) {
    where += " AND current_stream_id = ?";
    params.push(t.stream_id);
  }

  const students = await query(
    `SELECT id, first_name, last_name, admission_number, gender, 
            current_grade_id as grade_id, current_stream_id as stream_id
     FROM students 
     WHERE ${where} 
     ORDER BY first_name, last_name`,
    params,
  );

  const marks = await query(
    `SELECT * FROM assessment_marks
      WHERE assessment_id=? AND subject_id=? AND student_id IN (?)`,
    [t.assessment_id, t.subject_id, students.map((s) => s.id).concat(["0"])],
  );

  const byStudent = new Map(marks.map((m) => [m.student_id, m]));

  const subj = await queryOne(
    `SELECT out_of FROM assessment_subjects WHERE assessment_id=? AND grade_id=? AND subject_id=?`,
    [t.assessment_id, t.grade_id, t.subject_id],
  );

  return {
    task: t,
    out_of: subj?.out_of || 100,
    students: students.map((s) => ({
      ...s,
      mark: byStudent.get(s.id) || null,
    })),
  };
};
// ---------- BULK SAVE ----------
// Accepts: { assessment_id, task_id?, items:[{student_id, subject_id, score, out_of, status, remarks}] }
exports.bulkSave = async (
  schoolId,
  { assessment_id, task_id, recorded_by, items },
) => {
  if (!assessment_id || !Array.isArray(items)) {
    throw new Error("assessment_id and items[] required");
  }
  const a = await queryOne(
    "SELECT id, status FROM assessments WHERE id=? AND school_id=?",
    [assessment_id, schoolId],
  );
  if (!a) throw new Error("Assessment not found");
  if (a.status === "locked" || a.status === "archived") {
    throw new Error("Assessment is locked");
  }

  // Look up the student's grade for grade-scoped remarks
  const studentIds = [...new Set(items.map((i) => i.student_id))];
  const studentGrades = new Map();
  if (studentIds.length) {
    const ph = studentIds.map(() => "?").join(",");
    const rows = await query(
      `SELECT id, current_grade_id FROM students WHERE id IN (${ph})`,
      studentIds,
    );
    rows.forEach((r) => studentGrades.set(r.id, r.current_grade_id));
  }

  const saved = [];
  for (const it of items) {
    const outOf = Number(it.out_of) || 100;
    const score =
      it.score === "" || it.score === null || it.score === undefined
        ? null
        : Number(it.score);
    const al = await scoreToAL(schoolId, score, outOf);

    // Auto-status: present when score given, pending when cleared
    // (caller may override with explicit absent/exempted/transferred_*)
    const explicitStatus =
      it.status && !["pending", "present"].includes(it.status);
    const status = explicitStatus
      ? it.status
      : score !== null
        ? "present"
        : "pending";

    // Auto-remarks: only when score present, status is present, and no manual remark
    let remarks = it.remarks;
    if (
      (remarks == null || remarks === "") &&
      score !== null &&
      status === "present"
    ) {
      const pct = outOf > 0 ? (score / outOf) * 100 : 0;
      try {
        remarks = await remarkBands.resolveRemark(schoolId, {
          subject_id: it.subject_id,
          grade_id: studentGrades.get(it.student_id) || null,
          pct,
        });
      } catch (e) {
        // non-fatal — leave remarks empty
      }
    }

    const existing = await queryOne(
      `SELECT id FROM assessment_marks
        WHERE assessment_id=? AND student_id=? AND subject_id=?`,
      [assessment_id, it.student_id, it.subject_id],
    );

    if (existing) {
      await execute(
        `UPDATE assessment_marks SET
            task_id=COALESCE(?, task_id),
            score=?, out_of=?, achievement_level_code=?, band_code=?, points=?,
            status=?, remarks=?, recorded_by=?
          WHERE id=?`,
        [
          task_id || null,
          score,
          outOf,
          al?.code || null,
          al?.band_code || null,
          al?.points ?? null,
          status,
          remarks || null,
          recorded_by || null,
          existing.id,
        ],
      );
      saved.push(existing.id);
    } else {
      const id = uuid();
      await execute(
        `INSERT INTO assessment_marks
          (id, assessment_id, task_id, student_id, subject_id, score, out_of,
           achievement_level_code, band_code, points, status, remarks, recorded_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          assessment_id,
          task_id || null,
          it.student_id,
          it.subject_id,
          score,
          outOf,
          al?.code || null,
          al?.band_code || null,
          al?.points ?? null,
          status,
          remarks || null,
          recorded_by || null,
        ],
      );
      saved.push(id);
    }
  }

  // Bump assessment to in_progress if still draft/published
  if (a.status === "draft" || a.status === "published") {
    await execute("UPDATE assessments SET status='in_progress' WHERE id=?", [
      assessment_id,
    ]);
  }

  return { saved: saved.length };
};

// ---------- SUBMIT TASK ----------
exports.submitTask = async (schoolId, taskId) => {
  const t = await queryOne(
    `SELECT t.* FROM assessment_tasks t
       JOIN assessments a ON a.id=t.assessment_id
      WHERE t.id=? AND a.school_id=?`,
    [taskId, schoolId],
  );
  if (!t) throw new Error("Task not found");
  await execute(
    `UPDATE assessment_tasks SET status='submitted', submitted_at=NOW() WHERE id=?`,
    [taskId],
  );
  return { submitted: true };
};
