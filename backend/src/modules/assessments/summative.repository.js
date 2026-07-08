const { query, queryOne } = require("../../config/database");

exports.generateSummativeData = async (
  schoolId,
  assessmentIds,
  gradeId,
  streamId,
) => {
  if (!assessmentIds || !assessmentIds.length)
    return { cards: [], assessments: [] };

  // Fetch details of selected assessments to know their names and order
  const phA = assessmentIds.map(() => "?").join(",");
  const assessments = await query(
    `
    SELECT id, name FROM assessments WHERE id IN (${phA}) ORDER BY created_at ASC
  `,
    assessmentIds,
  );

  const ph = assessmentIds.map(() => "?").join(",");
  const params = [schoolId, ...assessmentIds];
  let where = "stu.school_id=? AND m.assessment_id IN (" + ph + ")";

  if (gradeId) {
    where += " AND stu.current_grade_id=?";
    params.push(gradeId);
  }
  if (streamId) {
    where += " AND stu.current_stream_id=?";
    params.push(streamId);
  }

  // Get marks for all these assessments
  const marks = await query(
    `
    SELECT m.student_id, stu.first_name, stu.last_name, stu.admission_number,
           g.name AS grade_name, st.name AS stream_name,
           m.assessment_id, a.name AS assessment_name,
           m.subject_id, s.name AS subject_name,
           m.score, m.out_of, m.percentage
      FROM assessment_marks m
      JOIN students stu ON stu.id = m.student_id
      JOIN assessments a ON a.id = m.assessment_id
      JOIN subjects s ON s.id = m.subject_id
      LEFT JOIN grades g ON g.id = stu.current_grade_id
      LEFT JOIN streams st ON st.id = stu.current_stream_id
     WHERE ${where}
  `,
    params,
  );

  // Group by student
  const studentMap = new Map();
  for (const row of marks) {
    if (!studentMap.has(row.student_id)) {
      studentMap.set(row.student_id, {
        student_id: row.student_id,
        first_name: row.first_name,
        last_name: row.last_name,
        admission_number: row.admission_number,
        grade_name: row.grade_name,
        stream_name: row.stream_name,
        subjectMarks: new Map(), // subject_id -> { name, assessments: {} }
      });
    }
    const stu = studentMap.get(row.student_id);
    if (!stu.subjectMarks.has(row.subject_id)) {
      stu.subjectMarks.set(row.subject_id, {
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        assessments: {},
      });
    }
    const subj = stu.subjectMarks.get(row.subject_id);
    subj.assessments[row.assessment_id] = {
      score: row.score,
      out_of: row.out_of,
      percentage: row.percentage,
    };
  }

  // Calculate averages
  const results = [];
  for (const stu of studentMap.values()) {
    const finalMarks = [];
    let totalScoreSum = 0;

    for (const subj of stu.subjectMarks.values()) {
      let subjScoreSum = 0;
      let count = 0;
      for (const a of assessments) {
        if (
          subj.assessments[a.id] &&
          subj.assessments[a.id].percentage != null
        ) {
          subjScoreSum += Number(subj.assessments[a.id].percentage || 0);
          count++;
        }
      }
      const avgPct = count > 0 ? subjScoreSum / count : null;

      finalMarks.push({
        subject_id: subj.subject_id,
        subject_name: subj.subject_name,
        assessments: subj.assessments,
        average_percentage: avgPct,
      });
      if (avgPct != null) {
        totalScoreSum += avgPct;
      }
    }

    // Filter out subjects with no marks at all
    const validMarks = finalMarks.filter((m) => m.average_percentage != null);
    const overallPct =
      validMarks.length > 0 ? totalScoreSum / validMarks.length : 0;

    // We will calculate a pseudo AL and Band based on overallPct
    // A quick hack to get AL from percentage
    let al = "AL1",
      band = "BE";
    if (overallPct >= 80) {
      al = "AL4";
      band = "EE";
    } else if (overallPct >= 65) {
      al = "AL3";
      band = "ME";
    } else if (overallPct >= 50) {
      al = "AL2";
      band = "AE";
    }

    results.push({
      ...stu,
      marks: validMarks.sort((a, b) =>
        a.subject_name.localeCompare(b.subject_name),
      ),
      percentage: overallPct,
      overall_al: al,
      overall_band: band,
    });
  }

  const sortedCards = results
    .sort((a, b) => b.percentage - a.percentage)
    .map((r, i) => ({ ...r, class_position: i + 1 }));
  return { cards: sortedCards, assessments };
};
