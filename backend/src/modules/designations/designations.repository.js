const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const create = async (data) => {
  const id = uuidv4();
  const { school_id, name, description } = data;

  await query(
    "INSERT INTO designations (id, school_id, name, description) VALUES (?, ?, ?, ?)",
    [id, school_id, name, description],
  );

  return { id, ...data };
};

const findAll = async (schoolId, { limit, offset }) => {
  // Ensure they're numbers
  const numLimit = parseInt(limit, 10);
  const numOffset = parseInt(offset, 10);

  const rows = await query(
    `SELECT * FROM designations WHERE school_id = ? AND is_active = TRUE ORDER BY name ASC LIMIT ${numLimit} OFFSET ${numOffset}`,
    [schoolId],
  );

  const countRes = await query(
    "SELECT COUNT(*) as count FROM designations WHERE school_id = ? AND is_active = TRUE",
    [schoolId],
  );

  return { rows, total: countRes[0]?.count || 0 };
};

const findById = async (id, schoolId) => {
  return queryOne("SELECT * FROM designations WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
};

const update = async (id, schoolId, data) => {
  const { name, description, is_active } = data;
  await query(
    "UPDATE designations SET name = ?, description = ?, is_active = ? WHERE id = ? AND school_id = ?",
    [name, description, is_active, id, schoolId],
  );
  return { id, ...data };
};

module.exports = { create, findAll, findById, update };
