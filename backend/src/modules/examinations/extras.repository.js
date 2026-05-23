const { query, queryOne, execute } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

// ===== Assessment types =====
const AT = {
  list: (schoolId) =>
    query(`SELECT * FROM assessment_types WHERE school_id = ? ORDER BY category, name`, [schoolId]),
  create: async (schoolId, b) => {
    const id = uuidv4();
    await execute(
      `INSERT INTO assessment_types (id, school_id, code, name, category, weight, is_active)
       VALUES (?,?,?,?,?,?,?)`,
      [id, schoolId, b.code, b.name, b.category || "SUMMATIVE", b.weight ?? 100, b.is_active ?? 1],
    );
    return queryOne(`SELECT * FROM assessment_types WHERE id = ?`, [id]);
  },
  update: async (id, schoolId, b) => {
    const allowed = ["code", "name", "category", "weight", "is_active"];
    const entries = Object.entries(b).filter(([k, v]) => allowed.includes(k) && v !== undefined);
    if (entries.length) {
      await execute(
        `UPDATE assessment_types SET ${entries.map(([k]) => `${k}=?`).join(", ")}
         WHERE id = ? AND school_id = ?`,
        [...entries.map(([, v]) => v), id, schoolId],
      );
    }
    return queryOne(`SELECT * FROM assessment_types WHERE id = ? AND school_id = ?`, [id, schoolId]);
  },
  remove: (id, schoolId) =>
    execute(`DELETE FROM assessment_types WHERE id = ? AND school_id = ?`, [id, schoolId]),
};

// ===== Grading scales + bands + CBC performance levels =====
const GS = {
  list: (schoolId) =>
    query(`SELECT * FROM grading_scales WHERE school_id = ? ORDER BY is_default DESC, name`, [schoolId]),
  get: async (id, schoolId) => {
    const scale = await queryOne(`SELECT * FROM grading_scales WHERE id = ? AND school_id = ?`, [id, schoolId]);
    if (!scale) return null;
    scale.bands  = await query(`SELECT * FROM grading_bands WHERE scale_id = ? ORDER BY min_score DESC`, [id]);
    scale.levels = await query(`SELECT * FROM cbc_performance_levels WHERE scale_id = ? ORDER BY sort_order`, [id]);
    return scale;
  },
  create: async (schoolId, b) => {
    const id = uuidv4();
    await execute(
      `INSERT INTO grading_scales (id, school_id, name, kind, pass_mark, is_default)
       VALUES (?,?,?,?,?,?)`,
      [id, schoolId, b.name, b.kind || "MARKS", b.pass_mark ?? null, b.is_default ? 1 : 0],
    );
    if (b.is_default) {
      await execute(`UPDATE grading_scales SET is_default = 0 WHERE school_id = ? AND id <> ?`, [schoolId, id]);
    }
    for (const band of b.bands || []) {
      await execute(
        `INSERT INTO grading_bands (id, scale_id, min_score, max_score, grade, points, descriptor, remark)
         VALUES (?,?,?,?,?,?,?,?)`,
        [uuidv4(), id, band.min_score, band.max_score, band.grade, band.points ?? null, band.descriptor || null, band.remark || null],
      );
    }
    for (const lvl of b.levels || []) {
      await execute(
        `INSERT INTO cbc_performance_levels (id, scale_id, code, label, descriptor, sort_order)
         VALUES (?,?,?,?,?,?)`,
        [uuidv4(), id, lvl.code, lvl.label, lvl.descriptor || null, lvl.sort_order ?? 0],
      );
    }
    return GS.get(id, schoolId);
  },
  update: async (id, schoolId, b) => {
    const allowed = ["name", "kind", "pass_mark", "is_default"];
    const entries = Object.entries(b).filter(([k, v]) => allowed.includes(k) && v !== undefined);
    if (entries.length) {
      await execute(
        `UPDATE grading_scales SET ${entries.map(([k]) => `${k}=?`).join(", ")} WHERE id = ? AND school_id = ?`,
        [...entries.map(([, v]) => v), id, schoolId],
      );
      if (b.is_default) {
        await execute(`UPDATE grading_scales SET is_default = 0 WHERE school_id = ? AND id <> ?`, [schoolId, id]);
      }
    }
    if (Array.isArray(b.bands)) {
      await execute(`DELETE FROM grading_bands WHERE scale_id = ?`, [id]);
      for (const band of b.bands) {
        await execute(
          `INSERT INTO grading_bands (id, scale_id, min_score, max_score, grade, points, descriptor, remark)
           VALUES (?,?,?,?,?,?,?,?)`,
          [uuidv4(), id, band.min_score, band.max_score, band.grade, band.points ?? null, band.descriptor || null, band.remark || null],
        );
      }
    }
    if (Array.isArray(b.levels)) {
      await execute(`DELETE FROM cbc_performance_levels WHERE scale_id = ?`, [id]);
      for (const lvl of b.levels) {
        await execute(
          `INSERT INTO cbc_performance_levels (id, scale_id, code, label, descriptor, sort_order)
           VALUES (?,?,?,?,?,?)`,
          [uuidv4(), id, lvl.code, lvl.label, lvl.descriptor || null, lvl.sort_order ?? 0],
        );
      }
    }
    return GS.get(id, schoolId);
  },
  remove: (id, schoolId) =>
    execute(`DELETE FROM grading_scales WHERE id = ? AND school_id = ?`, [id, schoolId]),
};

// ===== CBC competencies =====
const COMP = {
  list: (schoolId, { subject_id, grade_id } = {}) => {
    const where = ["school_id = ?"]; const p = [schoolId];
    if (subject_id) { where.push("subject_id = ?"); p.push(subject_id); }
    if (grade_id)   { where.push("grade_id = ?");   p.push(grade_id); }
    return query(`SELECT * FROM cbc_competencies WHERE ${where.join(" AND ")} ORDER BY name`, p);
  },
  create: async (schoolId, b) => {
    const id = uuidv4();
    await execute(
      `INSERT INTO cbc_competencies (id, school_id, subject_id, grade_id, code, name, description, is_active)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, schoolId, b.subject_id || null, b.grade_id || null, b.code, b.name, b.description || null, b.is_active ?? 1],
    );
    return queryOne(`SELECT * FROM cbc_competencies WHERE id = ?`, [id]);
  },
  update: async (id, schoolId, b) => {
    const allowed = ["subject_id", "grade_id", "code", "name", "description", "is_active"];
    const entries = Object.entries(b).filter(([k, v]) => allowed.includes(k) && v !== undefined);
    if (entries.length) {
      await execute(
        `UPDATE cbc_competencies SET ${entries.map(([k]) => `${k}=?`).join(", ")} WHERE id = ? AND school_id = ?`,
        [...entries.map(([, v]) => v), id, schoolId],
      );
    }
    return queryOne(`SELECT * FROM cbc_competencies WHERE id = ? AND school_id = ?`, [id, schoolId]);
  },
  remove: (id, schoolId) =>
    execute(`DELETE FROM cbc_competencies WHERE id = ? AND school_id = ?`, [id, schoolId]),
};

// ===== CBC observations (session-scoped) =====
const OBS = {
  list: (schoolId, session, { student_id, competency_id } = {}) => {
    const where = ["school_id = ?"]; const p = [schoolId];
    if (session?.academicYearId) { where.push("academic_year_id = ?"); p.push(session.academicYearId); }
    if (session?.termId)         { where.push("term_id = ?");          p.push(session.termId); }
    if (student_id)    { where.push("student_id = ?");    p.push(student_id); }
    if (competency_id) { where.push("competency_id = ?"); p.push(competency_id); }
    return query(
      `SELECT o.*, c.name AS competency_name, pl.code AS performance_code, pl.label AS performance_label
       FROM cbc_observations o
       LEFT JOIN cbc_competencies c ON c.id = o.competency_id
       LEFT JOIN cbc_performance_levels pl ON pl.id = o.performance_level_id
       WHERE ${where.join(" AND ")}
       ORDER BY o.observed_at DESC`,
      p,
    );
  },
  create: async (schoolId, session, b, actorId) => {
    const id = uuidv4();
    await execute(
      `INSERT INTO cbc_observations
       (id, school_id, academic_year_id, term_id, student_id, competency_id, performance_level_id, teacher_id, notes, evidence_url)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        id, schoolId,
        b.academic_year_id || session?.academicYearId || null,
        b.term_id          || session?.termId          || null,
        b.student_id, b.competency_id, b.performance_level_id || null,
        actorId, b.notes || null, b.evidence_url || null,
      ],
    );
    return queryOne(`SELECT * FROM cbc_observations WHERE id = ?`, [id]);
  },
  remove: (id, schoolId) =>
    execute(`DELETE FROM cbc_observations WHERE id = ? AND school_id = ?`, [id, schoolId]),
};

// ===== Analytics =====
const ANALYTICS = {
  examSummary: (schoolId, examId, session) =>
    queryOne(
      `SELECT COUNT(*) AS marks_count,
              AVG(score) AS mean_score,
              MIN(score) AS min_score,
              MAX(score) AS max_score,
              SUM(CASE WHEN score >= COALESCE((SELECT pass_mark FROM grading_scales WHERE id = e.grading_scale_id), 50)
                       THEN 1 ELSE 0 END) AS passed
       FROM exam_marks m JOIN exams e ON e.id = m.exam_id
       WHERE m.school_id = ? AND m.exam_id = ?
         AND (m.academic_year_id = ? OR m.academic_year_id IS NULL)
         AND (m.term_id = ? OR m.term_id IS NULL)`,
      [schoolId, examId, session?.academicYearId || null, session?.termId || null],
    ),
  subjectMeans: (schoolId, examId, session) =>
    query(
      `SELECT subject_name, AVG(score) AS mean, COUNT(*) AS n
       FROM exam_marks
       WHERE school_id = ? AND exam_id = ?
         AND (academic_year_id = ? OR academic_year_id IS NULL)
         AND (term_id = ? OR term_id IS NULL)
       GROUP BY subject_name ORDER BY mean DESC`,
      [schoolId, examId, session?.academicYearId || null, session?.termId || null],
    ),
  studentTotals: (schoolId, examId, session) =>
    query(
      `SELECT m.student_id, CONCAT(s.first_name,' ',s.last_name) AS student_name,
              SUM(m.score) AS total, AVG(m.score) AS mean, COUNT(*) AS subjects
       FROM exam_marks m
       LEFT JOIN students s ON s.id = m.student_id
       WHERE m.school_id = ? AND m.exam_id = ?
         AND (m.academic_year_id = ? OR m.academic_year_id IS NULL)
         AND (m.term_id = ? OR m.term_id IS NULL)
       GROUP BY m.student_id ORDER BY total DESC`,
      [schoolId, examId, session?.academicYearId || null, session?.termId || null],
    ),
};

/**
 * Recompute and persist student_rankings for an exam.
 * Called automatically when an exam transitions to APPROVED.
 */
const recomputeRankings = async (schoolId, examId, session) => {
  const totals = await ANALYTICS.studentTotals(schoolId, examId, session);
  await execute(
    `DELETE FROM student_rankings
     WHERE school_id = ? AND exam_id = ? AND scope = 'OVERALL'`,
    [schoolId, examId],
  );
  let rank = 0, prev = null;
  for (let i = 0; i < totals.length; i++) {
    const t = totals[i];
    if (t.total !== prev) { rank = i + 1; prev = t.total; }
    await execute(
      `INSERT INTO student_rankings
       (id, school_id, academic_year_id, term_id, exam_id, scope, scope_id, student_id, rank_position, score, total)
       VALUES (?,?,?,?,?, 'OVERALL', NULL, ?, ?, ?, ?)`,
      [uuidv4(), schoolId, session?.academicYearId || null, session?.termId || null, examId, t.student_id, rank, t.mean, t.total],
    );
  }
  return { ranked: totals.length };
};

// ===== Report cards =====
const RC = {
  listTemplates: (schoolId) =>
    query(`SELECT * FROM report_card_templates WHERE school_id = ? ORDER BY is_default DESC, name`, [schoolId]),
  createTemplate: async (schoolId, b) => {
    const id = uuidv4();
    await execute(
      `INSERT INTO report_card_templates (id, school_id, name, kind, layout, header_html, footer_html, is_default)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, schoolId, b.name, b.kind || "CBC", b.layout ? JSON.stringify(b.layout) : null, b.header_html || null, b.footer_html || null, b.is_default ? 1 : 0],
    );
    if (b.is_default) {
      await execute(`UPDATE report_card_templates SET is_default = 0 WHERE school_id = ? AND id <> ?`, [schoolId, id]);
    }
    return queryOne(`SELECT * FROM report_card_templates WHERE id = ?`, [id]);
  },
  removeTemplate: (id, schoolId) =>
    execute(`DELETE FROM report_card_templates WHERE id = ? AND school_id = ?`, [id, schoolId]),
  listRuns: (schoolId, session) =>
    query(
      `SELECT * FROM report_card_runs
       WHERE school_id = ?
         AND (academic_year_id = ? OR academic_year_id IS NULL)
         AND (term_id = ? OR term_id IS NULL)
       ORDER BY generated_at DESC`,
      [schoolId, session?.academicYearId || null, session?.termId || null],
    ),
  createRun: async (schoolId, session, b, actorId) => {
    const id = uuidv4();
    await execute(
      `INSERT INTO report_card_runs
       (id, school_id, academic_year_id, term_id, grade_id, stream_id, exam_id, template_id, status, generated_by, generated_at)
       VALUES (?,?,?,?,?,?,?,?, 'PENDING', ?, NOW())`,
      [
        id, schoolId,
        b.academic_year_id || session?.academicYearId || null,
        b.term_id          || session?.termId          || null,
        b.grade_id || null, b.stream_id || null,
        b.exam_id || null, b.template_id || null, actorId,
      ],
    );
    return queryOne(`SELECT * FROM report_card_runs WHERE id = ?`, [id]);
  },
  publishRun: (id, schoolId) =>
    execute(
      `UPDATE report_card_runs SET status='PUBLISHED', published_at = NOW()
       WHERE id = ? AND school_id = ?`,
      [id, schoolId],
    ),
};

module.exports = { AT, GS, COMP, OBS, ANALYTICS, RC, recomputeRankings };
