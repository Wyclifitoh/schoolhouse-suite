const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const create = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO staff_ratings
      (id, school_id, staff_id, rated_by, period,
       punctuality, performance, responsibility, assessment_submission, comments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.school_id, data.staff_id, data.rated_by, data.period ?? null,
      data.punctuality ?? 0, data.performance ?? 0,
      data.responsibility ?? 0, data.assessment_submission ?? 0,
      data.comments ?? null,
    ],
  );
  return queryOne("SELECT * FROM staff_ratings WHERE id = ?", [id]);
};

const listForStaff = (schoolId, staffId) =>
  query(
    `SELECT sr.*, u.full_name AS rater_name
       FROM staff_ratings sr
       LEFT JOIN users u ON u.id = sr.rated_by
      WHERE sr.school_id = ? AND sr.staff_id = ?
      ORDER BY sr.created_at DESC`,
    [schoolId, staffId],
  );

const listAll = async (schoolId, { limit, offset }) => {
  const rows = await query(
    `SELECT sr.*, s.first_name, s.last_name, u.full_name AS rater_name
       FROM staff_ratings sr
       JOIN staff s ON s.id = sr.staff_id
       LEFT JOIN users u ON u.id = sr.rated_by
      WHERE sr.school_id = ?
      ORDER BY sr.created_at DESC
      LIMIT ? OFFSET ?`,
    [schoolId, limit, offset],
  );
  const count = await query(
    "SELECT COUNT(*) AS count FROM staff_ratings WHERE school_id = ?",
    [schoolId],
  );
  return { rows, total: count[0]?.count || 0 };
};

const remove = async (id, schoolId) => {
  await query("DELETE FROM staff_ratings WHERE id = ? AND school_id = ?", [id, schoolId]);
  return { deleted: true };
};

module.exports = { create, listForStaff, listAll, remove };
