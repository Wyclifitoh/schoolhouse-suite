const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

// ---------- ASSESSMENT TYPES ----------
exports.listTypes = (schoolId) =>
  query(
    "SELECT * FROM assessment_types WHERE school_id=? ORDER BY category, name",
    [schoolId],
  );

exports.createType = async (data) => {
  const id = uuid();
  await execute(
    `INSERT INTO assessment_types (id, school_id, code, name, category, weight, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.code,
      data.name,
      data.category,
      data.weight || 0,
      data.is_active !== false ? 1 : 0,
    ],
  );
  return queryOne("SELECT * FROM assessment_types WHERE id=?", [id]);
};

exports.updateType = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const k of ["code", "name", "category", "weight", "is_active"]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(data[k]);
    }
  }
  if (fields.length) {
    values.push(id, schoolId);
    await execute(
      `UPDATE assessment_types SET ${fields.join(",")} WHERE id=? AND school_id=?`,
      values,
    );
  }
  return queryOne("SELECT * FROM assessment_types WHERE id=?", [id]);
};

exports.deleteType = (id, schoolId) =>
  execute("DELETE FROM assessment_types WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);

// ---------- BANDS ----------
exports.listBands = (schoolId) =>
  query(
    "SELECT * FROM cbc_performance_bands WHERE school_id=? ORDER BY sort_order",
    [schoolId],
  );

exports.upsertBand = async (data) => {
  const existing = await queryOne(
    "SELECT id FROM cbc_performance_bands WHERE school_id=? AND code=?",
    [data.school_id, data.code],
  );
  if (existing) {
    await execute(
      `UPDATE cbc_performance_bands SET name=?, color=?, sort_order=?, is_active=? WHERE id=?`,
      [
        data.name,
        data.color || "#3b82f6",
        data.sort_order || 0,
        data.is_active !== false ? 1 : 0,
        existing.id,
      ],
    );
    return queryOne("SELECT * FROM cbc_performance_bands WHERE id=?", [
      existing.id,
    ]);
  }
  const id = uuid();
  await execute(
    `INSERT INTO cbc_performance_bands (id, school_id, code, name, color, sort_order, is_active)
     VALUES (?,?,?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.code,
      data.name,
      data.color || "#3b82f6",
      data.sort_order || 0,
      data.is_active !== false ? 1 : 0,
    ],
  );
  return queryOne("SELECT * FROM cbc_performance_bands WHERE id=?", [id]);
};

exports.deleteBand = (id, schoolId) =>
  execute("DELETE FROM cbc_performance_bands WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);

// ---------- ACHIEVEMENT LEVELS ----------
exports.listLevels = (schoolId) =>
  query(
    "SELECT * FROM achievement_levels WHERE school_id=? ORDER BY sort_order",
    [schoolId],
  );

exports.upsertLevel = async (data) => {
  const existing = await queryOne(
    "SELECT id FROM achievement_levels WHERE school_id=? AND code=?",
    [data.school_id, data.code],
  );
  if (existing) {
    await execute(
      `UPDATE achievement_levels SET band_code=?, min_score=?, max_score=?, points=?, description=?, sort_order=?, is_active=? WHERE id=?`,
      [
        data.band_code,
        data.min_score,
        data.max_score,
        data.points,
        data.description || null,
        data.sort_order || 0,
        data.is_active !== false ? 1 : 0,
        existing.id,
      ],
    );
    return queryOne("SELECT * FROM achievement_levels WHERE id=?", [
      existing.id,
    ]);
  }
  const id = uuid();
  await execute(
    `INSERT INTO achievement_levels (id, school_id, code, band_code, min_score, max_score, points, description, sort_order, is_active)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.code,
      data.band_code,
      data.min_score,
      data.max_score,
      data.points,
      data.description || null,
      data.sort_order || 0,
      data.is_active !== false ? 1 : 0,
    ],
  );
  return queryOne("SELECT * FROM achievement_levels WHERE id=?", [id]);
};

exports.deleteLevel = (id, schoolId) =>
  execute("DELETE FROM achievement_levels WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);

// ---------- COMPETENCIES ----------
exports.listCompetencies = (schoolId) =>
  query(
    "SELECT * FROM cbc_competencies WHERE school_id=? ORDER BY name",
    [schoolId],
  );

exports.createCompetency = async (data) => {
  const id = uuid();
  await execute(
    `INSERT INTO cbc_competencies (id, school_id, name, description, is_active)
     VALUES (?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.name,
      data.description || null,
      data.is_active !== false ? 1 : 0,
    ],
  );
  return queryOne("SELECT * FROM cbc_competencies WHERE id=?", [id]);
};

exports.updateCompetency = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const k of ["name", "description", "is_active"]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(data[k]);
    }
  }
  if (fields.length) {
    values.push(id, schoolId);
    await execute(
      `UPDATE cbc_competencies SET ${fields.join(",")} WHERE id=? AND school_id=?`,
      values,
    );
  }
  return queryOne("SELECT * FROM cbc_competencies WHERE id=?", [id]);
};

exports.deleteCompetency = (id, schoolId) =>
  execute("DELETE FROM cbc_competencies WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);

// ---------- RUBRICS ----------
exports.listRubrics = (schoolId) =>
  query(
    `SELECT r.*, (SELECT COUNT(*) FROM assessment_rubric_criteria c WHERE c.rubric_id=r.id) AS criteria_count
     FROM assessment_rubrics r WHERE r.school_id=? ORDER BY r.created_at DESC`,
    [schoolId],
  );

exports.getRubric = async (id, schoolId) => {
  const r = await queryOne(
    "SELECT * FROM assessment_rubrics WHERE id=? AND school_id=?",
    [id, schoolId],
  );
  if (!r) return null;
  r.criteria = await query(
    "SELECT * FROM assessment_rubric_criteria WHERE rubric_id=? ORDER BY sort_order",
    [id],
  );
  return r;
};

exports.createRubric = async (data) => {
  const id = uuid();
  await execute(
    `INSERT INTO assessment_rubrics (id, school_id, name, scope, description, is_active)
     VALUES (?,?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.name,
      data.scope || "competency",
      data.description || null,
      data.is_active !== false ? 1 : 0,
    ],
  );
  if (Array.isArray(data.criteria)) {
    for (const [i, c] of data.criteria.entries()) {
      await execute(
        `INSERT INTO assessment_rubric_criteria (id, rubric_id, band_code, indicator, sort_order)
         VALUES (?,?,?,?,?)`,
        [uuid(), id, c.band_code, c.indicator, c.sort_order ?? i],
      );
    }
  }
  return exports.getRubric(id, data.school_id);
};

exports.deleteRubric = (id, schoolId) =>
  execute("DELETE FROM assessment_rubrics WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);
