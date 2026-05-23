const { query, queryOne, queryCount } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const findAll = async (
  schoolId,
  { limit, offset, search, status, gradeId, streamIds },
) => {
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

  const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as count");
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const [rows, countRows] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, -2)),
  ]);

  return { rows, total: countRows[0]?.count || 0 };
};

const findById = async (id, schoolId) => {
  return queryOne("SELECT * FROM students WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
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

module.exports = {
  findAll,
  findById,
  create,
  bulkCreate,
  update,
  findByParentPhone,
};
