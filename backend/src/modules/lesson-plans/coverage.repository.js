const { query, queryOne } = require("../../config/database");

const overview = async (schoolId, { subject_id, grade_id, term_id }) => {
  if (!subject_id || !grade_id) {
    return { total_sub_strands: 0, covered: 0, pct: 0, by_strand: [] };
  }
  const subStrands = await query(
    `SELECT ss.id, ss.name, ss.expected_lessons, ss.strand_id, s.name AS strand_name
       FROM cbc_sub_strands ss
       JOIN cbc_strands s ON s.id = ss.strand_id
      WHERE ss.school_id = ? AND s.subject_id = ? AND s.grade_id = ? AND ss.is_active = 1
      ORDER BY s.name, ss.sort_order`,
    [schoolId, subject_id, grade_id],
  );

  const covParams = [schoolId, subject_id, grade_id];
  let covSql = `SELECT sub_strand_id, COUNT(*) AS c
       FROM lesson_plan_coverage
      WHERE school_id = ? AND subject_id = ? AND grade_id = ?`;
  if (term_id) { covSql += " AND term_id = ?"; covParams.push(term_id); }
  covSql += " GROUP BY sub_strand_id";
  const covRows = await query(covSql, covParams);
  const covMap = new Map(covRows.map((r) => [r.sub_strand_id, Number(r.c)]));

  const byStrand = new Map();
  let totalCovered = 0;
  for (const ss of subStrands) {
    const done = covMap.get(ss.id) || 0;
    if (done >= ss.expected_lessons) totalCovered++;
    if (!byStrand.has(ss.strand_id)) {
      byStrand.set(ss.strand_id, {
        strand_id: ss.strand_id, strand_name: ss.strand_name,
        sub_strands: [], total: 0, covered: 0,
      });
    }
    const bucket = byStrand.get(ss.strand_id);
    bucket.sub_strands.push({
      id: ss.id, name: ss.name,
      expected: ss.expected_lessons, done, pct: ss.expected_lessons
        ? Math.min(100, Math.round((done / ss.expected_lessons) * 100)) : 0,
    });
    bucket.total++;
    if (done >= ss.expected_lessons) bucket.covered++;
  }

  return {
    total_sub_strands: subStrands.length,
    covered: totalCovered,
    pct: subStrands.length ? Math.round((totalCovered / subStrands.length) * 100) : 0,
    by_strand: Array.from(byStrand.values()),
  };
};

const dashboard = async (schoolId, { teacher_id, term_id } = {}) => {
  const where = ["school_id = ?"];
  const params = [schoolId];
  if (teacher_id) { where.push("teacher_id = ?"); params.push(teacher_id); }
  if (term_id) { where.push("term_id = ?"); params.push(term_id); }
  const w = where.join(" AND ");

  const totals = await queryOne(
    `SELECT
       COUNT(*) AS total,
       SUM(status='draft') AS drafts,
       SUM(status='published') AS published,
       SUM(status='delivered') AS delivered
     FROM lesson_plans WHERE ${w}`, params,
  );

  const upcoming = await query(
    `SELECT lp.id, lp.lesson_date, lp.start_time, lp.lesson_title,
            sub.name AS subject_name, g.name AS grade_name, st.name AS stream_name
       FROM lesson_plans lp
       LEFT JOIN subjects sub ON sub.id=lp.subject_id
       LEFT JOIN grades g ON g.id=lp.grade_id
       LEFT JOIN streams st ON st.id=lp.stream_id
      WHERE ${w} AND lp.lesson_date >= CURDATE()
      ORDER BY lp.lesson_date, lp.start_time LIMIT 10`,
    params,
  );

  const compliance = await query(
    `SELECT t.id AS teacher_id,
            CONCAT_WS(' ', s.first_name, s.last_name) AS name,
            COUNT(lp.id) AS plans,
            SUM(lp.status IN ('published','delivered')) AS published
       FROM teachers t
       JOIN staff s ON s.id = t.staff_id
       LEFT JOIN lesson_plans lp ON lp.teacher_id = t.id AND lp.school_id = ?
      WHERE t.school_id = ?
      GROUP BY t.id, name
      ORDER BY plans DESC LIMIT 20`,
    [schoolId, schoolId],
  );

  return {
    totals: {
      total: Number(totals?.total || 0),
      drafts: Number(totals?.drafts || 0),
      published: Number(totals?.published || 0),
      delivered: Number(totals?.delivered || 0),
    },
    upcoming,
    compliance,
  };
};

module.exports = { overview, dashboard };
