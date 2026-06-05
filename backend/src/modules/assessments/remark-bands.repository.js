// Subject remark bands — auto-fill remarks when a score is entered.
// v2: Remarks are tied to Achievement Levels (AL codes). Legacy min_pct/max_pct
// rows still resolve via percentage as a fallback.
const { query, queryOne, execute } = require("../../config/database");
const { v4: uuid } = require("uuid");

const DEFAULTS = [
  {
    level_code: "EE",
    descriptor: "Exceeding Expectation",
    remark: "Excellent performance — keep it up!",
  },
  {
    level_code: "ME",
    descriptor: "Meeting Expectation",
    remark: "Very good work; continue practising.",
  },
  {
    level_code: "AE",
    descriptor: "Approaching Expectation",
    remark: "Good effort; aim higher next time.",
  },
  {
    level_code: "BE",
    descriptor: "Below Expectation",
    remark: "Needs more practice — seek extra help.",
  },
];

async function ensureDefaults(schoolId) {
  const row = await queryOne(
    "SELECT COUNT(*) AS c FROM subject_remark_bands WHERE school_id=?",
    [schoolId],
  );
  if (row && Number(row.c) > 0) return;
  // Seed only when achievement_levels exist for this school; otherwise leave
  // empty so the admin can configure once levels are set up.
  const levels = await query(
    "SELECT code FROM achievement_levels WHERE school_id=? AND is_active=1",
    [schoolId],
  );
  const codes = new Set(levels.map((l) => l.code));
  let sort = 0;
  for (const d of DEFAULTS) {
    if (codes.size && !codes.has(d.level_code)) continue;
    await execute(
      `INSERT INTO subject_remark_bands
        (id, school_id, subject_id, grade_id, level_code, min_pct, max_pct,
         remark, descriptor, sort_order, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,1)`,
      [
        uuid(),
        schoolId,
        null,
        null,
        d.level_code,
        null,
        null,
        d.remark,
        d.descriptor,
        sort++,
      ],
    );
  }
}

exports.list = async (schoolId, { subject_id, grade_id, level_code } = {}) => {
  await ensureDefaults(schoolId);
  const params = [schoolId];
  let where = "b.school_id=?";
  if (subject_id) {
    where += " AND (b.subject_id=? OR b.subject_id IS NULL)";
    params.push(subject_id);
  }
  if (grade_id) {
    where += " AND (b.grade_id=? OR b.grade_id IS NULL)";
    params.push(grade_id);
  }
  if (level_code) {
    where += " AND b.level_code=?";
    params.push(level_code);
  }
  return query(
    `SELECT b.*, s.name AS subject_name, g.name AS grade_name,
            al.description AS level_description
       FROM subject_remark_bands b
       LEFT JOIN subjects s ON s.id=b.subject_id
       LEFT JOIN grades g   ON g.id=b.grade_id
       LEFT JOIN achievement_levels al
              ON al.school_id=b.school_id AND al.code=b.level_code
      WHERE ${where}
      ORDER BY (b.subject_id IS NULL), (b.grade_id IS NULL),
               s.name, g.name, b.sort_order, b.level_code`,
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
  const fields = {
    subject_id: data.subject_id || null,
    grade_id: data.grade_id || null,
    level_code: data.level_code || null,
    min_pct:
      data.min_pct == null || data.min_pct === "" ? null : Number(data.min_pct),
    max_pct:
      data.max_pct == null || data.max_pct === "" ? null : Number(data.max_pct),
    remark: data.remark,
    descriptor: data.descriptor || null,
    sort_order: Number(data.sort_order || 0),
    is_active: data.is_active === false ? 0 : 1,
  };
  if (existing) {
    await execute(
      `UPDATE subject_remark_bands SET
         subject_id=?, grade_id=?, level_code=?, min_pct=?, max_pct=?,
         remark=?, descriptor=?, sort_order=?, is_active=?
       WHERE id=? AND school_id=?`,
      [...Object.values(fields), existing.id, data.school_id],
    );
    return queryOne("SELECT * FROM subject_remark_bands WHERE id=?", [
      existing.id,
    ]);
  }
  await execute(
    `INSERT INTO subject_remark_bands
       (id, school_id, subject_id, grade_id, level_code, min_pct, max_pct,
        remark, descriptor, sort_order, is_active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, data.school_id, ...Object.values(fields)],
  );
  return queryOne("SELECT * FROM subject_remark_bands WHERE id=?", [id]);
};

exports.remove = (id, schoolId) =>
  execute("DELETE FROM subject_remark_bands WHERE id=? AND school_id=?", [
    id,
    schoolId,
  ]);

// Resolve best-matching remark for a score.
// Priority: level_code match > percentage range > default.
// Scope priority: (subject+grade) > (subject) > (grade) > (global).
exports.resolveRemark = async (
  schoolId,
  { subject_id, grade_id, pct, level_code },
) => {
  await ensureDefaults(schoolId);
  const rows = await query(
    `SELECT * FROM subject_remark_bands WHERE school_id=? AND is_active=1`,
    [schoolId],
  );
  if (!rows.length) return null;

  const eligible = rows.filter((b) => {
    if (b.level_code && level_code) return b.level_code === level_code;
    if (b.min_pct != null && b.max_pct != null && pct != null) {
      return (
        Number(pct) >= Number(b.min_pct) && Number(pct) <= Number(b.max_pct)
      );
    }
    return false;
  });
  if (!eligible.length) return null;

  const score = (b) =>
    (b.level_code ? 4 : 0) +
    (b.subject_id === subject_id ? 2 : b.subject_id == null ? 0 : -10) +
    (b.grade_id === grade_id ? 1 : b.grade_id == null ? 0 : -10);
  eligible.sort((a, b) => score(b) - score(a));
  return eligible[0]?.remark || null;
};
