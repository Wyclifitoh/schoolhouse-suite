// Per-school 8-4-4 grading scale CRUD.
// Falls back to DEFAULT_844 (hardcoded) when no rows exist for the school.
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");
const { DEFAULT_844 } = require("./grading844");

async function ensureDefaults(schoolId) {
  const row = await queryOne(
    "SELECT COUNT(*) AS c FROM grading_scales_844 WHERE school_id=?",
    [schoolId],
  );
  if (row && Number(row.c) > 0) return;
  let i = 1;
  for (const g of DEFAULT_844) {
    await execute(
      `INSERT INTO grading_scales_844
        (id, school_id, code, min_pct, max_pct, points, remark, sort_order, is_active)
       VALUES (?,?,?,?,?,?,?,?,1)`,
      [uuid(), schoolId, g.code, g.min, g.max, g.points, g.remark, i++],
    );
  }
}

exports.list = async (schoolId) => {
  await ensureDefaults(schoolId);
  return query(
    "SELECT * FROM grading_scales_844 WHERE school_id=? ORDER BY sort_order, points DESC",
    [schoolId],
  );
};

// Returns rows in the shape expected by grading844 helpers
// ({ min, max, code, points, remark }) — or DEFAULT_844 if school has none.
exports.getScale = async (schoolId) => {
  const rows = await query(
    `SELECT code, min_pct AS min, max_pct AS max, points, remark
       FROM grading_scales_844
      WHERE school_id=? AND is_active=1
      ORDER BY points DESC`,
    [schoolId],
  );
  if (!rows.length) return DEFAULT_844;
  return rows.map((r) => ({
    code: r.code,
    min: Number(r.min),
    max: Number(r.max),
    points: Number(r.points),
    remark: r.remark,
  }));
};

exports.upsert = async (data) => {
  const existing = data.id
    ? await queryOne(
        "SELECT id FROM grading_scales_844 WHERE id=? AND school_id=?",
        [data.id, data.school_id],
      )
    : await queryOne(
        "SELECT id FROM grading_scales_844 WHERE school_id=? AND code=?",
        [data.school_id, data.code],
      );
  const fields = [
    data.code,
    Number(data.min_pct),
    Number(data.max_pct),
    Number(data.points),
    data.remark || null,
    Number(data.sort_order || 0),
    data.is_active === false ? 0 : 1,
  ];
  if (existing) {
    await execute(
      `UPDATE grading_scales_844
          SET code=?, min_pct=?, max_pct=?, points=?, remark=?, sort_order=?, is_active=?
        WHERE id=? AND school_id=?`,
      [...fields, existing.id, data.school_id],
    );
    return queryOne("SELECT * FROM grading_scales_844 WHERE id=?", [existing.id]);
  }
  const id = uuid();
  await execute(
    `INSERT INTO grading_scales_844
       (id, school_id, code, min_pct, max_pct, points, remark, sort_order, is_active)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, data.school_id, ...fields],
  );
  return queryOne("SELECT * FROM grading_scales_844 WHERE id=?", [id]);
};

exports.remove = (id, schoolId) =>
  execute("DELETE FROM grading_scales_844 WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);

exports.resetDefaults = async (schoolId) => {
  await execute("DELETE FROM grading_scales_844 WHERE school_id=?", [schoolId]);
  await ensureDefaults(schoolId);
  return exports.list(schoolId);
};