// =============================================================================
// ASSESSMENT ANALYTICS — Phase 3 (filter-aware)
// School-wide insights: subject means, band distribution, leaderboards.
// All functions accept an optional `filters` object: { grade_id, stream_id, subject_id }.
// =============================================================================
const { query, queryOne } = require("../../config/database");

// Build optional extra WHERE clauses that depend on student grade/stream/subject.
// Returns { joinStudents, marksExtra, params } — marksExtra refers to columns on the
// `m` (marks) alias and the joined `stu` (students) alias.
function buildMarksFilter(filters = {}) {
  const parts = [];
  const params = [];
  let joinStudents = false;
  if (filters.grade_id) {
    joinStudents = true;
    parts.push("stu.current_grade_id=?");
    params.push(filters.grade_id);
  }
  if (filters.stream_id) {
    joinStudents = true;
    parts.push("stu.current_stream_id=?");
    params.push(filters.stream_id);
  }
  if (filters.subject_id) {
    parts.push("m.subject_id=?");
    params.push(filters.subject_id);
  }
  return {
    joinStudents,
    extraSql: parts.length ? " AND " + parts.join(" AND ") : "",
    params,
  };
}

function buildResultsFilter(filters = {}) {
  const parts = [];
  const params = [];
  if (filters.grade_id) {
    parts.push("r.grade_id=?");
    params.push(filters.grade_id);
  }
  if (filters.stream_id) {
    parts.push("r.stream_id=?");
    params.push(filters.stream_id);
  }
  return {
    extraSql: parts.length ? " AND " + parts.join(" AND ") : "",
    params,
  };
}

exports.overview = async (schoolId, assessmentId, filters = {}) => {
  const m = buildMarksFilter(filters);
  const baseJoin = m.joinStudents
    ? "JOIN students stu ON stu.id=m.student_id"
    : "";
  const fp = m.params;
  return queryOne(
    `SELECT a.id, a.name, a.status,
            (SELECT COUNT(*) FROM assessment_marks m ${baseJoin}
              WHERE m.assessment_id=a.id AND m.score IS NOT NULL ${m.extraSql}) AS marks_count,
            (SELECT COUNT(DISTINCT m.student_id) FROM assessment_marks m ${baseJoin}
              WHERE m.assessment_id=a.id ${m.extraSql}) AS students_count,
            (SELECT AVG((m.score/m.out_of)*100) FROM assessment_marks m ${baseJoin}
              WHERE m.assessment_id=a.id AND m.score IS NOT NULL ${m.extraSql}) AS mean_pct,
            (SELECT MAX((m.score/m.out_of)*100) FROM assessment_marks m ${baseJoin}
              WHERE m.assessment_id=a.id ${m.extraSql}) AS max_pct
       FROM assessments a WHERE a.id=? AND a.school_id=?`,
    [...fp, ...fp, ...fp, ...fp, assessmentId, schoolId],
  );
};

exports.subjectMeans = (schoolId, assessmentId, filters = {}) => {
  const f = buildMarksFilter(filters);
  const join = f.joinStudents ? "JOIN students stu ON stu.id=m.student_id" : "";
  return query(
    `SELECT s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
            COUNT(m.id) AS n,
            AVG((m.score/m.out_of)*100) AS mean_pct,
            MIN((m.score/m.out_of)*100) AS min_pct,
            MAX((m.score/m.out_of)*100) AS max_pct
       FROM assessment_marks m
       JOIN subjects s ON s.id=m.subject_id
       JOIN assessments a ON a.id=m.assessment_id
       ${join}
      WHERE a.school_id=? AND m.assessment_id=? AND m.score IS NOT NULL ${f.extraSql}
      GROUP BY s.id, s.name, s.code
      ORDER BY mean_pct DESC`,
    [schoolId, assessmentId, ...f.params],
  );
};

exports.bandDistribution = (schoolId, assessmentId, filters = {}) => {
  const f = buildMarksFilter(filters);
  const join = f.joinStudents ? "JOIN students stu ON stu.id=m.student_id" : "";
  return query(
    `SELECT m.band_code, COUNT(*) AS n
       FROM assessment_marks m
       JOIN assessments a ON a.id=m.assessment_id
       ${join}
      WHERE a.school_id=? AND m.assessment_id=? AND m.band_code IS NOT NULL ${f.extraSql}
      GROUP BY m.band_code
      ORDER BY n DESC`,
    [schoolId, assessmentId, ...f.params],
  );
};

exports.alDistribution = (schoolId, assessmentId, filters = {}) => {
  const f = buildMarksFilter(filters);
  const join = f.joinStudents ? "JOIN students stu ON stu.id=m.student_id" : "";
  return query(
    `SELECT m.achievement_level_code AS code, COUNT(*) AS n
       FROM assessment_marks m
       JOIN assessments a ON a.id=m.assessment_id
       ${join}
      WHERE a.school_id=? AND m.assessment_id=? AND m.achievement_level_code IS NOT NULL ${f.extraSql}
      GROUP BY m.achievement_level_code
      ORDER BY code DESC`,
    [schoolId, assessmentId, ...f.params],
  );
};

exports.leaderboard = (schoolId, assessmentId, limit = 20, filters = {}) => {
  const numLimit = parseInt(limit, 10) || 20;
  const f = buildResultsFilter(filters);
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
     WHERE a.school_id = ? AND r.assessment_id = ? ${f.extraSql}
     ORDER BY r.percentage DESC
     LIMIT ${numLimit}`,
    [schoolId, assessmentId, ...f.params],
  );
};

exports.gradeMeans = (schoolId, assessmentId, filters = {}) => {
  const f = buildResultsFilter(filters);
  return query(
    `SELECT g.id AS grade_id, g.name AS grade_name,
            COUNT(r.id) AS n,
            AVG(r.percentage) AS mean_pct
       FROM assessment_results r
       JOIN grades g ON g.id=r.grade_id
       JOIN assessments a ON a.id=r.assessment_id
      WHERE a.school_id=? AND r.assessment_id=? ${f.extraSql}
      GROUP BY g.id, g.name
      ORDER BY mean_pct DESC`,
    [schoolId, assessmentId, ...f.params],
  );
};

exports.streamMeans = (schoolId, assessmentId, filters = {}) => {
  const f = buildResultsFilter(filters);
  return query(
    `SELECT g.name AS grade_name, st.id AS stream_id, st.name AS stream_name,
            COUNT(r.id) AS n,
            AVG(r.percentage) AS mean_pct
       FROM assessment_results r
       JOIN grades g ON g.id=r.grade_id
       JOIN streams st ON st.id=r.stream_id
       JOIN assessments a ON a.id=r.assessment_id
      WHERE a.school_id=? AND r.assessment_id=? ${f.extraSql}
      GROUP BY g.name, st.id, st.name
      ORDER BY mean_pct DESC`,
    [schoolId, assessmentId, ...f.params],
  );
};
