// =============================================================================
// ASSESSMENT COMPARISON
// Compare an assessment to a previous one (or to its previous term/year).
// =============================================================================
const { query, queryOne } = require("../../config/database");

exports.previousAssessments = (schoolId, currentId, limit = 10) => {
  const numLimit = parseInt(limit, 10);
  // Use template literal for LIMIT to avoid quoting issues
  return query(
    `SELECT a.id, a.name, a.term_id, a.academic_year_id, a.created_at, a.status,
            (SELECT AVG(percentage) FROM assessment_results WHERE assessment_id = a.id) AS mean_pct
     FROM assessments a
     WHERE a.school_id = ? AND a.id != ?
       AND a.created_at < (SELECT created_at FROM assessments WHERE id = ?)
     ORDER BY a.created_at DESC
     LIMIT ${numLimit}`,
    [schoolId, currentId, currentId],
  );
};

// Overall school comparison
exports.overall = async (schoolId, currentId, previousId) => {
  const [cur, prev] = await Promise.all([
    queryOne(
      `SELECT a.id, a.name,
              (SELECT COUNT(*) FROM assessment_results WHERE assessment_id=a.id) AS n,
              (SELECT AVG(percentage) FROM assessment_results WHERE assessment_id=a.id) AS mean_pct
         FROM assessments a WHERE a.id=? AND a.school_id=?`,
      [currentId, schoolId],
    ),
    queryOne(
      `SELECT a.id, a.name,
              (SELECT COUNT(*) FROM assessment_results WHERE assessment_id=a.id) AS n,
              (SELECT AVG(percentage) FROM assessment_results WHERE assessment_id=a.id) AS mean_pct
         FROM assessments a WHERE a.id=? AND a.school_id=?`,
      [previousId, schoolId],
    ),
  ]);
  const delta = (cur?.mean_pct || 0) - (prev?.mean_pct || 0);
  return {
    current: cur,
    previous: prev,
    delta,
    trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
};

// Per-subject comparison
exports.subjects = (schoolId, currentId, previousId) =>
  query(
    `SELECT s.id, s.name AS subject_name, s.code AS subject_code,
            AVG(CASE WHEN m.assessment_id=? THEN (m.score/m.out_of)*100 END) AS cur_mean,
            AVG(CASE WHEN m.assessment_id=? THEN (m.score/m.out_of)*100 END) AS prev_mean,
            COUNT(DISTINCT CASE WHEN m.assessment_id=? THEN m.student_id END) AS cur_n,
            COUNT(DISTINCT CASE WHEN m.assessment_id=? THEN m.student_id END) AS prev_n
       FROM assessment_marks m
       JOIN subjects s ON s.id=m.subject_id
       JOIN assessments a ON a.id=m.assessment_id
      WHERE a.school_id=? AND m.assessment_id IN (?,?)
        AND m.score IS NOT NULL
      GROUP BY s.id, s.name, s.code
      ORDER BY s.name`,
    [
      currentId,
      previousId,
      currentId,
      previousId,
      schoolId,
      currentId,
      previousId,
    ],
  );

// Per-student comparison (most improved / declined)
exports.students = (schoolId, currentId, previousId) =>
  query(
    `SELECT stu.id AS student_id, stu.first_name, stu.last_name, stu.admission_number,
            g.name AS grade_name, st.name AS stream_name,
            cur.percentage AS cur_pct, prev.percentage AS prev_pct,
            (cur.percentage - prev.percentage) AS delta,
            cur.overall_al AS cur_al, prev.overall_al AS prev_al,
            cur.class_position AS cur_pos, prev.class_position AS prev_pos
       FROM students stu
       JOIN assessment_results cur ON cur.student_id=stu.id AND cur.assessment_id=?
       JOIN assessment_results prev ON prev.student_id=stu.id AND prev.assessment_id=?
       JOIN grades g ON g.id=stu.grade_id
       LEFT JOIN streams st ON st.id=stu.stream_id
      WHERE stu.school_id=?
      ORDER BY delta DESC`,
    [currentId, previousId, schoolId],
  );

// Per-class comparison
exports.grades = (schoolId, currentId, previousId) =>
  query(
    `SELECT g.id AS grade_id, g.name AS grade_name,
            AVG(CASE WHEN r.assessment_id=? THEN r.percentage END) AS cur_mean,
            AVG(CASE WHEN r.assessment_id=? THEN r.percentage END) AS prev_mean,
            COUNT(DISTINCT CASE WHEN r.assessment_id=? THEN r.student_id END) AS cur_n,
            COUNT(DISTINCT CASE WHEN r.assessment_id=? THEN r.student_id END) AS prev_n
       FROM assessment_results r
       JOIN grades g ON g.id=r.grade_id
       JOIN assessments a ON a.id=r.assessment_id
      WHERE a.school_id=? AND r.assessment_id IN (?,?)
      GROUP BY g.id, g.name
      ORDER BY g.name`,
    [
      currentId,
      previousId,
      currentId,
      previousId,
      schoolId,
      currentId,
      previousId,
    ],
  );

// Most improved / declined learners (Top N each)
exports.movers = async (schoolId, currentId, previousId, limit = 10) => {
  const all = await exports.students(schoolId, currentId, previousId);
  const improved = all.filter((r) => Number(r.delta) > 0).slice(0, limit);
  const declined = [...all]
    .filter((r) => Number(r.delta) < 0)
    .sort((a, b) => Number(a.delta) - Number(b.delta))
    .slice(0, limit);
  return { improved, declined, total_compared: all.length };
};
