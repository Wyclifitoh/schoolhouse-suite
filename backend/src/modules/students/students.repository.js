const { query, queryOne, queryCount } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const findAllV1 = async (
  schoolId,
  { limit, offset, search, status, gradeId, streamIds },
) => {
  // Parse as integers to ensure they're numbers
  const numLimit = parseInt(limit, 10);
  const numOffset = parseInt(offset, 10);

  let sql = "SELECT * FROM students WHERE school_id = ?";
  const params = [schoolId];

  if (status && status !== "all") {
    sql += " AND status = ?";
    params.push(status);
  }
  if (gradeId) {
    // Match by id OR by name (legacy students without current_grade_id set)
    sql +=
      " AND (current_grade_id = ? OR (current_grade_id IS NULL AND grade = (SELECT name FROM grades WHERE id = ?)))";
    params.push(gradeId, gradeId);
  }
  if (streamIds && streamIds.length) {
    const ph = streamIds.map(() => "?").join(",");
    sql += ` AND (current_stream_id IN (${ph}) OR (current_stream_id IS NULL AND stream IN (SELECT name FROM streams WHERE id IN (${ph}))))`;
    params.push(...streamIds, ...streamIds);
  }
  if (search) {
    sql +=
      " AND (full_name LIKE ? OR admission_number LIKE ? OR first_name LIKE ? OR last_name LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  // Build count SQL (remove ORDER BY and LIMIT/OFFSET)
  let countSql = sql;
  // Remove ORDER BY clause for count query
  const orderByIndex = countSql.toUpperCase().indexOf(" ORDER BY ");
  if (orderByIndex !== -1) {
    countSql = countSql.substring(0, orderByIndex);
  }
  countSql = countSql.replace("SELECT *", "SELECT COUNT(*) as count");

  // Add ORDER BY and use template literals for LIMIT/OFFSET (not placeholders)
  sql += ` ORDER BY created_at DESC LIMIT ${numLimit} OFFSET ${numOffset}`;

  const [rows, countRows] = await Promise.all([
    query(sql, params),
    query(countSql, params), // All params except no LIMIT/OFFSET needed
  ]);

  return { rows, total: countRows[0]?.count || 0 };
};

const findAll = async (
  schoolId,
  { limit, offset, search, status, gradeId, streamIds },
) => {
  // Parse as integers
  const numLimit = parseInt(limit, 10);
  const numOffset = parseInt(offset, 10);

  // Build WHERE clause (using alias `s` so it works with our JOIN below)
  let whereClause = " WHERE s.school_id = ?";
  const params = [schoolId];

  if (status && status !== "all") {
    whereClause += " AND s.status = ?";
    params.push(status);
  }
  if (gradeId) {
    whereClause +=
      " AND (s.current_grade_id = ? OR (s.current_grade_id IS NULL AND s.grade = (SELECT name FROM grades WHERE id = ?)))";
    params.push(gradeId, gradeId);
  }
  if (streamIds && streamIds.length) {
    const ph = streamIds.map(() => "?").join(",");
    whereClause += ` AND (s.current_stream_id IN (${ph}) OR (s.current_stream_id IS NULL AND s.stream IN (SELECT name FROM streams WHERE id IN (${ph}))))`;
    params.push(...streamIds, ...streamIds);
  }
  if (search) {
    whereClause +=
      " AND (s.full_name LIKE ? OR s.admission_number LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)";
    const sv = `%${search}%`;
    params.push(sv, sv, sv, sv);
  }

  // Main query — overlay primary parent (from student_parents) so the list
  // always reflects the linked guardian, not stale legacy columns.
  const sql = `
    SELECT s.*,
           COALESCE(NULLIF(TRIM(CONCAT_WS(' ', pp.first_name, pp.last_name)), ''), s.parent_name) AS parent_name,
           COALESCE(pp.phone, s.parent_phone) AS parent_phone,
           pp.email AS parent_email,
           st.name as stream,
           g.name as grade
      FROM students s
      LEFT JOIN streams st ON st.id = s.current_stream_id
      LEFT JOIN grades g ON g.id = s.current_grade_id
      LEFT JOIN (
        SELECT sp.student_id, p.first_name, p.last_name, p.phone, p.email,
               ROW_NUMBER() OVER (
                 PARTITION BY sp.student_id
                 ORDER BY sp.is_primary_contact DESC, sp.created_at ASC
               ) AS rn
          FROM student_parents sp
          JOIN parents p ON p.id = sp.parent_id
      ) pp ON pp.student_id = s.id AND pp.rn = 1
      ${whereClause}
      ORDER BY s.created_at DESC LIMIT ${numLimit} OFFSET ${numOffset}`;

  // Count query (no JOIN needed)
  const countSql = `SELECT COUNT(*) as count FROM students s ${whereClause}`;

  const [rows, countRows] = await Promise.all([
    query(sql, params),
    query(countSql, params),
  ]);

  return { rows, total: countRows[0]?.count || 0 };
};

const findById = async (id, schoolId) => {
  const student = await queryOne(
    "SELECT * FROM students WHERE id = ? AND school_id = ?",
    [id, schoolId],
  );
  if (!student) return null;
  // Attach linked parents (via student_parents) so UI never has to rely on
  // the legacy students.parent_name / parent_phone columns alone.
  const parents = await query(
    `SELECT p.id, p.first_name, p.last_name, p.phone, p.alt_phone, p.email,
            p.occupation, p.id_number,
            sp.relationship, sp.is_primary
       FROM student_parents sp
       JOIN parents p ON p.id = sp.parent_id
      WHERE sp.student_id = ?
      ORDER BY (sp.is_primary = 1) DESC, sp.created_at ASC`,
    [id],
  ).catch(() => []);
  student.parents = parents;
  // Convenience fields — first linked parent wins, fallback to legacy cols
  const primary = parents[0];
  if (primary) {
    student.parent_name =
      `${primary.first_name || ""} ${primary.last_name || ""}`.trim();
    student.parent_phone = primary.phone || student.parent_phone;
    student.parent_email = primary.email || null;
  }
  return student;
};

const create = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO students (id, school_id, admission_number, first_name, middle_name, last_name, date_of_birth, gender, religion, nationality, grade, stream, current_grade_id, current_stream_id, current_term_id, admission_date, previous_school, medical_info, special_needs, parent_name, parent_phone, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.admission_number,
      data.first_name,
      data.middle_name || null,
      data.last_name,
      data.date_of_birth || null,
      data.gender || null,
      data.religion || null,
      data.nationality || "Kenyan",
      data.grade || null,
      data.stream || null,
      data.current_grade_id || null,
      data.current_stream_id || null,
      data.current_term_id || null,
      data.admission_date || null,
      data.previous_school || null,
      data.medical_info ? JSON.stringify(data.medical_info) : null,
      data.special_needs || null,
      data.parent_name || null,
      data.parent_phone || null,
      data.status || "active",
    ],
  );
  return queryOne("SELECT * FROM students WHERE id = ?", [id]);
};

const bulkCreate = async (schoolId, students) => {
  const created = [];
  const failed = [];

  for (const [index, data] of students.entries()) {
    try {
      const student = await create({ ...data, school_id: schoolId });
      created.push(student);
    } catch (err) {
      failed.push({
        row: index + 1,
        admission_number: data.admission_number || null,
        message: err.message,
      });
    }
  }

  return { created, failed, total: students.length };
};

const update = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === "medical_info") {
      fields.push(`${key} = ?`);
      values.push(JSON.stringify(value));
    } else {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return findById(id, schoolId);
  values.push(id, schoolId);
  await query(
    `UPDATE students SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne("SELECT * FROM students WHERE id = ?", [id]);
};

const findByParentPhone = async (schoolId, parentPhone, excludeId) => {
  let sql =
    "SELECT id, first_name, last_name, full_name, admission_number, grade, stream, status FROM students WHERE school_id = ? AND parent_phone = ?";
  const params = [schoolId, parentPhone];
  if (excludeId) {
    sql += " AND id != ?";
    params.push(excludeId);
  }
  return query(sql, params);
};

const getNextAdmissionNumber = async (schoolId) => {
  const result = await queryOne(
    "SELECT admission_number FROM students WHERE school_id = ? ORDER BY created_at DESC LIMIT 1",
    [schoolId],
  );
  if (!result || !result.admission_number) return "1000";

  const match = result.admission_number.match(/\d+$/);
  if (match) {
    const nextNum = parseInt(match[0], 10) + 1;
    const numStr = String(nextNum).padStart(match[0].length, "0");
    return result.admission_number.replace(/\d+$/, numStr);
  }

  return result.admission_number + "-1";
};

module.exports = {
  findAll,
  findById,
  create,
  bulkCreate,
  update,
  findByParentPhone,
  getNextAdmissionNumber,
};
