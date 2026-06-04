// Subject remark bands — auto-fill remarks when score is entered.
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

const DEFAULTS = [
  { min: 80, max: 100, remark: "Excellent performance — keep it up!" },
  { min: 65, max: 79.99, remark: "Very good work; continue practising." },
  { min: 50, max: 64.99, remark: "Good effort; aim higher next time." },
  { min: 40, max: 49.99, remark: "Fair; needs more practice." },
  { min: 0, max: 39.99, remark: "Needs improvement — seek extra help." },
];

async function ensureDefaults(schoolId) {
  const row = await queryOne(
    "SELECT COUNT(*) AS c FROM subject_remark_bands WHERE school_id=?",
    [schoolId],
  );
  if (row && Number(row.c) > 0) return;
  for (let i = 0; i < DEFAULTS.length; i++) {
    const d = DEFAULTS[i];
    await execute(
      `INSERT INTO subject_remark_bands
        (id, school_id, subject_id, grade_id, min_pct, max_pct, remark, sort_order, is_active)
       VALUES (?,?,?,?,?,?,?,?,1)`,
      [uuid(), schoolId, null, null, d.min, d.max, d.remark, i],
    );
  }
}

exports.list = async (schoolId, { subject_id, grade_id } = {}) => {
  await ensureDefaults(schoolId);
  const params = [schoolId];
  let where = "school_id=?";
  if (subject_id) {
    where += " AND (subject_id=? OR subject_id IS NULL)";
    params.push(subject_id);
  }
  if (grade_id) {
    where += " AND (grade_id=? OR grade_id IS NULL)";
    params.push(grade_id);
  }
  return query(
    `SELECT b.*, s.name AS subject_name, g.name AS grade_name
       FROM subject_remark_bands b
       LEFT JOIN subjects s ON s.id=b.subject_id
       LEFT JOIN grades g ON g.id=b.grade_id
      WHERE ${where}
      ORDER BY (b.subject_id IS NULL), (b.grade_id IS NULL),
               s.name, g.name, b.sort_order, b.min_pct DESC`,
    params,
  );
};

exports.upsert = async (data) => {
  const id = data.id || uuid();
  const existing = data.id
    ? await queryOne(
        "SELECT id FROM subject_remark_bands WHERE id=? AND school_id=?",
        [data.id, data.school_id],
      )
    : null;
  if (existing) {
    await execute(
      `UPDATE subject_remark_bands SET
         subject_id=?, grade_id=?, min_pct=?, max_pct=?, remark=?, sort_order=?, is_active=?
       WHERE id=? AND school_id=?`,
      [
        data.subject_id || null,
        data.grade_id || null,
        Number(data.min_pct),
        Number(data.max_pct),
        data.remark,
        Number(data.sort_order || 0),
        data.is_active === false ? 0 : 1,
        existing.id,
        data.school_id,
      ],
    );
    return queryOne("SELECT * FROM subject_remark_bands WHERE id=?", [
      existing.id,
    ]);
  }
  await execute(
    `INSERT INTO subject_remark_bands
       (id, school_id, subject_id, grade_id, min_pct, max_pct, remark, sort_order, is_active)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      id,
      data.school_id,
      data.subject_id || null,
      data.grade_id || null,
      Number(data.min_pct),
      Number(data.max_pct),
      data.remark,
      Number(data.sort_order || 0),
      data.is_active === false ? 0 : 1,
    ],
  );
  return queryOne("SELECT * FROM subject_remark_bands WHERE id=?", [id]);
};

exports.remove = (id, schoolId) =>
  execute("DELETE FROM subject_remark_bands WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);

// Resolve best-matching remark for a score.
// Priority: (subject + grade) > (subject only) > (grade only) > (global).
exports.resolveRemark = async (schoolId, { subject_id, grade_id, pct }) => {
  await ensureDefaults(schoolId);
  const rows = await query(
    `SELECT * FROM subject_remark_bands
      WHERE school_id=? AND is_active=1
        AND ? BETWEEN min_pct AND max_pct`,
    [schoolId, pct],
  );
  if (!rows.length) return null;
  const score = (b) =>
    (b.subject_id === subject_id ? 2 : b.subject_id == null ? 0 : -10) +
    (b.grade_id === grade_id ? 1 : b.grade_id == null ? 0 : -10);
  rows.sort((a, b) => score(b) - score(a));
  return rows[0]?.remark || null;
};
