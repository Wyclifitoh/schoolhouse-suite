const { query, queryOne, queryCount } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const findAll = async (schoolId, { limit, offset, search, student_id }) => {
  const numLimit = parseInt(limit, 10) || 20;
  const numOffset = parseInt(offset, 10) || 0;

  // If filtering by student, join through student_parents so we return ONLY
  // the parents/guardians attached to that specific student.
  if (student_id) {
    let sql = `SELECT p.*, sp.relationship, sp.is_primary_contact AS is_primary
                 FROM parents p
                 JOIN student_parents sp ON sp.parent_id = p.id
                WHERE p.school_id = ? AND sp.student_id = ?`;
    const params = [schoolId, student_id];
    if (search) {
      sql +=
        " AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    sql += ` ORDER BY sp.is_primary_contact DESC, p.first_name ASC LIMIT ${numLimit} OFFSET ${numOffset}`;
    const rows = await query(sql, params);
    return { rows, total: rows.length };
  }

  let sql = "SELECT * FROM parents WHERE school_id = ?";
  const params = [schoolId];

  if (search) {
    sql +=
      " AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)";
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  let countSql = sql.replace("SELECT *", "SELECT COUNT(*) as count");
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
    `SELECT sp.id AS link_id, sp.relationship, sp.is_primary_contact, sp.is_fee_payer,
            s.id, s.first_name, s.last_name, s.full_name, s.admission_number,
            s.grade, s.stream, s.status, s.school_id
       FROM student_parents sp
       JOIN students s ON s.id = sp.student_id
      WHERE sp.parent_id = ?
      ORDER BY sp.is_primary_contact DESC, s.grade ASC, s.first_name ASC`,
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
