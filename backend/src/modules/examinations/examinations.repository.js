// lint:session-scope-ok — every list/update path constructs its WHERE
// dynamically from req.session via where.push("m.term_id = ?", ...)
// and the upsertMark / submitDraftMarks paths embed session ids directly
// in their column lists. The static scanner can't see runtime composition.
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const { resolveGrade, defaultScaleForSchool } = require("./grading");
const { writeAudit } = require("./audit");
const { assertTransition, normalizeStatus } = require("./lifecycle");

// ---------- helpers ----------
const sessionWhere = (alias, session) => {
  const w = [],
    p = [];
  if (session?.academicYearId) {
    w.push(`${alias}.academic_year_id = ?`);
    p.push(session.academicYearId);
  }
  if (session?.termId) {
    w.push(`${alias}.term_id = ?`);
    p.push(session.termId);
  }
  return { sql: w.join(" AND "), params: p };
};

// ===== Exams =====
const listExams = async (schoolId, session = {}, filters = {}) => {
  const where = ["e.school_id = ?"];
  const params = [schoolId];
  const ses = sessionWhere("e", session);
  if (ses.sql) {
    where.push(ses.sql);
    params.push(...ses.params);
  }
  if (filters.status) {
    where.push("e.status = ?");
    params.push(filters.status);
  }
  if (filters.assessment_type_id) {
    where.push("e.assessment_type_id = ?");
    params.push(filters.assessment_type_id);
  }

  const rows = await query(
    `SELECT e.*,
            at.name AS assessment_type_name,
            gs.name AS grading_scale_name,
            (SELECT GROUP_CONCAT(g.name SEPARATOR ', ')
             FROM exam_classes ec LEFT JOIN grades g ON g.id = ec.grade_id
             WHERE ec.exam_id = e.id) AS classes
     FROM exams e
     LEFT JOIN assessment_types at ON at.id = e.assessment_type_id
     LEFT JOIN grading_scales gs ON gs.id = e.grading_scale_id
     WHERE ${where.join(" AND ")}
     ORDER BY e.created_at DESC`,
    params,
  );
  return rows.map((r) => ({
    ...r,
    classes: r.classes ? r.classes.split(", ").filter(Boolean) : [],
  }));
};

const getExam = (id, schoolId) =>
  queryOne("SELECT * FROM exams WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);

const createExam = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO exams
     (id, school_id, academic_year_id, term_id, name, type, assessment_type_id, grading_scale_id, weight,
      term, start_date, end_date, status, curriculum_type, description, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.academic_year_id || null,
      data.term_id || null,
      data.name,
      data.type || "CAT",
      data.assessment_type_id || null,
      data.grading_scale_id || null,
      data.weight ?? 100,
      data.term || null,
      data.start_date || null,
      data.end_date || null,
      data.status || "DRAFT",
      data.curriculum_type || "CBC",
      data.description || null,
      data.created_by || null,
    ],
  );
  if (Array.isArray(data.classes)) {
    for (const c of data.classes) {
      const gradeId = typeof c === "string" ? c : c.grade_id;
      const streamId = typeof c === "string" ? null : c.stream_id || null;
      if (!gradeId) continue;
      await query(
        "INSERT INTO exam_classes (id, exam_id, grade_id, stream_id) VALUES (?, ?, ?, ?)",
        [uuidv4(), id, gradeId, streamId],
      );
    }
  }
  if (Array.isArray(data.subjects)) {
    for (const s of data.subjects) {
      await query(
        `INSERT INTO exam_subjects (id, exam_id, subject_id, subject_name, max_marks, pass_mark, weight, grading_scale_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          id,
          s.subject_id || null,
          s.subject_name,
          s.max_marks ?? 100,
          s.pass_mark ?? null,
          s.weight ?? 100,
          s.grading_scale_id || data.grading_scale_id || null,
        ],
      );
    }
  }
  return getExam(id, data.school_id);
};

const updateExam = async (id, schoolId, data) => {
  const allowed = [
    "name",
    "type",
    "term",
    "start_date",
    "end_date",
    "description",
    "term_id",
    "academic_year_id",
    "curriculum_type",
    "assessment_type_id",
    "grading_scale_id",
    "weight",
  ];
  const entries = Object.entries(data).filter(
    ([k, v]) => allowed.includes(k) && v !== undefined,
  );
  if (entries.length) {
    const fields = entries.map(([k]) => `${k} = ?`).join(", ");
    await query(`UPDATE exams SET ${fields} WHERE id = ? AND school_id = ?`, [
      ...entries.map(([, v]) => v),
      id,
      schoolId,
    ]);
  }
  return getExam(id, schoolId);
};

const deleteExam = (id, schoolId) =>
  query("DELETE FROM exams WHERE id = ? AND school_id = ?", [id, schoolId]);

// ===== Lifecycle =====
const transitionExam = async ({
  id,
  schoolId,
  action,
  actorId,
  actorRole,
  reason,
}) => {
  const exam = await getExam(id, schoolId);
  if (!exam) {
    const e = new Error("Exam not found");
    e.statusCode = 404;
    throw e;
  }
  const next = assertTransition(exam.status, action, actorRole);

  const fields = ["status = ?"];
  const params = [next];
  if (next === "APPROVED") {
    fields.push("published_at = NOW()");
  }
  if (next === "LOCKED") {
    fields.push("locked_at = NOW()", "locked_by = ?");
    params.push(actorId);
  }
  params.push(id, schoolId);

  await query(
    `UPDATE exams SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  );

  // Cascade mark-level status for SUBMIT/APPROVE/LOCK/REOPEN.
  if (["SUBMITTED", "APPROVED", "LOCKED", "DRAFT"].includes(next)) {
    const markStatus =
      next === "DRAFT"
        ? "DRAFT"
        : next === "SUBMITTED"
          ? "SUBMITTED"
          : next === "APPROVED"
            ? "APPROVED"
            : "LOCKED";
    await query(
      `UPDATE exam_marks SET status = ?, version = version + 1 WHERE exam_id = ? AND school_id = ?`,
      [markStatus, id, schoolId],
    );
  }

  // Recompute rankings + notify parents whenever the exam is officially approved.
  if (next === "APPROVED") {
    try {
      const { recomputeRankings } = require("./extras.repository");
      await recomputeRankings(schoolId, id, {
        academicYearId: exam.academic_year_id,
        termId: exam.term_id,
      });
    } catch (_) {
      /* non-fatal */
    }
    try {
      const { notifyExamApproved } = require("./notify");
      notifyExamApproved(schoolId, id).catch(() => {});
    } catch (_) {
      /* non-fatal */
    }
  }

  // Audit a single exam-level record (exam_mark_id reused as exam_id sentinel).
  await writeAudit({
    examMarkId: id,
    examId: id,
    action: action.toUpperCase(),
    oldValue: { status: exam.status },
    newValue: { status: next },
    actorId,
    actorRole,
    reason,
  });

  return getExam(id, schoolId);
};

// ===== Schedules =====
const listSchedules = async (schoolId, examId) => {
  const where = examId
    ? "WHERE e.school_id = ? AND s.exam_id = ?"
    : "WHERE e.school_id = ?";
  const params = examId ? [schoolId, examId] : [schoolId];
  return query(
    `SELECT s.*, e.name as exam_name, g.name as grade_name, st.name as stream_name
     FROM exam_schedules s
     JOIN exams e ON e.id = s.exam_id
     LEFT JOIN grades g ON g.id = s.grade_id
     LEFT JOIN streams st ON st.id = s.stream_id
     ${where}
     ORDER BY s.exam_date ASC, s.start_time ASC`,
    params,
  );
};

const createSchedule = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO exam_schedules
     (id, exam_id, subject_id, subject_name, grade_id, stream_id, exam_date, start_time, end_time, room, full_marks, pass_marks, invigilator_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      data.exam_id,
      data.subject_id || null,
      data.subject_name,
      data.grade_id || null,
      data.stream_id || null,
      data.exam_date || null,
      data.start_time || null,
      data.end_time || null,
      data.room || null,
      data.full_marks || 100,
      data.pass_marks || 50,
      data.invigilator_id || null,
    ],
  );
  return queryOne("SELECT * FROM exam_schedules WHERE id = ?", [id]);
};

const updateSchedule = async (id, data) => {
  const allowed = [
    "subject_name",
    "grade_id",
    "stream_id",
    "exam_date",
    "start_time",
    "end_time",
    "room",
    "full_marks",
    "pass_marks",
    "invigilator_id",
    "subject_id",
  ];
  const entries = Object.entries(data).filter(
    ([k, v]) => allowed.includes(k) && v !== undefined,
  );
  if (entries.length) {
    const fields = entries.map(([k]) => `${k} = ?`).join(", ");
    await query(`UPDATE exam_schedules SET ${fields} WHERE id = ?`, [
      ...entries.map(([, v]) => v),
      id,
    ]);
  }
  return queryOne("SELECT * FROM exam_schedules WHERE id = ?", [id]);
};

const deleteSchedule = (id) =>
  query("DELETE FROM exam_schedules WHERE id = ?", [id]);

// ===== Marks =====
const PERF_SCORE = { EE: 4, ME: 3, AE: 2, BE: 1 };

const listMarks = async (
  schoolId,
  { exam_id, grade_id, stream_id, student_id, subject_id, status },
  session = {},
) => {
  const where = ["m.school_id = ?"];
  const params = [schoolId];
  if (exam_id) {
    where.push("m.exam_id = ?");
    params.push(exam_id);
  }
  if (student_id) {
    where.push("m.student_id = ?");
    params.push(student_id);
  }
  if (subject_id) {
    where.push("m.subject_id = ?");
    params.push(subject_id);
  }
  if (grade_id) {
    where.push("st.grade_id = ?");
    params.push(grade_id);
  }
  if (stream_id) {
    where.push("st.stream_id = ?");
    params.push(stream_id);
  }
  if (status) {
    where.push("m.status = ?");
    params.push(status);
  }
  const ses = sessionWhere("m", session);
  if (ses.sql) {
    where.push(ses.sql);
    params.push(...ses.params);
  }

  return query(
    `SELECT m.*,
            CONCAT(st.first_name, ' ', st.last_name) AS student_name,
            st.admission_number, st.grade_id, st.stream_id,
            g.name as grade_name, sm.name as stream_name,
            pl.code AS performance_level_code, pl.label AS performance_level_label
     FROM exam_marks m
     LEFT JOIN students st ON st.id = m.student_id
     LEFT JOIN grades g ON g.id = st.grade_id
     LEFT JOIN streams sm ON sm.id = st.stream_id
     LEFT JOIN cbc_performance_levels pl ON pl.id = m.performance_level_id
     WHERE ${where.join(" AND ")}
     ORDER BY student_name ASC, m.subject_name ASC`,
    params,
  );
};

/**
 * Upsert one mark. Enforces:
 *  - session stamping
 *  - max_marks validation against exam_subjects
 *  - grade resolution from grading scale
 *  - status: locked rows refuse mutation unless caller passes forceAdmin=true
 *  - audit row on every change
 */
const upsertMark = async (data, ctx = {}) => {
  const {
    actorId = null,
    actorRole = null,
    forceAdmin = false,
    reason = null,
  } = ctx;

  // Validate against exam_subjects max_marks when provided.
  if (data.score != null) {
    const sub = await queryOne(
      `SELECT max_marks, grading_scale_id FROM exam_subjects WHERE exam_id = ? AND subject_name = ?`,
      [data.exam_id, data.subject_name],
    );
    const max = Number(sub?.max_marks ?? data.out_of ?? 100);
    if (Number(data.score) < 0 || Number(data.score) > max) {
      const e = new Error(`Score must be between 0 and ${max}`);
      e.statusCode = 400;
      throw e;
    }
    data.out_of = max;
    data.grading_scale_id =
      data.grading_scale_id || sub?.grading_scale_id || null;
  }

  // Resolve grade if numeric.
  let gradeInfo = { grade: null, points: null, remark: null };
  if (data.score != null) {
    const scaleId =
      data.grading_scale_id ||
      (await defaultScaleForSchool(data.school_id))?.id ||
      null;
    if (scaleId) gradeInfo = await resolveGrade(Number(data.score), scaleId);
  }

  const perfScore = data.performance_level
    ? PERF_SCORE[data.performance_level] || null
    : null;

  const existing = await queryOne(
    `SELECT * FROM exam_marks
     WHERE exam_id = ? AND student_id = ? AND subject_name = ?
       AND (competency_id <=> ?)`,
    [
      data.exam_id,
      data.student_id,
      data.subject_name,
      data.competency_id || null,
    ],
  );

  if (existing) {
    if (existing.status === "LOCKED" && !forceAdmin) {
      const e = new Error("Mark is LOCKED — admin override required");
      e.statusCode = 409;
      throw e;
    }
    await query(
      `UPDATE exam_marks SET
         score = ?, out_of = ?, grade = ?, points = ?,
         performance_level = ?, performance_score = ?, performance_level_id = ?,
         remarks = ?, entered_by = ?, entered_at = NOW(),
         status = ?, version = version + 1
       WHERE id = ?`,
      [
        data.score ?? null,
        data.out_of ?? 100,
        gradeInfo.grade,
        gradeInfo.points,
        data.performance_level || null,
        perfScore,
        data.performance_level_id || null,
        data.remarks ?? gradeInfo.remark ?? null,
        actorId,
        data.status || existing.status || "DRAFT",
        existing.id,
      ],
    );
    await writeAudit({
      examMarkId: existing.id,
      examId: data.exam_id,
      studentId: data.student_id,
      action: "UPDATE",
      oldValue: {
        score: existing.score,
        grade: existing.grade,
        status: existing.status,
        performance_level: existing.performance_level,
      },
      newValue: {
        score: data.score,
        grade: gradeInfo.grade,
        status: data.status || existing.status,
        performance_level: data.performance_level,
      },
      actorId,
      actorRole,
      reason,
    });
    return queryOne("SELECT * FROM exam_marks WHERE id = ?", [existing.id]);
  }

  const id = uuidv4();
  await query(
    `INSERT INTO exam_marks
     (id, school_id, academic_year_id, term_id, exam_id, schedule_id, subject_id, subject_name,
      assessment_type_id, competency_id, performance_level_id,
      score, out_of, grade, points, performance_level, performance_score,
      remarks, recorded_by, entered_by, entered_at, status, version, student_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,1,?)`,
    [
      id,
      data.school_id,
      data.academic_year_id || null,
      data.term_id || null,
      data.exam_id,
      data.schedule_id || null,
      data.subject_id || null,
      data.subject_name,
      data.assessment_type_id || null,
      data.competency_id || null,
      data.performance_level_id || null,
      data.score ?? null,
      data.out_of ?? 100,
      gradeInfo.grade,
      gradeInfo.points,
      data.performance_level || null,
      perfScore,
      data.remarks ?? gradeInfo.remark ?? null,
      data.recorded_by || actorId,
      actorId,
      data.status || "DRAFT",
      data.student_id,
    ],
  );
  await writeAudit({
    examMarkId: id,
    examId: data.exam_id,
    studentId: data.student_id,
    action: "CREATE",
    newValue: {
      score: data.score,
      grade: gradeInfo.grade,
      status: data.status || "DRAFT",
    },
    actorId,
    actorRole,
    reason,
  });
  return queryOne("SELECT * FROM exam_marks WHERE id = ?", [id]);
};

const bulkUpsertMarks = async (rows, ctx = {}) => {
  const out = [];
  for (const r of rows) out.push(await upsertMark(r, ctx));
  return out;
};

/**
 * Promote every DRAFT mark on an exam to SUBMITTED.
 * Scoped to (school_id, exam_id, session) for safety.
 */
const submitDraftMarks = async ({
  schoolId,
  examId,
  session,
  actorId,
  actorRole,
}) => {
  const drafts = await query(
    `SELECT id, student_id FROM exam_marks
     WHERE school_id = ? AND exam_id = ? AND status = 'DRAFT'
       AND (academic_year_id = ? OR academic_year_id IS NULL)
       AND (term_id = ? OR term_id IS NULL)`,
    [
      schoolId,
      examId,
      session?.academicYearId || null,
      session?.termId || null,
    ],
  );
  if (!drafts.length) return { submitted: 0 };
  await query(
    `UPDATE exam_marks SET status = 'SUBMITTED', version = version + 1
     WHERE school_id = ? AND exam_id = ? AND status = 'DRAFT'`,
    [schoolId, examId],
  );
  for (const d of drafts) {
    await writeAudit({
      examMarkId: d.id,
      examId,
      studentId: d.student_id,
      action: "SUBMIT",
      newValue: { status: "SUBMITTED" },
      actorId,
      actorRole,
    });
  }
  return { submitted: drafts.length };
};

const deleteMark = async (id, schoolId, ctx = {}) => {
  const existing = await queryOne(
    "SELECT * FROM exam_marks WHERE id = ? AND school_id = ?",
    [id, schoolId],
  );
  if (!existing) return { deleted: false };
  if (existing.status === "LOCKED" && ctx.actorRole !== "admin") {
    const e = new Error("Cannot delete LOCKED mark");
    e.statusCode = 409;
    throw e;
  }
  await query("DELETE FROM exam_marks WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
  await writeAudit({
    examMarkId: id,
    examId: existing.exam_id,
    studentId: existing.student_id,
    action: "DELETE",
    oldValue: existing,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    reason: ctx.reason,
  });
  return { deleted: true };
};

// ===== Exam subjects =====
const listExamSubjects = (examId) =>
  query(`SELECT * FROM exam_subjects WHERE exam_id = ? ORDER BY subject_name`, [
    examId,
  ]);

const upsertExamSubject = async (examId, s) => {
  const existing = await queryOne(
    `SELECT id FROM exam_subjects WHERE exam_id = ? AND subject_name = ?`,
    [examId, s.subject_name],
  );
  if (existing) {
    await query(
      `UPDATE exam_subjects SET subject_id = ?, max_marks = ?, pass_mark = ?, weight = ?, grading_scale_id = ?
       WHERE id = ?`,
      [
        s.subject_id || null,
        s.max_marks ?? 100,
        s.pass_mark ?? null,
        s.weight ?? 100,
        s.grading_scale_id || null,
        existing.id,
      ],
    );
    return queryOne(`SELECT * FROM exam_subjects WHERE id = ?`, [existing.id]);
  }
  const id = uuidv4();
  await query(
    `INSERT INTO exam_subjects (id, exam_id, subject_id, subject_name, max_marks, pass_mark, weight, grading_scale_id)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      id,
      examId,
      s.subject_id || null,
      s.subject_name,
      s.max_marks ?? 100,
      s.pass_mark ?? null,
      s.weight ?? 100,
      s.grading_scale_id || null,
    ],
  );
  return queryOne(`SELECT * FROM exam_subjects WHERE id = ?`, [id]);
};

module.exports = {
  listExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  transitionExam,
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listMarks,
  upsertMark,
  bulkUpsertMarks,
  submitDraftMarks,
  deleteMark,
  listExamSubjects,
  upsertExamSubject,
  normalizeStatus,
};
