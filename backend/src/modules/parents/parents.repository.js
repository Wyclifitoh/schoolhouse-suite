const { query, queryOne, queryCount } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const findAll = async (schoolId, { limit, offset, search }) => {
  // Parse as integers
  const numLimit = parseInt(limit, 10) || 20;
  const numOffset = parseInt(offset, 10) || 0;

  let sql = "SELECT * FROM parents WHERE school_id = ?";
  const params = [schoolId];

  if (search) {
    sql +=
      " AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  // Build count SQL (remove ORDER BY)
  let countSql = sql;
  const orderByIndex = countSql.toUpperCase().indexOf(" ORDER BY ");
  if (orderByIndex !== -1) {
    countSql = countSql.substring(0, orderByIndex);
  }
  countSql = countSql.replace("SELECT *", "SELECT COUNT(*) as count");

  // Use template literals for LIMIT and OFFSET
  sql += ` ORDER BY created_at DESC LIMIT ${numLimit} OFFSET ${numOffset}`;

  const [rows, countRows] = await Promise.all([
    query(sql, params),
    query(countSql, params),
  ]);

  return { rows, total: countRows[0]?.count || 0 };
};

const findById = async (id, schoolId) => {
  return queryOne("SELECT * FROM parents WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
};

const create = async (data) => {
  const id = uuidv4();
  await query(
    "INSERT INTO parents (id, school_id, first_name, last_name, phone, alt_phone, email, id_number, occupation, employer, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      data.school_id,
      data.first_name,
      data.last_name,
      data.phone,
      data.alt_phone || null,
      data.email || null,
      data.id_number || null,
      data.occupation || null,
      data.employer || null,
      data.address || null,
    ],
  );
  return queryOne("SELECT * FROM parents WHERE id = ?", [id]);
};

const update = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return findById(id, schoolId);
  values.push(id, schoolId);
  await query(
    `UPDATE parents SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne("SELECT * FROM parents WHERE id = ?", [id]);
};

const findChildren = async (parentId) => {
  return query(
    `SELECT sp.relationship, sp.is_primary_contact, s.id, s.first_name, s.last_name, s.full_name, s.admission_number, s.grade, s.stream, s.status
     FROM student_parents sp JOIN students s ON s.id = sp.student_id WHERE sp.parent_id = ?`,
    [parentId],
  );
};

const findByPhone = async (schoolId, phone) => {
  return queryOne("SELECT * FROM parents WHERE school_id = ? AND phone = ?", [
    schoolId,
    phone,
  ]);
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  findChildren,
  findByPhone,
};
