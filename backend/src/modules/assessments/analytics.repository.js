// =============================================================================
// ASSESSMENT ANALYTICS — Phase 3
// School-wide insights: subject means, band distribution, leaderboards.
// =============================================================================
const { query, queryOne } = require("../../config/database");

exports.overview = async (schoolId, assessmentId) => {
  const a = await queryOne(
    `SELECT a.id, a.name, a.status,
            (SELECT COUNT(*) FROM assessment_marks m WHERE m.assessment_id=a.id AND m.score IS NOT NULL) AS marks_count,
            (SELECT COUNT(DISTINCT student_id) FROM assessment_marks WHERE assessment_id=a.id) AS students_count,
            (SELECT AVG((score/out_of)*100) FROM assessment_marks WHERE assessment_id=a.id AND score IS NOT NULL) AS mean_pct,
            (SELECT MAX((score/out_of)*100) FROM assessment_marks WHERE assessment_id=a.id) AS max_pct
       FROM assessments a WHERE a.id=? AND a.school_id=?`,
    [assessmentId, schoolId],
  );
  return a;
};

exports.subjectMeans = (schoolId, assessmentId) =>
  query(
    `SELECT s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
            COUNT(m.id) AS n,
            AVG((m.score/m.out_of)*100) AS mean_pct,
            MIN((m.score/m.out_of)*100) AS min_pct,
            MAX((m.score/m.out_of)*100) AS max_pct
       FROM assessment_marks m
       JOIN subjects s ON s.id=m.subject_id
       JOIN assessments a ON a.id=m.assessment_id
      WHERE a.school_id=? AND m.assessment_id=? AND m.score IS NOT NULL
      GROUP BY s.id, s.name, s.code
      ORDER BY mean_pct DESC`,
    [schoolId, assessmentId],
  );

exports.bandDistribution = (schoolId, assessmentId) =>
  query(
    `SELECT m.band_code, COUNT(*) AS n
       FROM assessment_marks m
       JOIN assessments a ON a.id=m.assessment_id
      WHERE a.school_id=? AND m.assessment_id=? AND m.band_code IS NOT NULL
      GROUP BY m.band_code
      ORDER BY n DESC`,
    [schoolId, assessmentId],
  );

exports.alDistribution = (schoolId, assessmentId) =>
  query(
    `SELECT m.achievement_level_code AS code, COUNT(*) AS n
       FROM assessment_marks m
       JOIN assessments a ON a.id=m.assessment_id
      WHERE a.school_id=? AND m.assessment_id=? AND m.achievement_level_code IS NOT NULL
      GROUP BY m.achievement_level_code
      ORDER BY code DESC`,
    [schoolId, assessmentId],
  );

exports.leaderboard = (schoolId, assessmentId, limit = 20) => {
  const numLimit = parseInt(limit, 10);

  return query(
    `SELECT r.student_id, r.percentage, r.mean_score, r.total_score, r.total_out_of,
            r.overall_al, r.overall_band, r.class_position,
            stu.first_name, stu.last_name, stu.admission_number,
            g.name AS grade_name, st.name AS stream_name
     FROM assessment_results r
     JOIN students stu ON stu.id = r.student_id
     JOIN grades g ON g.id = r.grade_id
     LEFT JOIN streams st ON st.id = r.stream_id
     JOIN assessments a ON a.id = r.assessment_id
     WHERE a.school_id = ? AND r.assessment_id = ?
     ORDER BY r.percentage DESC
     LIMIT ${numLimit}`,
    [schoolId, assessmentId],
  );
};

exports.gradeMeans = (schoolId, assessmentId) =>
  query(
    `SELECT g.id AS grade_id, g.name AS grade_name,
            COUNT(r.id) AS n,
            AVG(r.percentage) AS mean_pct
       FROM assessment_results r
       JOIN grades g ON g.id=r.grade_id
       JOIN assessments a ON a.id=r.assessment_id
      WHERE a.school_id=? AND r.assessment_id=?
      GROUP BY g.id, g.name
      ORDER BY mean_pct DESC`,
    [schoolId, assessmentId],
  );

exports.streamMeans = (schoolId, assessmentId) =>
  query(
    `SELECT g.name AS grade_name, st.id AS stream_id, st.name AS stream_name,
            COUNT(r.id) AS n,
            AVG(r.percentage) AS mean_pct
       FROM assessment_results r
       JOIN grades g ON g.id=r.grade_id
       JOIN streams st ON st.id=r.stream_id
       JOIN assessments a ON a.id=r.assessment_id
      WHERE a.school_id=? AND r.assessment_id=?
      GROUP BY g.name, st.id, st.name
      ORDER BY mean_pct DESC`,
    [schoolId, assessmentId],
  );
