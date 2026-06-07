// =============================================================================
// REPORT CARDS v2 — Phase 3 (CBC)
// Templates, batch runs (per assessment + class), per-student card snapshots.
// =============================================================================
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");
const results = require("./results.repository");

// ---------- TEMPLATES ----------
exports.listTemplates = (schoolId) =>
  query(
    "SELECT * FROM report_card_templates_v2 WHERE school_id=? ORDER BY is_default DESC, name",
    [schoolId],
  );

exports.createTemplate = async (data) => {
  const id = uuid();
  await execute(
    `INSERT INTO report_card_templates_v2
      (id, school_id, name, kind, header_title, header_subtitle,
       show_position, show_band, show_competencies, show_teacher_remarks, show_principal_remarks, is_default)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.name,
      data.kind || "CBC",
      data.header_title || null,
      data.header_subtitle || null,
      data.show_position ?? 0,
      data.show_band ?? 1,
      data.show_competencies ?? 1,
      data.show_teacher_remarks ?? 1,
      data.show_principal_remarks ?? 1,
      data.is_default ?? 0,
    ],
  );
  return queryOne("SELECT * FROM report_card_templates_v2 WHERE id=?", [id]);
};

exports.updateTemplate = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const k of [
    "name",
    "kind",
    "header_title",
    "header_subtitle",
    "show_position",
    "show_band",
    "show_competencies",
    "show_teacher_remarks",
    "show_principal_remarks",
    "is_default",
  ]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(data[k]);
    }
  }
  if (!fields.length) return null;
  values.push(id, schoolId);
  await execute(
    `UPDATE report_card_templates_v2 SET ${fields.join(",")} WHERE id=? AND school_id=?`,
    values,
  );
  return queryOne(
    "SELECT * FROM report_card_templates_v2 WHERE id=? AND school_id=?",
    [id, schoolId],
  );
};

exports.deleteTemplate = (id, schoolId) =>
  execute("DELETE FROM report_card_templates_v2 WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);

// ---------- RUNS ----------
exports.listRuns = (schoolId, { assessment_id } = {}, session = null) => {
  const params = [schoolId];
  let where = "r.school_id=?";
  if (assessment_id) {
    where += " AND r.assessment_id=?";
    params.push(assessment_id);
  }
  // Session scoping: restrict to active term/year when present, allow
  // legacy NULL rows so historical runs remain visible.
  if (session?.academicYearId) {
    where += " AND (r.academic_year_id = ? OR r.academic_year_id IS NULL)";
    params.push(session.academicYearId);
  }
  if (session?.termId) {
    where += " AND (r.term_id = ? OR r.term_id IS NULL)";
    params.push(session.termId);
  }
  return query(
    `SELECT r.*, a.name AS assessment_name, g.name AS grade_name, st.name AS stream_name,
            t.name AS template_name
       FROM report_card_runs_v2 r
       JOIN assessments a ON a.id=r.assessment_id
       LEFT JOIN grades g ON g.id=r.grade_id
       LEFT JOIN streams st ON st.id=r.stream_id
       LEFT JOIN report_card_templates_v2 t ON t.id=r.template_id
      WHERE ${where}
      ORDER BY r.generated_at DESC LIMIT 100`,
    params,
  );
};

// Generate a run: pulls approved/published results and snapshots a payload per student.
exports.createRun = async (data) => {
  const {
    school_id,
    assessment_id,
    grade_id,
    stream_id,
    template_id,
    created_by,
    academic_year_id,
    term_id,
  } = data;

  // Ensure results exist
  await results.compute(school_id, assessment_id, { include_positions: true });

  const runId = uuid();
  await execute(
    `INSERT INTO report_card_runs_v2
      (id, school_id, assessment_id, template_id, grade_id, stream_id, status, created_by, academic_year_id, term_id)
     VALUES (?,?,?,?,?,?, 'processing', ?,?,?)`,
    [
      runId,
      school_id,
      assessment_id,
      template_id || null,
      grade_id || null,
      stream_id || null,
      created_by || null,
      academic_year_id || null,
      term_id || null,
    ],
  );

  // Filter students by grade/stream if provided
  const params = [assessment_id];
  let where = "r.assessment_id=?";
  if (grade_id) {
    where += " AND r.grade_id=?";
    params.push(grade_id);
  }
  if (stream_id) {
    where += " AND r.stream_id=?";
    params.push(stream_id);
  }
  const studentResults = await query(
    `SELECT r.* FROM assessment_results r WHERE ${where}`,
    params,
  );

  let count = 0;
  for (const r of studentResults) {
    const detail = await results.studentDetail(
      school_id,
      assessment_id,
      r.student_id,
    );
    if (!detail) continue;
    await execute(
      `INSERT IGNORE INTO report_cards_v2
        (id, run_id, assessment_id, student_id, payload)
       VALUES (?,?,?,?,?)`,
      [uuid(), runId, assessment_id, r.student_id, JSON.stringify(detail)],
    );
    count++;
  }

  await execute(
    `UPDATE report_card_runs_v2 SET status='generated', total_cards=? WHERE id=?`,
    [count, runId],
  );
  return queryOne("SELECT * FROM report_card_runs_v2 WHERE id=?", [runId]);
};

exports.publishRun = async (id, schoolId) => {
  const run = await queryOne(
    "SELECT * FROM report_card_runs_v2 WHERE id=? AND school_id=?",
    [id, schoolId],
  );
  if (!run) throw new Error("Run not found");
  await execute(
    `UPDATE report_card_runs_v2 SET status='published', published_at=NOW() WHERE id=?`,
    [id],
  );
  await execute(`UPDATE report_cards_v2 SET published=1 WHERE run_id=?`, [id]);
  // Publish related results
  await execute(
    `UPDATE assessment_results SET status='published', published_at=NOW()
      WHERE assessment_id=? AND status<>'published'`,
    [run.assessment_id],
  );
  return queryOne("SELECT * FROM report_card_runs_v2 WHERE id=?", [id]);
};

exports.listCards = (runId) =>
  query(
    `SELECT c.id, c.student_id, c.published, c.teacher_remarks, c.principal_remarks,
            stu.first_name, stu.last_name, stu.admission_number,
            JSON_EXTRACT(c.payload, '$.percentage') AS percentage,
            JSON_EXTRACT(c.payload, '$.overall_al') AS overall_al,
            JSON_EXTRACT(c.payload, '$.overall_band') AS overall_band,
            JSON_EXTRACT(c.payload, '$.class_position') AS class_position
       FROM report_cards_v2 c
       JOIN students stu ON stu.id=c.student_id
      WHERE c.run_id=?
      ORDER BY stu.first_name, stu.last_name`,
    [runId],
  );

exports.getCard = (id) =>
  queryOne("SELECT * FROM report_cards_v2 WHERE id=?", [id]);

exports.updateRemarks = (id, { teacher_remarks, principal_remarks }) =>
  execute(
    `UPDATE report_cards_v2 SET teacher_remarks=COALESCE(?, teacher_remarks),
        principal_remarks=COALESCE(?, principal_remarks) WHERE id=?`,
    [teacher_remarks ?? null, principal_remarks ?? null, id],
  );

// Parent / student portal view — only published cards visible
exports.portalCards = (studentId) =>
  query(
    `SELECT c.id, c.assessment_id, c.payload, c.teacher_remarks, c.principal_remarks,
            r.published_at, a.name AS assessment_name
       FROM report_cards_v2 c
       JOIN report_card_runs_v2 r ON r.id=c.run_id
       JOIN assessments a ON a.id=c.assessment_id
      WHERE c.student_id=? AND c.published=1 AND r.status='published'
      ORDER BY r.published_at DESC`,
    [studentId],
  );
