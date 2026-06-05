const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

// Resolve the logical stream NAME from an :id param. The id can refer to any
// of the underlying streams rows that share the same name in the school.
const resolveName = async (schoolId, id) => {
  const row = await queryOne(
    "SELECT name FROM streams WHERE id = ? AND school_id = ? LIMIT 1",
    [id, schoolId],
  );
  return row ? row.name : null;
};

const getCurrentYearId = async (schoolId) => {
  const r = await queryOne(
    "SELECT id FROM academic_years WHERE school_id = ? AND is_current = TRUE LIMIT 1",
    [schoolId],
  );
  return r ? r.id : null;
};

// One logical row per distinct stream name.
const listIndependent = async (schoolId) => {
  const rows = await query(
    `SELECT s.id, s.name, s.description, s.capacity, s.grade_id, g.name AS grade_name
     FROM streams s
     LEFT JOIN grades g ON g.id = s.grade_id
     WHERE s.school_id = ?
     ORDER BY s.name ASC, s.created_at ASC`,
    [schoolId],
  );
  const byName = new Map();
  for (const r of rows) {
    const key = r.name;
    if (!byName.has(key)) {
      byName.set(key, {
        id: r.id, // representative id (first encountered)
        name: r.name,
        description: r.description,
        capacity: r.capacity,
        grade_ids: [],
        grade_names: [],
      });
    }
    const agg = byName.get(key);
    if (r.grade_id && !agg.grade_ids.includes(r.grade_id)) {
      agg.grade_ids.push(r.grade_id);
      if (r.grade_name) agg.grade_names.push(r.grade_name);
    }
  }
  return Array.from(byName.values());
};

const createIndependent = async (schoolId, { name, description, capacity }) => {
  // Block duplicates by name in this school.
  const existing = await queryOne(
    "SELECT id FROM streams WHERE school_id = ? AND name = ? LIMIT 1",
    [schoolId, name],
  );
  if (existing) throw new Error(`A stream named "${name}" already exists`);

  const id = uuidv4();
  const yearId = await getCurrentYearId(schoolId);
  await query(
    `INSERT INTO streams (id, school_id, grade_id, academic_year_id, name, description, capacity)
     VALUES (?, ?, NULL, ?, ?, ?, ?)`,
    [id, schoolId, yearId, name, description || null, capacity || null],
  );
  return queryOne("SELECT * FROM streams WHERE id = ?", [id]);
};

const updateIndependent = async (schoolId, id, data) => {
  const name = await resolveName(schoolId, id);
  if (!name) throw new Error("Stream not found");

  const sets = [];
  const params = [];
  if (typeof data.name === "string" && data.name && data.name !== name) {
    // Prevent rename collision.
    const clash = await queryOne(
      "SELECT id FROM streams WHERE school_id = ? AND name = ? LIMIT 1",
      [schoolId, data.name],
    );
    if (clash) throw new Error(`A stream named "${data.name}" already exists`);
    sets.push("name = ?");
    params.push(data.name);
  }
  if (data.description !== undefined) {
    sets.push("description = ?");
    params.push(data.description || null);
  }
  if (data.capacity !== undefined) {
    sets.push("capacity = ?");
    params.push(data.capacity || null);
  }
  if (sets.length === 0) return { updated: 0 };

  params.push(schoolId, name);
  const result = await query(
    `UPDATE streams SET ${sets.join(", ")} WHERE school_id = ? AND name = ?`,
    params,
  );
  return { updated: result.affectedRows || 0 };
};

const hasStudentRefs = async (schoolId, streamRowIds) => {
  if (!streamRowIds.length) return false;
  const placeholders = streamRowIds.map(() => "?").join(",");
  const r = await queryOne(
    `SELECT COUNT(*) AS c FROM students WHERE school_id = ? AND current_stream_id IN (${placeholders})`,
    [schoolId, ...streamRowIds],
  );
  return (r?.c || 0) > 0;
};

const deleteIndependent = async (schoolId, id) => {
  const name = await resolveName(schoolId, id);
  if (!name) throw new Error("Stream not found");
  const rows = await query(
    "SELECT id FROM streams WHERE school_id = ? AND name = ?",
    [schoolId, name],
  );
  const ids = rows.map((r) => r.id);
  if (await hasStudentRefs(schoolId, ids)) {
    throw new Error("Stream is linked to students and cannot be deleted");
  }
  await query("DELETE FROM streams WHERE school_id = ? AND name = ?", [schoolId, name]);
  return { deleted: ids.length };
};

// Attach the logical stream to a grade. Find-or-create the per-grade row so
// existing per-grade FKs (students, timetable) keep their granularity.
const attachToGrade = async (schoolId, id, gradeId) => {
  const name = await resolveName(schoolId, id);
  if (!name) throw new Error("Stream not found");
  const grade = await queryOne(
    "SELECT id FROM grades WHERE id = ? AND school_id = ?",
    [gradeId, schoolId],
  );
  if (!grade) throw new Error("Grade not found");

  const existing = await queryOne(
    "SELECT * FROM streams WHERE school_id = ? AND grade_id = ? AND name = ? LIMIT 1",
    [schoolId, gradeId, name],
  );
  if (existing) return existing;

  // Use the "template" row (grade_id IS NULL) if available so we don't
  // accumulate stale unassigned rows.
  const template = await queryOne(
    "SELECT * FROM streams WHERE school_id = ? AND name = ? AND grade_id IS NULL LIMIT 1",
    [schoolId, name],
  );
  if (template) {
    await query(
      "UPDATE streams SET grade_id = ? WHERE id = ?",
      [gradeId, template.id],
    );
    return queryOne("SELECT * FROM streams WHERE id = ?", [template.id]);
  }

  // Otherwise clone metadata from any existing row with this name.
  const meta = await queryOne(
    "SELECT description, capacity, academic_year_id FROM streams WHERE school_id = ? AND name = ? LIMIT 1",
    [schoolId, name],
  );
  const newId = uuidv4();
  const yearId = meta?.academic_year_id || (await getCurrentYearId(schoolId));
  await query(
    `INSERT INTO streams (id, school_id, grade_id, academic_year_id, name, description, capacity)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      newId,
      schoolId,
      gradeId,
      yearId,
      name,
      meta?.description || null,
      meta?.capacity || null,
    ],
  );
  return queryOne("SELECT * FROM streams WHERE id = ?", [newId]);
};

const detachFromGrade = async (schoolId, id, gradeId) => {
  const name = await resolveName(schoolId, id);
  if (!name) throw new Error("Stream not found");
  const row = await queryOne(
    "SELECT id FROM streams WHERE school_id = ? AND grade_id = ? AND name = ? LIMIT 1",
    [schoolId, gradeId, name],
  );
  if (!row) return { detached: 0 };
  if (await hasStudentRefs(schoolId, [row.id])) {
    throw new Error("Stream is linked to students in this class and cannot be detached");
  }
  await query("DELETE FROM streams WHERE id = ?", [row.id]);
  return { detached: 1 };
};

module.exports = {
  listIndependent,
  createIndependent,
  updateIndependent,
  deleteIndependent,
  attachToGrade,
  detachFromGrade,
};
