/**
 * CRUD for subject_papers and subject calc config.
 * Lives in the classes module because subjects already live here.
 */
const { v4: uuidv4 } = require("uuid");
const { query, queryOne } = require("../../config/database");

const listPapers = (schoolId, subjectId) =>
  query(
    `SELECT * FROM subject_papers
      WHERE school_id = ? AND subject_id = ?
      ORDER BY display_order ASC, name ASC`,
    [schoolId, subjectId],
  );

const createPaper = async ({ schoolId, subjectId, data }) => {
  const id = uuidv4();
  await query(
    `INSERT INTO subject_papers
       (id, school_id, subject_id, name, code, paper_type, max_marks, display_order, is_active)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      id,
      schoolId,
      subjectId,
      data.name,
      data.code || null,
      data.paper_type || "THEORY",
      data.max_marks ?? 100,
      data.display_order ?? 0,
      data.is_active == null ? 1 : data.is_active ? 1 : 0,
    ],
  );
  return queryOne("SELECT * FROM subject_papers WHERE id = ?", [id]);
};

const updatePaper = async ({ paperId, schoolId, data }) => {
  const allowed = ["name", "code", "paper_type", "max_marks", "display_order", "is_active"];
  const entries = Object.entries(data).filter(
    ([k, v]) => allowed.includes(k) && v !== undefined,
  );
  if (entries.length) {
    const fields = entries.map(([k]) => `${k} = ?`).join(", ");
    const values = entries.map(([, v]) => v);
    await query(
      `UPDATE subject_papers SET ${fields} WHERE id = ? AND school_id = ?`,
      [...values, paperId, schoolId],
    );
  }
  return queryOne("SELECT * FROM subject_papers WHERE id = ?", [paperId]);
};

const deletePaper = async (paperId, schoolId) => {
  await query(`DELETE FROM subject_papers WHERE id = ? AND school_id = ?`, [paperId, schoolId]);
  return { deleted: true };
};

const updateSubjectConfig = async (subjectId, schoolId, data) => {
  const allowed = ["curriculum_type", "has_papers", "calculation_type", "calculation_config"];
  const entries = Object.entries(data).filter(
    ([k, v]) => allowed.includes(k) && v !== undefined,
  );
  if (entries.length) {
    const fields = entries.map(([k]) => `${k} = ?`).join(", ");
    const values = entries.map(([k, v]) =>
      k === "calculation_config" && v != null ? JSON.stringify(v) : v,
    );
    await query(
      `UPDATE subjects SET ${fields} WHERE id = ? AND school_id = ?`,
      [...values, subjectId, schoolId],
    );
  }
  return queryOne("SELECT * FROM subjects WHERE id = ?", [subjectId]);
};

module.exports = { listPapers, createPaper, updatePaper, deletePaper, updateSubjectConfig };