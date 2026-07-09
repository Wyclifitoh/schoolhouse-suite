// =============================================================================
// ASSESSMENT RESULTS — Phase 3
// Aggregates marks per student, computes AL/band, optional rankings,
// supports review → approve → publish lifecycle.
// =============================================================================
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

async function overallAL(schoolId, pct) {
  // Clamp so out-of-range (e.g. >100%) still maps to top band
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const level = await queryOne(
    `SELECT code, band_code FROM achievement_levels
      WHERE school_id=? AND is_active=1 AND ? BETWEEN min_score AND max_score
      ORDER BY points DESC LIMIT 1`,
    [schoolId, clamped],
  );
  if (level) return level;
  // Fallback: pick the highest level if percentage exceeds top range,
  // or the lowest if below — never leave AL/band blank when we have a %.
  const fallback = await queryOne(
    `SELECT code, band_code FROM achievement_levels
      WHERE school_id=? AND is_active=1
      ORDER BY ${clamped >= 50 ? "points DESC" : "points ASC"} LIMIT 1`,
    [schoolId],
  );
  return fallback || { code: null, band_code: null };
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

  // ---------------------------------------------------------------------
  // FAIR RANKING: rank against full possible marks of the assessment.
  // A student is ranked over the SUM of out_of of every subject configured
  // for their grade in this assessment. Missing/absent marks count as 0
  // so absent students are not artificially advantaged by a smaller
  // denominator. Subjects that are EXCUSED can be wired in here later.
  // ---------------------------------------------------------------------

  // 1) Total possible marks per grade (sum of assessment_subjects.out_of)
  const gradeTotals = await query(
    `SELECT grade_id,
            COUNT(*)                       AS subjects_count,
            COALESCE(SUM(out_of), 0)       AS total_out_of
       FROM assessment_subjects
      WHERE assessment_id=?
      GROUP BY grade_id`,
    [assessmentId],
  );
  const gradeMap = new Map(
    gradeTotals.map((g) => [
      g.grade_id,
      {
        subjects_count: Number(g.subjects_count) || 0,
        total_out_of: Number(g.total_out_of) || 0,
      },
    ]),
  );

  // 2) Roster: every student in any grade attached to this assessment.
  //    Includes students with zero marks (absent across the board).
  const roster = await query(
    `SELECT DISTINCT stu.id AS student_id,
            stu.current_grade_id AS grade_id,
            stu.current_stream_id AS stream_id
       FROM students stu
       JOIN assessment_classes ac
         ON ac.grade_id = stu.current_grade_id
      WHERE ac.assessment_id=? AND stu.status='active'`,
    [assessmentId],
  );

  // 3) Aggregate marks per student (treats missing as 0 by simply summing
  //    what's there — denominator comes from grade total above).
  const markRows = await query(
    `SELECT m.student_id,
            COALESCE(SUM(m.score),  0) AS total_score,
            COALESCE(SUM(m.points), 0) AS total_points
       FROM assessment_marks m
      WHERE m.assessment_id=?
        AND m.status IN ('present','transferred_in')
        AND m.score IS NOT NULL
      GROUP BY m.student_id`,
    [assessmentId],
  );
  const markMap = new Map(markRows.map((r) => [r.student_id, r]));

  // 4) Merge so every roster student gets a row (0 marks if absent).
  //    Also keep any student that has marks but somehow isn't in roster
  //    (e.g. transferred mid-term) — pull their grade from assessment_marks.
  const rosterIds = new Set(roster.map((r) => r.student_id));
  const extras = [];
  for (const r of markRows) {
    if (rosterIds.has(r.student_id)) continue;
    const stu = await queryOne(
      `SELECT id AS student_id, current_grade_id AS grade_id, current_stream_id AS stream_id
         FROM students WHERE id=?`,
      [r.student_id],
    );
    if (stu) extras.push(stu);
  }
  const rows = [...roster, ...extras].map((stu) => {
    const gt = gradeMap.get(stu.grade_id) || {
      subjects_count: 0,
      total_out_of: 0,
    };
    const m = markMap.get(stu.student_id) || {
      total_score: 0,
      total_points: 0,
    };
    return {
      student_id: stu.student_id,
      grade_id: stu.grade_id,
      stream_id: stu.stream_id,
      subjects_count: gt.subjects_count,
      total_score: Number(m.total_score) || 0,
      total_out_of: gt.total_out_of,
      total_points: Number(m.total_points) || 0,
    };
  });

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
  result.progress = await buildProgressContext(
    schoolId,
    studentId,
    assessmentId,
    result.term_id,
    result.academic_year_id,
  );

  // Attach previous assessment to calculate deviations
  const prevResult = await queryOne(
    `SELECT r.assessment_id, r.percentage, r.class_position 
       FROM assessment_results r 
       JOIN assessments a ON a.id = r.assessment_id 
      WHERE r.student_id=? AND a.school_id=? AND r.assessment_id != ? 
        AND r.status IN ('approved', 'published')
      ORDER BY a.created_at DESC LIMIT 1`,
    [studentId, schoolId, assessmentId],
  );
  if (prevResult) {
    const prevMarks = await query(
      `SELECT subject_id, score, out_of FROM assessment_marks WHERE assessment_id=? AND student_id=?`,
      [prevResult.assessment_id, studentId],
    );
    result.previous_assessment = {
      percentage: prevResult.percentage,
      class_position: prevResult.class_position,
      marks: prevMarks.map((m) => ({
        subject_id: m.subject_id,
        percentage: m.out_of ? (m.score / m.out_of) * 100 : null,
      })),
    };
  }

  return result;
};

async function buildProgressContext(
  schoolId,
  studentId,
  currentAssessmentId,
  termId,
  yearId,
) {
  // 1. Term assessments — every assessment in the same term/year for this
  //    student that has marks. Pull per-subject scores; aggregate client-side.
  const termAssessments = await query(
    `SELECT a.id, a.name, a.kind, a.created_at,
            COALESCE(r.percentage,0) AS percentage,
            COALESCE(r.overall_al,'')  AS overall_al,
            COALESCE(r.mean_points,0)  AS mean_points,
            COALESCE(r.total_points,0) AS total_points,
            COALESCE(r.class_position,0) AS class_position
       FROM assessments a
       LEFT JOIN assessment_results r
              ON r.assessment_id = a.id AND r.student_id = ?
      WHERE a.school_id=?
        ${termId ? "AND a.term_id=?" : ""}
        ${yearId ? "AND a.academic_year_id=?" : ""}
      ORDER BY a.created_at ASC`,
    [
      studentId,
      schoolId,
      ...(termId ? [termId] : []),
      ...(yearId ? [yearId] : []),
    ],
  );

  // Per-subject marks across those assessments (one row per subject per
  // assessment). The viewer pivots subject vs assessment.
  const ids = termAssessments.map((a) => a.id);
  let subjectMatrix = [];
  if (ids.length) {
    const ph = ids.map(() => "?").join(",");
    subjectMatrix = await query(
      `SELECT m.assessment_id, m.subject_id, s.name AS subject_name, s.code AS subject_code,
              m.score, m.out_of, (m.score / m.out_of * 100) AS percentage, m.points,
              m.achievement_level_code, m.grade_code
         FROM assessment_marks m
         JOIN subjects s ON s.id = m.subject_id
        WHERE m.student_id=? AND m.assessment_id IN (${ph})`,
      [studentId, ...ids],
    );
  }

  // 2. Previous-term comparison
  let previousTerm = null;
  if (termId) {
    const prev = await queryOne(
      `SELECT a.id, a.name, a.term_id, t.name AS term_name,
              r.percentage, r.overall_al, r.mean_points, r.class_position
         FROM assessment_results r
         JOIN assessments a ON a.id=r.assessment_id
         LEFT JOIN terms t ON t.id=a.term_id
        WHERE a.school_id=? AND r.student_id=?
          AND a.term_id IS NOT NULL AND a.term_id <> ?
          AND r.status IN ('approved','published')
        ORDER BY a.published_at DESC, a.created_at DESC
        LIMIT 1`,
      [schoolId, studentId, termId],
    );
    if (prev) {
      const current = termAssessments.find((a) => a.id === currentAssessmentId);
      const curPct = current ? Number(current.percentage) : null;
      const prevPct = Number(prev.percentage);
      previousTerm = {
        assessment_name: prev.name,
        term_name: prev.term_name,
        percentage: prevPct,
        overall_al: prev.overall_al,
        mean_points: prev.mean_points,
        class_position: prev.class_position,
        delta_percentage:
          curPct != null ? Math.round((curPct - prevPct) * 100) / 100 : null,
      };
    }
  }

  // 3. Trend — last 6 assessments overall + per-subject series
  const trend = await query(
    `SELECT a.id, a.name, a.created_at, r.percentage, r.mean_points,
            r.overall_al
       FROM assessment_results r
       JOIN assessments a ON a.id=r.assessment_id
      WHERE a.school_id=? AND r.student_id=?
      ORDER BY a.created_at DESC
      LIMIT 6`,
    [schoolId, studentId],
  );
  trend.reverse();

  return {
    term_assessments: termAssessments,
    subject_matrix: subjectMatrix,
    previous_term: previousTerm,
    trend,
  };
}
