/**
 * Phase 6 — Parent/Student portal results endpoint.
 *
 * Gating rules (enforced in SQL):
 *   - exam.status = 'APPROVED' or 'LOCKED'
 *   - exam.published_at IS NOT NULL
 *   - exam_marks.status IN ('APPROVED','LOCKED')
 *
 * Always scoped by req.schoolId AND the current session (year + term)
 * unless the caller passes ?academic_year_id / ?term_id explicitly
 * (e.g. historical view from the archives switcher).
 */
const { query } = require("../../config/database");
const { success, error } = require("../../utils/response");

const listPortalResults = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const studentId = req.query.student_id;
    if (!studentId) return error(res, "student_id is required", 400);

    // Role check: only parent / student / admin / academic may use this.
    const role = req.user?.role;
    if (!["parent", "student", "admin", "academic", "teacher", "hod"].includes(role)) {
      return error(res, "Forbidden", 403);
    }

    const yearId = req.query.academic_year_id || req.session?.academicYearId || null;
    const termId = req.query.term_id || req.session?.termId || null;

    const where = [
      "m.school_id = ?",
      "m.student_id = ?",
      "e.published_at IS NOT NULL",
      "e.status IN ('APPROVED','LOCKED')",
      "m.status IN ('APPROVED','LOCKED')",
    ];
    const params = [schoolId, studentId];
    if (yearId) { where.push("m.academic_year_id = ?"); params.push(yearId); }
    if (termId) { where.push("m.term_id = ?");          params.push(termId); }

    const marks = await query(
      `SELECT m.id, m.exam_id, m.subject_name, m.score, m.out_of,
              m.grade, m.points, m.performance_level, m.remarks,
              e.name AS exam_name, e.type AS exam_type, e.curriculum_type,
              e.published_at, e.term_id, e.academic_year_id,
              ay.name AS academic_year_name, t.name AS term_name
       FROM exam_marks m
       JOIN exams e          ON e.id = m.exam_id
       LEFT JOIN academic_years ay ON ay.id = m.academic_year_id
       LEFT JOIN terms t           ON t.id  = m.term_id
       WHERE ${where.join(" AND ")}
       ORDER BY e.published_at DESC, m.subject_name ASC`,
      params,
    );

    // Group by exam.
    const grouped = {};
    for (const m of marks) {
      if (!grouped[m.exam_id]) {
        grouped[m.exam_id] = {
          exam_id: m.exam_id,
          exam_name: m.exam_name,
          exam_type: m.exam_type,
          curriculum_type: m.curriculum_type,
          published_at: m.published_at,
          academic_year_name: m.academic_year_name,
          term_name: m.term_name,
          subjects: [],
          total: 0,
          out_of_total: 0,
        };
      }
      grouped[m.exam_id].subjects.push({
        subject_name: m.subject_name,
        score: m.score, out_of: m.out_of,
        grade: m.grade, points: m.points,
        performance_level: m.performance_level,
        remarks: m.remarks,
      });
      if (m.score != null) {
        grouped[m.exam_id].total += Number(m.score);
        grouped[m.exam_id].out_of_total += Number(m.out_of || 0);
      }
    }
    const results = Object.values(grouped).map((g) => ({
      ...g,
      mean: g.subjects.length ? +(g.total / g.subjects.length).toFixed(2) : 0,
      percentage: g.out_of_total ? +((g.total / g.out_of_total) * 100).toFixed(2) : 0,
    }));

    return success(res, results);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { listPortalResults };
