// =============================================================================
// ASSESSMENTS REPOSITORY — Phase 2
// CRUD for assessments, auto-generation of teacher tasks, status lifecycle.
// =============================================================================
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

// ---------- LIST ----------
exports.list = async (
  schoolId,
  { status, term_id, year_id, type_id, q } = {},
  user,
) => {
  const params = [schoolId];
  let where = "a.school_id=?";

  // Check if user is only a teacher (doesn't have admin roles)
  const userRoles = (user?.roles || []).map((r) => {
    if (typeof r === "object" && r.role) return r.role;
    if (typeof r === "string") return r;
    return r;
  });
  const isTeacher = userRoles.some((role) => role === "teacher");
  const isAdmin = userRoles.some((role) =>
    [
      "super_admin",
      "school_admin",
      "admin",
      "manager",
      "deputy_admin",
    ].includes(role),
  );

  // If they are a teacher but NOT an admin, hide drafts
  if (isTeacher && !isAdmin) {
    if (status && status === "draft") {
      // If they explicitly ask for draft, return nothing
      return [];
    }
    where += " AND a.status != 'draft'";
  }

  if (status) {
    where += " AND a.status=?";
    params.push(status);
  }
  if (term_id) {
    where += " AND a.term_id=?";
    params.push(term_id);
  }
  if (year_id) {
    where += " AND a.academic_year_id=?";
    params.push(year_id);
  }
  if (type_id) {
    where += " AND a.assessment_type_id=?";
    params.push(type_id);
  }
  if (q) {
    where += " AND a.name LIKE ?";
    params.push(`%${q}%`);
  }

  return query(
    `SELECT a.*, at.name AS type_name, at.code AS type_code, at.weight AS type_weight,
            (SELECT COUNT(*) FROM assessment_classes ac WHERE ac.assessment_id=a.id) AS class_count,
            (SELECT COUNT(*) FROM assessment_subjects asu WHERE asu.assessment_id=a.id) AS subject_count,
            (SELECT COUNT(*) FROM assessment_tasks t WHERE t.assessment_id=a.id) AS task_count,
            (SELECT COUNT(*) FROM assessment_tasks t WHERE t.assessment_id=a.id AND t.status IN ('submitted','approved','locked')) AS task_done
       FROM assessments a
       LEFT JOIN assessment_types at ON at.id=a.assessment_type_id
      WHERE ${where}
      ORDER BY a.created_at DESC`,
    params,
  );
};

// ---------- GET ONE ----------
exports.get = async (id, schoolId) => {
  const a = await queryOne(
    `SELECT a.*, at.name AS type_name, at.code AS type_code, at.weight AS type_weight
       FROM assessments a LEFT JOIN assessment_types at ON at.id=a.assessment_type_id
      WHERE a.id=? AND a.school_id=?`,
    [id, schoolId],
  );
  if (!a) return null;
  a.classes = await query(
    `SELECT ac.id, ac.grade_id, g.name AS grade_name
       FROM assessment_classes ac JOIN grades g ON g.id=ac.grade_id
      WHERE ac.assessment_id=? ORDER BY g.name`,
    [id],
  );
  a.subjects = await query(
    `SELECT asu.id, asu.grade_id, asu.subject_id, asu.out_of,
            g.name AS grade_name, s.name AS subject_name, s.code AS subject_code
       FROM assessment_subjects asu
       JOIN grades g ON g.id=asu.grade_id
       JOIN subjects s ON s.id=asu.subject_id
      WHERE asu.assessment_id=? ORDER BY g.name, s.name`,
    [id],
  );
  return a;
};

// ---------- CREATE ----------
exports.create = async (data) => {
  const id = uuid();
  const curriculum =
    (data.curriculum_type || "CBC").toUpperCase() === "844" ? "844" : "CBC";
  await execute(
    `INSERT INTO assessments (id, school_id, academic_year_id, term_id, assessment_type_id,
        name, description, start_date, end_date, status, created_by, curriculum_type)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.academic_year_id || null,
      data.term_id || null,
      data.assessment_type_id || null,
      data.name,
      data.description || null,
      data.start_date || null,
      data.end_date || null,
      data.status || "draft",
      data.created_by || null,
      curriculum,
    ],
  );

  // attach classes
  const gradeIds = Array.isArray(data.grade_ids) ? data.grade_ids : [];
  for (const gid of gradeIds) {
    await execute(
      `INSERT INTO assessment_classes (id, assessment_id, grade_id) VALUES (?,?,?)`,
      [uuid(), id, gid],
    );
  }

  // auto-attach subjects from subject_allocations for each grade
  for (const gid of gradeIds) {
    const subs = await query(
      `SELECT sa.subject_id,
              COALESCE(s.curriculum_type,'CBC')    AS s_curr,
              COALESCE(s.calculation_type,'GENERAL') AS calc_type,
              s.calculation_config                  AS calc_cfg,
              COALESCE(s.has_papers,0)              AS has_papers
         FROM subject_allocations sa
         LEFT JOIN subjects s ON s.id = sa.subject_id
        WHERE sa.school_id=? AND sa.grade_id=? AND sa.is_active=1`,
      [data.school_id, gid],
    );
    for (const row of subs) {
      await execute(
        `INSERT IGNORE INTO assessment_subjects
           (id, assessment_id, grade_id, subject_id, out_of,
            curriculum_type, calculation_type, calculation_config, uses_papers)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          uuid(),
          id,
          gid,
          row.subject_id,
          data.out_of || 100,
          curriculum,
          curriculum === "844" ? row.calc_type : null,
          curriculum === "844" ? row.calc_cfg : null,
          curriculum === "844" && Number(row.has_papers) === 1 ? 1 : 0,
        ],
      );
    }
  }

  return exports.get(id, data.school_id);
};

// ---------- UPDATE ----------
exports.update = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const k of [
    "name",
    "description",
    "start_date",
    "end_date",
    "assessment_type_id",
    "academic_year_id",
    "term_id",
    "status",
    "curriculum_type",
  ]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(data[k]);
    }
  }
  if (fields.length) {
    values.push(id, schoolId);
    await execute(
      `UPDATE assessments SET ${fields.join(",")} WHERE id=? AND school_id=?`,
      values,
    );
  }
  return exports.get(id, schoolId);
};

// ---------- DELETE ----------
exports.remove = (id, schoolId) =>
  execute("DELETE FROM assessments WHERE id=? AND school_id=?", [id, schoolId]);

// ---------- PUBLISH + AUTO-GENERATE TASKS ----------
exports.publish = async (id, schoolId) => {
  const a = await queryOne(
    "SELECT * FROM assessments WHERE id=? AND school_id=?",
    [id, schoolId],
  );
  if (!a) throw new Error("Assessment not found");

  // For every (grade, subject) on the assessment, generate tasks per stream
  // and pick the allocated teacher (if any).
  const subs = await query(
    `SELECT grade_id, subject_id FROM assessment_subjects WHERE assessment_id=?`,
    [id],
  );

  for (const { grade_id, subject_id } of subs) {
    const streams = await query(
      `SELECT id FROM streams WHERE grade_id=? AND (is_active=1 OR is_active IS NULL)`,
      [grade_id],
    );
    const targets = streams.length ? streams.map((s) => s.id) : [null]; // grade-only task when no streams

    for (const stream_id of targets) {
      // pick allocated teacher
      const teacher = await queryOne(
        `SELECT teacher_id FROM teacher_subject_allocations
          WHERE school_id=? AND subject_id=? AND grade_id=?
            AND (stream_id<=>? OR stream_id IS NULL)
            AND is_active=1
          ORDER BY (stream_id IS NULL) ASC LIMIT 1`,
        [schoolId, subject_id, grade_id, stream_id],
      );

      // skip if a task already exists for this slot
      const existing = await queryOne(
        `SELECT id FROM assessment_tasks
          WHERE assessment_id=? AND grade_id=? AND (stream_id<=>?) AND subject_id=?`,
        [id, grade_id, stream_id, subject_id],
      );
      if (existing) continue;

      await execute(
        `INSERT INTO assessment_tasks
          (id, assessment_id, grade_id, stream_id, subject_id, teacher_id, status)
         VALUES (?,?,?,?,?,?, 'pending')`,
        [
          uuid(),
          id,
          grade_id,
          stream_id,
          subject_id,
          teacher?.teacher_id || null,
        ],
      );
    }
  }

  await execute(
    `UPDATE assessments SET status='published', published_at=NOW() WHERE id=? AND school_id=?`,
    [id, schoolId],
  );
  return exports.get(id, schoolId);
};

// ---------- LOCK / UNLOCK / ARCHIVE / UNARCHIVE ----------
exports.setStatus = async (id, schoolId, status) => {
  const map = {
    locked: `UPDATE assessments SET status='locked', locked_at=NOW() WHERE id=? AND school_id=?`,
    archived: `UPDATE assessments SET status='archived' WHERE id=? AND school_id=?`,
    in_progress: `UPDATE assessments SET status='in_progress' WHERE id=? AND school_id=?`,
    // Unlock — restore to published (the only state that can become locked)
    published: `UPDATE assessments SET status='published', locked_at=NULL, published_at=COALESCE(published_at, NOW()) WHERE id=? AND school_id=?`,
    // Unarchive / reopen — fall back to draft so the user can re-publish/edit
    draft: `UPDATE assessments SET status='draft', published_at=NULL, locked_at=NULL WHERE id=? AND school_id=?`,
  };
  if (!map[status]) throw new Error("Invalid status");
  await execute(map[status], [id, schoolId]);
  return exports.get(id, schoolId);
};

// ---------- SYNC SUBJECTS WITH CURRENT CLASS ALLOCATIONS ----------
// Called when subject_allocations for a grade change. Adds new subjects and
// removes subjects that no longer belong, but only when there are no marks yet
// and the assessment isn't locked/archived.
exports.syncSubjectsForGrade = async (schoolId, gradeId) => {
  const list = await query(
    `SELECT a.id, a.status FROM assessments a
       JOIN assessment_classes ac ON ac.assessment_id=a.id
      WHERE a.school_id=? AND ac.grade_id=? AND a.status NOT IN ('locked','archived')`,
    [schoolId, gradeId],
  );
  if (!list.length) return { updated: 0 };

  const allocated = await query(
    `SELECT subject_id FROM subject_allocations
      WHERE school_id=? AND grade_id=? AND is_active=1`,
    [schoolId, gradeId],
  );
  const allocatedIds = new Set(allocated.map((s) => s.subject_id));

  for (const a of list) {
    const current = await query(
      `SELECT id, subject_id FROM assessment_subjects WHERE assessment_id=? AND grade_id=?`,
      [a.id, gradeId],
    );
    const currentIds = new Set(current.map((c) => c.subject_id));

    // Remove subjects no longer allocated (only when no marks recorded)
    for (const c of current) {
      if (allocatedIds.has(c.subject_id)) continue;
      const hasMarks = await queryOne(
        `SELECT 1 FROM assessment_marks m
           JOIN assessment_tasks t ON t.id=m.task_id
          WHERE t.assessment_id=? AND t.grade_id=? AND t.subject_id=? AND m.score IS NOT NULL LIMIT 1`,
        [a.id, gradeId, c.subject_id],
      );
      if (hasMarks) continue;
      await execute(
        `DELETE FROM assessment_tasks WHERE assessment_id=? AND grade_id=? AND subject_id=?`,
        [a.id, gradeId, c.subject_id],
      );
      await execute(`DELETE FROM assessment_subjects WHERE id=?`, [c.id]);
    }

    // Add newly allocated subjects
    for (const subject_id of allocatedIds) {
      if (currentIds.has(subject_id)) continue;
      await execute(
        `INSERT IGNORE INTO assessment_subjects (id, assessment_id, grade_id, subject_id, out_of)
         VALUES (?,?,?,?,100)`,
        [uuid(), a.id, gradeId, subject_id],
      );
      // For published/in_progress assessments, also generate teacher tasks
      if (a.status === "published" || a.status === "in_progress") {
        const streams = await query(
          `SELECT id FROM streams WHERE grade_id=? AND (is_active=1 OR is_active IS NULL)`,
          [gradeId],
        );
        const targets = streams.length ? streams.map((s) => s.id) : [null];
        for (const stream_id of targets) {
          const teacher = await queryOne(
            `SELECT teacher_id FROM teacher_subject_allocations
              WHERE school_id=? AND subject_id=? AND grade_id=?
                AND (stream_id<=>? OR stream_id IS NULL) AND is_active=1
              ORDER BY (stream_id IS NULL) ASC LIMIT 1`,
            [schoolId, subject_id, gradeId, stream_id],
          );
          const exists = await queryOne(
            `SELECT id FROM assessment_tasks
              WHERE assessment_id=? AND grade_id=? AND (stream_id<=>?) AND subject_id=?`,
            [a.id, gradeId, stream_id, subject_id],
          );
          if (exists) continue;
          await execute(
            `INSERT INTO assessment_tasks
               (id, assessment_id, grade_id, stream_id, subject_id, teacher_id, status)
             VALUES (?,?,?,?,?,?, 'pending')`,
            [
              uuid(),
              a.id,
              gradeId,
              stream_id,
              subject_id,
              teacher?.teacher_id || null,
            ],
          );
        }
      }
    }
  }
  return { updated: list.length };
};

// Resync all grades attached to an assessment (manual trigger)
exports.resyncSubjects = async (id, schoolId) => {
  const grades = await query(
    `SELECT grade_id FROM assessment_classes WHERE assessment_id=?`,
    [id],
  );
  for (const g of grades) {
    await exports.syncSubjectsForGrade(schoolId, g.grade_id);
  }
  return exports.get(id, schoolId);
};

// ---------- TASKS ----------
exports.listTasksV1 = (
  schoolId,
  { assessment_id, teacher_id, status, grade_id } = {},
) => {
  const params = [schoolId];
  let where = "a.school_id=?";
  if (assessment_id) {
    where += " AND t.assessment_id=?";
    params.push(assessment_id);
  }
  if (teacher_id) {
    where += " AND t.teacher_id=?";
    params.push(teacher_id);
  }
  if (status) {
    where += " AND t.status=?";
    params.push(status);
  }
  if (grade_id) {
    where += " AND t.grade_id=?";
    params.push(grade_id);
  }
  return query(
    `SELECT t.*, a.name AS assessment_name, a.status AS assessment_status,
            g.name AS grade_name, st.name AS stream_name,
            s.name AS subject_name, s.code AS subject_code,
            CONCAT(COALESCE(te.first_name,''),' ',COALESCE(te.last_name,'')) AS teacher_name,
            (SELECT COUNT(*) FROM students stu WHERE stu.grade_id=t.grade_id
                AND (stu.stream_id<=>t.stream_id OR t.stream_id IS NULL)
                AND stu.status='active') AS student_count,
            (SELECT COUNT(*) FROM assessment_marks m WHERE m.task_id=t.id AND m.score IS NOT NULL) AS marked_count
       FROM assessment_tasks t
       JOIN assessments a ON a.id=t.assessment_id
       JOIN grades g ON g.id=t.grade_id
       JOIN subjects s ON s.id=t.subject_id
       LEFT JOIN streams st ON st.id=t.stream_id
       LEFT JOIN teachers te ON te.id=t.teacher_id
      WHERE ${where}
      ORDER BY a.created_at DESC, g.name, s.name`,
    params,
  );
};

exports.listTasks = async (
  schoolId,
  {
    assessment_id,
    teacher_id,
    status,
    grade_id,
    stream_id,
    assessment_type_id,
    search,
    page,
    limit,
  } = {},
  user,
) => {
  const params = [schoolId];
  let where = "a.school_id=?";

  console.log("listTasks called with", {
    schoolId,
    assessment_id,
    teacher_id,
    status,
    grade_id,
    user,
  });

  console.log("User roles:", user?.roles);

  let teacherId = teacher_id || null; // for admin override

  // Extract role strings from role objects
  const userRoles = (user?.roles || []).map((r) => {
    // If role is an object with a 'role' property
    if (typeof r === "object" && r.role) {
      return r.role;
    }
    // If role is a string
    if (typeof r === "string") {
      return r;
    }
    return r;
  });

  console.log("Extracted user roles:", userRoles);

  const isTeacher = userRoles.some((role) => role === "teacher");
  console.log("Is teacher:", isTeacher);

  if (isTeacher) {
    console.log("Fetching teacher profile for user ID:", user.id);
    const teacher = await queryOne(
      `SELECT t.id FROM teachers t
       JOIN staff s ON s.id = t.staff_id
       WHERE s.user_id = ? AND s.school_id = ?`,
      [user.id, schoolId],
    );
    console.log("Teacher found:", teacher);

    if (!teacher) throw new Error("Teacher profile not found");
    teacherId = teacher.id;
    console.log("Setting teacherId filter to:", teacherId);
  }

  if (assessment_id) {
    where += " AND t.assessment_id=?";
    params.push(assessment_id);
  }
  if (teacherId) {
    where += " AND t.teacher_id=?";
    params.push(teacherId);
  }
  if (status) {
    where += " AND t.status=?";
    params.push(status);
  }
  if (grade_id) {
    where += " AND t.grade_id=?";
    params.push(grade_id);
  }
  if (stream_id) {
    where += " AND t.stream_id=?";
    params.push(stream_id);
  }
  if (assessment_type_id) {
    where += " AND a.assessment_type_id=?";
    params.push(assessment_type_id);
  }
  if (search) {
    where +=
      " AND (a.name LIKE ? OR s.name LIKE ? OR s.code LIKE ? OR g.name LIKE ?)";
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const lim = Math.min(200, Math.max(1, Number(limit) || 100));
  const offset = (pageNum - 1) * lim;

  const totalRow = await queryOne(
    `SELECT COUNT(*) AS c
       FROM assessment_tasks t
       JOIN assessments a ON a.id = t.assessment_id
       JOIN grades g ON g.id = t.grade_id
       JOIN subjects s ON s.id = t.subject_id
       LEFT JOIN streams st ON st.id = t.stream_id
      WHERE ${where}`,
    params,
  );

  const data = await query(
    `SELECT t.*, a.name AS assessment_name, a.status AS assessment_status,
            a.assessment_type_id,
            g.name AS grade_name, st.name AS stream_name,
            s.name AS subject_name, s.code AS subject_code,
            CONCAT(COALESCE(sf.first_name,''),' ',COALESCE(sf.last_name,'')) AS teacher_name,
            (SELECT COUNT(*) FROM students stu WHERE stu.current_grade_id = t.grade_id
                AND (stu.current_stream_id <=> t.stream_id OR t.stream_id IS NULL)
                AND stu.status = 'active') AS student_count,
            (SELECT COUNT(*) FROM assessment_marks m WHERE m.task_id = t.id AND m.score IS NOT NULL) AS marked_count
     FROM assessment_tasks t
     JOIN assessments a ON a.id = t.assessment_id
     JOIN grades g ON g.id = t.grade_id
     JOIN subjects s ON s.id = t.subject_id
     LEFT JOIN streams st ON st.id = t.stream_id
     LEFT JOIN teachers te ON te.id = t.teacher_id
     LEFT JOIN staff sf ON sf.id = te.staff_id
     WHERE ${where}
     ORDER BY a.created_at DESC, g.name, s.name
     LIMIT ${lim} OFFSET ${offset}`,
    params,
  );

  return {
    data,
    total: Number(totalRow?.c || 0),
    page: pageNum,
    limit: lim,
  };
};

exports.reassignTask = (id, teacher_id) =>
  execute("UPDATE assessment_tasks SET teacher_id=? WHERE id=?", [
    teacher_id,
    id,
  ]);

exports.setTaskStatus = (id, status) =>
  execute(
    `UPDATE assessment_tasks SET status=?, submitted_at=CASE WHEN ?='submitted' THEN NOW() ELSE submitted_at END WHERE id=?`,
    [status, status, id],
  );
