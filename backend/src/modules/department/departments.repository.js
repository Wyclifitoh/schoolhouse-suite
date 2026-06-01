const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const create = async (data) => {
  const id = uuidv4();
  const { school_id, name, description } = data;

  await query(
    "INSERT INTO departments (id, school_id, name, description) VALUES (?, ?, ?, ?)",
    [id, school_id, name, description],
  );

  return { id, ...data };
};

const findAll = async (schoolId, { limit, offset }) => {
  // Ensure they're numbers
  const numLimit = parseInt(limit, 10);
  const numOffset = parseInt(offset, 10);

  const rows = await query(
    `SELECT * FROM departments WHERE school_id = ? ORDER BY name ASC LIMIT ${numLimit} OFFSET ${numOffset}`,
    [schoolId],
  );

  const countResult = await query(
    "SELECT COUNT(*) as count FROM departments WHERE school_id = ?",
    [schoolId],
  );

  return {
    rows,
    total: countResult[0]?.count || 0,
  };
};
const findById = async (id, schoolId) => {
  return queryOne("SELECT * FROM departments WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
};

const update = async (id, schoolId, data) => {
  const { name, description, is_active } = data;
  await query(
    `UPDATE departments SET name = ?, description = ?, is_active = COALESCE(?, is_active)
     WHERE id = ? AND school_id = ?`,
    [
      name,
      description,
      typeof is_active === "boolean" ? (is_active ? 1 : 0) : null,
      id,
      schoolId,
    ],
  );
  return { id, ...data };
};

const remove = async (id, schoolId) => {
  await query(
    `UPDATE departments SET is_active = 0 WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  );
  return { id, is_active: false };
};

module.exports = { create, findAll, findById, update, remove };
