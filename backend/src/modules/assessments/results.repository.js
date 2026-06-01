// =============================================================================
// ASSESSMENT RESULTS — Phase 3
// Aggregates marks per student, computes AL/band, optional rankings,
// supports review → approve → publish lifecycle.
// =============================================================================
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

async function overallAL(schoolId, pct) {
  const level = await queryOne(
    `SELECT code, band_code FROM achievement_levels
      WHERE school_id=? AND is_active=1 AND ? BETWEEN min_score AND max_score
      ORDER BY points DESC LIMIT 1`,
    [schoolId, pct],
  );
  return level || { code: null, band_code: null };
}

// ---------- COMPUTE RESULTS ----------
// Aggregates marks for an assessment, fills assessment_results, and
// (optionally) computes positions (class/stream/grade).
exports.compute = async (
  schoolId,
  assessmentId,
  { include_positions = true } = {},
) => {
  const a = await queryOne(
    "SELECT id, status FROM assessments WHERE id=? AND school_id=?",
    [assessmentId, schoolId],
  );
  if (!a) throw new Error("Assessment not found");
  if (a.status === "archived") throw new Error("Assessment is archived");

  // Pull aggregates per student - FIXED column names
  const rows = await query(
    `SELECT m.student_id,
            stu.current_grade_id AS grade_id, 
            stu.current_stream_id AS stream_id,
            COUNT(DISTINCT m.subject_id) AS subjects_count,
            COALESCE(SUM(m.score),0) AS total_score,
            COALESCE(SUM(m.out_of),0) AS total_out_of,
            COALESCE(SUM(m.points),0) AS total_points
       FROM assessment_marks m
       JOIN students stu ON stu.id = m.student_id
      WHERE m.assessment_id=? AND m.status IN ('present','transferred_in')
        AND m.score IS NOT NULL
      GROUP BY m.student_id, stu.current_grade_id, stu.current_stream_id`,
    [assessmentId],
  );

  // Upsert each row
  for (const r of rows) {
    const pct =
      r.total_out_of > 0
        ? (Number(r.total_score) / Number(r.total_out_of)) * 100
        : 0;
    const mean_points =
      r.subjects_count > 0
        ? Number(r.total_points) / Number(r.subjects_count)
        : 0;
    const mean_score =
      r.subjects_count > 0
        ? Number(r.total_score) / Number(r.subjects_count)
        : 0;
    const al = await overallAL(schoolId, pct);

    const existing = await queryOne(
      "SELECT id, status FROM assessment_results WHERE assessment_id=? AND student_id=?",
      [assessmentId, r.student_id],
    );
    if (existing) {
      // Don't overwrite if already approved/published
      if (existing.status === "approved" || existing.status === "published")
        continue;
      await execute(
        `UPDATE assessment_results SET
            grade_id=?, stream_id=?, subjects_count=?, total_score=?, total_out_of=?,
            mean_score=?, percentage=?, total_points=?, mean_points=?,
            overall_al=?, overall_band=?, status='pending_review'
          WHERE id=?`,
        [
          r.grade_id,
          r.stream_id,
          r.subjects_count,
          r.total_score,
          r.total_out_of,
          mean_score,
          pct,
          r.total_points,
          mean_points,
          al.code,
          al.band_code,
          existing.id,
        ],
      );
    } else {
      await execute(
        `INSERT INTO assessment_results
          (id, assessment_id, student_id, grade_id, stream_id, subjects_count,
           total_score, total_out_of, mean_score, percentage, total_points,
           mean_points, overall_al, overall_band, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending_review')`,
        [
          uuid(),
          assessmentId,
          r.student_id,
          r.grade_id,
          r.stream_id,
          r.subjects_count,
          r.total_score,
          r.total_out_of,
          mean_score,
          pct,
          r.total_points,
          mean_points,
          al.code,
          al.band_code,
        ],
      );
    }
  }

  if (include_positions) {
    await exports.recomputePositions(schoolId, assessmentId);
  }

  return { computed: rows.length };
};

// ---------- POSITIONS ----------
exports.recomputePositions = async (schoolId, assessmentId) => {
  // Grade-wide ranking
  const all = await query(
    `SELECT id, grade_id, stream_id, percentage
       FROM assessment_results
      WHERE assessment_id=?
      ORDER BY percentage DESC`,
    [assessmentId],
  );

  // Grade position
  const byGrade = new Map();
  const byStream = new Map();
  for (const r of all) {
    const gk = r.grade_id;
    const sk = `${r.grade_id}|${r.stream_id || ""}`;
    const gpos = (byGrade.get(gk) || 0) + 1;
    const spos = (byStream.get(sk) || 0) + 1;
    byGrade.set(gk, gpos);
    byStream.set(sk, spos);
    await execute(
      `UPDATE assessment_results SET grade_position=?, stream_position=?, class_position=? WHERE id=?`,
      [gpos, spos, spos, r.id],
    );
  }
  return { positioned: all.length };
};

// ---------- LIST ----------
exports.list = (
  schoolId,
  { assessment_id, grade_id, stream_id, status } = {},
) => {
  const params = [schoolId];
  let where = "a.school_id=?";
  if (assessment_id) {
    where += " AND r.assessment_id=?";
    params.push(assessment_id);
  }
  if (grade_id) {
    where += " AND r.grade_id=?";
    params.push(grade_id);
  }
  if (stream_id) {
    where += " AND r.stream_id=?";
    params.push(stream_id);
  }
  if (status) {
    where += " AND r.status=?";
    params.push(status);
  }
  return query(
    `SELECT r.*, stu.first_name, stu.last_name, stu.admission_number,
            g.name AS grade_name, st.name AS stream_name,
            a.name AS assessment_name, a.status AS assessment_status
       FROM assessment_results r
       JOIN assessments a ON a.id=r.assessment_id
       JOIN students stu ON stu.id=r.student_id
       JOIN grades g ON g.id=r.grade_id
       LEFT JOIN streams st ON st.id=r.stream_id
      WHERE ${where}
      ORDER BY r.percentage DESC`,
    params,
  );
};

// ---------- APPROVE / PUBLISH / REVOKE ----------
exports.bulkSetStatus = async (
  schoolId,
  assessmentId,
  { ids, status, actor_id },
) => {
  if (!Array.isArray(ids) || !ids.length) throw new Error("ids[] required");
  const a = await queryOne(
    "SELECT id FROM assessments WHERE id=? AND school_id=?",
    [assessmentId, schoolId],
  );
  if (!a) throw new Error("Assessment not found");

  const valid = ["pending_review", "approved", "published", "revoked", "draft"];
  if (!valid.includes(status)) throw new Error("Invalid status");

  const stamp =
    status === "approved"
      ? ", approved_at=NOW(), approved_by=?"
      : status === "published"
        ? ", published_at=NOW()"
        : "";
  const placeholders = ids.map(() => "?").join(",");
  const params = [status];
  if (status === "approved") params.push(actor_id || null);
  params.push(assessmentId, ...ids);

  await execute(
    `UPDATE assessment_results
        SET status=?${stamp}
      WHERE assessment_id=? AND id IN (${placeholders})`,
    params,
  );

  // Lock the assessment when results are published
  if (status === "published") {
    await execute(
      "UPDATE assessments SET status='locked', locked_at=NOW() WHERE id=? AND status<>'locked'",
      [assessmentId],
    );
  }
  return { updated: ids.length };
};

// ---------- STUDENT DETAIL ----------
exports.studentDetail = async (schoolId, assessmentId, studentId) => {
  const result = await queryOne(
    `SELECT r.*, stu.first_name, stu.last_name, stu.admission_number,
            g.name AS grade_name, st.name AS stream_name,
            a.name AS assessment_name, a.published_at, a.term_id, a.academic_year_id
       FROM assessment_results r
       JOIN assessments a ON a.id=r.assessment_id
       JOIN students stu ON stu.id=r.student_id
       JOIN grades g ON g.id=r.grade_id
       LEFT JOIN streams st ON st.id=r.stream_id
      WHERE a.school_id=? AND r.assessment_id=? AND r.student_id=?`,
    [schoolId, assessmentId, studentId],
  );
  if (!result) return null;
  result.marks = await query(
    `SELECT m.*, s.name AS subject_name, s.code AS subject_code
       FROM assessment_marks m
       JOIN subjects s ON s.id=m.subject_id
      WHERE m.assessment_id=? AND m.student_id=?
      ORDER BY s.name`,
    [assessmentId, studentId],
  );
  result.competencies = await query(
    `SELECT cr.*, c.name AS competency_name
       FROM competency_ratings cr
       JOIN cbc_competencies c ON c.id=cr.competency_id
      WHERE cr.assessment_id=? AND cr.student_id=?
      ORDER BY c.name`,
    [assessmentId, studentId],
  );
  return result;
};
