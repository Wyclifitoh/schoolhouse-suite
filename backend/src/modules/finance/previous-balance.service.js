const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const SYSTEM_CODE = "PREVIOUS_BALANCE";
const SYSTEM_NAME = "Previous Balance";
const SYSTEM_CATEGORY_NAME = "System";

let _schemaReady = false;

/**
 * Idempotently ensure the supporting columns exist on `fee_structures`.
 * Runs once per process; safe to call from any code path.
 */
async function ensureSchema() {
  if (_schemaReady) return;
  const cols = await query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'fee_structures'`,
  );
  const set = new Set(
    cols.map((c) => String(c.column_name || c.COLUMN_NAME).toLowerCase()),
  );
  if (!set.has("is_system")) {
    try {
      await query(
        "ALTER TABLE fee_structures ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE",
      );
    } catch (e) {
      /* race */
    }
  }
  if (!set.has("system_code")) {
    try {
      await query(
        "ALTER TABLE fee_structures ADD COLUMN system_code VARCHAR(64) NULL",
      );
    } catch (e) {
      /* race */
    }
    try {
      await query(
        "CREATE UNIQUE INDEX uq_fee_structures_system ON fee_structures (school_id, system_code)",
      );
    } catch (e) {
      /* exists */
    }
  }
  _schemaReady = true;
}

async function getOrCreateSystemCategory(schoolId) {
  let cat = await queryOne(
    "SELECT id FROM fee_categories WHERE school_id = ? AND name = ? LIMIT 1",
    [schoolId, SYSTEM_CATEGORY_NAME],
  );
  if (cat) return cat.id;
  const id = uuidv4();
  await query(
    "INSERT INTO fee_categories (id, school_id, name, type, description) VALUES (?, ?, ?, 'tuition', 'System-managed category')",
    [id, schoolId, SYSTEM_CATEGORY_NAME],
  );
  return id;
}

/**
 * Return the protected Previous Balance fee_structure id for the given
 * (school, academic_year). Creates it on first access. Idempotent.
 */
async function getOrCreateStructure(schoolId, academicYearId) {
  await ensureSchema();

  // If academicYearId not provided, fetch the current academic year using is_current flag
  if (!academicYearId) {
    const currentAcademicYear = await queryOne(
      "SELECT id FROM academic_years WHERE school_id = ? AND is_current = 1 AND is_archived = 0 LIMIT 1",
      [schoolId],
    );
    academicYearId = currentAcademicYear?.id;
  }

  if (!academicYearId) {
    throw new Error(
      "No current academic year set. Please set an academic year as current first.",
    );
  }

  let row = await queryOne(
    "SELECT id FROM fee_structures WHERE school_id = ? AND system_code = ? LIMIT 1",
    [schoolId, SYSTEM_CODE],
  );
  if (row) return row.id;

  const categoryId = await getOrCreateSystemCategory(schoolId);
  const id = uuidv4();
  await query(
    `INSERT INTO fee_structures
       (id, school_id, name, fee_category_id, academic_year_id, amount, grade_id, term_id, is_system, system_code)
     VALUES (?, ?, ?, ?, ?, 0, NULL, NULL, TRUE, ?)`,
    [id, schoolId, SYSTEM_NAME, categoryId, academicYearId, SYSTEM_CODE],
  );
  return id;
}

/**
 * Upsert a Previous Balance assignment for a student in a given term.
 * Will INSERT a new student_fees row when none exists for that (student,
 * structure, term); otherwise UPDATE the existing row's amount_due (only
 * when there are no payments allocated to it yet, to avoid breaking
 * receipts / ledger integrity).
 */
async function upsertStudentAssignment({
  schoolId,
  studentId,
  termId,
  academicYearId,
  amount,
}) {
  console.log(`[DEBUG] upsertStudentAssignment - Input:`, {
    schoolId,
    studentId,
    termId,
    academicYearId,
    amount,
  });

  if (!termId) throw new Error("termId is required");
  if (!(Number(amount) >= 0)) throw new Error("amount must be a number");
  const structureId = await getOrCreateStructure(schoolId, academicYearId);
  console.log(`[DEBUG] structureId: ${structureId}`);

  // Detect fee_structure_id column (may be missing on older schemas).
  const colRow = await queryOne(
    `SELECT COUNT(*) AS c FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'student_fees' AND column_name = 'fee_structure_id'`,
  );
  const hasFS = Number(colRow?.c || 0) > 0;

  let existing = null;
  if (hasFS) {
    existing = await queryOne(
      `SELECT id, amount_paid FROM student_fees
        WHERE school_id = ? AND student_id = ? AND fee_structure_id = ? AND term_id = ?`,
      [schoolId, studentId, structureId, termId],
    );
  } else {
    // Legacy: match by fee_name (best-effort).
    existing = await queryOne(
      `SELECT id, amount_paid FROM student_fees
        WHERE school_id = ? AND student_id = ? AND term_id = ? AND fee_name = ? LIMIT 1`,
      [schoolId, studentId, termId, SYSTEM_NAME],
    );
  }

  if (existing) {
    console.log(`[DEBUG] Found existing record:`, existing);
    if (Number(existing.amount_paid || 0) > 0) {
      // Already has payments — only allow increasing the amount.
      const newAmount = Math.max(Number(amount), Number(existing.amount_paid));
      await query(
        `UPDATE student_fees SET amount_due = ?, status = CASE WHEN amount_paid >= ? THEN 'paid' WHEN amount_paid > 0 THEN 'partial' ELSE 'pending' END, updated_at = NOW() WHERE id = ?`,
        [newAmount, newAmount, existing.id],
      );
    } else {
      await query(
        `UPDATE student_fees SET amount_due = ?, status = 'pending', updated_at = NOW() WHERE id = ?`,
        [Number(amount), existing.id],
      );
    }
    return { id: existing.id, updated: true };
  }

  const id = uuidv4();
  if (hasFS) {
    await query(
      `INSERT INTO student_fees
         (id, school_id, student_id, fee_structure_id, term_id, academic_year_id, ledger_type,
          amount_due, amount_paid, brought_forward_amount, status, assignment_mode, due_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'fees', ?, 0, ?, 'pending', 'system', CURDATE(), NOW())`,
      [
        id,
        schoolId,
        studentId,
        structureId,
        termId,
        academicYearId || null,
        Number(amount),
        Number(amount),
      ],
    );
  } else {
    await query(
      `INSERT INTO student_fees
         (id, school_id, student_id, term_id, academic_year_id, fee_name, ledger_type,
          amount_due, amount_paid, brought_forward_amount, status, assignment_mode, due_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'fees', ?, 0, ?, 'pending', 'system', CURDATE(), NOW())`,
      [
        id,
        schoolId,
        studentId,
        termId,
        academicYearId || null,
        SYSTEM_NAME,
        Number(amount),
        Number(amount),
      ],
    );
  }
  return { id, created: true };
}

/**
 * Preview unpaid balances from `fromTermId` for students in (classId, streamId).
 * Also returns any existing Previous Balance amount already carried into the
 * destination term so the UI can flag duplicates.
 */
async function previewBroughtForward({
  schoolId,
  classId,
  streamId,
  fromTermId,
  toTermId,
}) {
  await ensureSchema();
  const structureId = await getOrCreateStructure(schoolId, null);

  const params = [schoolId];
  let where = "s.school_id = ? AND s.status = 'active'";
  if (classId) {
    where += " AND s.current_grade_id = ?";
    params.push(classId);
  }
  if (streamId) {
    where += " AND s.current_stream_id = ?";
    params.push(streamId);
  }

  const students = await query(
    `SELECT s.id, s.admission_number, s.full_name, s.first_name, s.last_name
       FROM students s
      WHERE ${where}
      ORDER BY s.admission_number ASC`,
    params,
  );

  if (!students.length) return [];

  const ids = students.map((s) => s.id);
  const ph = ids.map(() => "?").join(",");

  // Sum unpaid balances in source term (exclude existing previous-balance rows
  // so we don't double count when a B/F already exists in the source term).
  const balanceRows = fromTermId
    ? await query(
        `SELECT student_id, COALESCE(SUM(amount_due - amount_paid), 0) AS balance
           FROM student_fees
          WHERE school_id = ? AND term_id = ? AND student_id IN (${ph})
            AND status NOT IN ('cancelled','waived')
          GROUP BY student_id`,
        [schoolId, fromTermId, ...ids],
      )
    : [];

  const balanceMap = new Map(
    balanceRows.map((r) => [r.student_id, Number(r.balance) || 0]),
  );

  // Existing Previous Balance entries in destination term.
  const existingRows = toTermId
    ? await query(
        `SELECT student_id, id, amount_due FROM student_fees
          WHERE school_id = ? AND term_id = ? AND student_id IN (${ph})
            AND (fee_structure_id = ? OR fee_name = ?)`,
        [schoolId, toTermId, ...ids, structureId, SYSTEM_NAME],
      )
    : [];
  const existingMap = new Map(
    existingRows.map((r) => [r.student_id, Number(r.amount_due) || 0]),
  );

  return students.map((s) => ({
    student_id: s.id,
    admission_number: s.admission_number,
    full_name:
      s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim(),
    previous_term_balance: balanceMap.get(s.id) || 0,
    existing_brought_forward: existingMap.get(s.id) || 0,
  }));
}

async function applyBroughtForward({
  schoolId,
  toTermId,
  academicYearId,
  entries,
}) {
  if (!toTermId) throw new Error("to_term_id is required");
  if (!Array.isArray(entries) || !entries.length)
    throw new Error("entries are required");
  const created = [];
  const updated = [];
  const failed = [];
  for (const e of entries) {
    try {
      const amount = Number(e.amount || 0);
      if (!e.student_id || amount < 0) throw new Error("invalid entry");
      if (amount === 0) continue;
      const r = await upsertStudentAssignment({
        schoolId,
        studentId: e.student_id,
        termId: toTermId,
        academicYearId,
        amount,
      });
      (r.created ? created : updated).push(e.student_id);
    } catch (err) {
      failed.push({ student_id: e.student_id, message: err.message });
    }
  }
  return { created: created.length, updated: updated.length, failed };
}

module.exports = {
  SYSTEM_CODE,
  SYSTEM_NAME,
  ensureSchema,
  getOrCreateStructure,
  upsertStudentAssignment,
  previewBroughtForward,
  applyBroughtForward,
};
