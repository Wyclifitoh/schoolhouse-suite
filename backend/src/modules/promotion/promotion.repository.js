const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

/**
 * Bulk-promote students into a target (academic_year, term, grade) by
 * inserting new `student_enrollments` rows. Existing enrollments in the
 * source session are marked `completed`. Source academic data is never
 * touched.
 */
const runPromotion = async (schoolId, body, userId) => {
  const {
    from_academic_year_id,
    from_term_id,
    to_academic_year_id,
    to_term_id,
    entries = [], // [{ student_id, action: 'promote'|'retain'|'leaving', target_grade_id? }]
  } = body || {};

  if (!to_academic_year_id || !to_term_id)
    throw Object.assign(
      new Error("to_academic_year_id and to_term_id are required"),
      { statusCode: 400 },
    );
  if (!Array.isArray(entries) || entries.length === 0)
    throw Object.assign(new Error("entries array is required"), {
      statusCode: 400,
    });

  let promoted = 0,
    retained = 0,
    leaving = 0;

  for (const e of entries) {
    if (!e.student_id) continue;

    if (e.action === "leaving") {
      await query(
        `UPDATE students SET status = 'transferred' WHERE id = ? AND school_id = ?`,
        [e.student_id, schoolId],
      );
      leaving++;
      continue;
    }

    // Mark prior enrollment(s) in the source session completed
    if (from_academic_year_id && from_term_id) {
      await query(
        `UPDATE student_enrollments SET status = 'completed'
         WHERE school_id = ? AND student_id = ?
           AND academic_year_id = ? AND term_id = ? AND status = 'active'`,
        [schoolId, e.student_id, from_academic_year_id, from_term_id],
      );
    }

    // Resolve target grade/stream
    const student = await queryOne(
      `SELECT current_grade_id, current_stream_id FROM students WHERE id = ? AND school_id = ?`,
      [e.student_id, schoolId],
    );
    const targetGrade =
      e.target_grade_id ||
      (e.action === "retain"
        ? student?.current_grade_id
        : student?.current_grade_id);

    // Insert new enrollment (unique on student+year+term)
    try {
      await query(
        `INSERT INTO student_enrollments
          (id, school_id, student_id, academic_year_id, term_id, grade_id, stream_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          uuidv4(),
          schoolId,
          e.student_id,
          to_academic_year_id,
          to_term_id,
          targetGrade || null,
          student?.current_stream_id || null,
        ],
      );
    } catch (err) {
      // Duplicate (already enrolled in target session) — non-fatal
      if (!String(err.message).includes("Duplicate")) throw err;
    }

    // Sync students.current_* pointer when promoting
    if (e.action === "promote" && e.target_grade_id) {
      await query(
        `UPDATE students SET current_grade_id = ?, current_term_id = ?
         WHERE id = ? AND school_id = ?`,
        [e.target_grade_id, to_term_id, e.student_id, schoolId],
      );
    }

    if (e.action === "promote") promoted++;
    else retained++;
  }

  // Audit
  try {
    await query(
      `INSERT INTO finance_audit_logs
        (id, school_id, action, entity_type, entity_id, performed_by, metadata)
       VALUES (?, ?, 'PROMOTION_RUN', 'promotion', ?, ?, ?)`,
      [
        uuidv4(),
        schoolId,
        `${from_academic_year_id || "na"}:${from_term_id || "na"}->${to_academic_year_id}:${to_term_id}`,
        String(userId || "system"),
        JSON.stringify({ promoted, retained, leaving, total: entries.length }),
      ],
    );
  } catch {
    /* non-fatal */
  }

  return { promoted, retained, leaving, total: entries.length };
};

const listEnrollments = (schoolId, { academicYearId, termId, gradeId }) => {
  const where = ["e.school_id = ?"];
  const params = [schoolId];
  if (academicYearId) {
    where.push("e.academic_year_id = ?");
    params.push(academicYearId);
  }
  if (termId) {
    where.push("e.term_id = ?");
    params.push(termId);
  }
  if (gradeId) {
    where.push("e.grade_id = ?");
    params.push(gradeId);
  }
  return query(
    `SELECT e.*, s.full_name, s.admission_number, g.name AS grade_name
     FROM student_enrollments e
     JOIN students s ON s.id = e.student_id
     LEFT JOIN grades g ON g.id = e.grade_id
     WHERE ${where.join(" AND ")}
     ORDER BY s.full_name`,
    params,
  );
};

module.exports = { runPromotion, listEnrollments };
