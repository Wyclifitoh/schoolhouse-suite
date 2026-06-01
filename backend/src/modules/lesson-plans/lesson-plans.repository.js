const { query, queryOne, queryCount, execute } = require("../../config/database");
const crypto = require("crypto");

const BODY_FIELDS = [
  "learning_outcomes", "key_inquiry_questions", "learning_resources",
  "intro_teacher_activities", "intro_learner_activities", "lesson_development",
  "extended_activities", "lesson_summary", "achievement_of_outcomes",
  "reflection_went_well", "reflection_challenges", "reflection_improvements",
];

const SELECT_PLAN = `
  SELECT lp.*,
         sub.name AS subject_name, sub.code AS subject_code,
         g.name  AS grade_name,
         st.name AS stream_name,
         CONCAT_WS(' ', sf.first_name, sf.last_name) AS teacher_name,
         t.tsc_number, sf.gender AS teacher_gender,
         str.name AS strand_name,
         ss.name AS sub_strand_name,
         tm.name AS term_name,
         ay.name AS academic_year_name
    FROM lesson_plans lp
    LEFT JOIN subjects sub ON sub.id = lp.subject_id
    LEFT JOIN grades g    ON g.id = lp.grade_id
    LEFT JOIN streams st  ON st.id = lp.stream_id
    LEFT JOIN teachers t  ON t.id = lp.teacher_id
    LEFT JOIN staff sf    ON sf.id = t.staff_id
    LEFT JOIN cbc_strands str ON str.id = lp.strand_id
    LEFT JOIN cbc_sub_strands ss ON ss.id = lp.sub_strand_id
    LEFT JOIN terms tm    ON tm.id = lp.term_id
    LEFT JOIN academic_years ay ON ay.id = lp.academic_year_id
`;

const findById = (schoolId, id) =>
  queryOne(`${SELECT_PLAN} WHERE lp.school_id = ? AND lp.id = ?`, [schoolId, id]);

const list = async (schoolId, filters, { page, limit, offset }) => {
  const where = ["lp.school_id = ?"];
  const params = [schoolId];
  const add = (cond, val) => { where.push(cond); params.push(val); };
  if (filters.teacher_id) add("lp.teacher_id = ?", filters.teacher_id);
  if (filters.subject_id) add("lp.subject_id = ?", filters.subject_id);
  if (filters.grade_id) add("lp.grade_id = ?", filters.grade_id);
  if (filters.stream_id) add("lp.stream_id = ?", filters.stream_id);
  if (filters.term_id) add("lp.term_id = ?", filters.term_id);
  if (filters.academic_year_id) add("lp.academic_year_id = ?", filters.academic_year_id);
  if (filters.status) add("lp.status = ?", filters.status);
  if (filters.from) add("lp.lesson_date >= ?", filters.from);
  if (filters.to) add("lp.lesson_date <= ?", filters.to);
  if (filters.search) {
    where.push("(lp.lesson_title LIKE ? OR sub.name LIKE ? OR g.name LIKE ?)");
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }
  const whereSql = where.join(" AND ");
  const total = await queryCount(
    `SELECT COUNT(*) AS count FROM lesson_plans lp WHERE ${whereSql}`,
    params,
  );
  const rows = await query(
    `${SELECT_PLAN} WHERE ${whereSql}
      ORDER BY lp.lesson_date DESC, lp.start_time DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return { rows, total };
};

const create = async (data) => {
  const id = crypto.randomUUID();
  const cols = [
    "id", "school_id", "academic_year_id", "term_id", "subject_id", "grade_id",
    "stream_id", "teacher_id", "timetable_entry_id", "lesson_date",
    "start_time", "end_time", "week_number", "duration_minutes",
    "roll", "boys", "girls", "total_learners",
    "strand_id", "sub_strand_id", "lesson_title", "status",
    ...BODY_FIELDS,
  ];
  const values = cols.map((c) => (c === "id" ? id : data[c] ?? null));
  await execute(
    `INSERT INTO lesson_plans (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
    values,
  );
  return id;
};

const update = async (id, data) => {
  const allowed = [
    "academic_year_id", "term_id", "subject_id", "grade_id", "stream_id",
    "lesson_date", "start_time", "end_time", "week_number", "duration_minutes",
    "roll", "boys", "girls", "total_learners",
    "strand_id", "sub_strand_id", "lesson_title", "status",
    "published_at", "delivered_at",
    ...BODY_FIELDS,
  ];
  const fields = [];
  const params = [];
  for (const k of allowed) {
    if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(data[k]); }
  }
  if (!fields.length) return;
  params.push(id);
  await execute(`UPDATE lesson_plans SET ${fields.join(", ")} WHERE id = ?`, params);
};

const remove = (id) => execute(`DELETE FROM lesson_plans WHERE id = ?`, [id]);

// --- Coverage helpers ----------------------------------------------------
const writeCoverage = async (plan) => {
  await execute(`DELETE FROM lesson_plan_coverage WHERE lesson_plan_id = ?`, [plan.id]);
  if (!plan.sub_strand_id && !plan.strand_id) return;
  await execute(
    `INSERT INTO lesson_plan_coverage
       (id, school_id, lesson_plan_id, subject_id, grade_id, term_id,
        strand_id, sub_strand_id, lessons_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      crypto.randomUUID(), plan.school_id, plan.id, plan.subject_id,
      plan.grade_id, plan.term_id || null, plan.strand_id || null,
      plan.sub_strand_id || null,
    ],
  );
};
const clearCoverage = (planId) =>
  execute(`DELETE FROM lesson_plan_coverage WHERE lesson_plan_id = ?`, [planId]);

// --- Roster snapshot -----------------------------------------------------
const rosterForStream = async (schoolId, streamId) => {
  if (!streamId) return { boys: 0, girls: 0, total: 0 };
  const row = await queryOne(
    `SELECT
       SUM(LOWER(gender)='male') AS boys,
       SUM(LOWER(gender)='female') AS girls,
       COUNT(*) AS total
     FROM students
     WHERE school_id = ? AND stream_id = ? AND (status IS NULL OR status='active')`,
    [schoolId, streamId],
  );
  return {
    boys: Number(row?.boys || 0),
    girls: Number(row?.girls || 0),
    total: Number(row?.total || 0),
  };
};

const findTimetableEntry = (schoolId, id) =>
  queryOne(
    `SELECT te.*, t.id AS teacher_id_resolved
       FROM timetable_entries te
       LEFT JOIN teachers t ON t.id = te.teacher_id
      WHERE te.school_id = ? AND te.id = ?`,
    [schoolId, id],
  );

const teacherFromUser = (schoolId, userId) =>
  queryOne(
    `SELECT t.* FROM teachers t
       JOIN staff s ON s.id = t.staff_id
      WHERE t.school_id = ? AND s.user_id = ? LIMIT 1`,
    [schoolId, userId],
  );

const isTeacherAllocated = async (schoolId, teacherId, subjectId, gradeId, streamId) => {
  const r = await queryOne(
    `SELECT 1 FROM teacher_subject_allocations
      WHERE school_id = ? AND teacher_id = ? AND subject_id = ? AND grade_id = ?
        AND (stream_id = ? OR stream_id IS NULL) AND is_active = 1 LIMIT 1`,
    [schoolId, teacherId, subjectId, gradeId, streamId || null],
  );
  return Boolean(r);
};

module.exports = {
  findById, list, create, update, remove,
  writeCoverage, clearCoverage,
  rosterForStream, findTimetableEntry, teacherFromUser, isTeacherAllocated,
  BODY_FIELDS,
};
