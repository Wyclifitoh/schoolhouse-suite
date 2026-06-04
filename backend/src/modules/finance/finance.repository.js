const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

// ---- Fee Templates ----
const findFeeTemplates = async (schoolId, { limit, offset }) => {
  const rows = await query(
    "SELECT * FROM fee_templates WHERE school_id = ? AND is_active = TRUE ORDER BY priority ASC LIMIT ? OFFSET ?",
    [schoolId, limit, offset],
  );
  const countRows = await query(
    "SELECT COUNT(*) as count FROM fee_templates WHERE school_id = ? AND is_active = TRUE",
    [schoolId],
  );
  return { rows, total: countRows[0]?.count || 0 };
};

// ---- Fee Categories ----
const findFeeCategories = async (schoolId) => {
  return query(
    "SELECT * FROM fee_categories WHERE school_id = ? ORDER BY name",
    [schoolId],
  );
};

const createFeeCategory = async (schoolId, data) => {
  const id = uuidv4();
  await query(
    "INSERT INTO fee_categories (id, school_id, name, type, description, gl_code, is_optional) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      schoolId,
      data.name,
      data.type || "tuition",
      data.description || null,
      data.gl_code || null,
      data.is_optional || false,
    ],
  );
  return queryOne("SELECT * FROM fee_categories WHERE id = ?", [id]);
};

// ---- Fee Structures ----
const findFeeStructures = async (schoolId) => {
  return query(
    `SELECT fs.*, fc.name as category_name, fc.type as category_type, g.name as grade_name
     FROM fee_structures fs
     LEFT JOIN fee_categories fc ON fc.id = fs.fee_category_id
     LEFT JOIN grades g ON g.id = fs.grade_id
     WHERE fs.school_id = ? ORDER BY fs.created_at DESC`,
    [schoolId],
  );
};

const createFeeStructure = async (schoolId, data) => {
  if (data && (data.system_code || data.is_system)) {
    const err = new Error("System fee structures cannot be created manually");
    err.statusCode = 403;
    throw err;
  }
  const id = uuidv4();
  await query(
    `INSERT INTO fee_structures (id, school_id, name, fee_category_id, academic_year_id, amount, grade_id, term_id, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      schoolId,
      data.name,
      data.fee_category_id,
      data.academic_year_id,
      data.amount || 0,
      data.grade_id || null,
      data.term_id || null,
      data.due_date || null,
    ],
  );
  return queryOne("SELECT * FROM fee_structures WHERE id = ?", [id]);
};

const updateFeeStructure = async (id, schoolId, data) => {
  const existing = await queryOne(
    "SELECT is_system FROM fee_structures WHERE id = ? AND school_id = ?",
    [id, schoolId],
  ).catch(() => null);
  if (existing && existing.is_system) {
    const err = new Error("This is a system-managed fee structure and cannot be edited");
    err.statusCode = 403;
    throw err;
  }
  const allowed = [
    "name",
    "fee_category_id",
    "amount",
    "grade_id",
    "term_id",
    "academic_year_id",
    "due_date",
    "is_active",
  ];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0)
    return queryOne(
      "SELECT * FROM fee_structures WHERE id = ? AND school_id = ?",
      [id, schoolId],
    );
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  values.push(id, schoolId);
  await query(
    `UPDATE fee_structures SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne("SELECT * FROM fee_structures WHERE id = ?", [id]);
};

const deleteFeeStructure = async (id, schoolId) => {
  const existing = await queryOne(
    "SELECT is_system FROM fee_structures WHERE id = ? AND school_id = ?",
    [id, schoolId],
  ).catch(() => null);
  if (existing && existing.is_system) {
    const err = new Error("This is a system-managed fee structure and cannot be deleted");
    err.statusCode = 403;
    throw err;
  }
  await query("DELETE FROM fee_structures WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
  return { deleted: true };
};

// ---- Fee Discounts ----
const findFeeDiscounts = async (schoolId) => {
  return query(
    "SELECT * FROM fee_discounts WHERE school_id = ? AND is_active = TRUE ORDER BY priority",
    [schoolId],
  );
};

const createFeeDiscount = async (schoolId, data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO fee_discounts (id, school_id, name, type, value, code, description, applicable_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      schoolId,
      data.name,
      data.type || "percentage",
      data.value || 0,
      data.code || null,
      data.description || null,
      data.applicable_to || null,
    ],
  );
  return queryOne("SELECT * FROM fee_discounts WHERE id = ?", [id]);
};

// ---- Student Fees ----
const findStudentFees = async (studentId, schoolId, opts = {}) => {
  const { termId, academicYearId, includeZero = false } = opts;
  const params = [studentId, schoolId];
  let sql = `SELECT sf.*,
            COALESCE(fs.name, ft.name) AS fee_name,
            COALESCE(fc.type, ft.fee_type) AS fee_type,
            t.name AS term_name,
            ay.name AS academic_year_name,
            sf.amount_due AS amount,
            sf.amount_paid AS paid,
            (sf.amount_due - sf.amount_paid) AS balance,
            sf.discount_amount AS discount
     FROM student_fees sf
     LEFT JOIN fee_templates ft   ON ft.id = sf.fee_template_id
     LEFT JOIN fee_structures fs  ON fs.id = sf.fee_structure_id
     LEFT JOIN fee_categories fc  ON fc.id = fs.fee_category_id
     LEFT JOIN terms t            ON t.id = sf.term_id
     LEFT JOIN academic_years ay  ON ay.id = sf.academic_year_id
     WHERE sf.student_id = ? AND sf.school_id = ?
       AND sf.status NOT IN ('cancelled')`;
  if (termId) {
    sql += " AND sf.term_id = ?";
    params.push(termId);
  }
  if (academicYearId) {
    sql += " AND sf.academic_year_id = ?";
    params.push(academicYearId);
  }
  if (!includeZero) {
    // Hide ghost rows (amount_due=0 with no payment, no discount, not waived).
    sql +=
      " AND NOT (sf.amount_due = 0 AND sf.amount_paid = 0 AND COALESCE(sf.discount_amount,0) = 0 AND sf.status <> 'waived')";
  }
  sql += " ORDER BY t.start_date DESC, sf.due_date ASC, sf.created_at ASC";
  return query(sql, params);
};

// Detect once whether the student_fees.fee_structure_id column is present.
// Cached because columns don't change at runtime.
let _hasFeeStructureCol = null;
const hasFeeStructureColumn = async () => {
  if (_hasFeeStructureCol !== null) return _hasFeeStructureCol;
  try {
    const rows = await query(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'student_fees'
         AND column_name = 'fee_structure_id'`,
    );
    _hasFeeStructureCol = Number(rows[0]?.c || 0) > 0;
  } catch {
    _hasFeeStructureCol = false;
  }
  return _hasFeeStructureCol;
};

// Find which students already have a given fee (structure) in a term
const findFeeAssignments = async (schoolId, { feeStructureId, termId }) => {
  const hasFS = await hasFeeStructureColumn();
  if (hasFS) {
    return query(
      `SELECT id, student_id, amount_due, amount_paid, status
       FROM student_fees
       WHERE school_id = ? AND fee_structure_id = ? AND term_id <=> ? AND status NOT IN ('cancelled')`,
      [schoolId, feeStructureId, termId || null],
    );
  }
  // Legacy fallback: there's no link column, so only exact-amount matches in same term are detectable.
  // Returning empty avoids polluting the existing-set with unrelated rows; bulk insert will create new rows.
  return [];
};

const bulkAssignFee = async ({
  schoolId,
  studentIds,
  feeStructure,
  termId,
  academicYearId,
  discountAmount,
  assignedBy,
}) => {
  const created = [];
  const hasFS = await hasFeeStructureColumn();
  const amount = Math.max(
    0,
    Number(feeStructure.amount || 0) - Number(discountAmount || 0),
  );
  for (const studentId of studentIds) {
    let existing = null;
    if (hasFS) {
      existing = await queryOne(
        `SELECT id FROM student_fees WHERE school_id = ? AND student_id = ? AND fee_structure_id = ? AND term_id <=> ?`,
        [schoolId, studentId, feeStructure.id, termId || null],
      );
    }
    if (existing) continue;
    const id = uuidv4();
    if (hasFS) {
      await query(
        `INSERT INTO student_fees (id, school_id, student_id, fee_structure_id, term_id, academic_year_id, ledger_type, amount_due, discount_amount, status, due_date, assigned_by, assignment_mode)
         VALUES (?, ?, ?, ?, ?, ?, 'fees', ?, ?, 'pending', ?, ?, 'bulk')`,
        [
          id,
          schoolId,
          studentId,
          feeStructure.id,
          termId || null,
          academicYearId || null,
          amount,
          discountAmount || 0,
          feeStructure.due_date || null,
          assignedBy || null,
        ],
      );
    } else {
      // Legacy schema without fee_structure_id column: insert with NULL fee_template_id
      // (fee_structure id is NOT a fee_templates id; using it would violate the FK).
      await query(
        `INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, discount_amount, status, due_date, assigned_by, assignment_mode)
         VALUES (?, ?, ?, NULL, ?, ?, 'fees', ?, ?, 'pending', ?, ?, 'bulk')`,
        [
          id,
          schoolId,
          studentId,
          termId || null,
          academicYearId || null,
          amount,
          discountAmount || 0,
          feeStructure.due_date || null,
          assignedBy || null,
        ],
      );
    }
    created.push(id);
  }
  return { created: created.length, fee_ids: created };
};

const bulkUnassignFee = async ({
  schoolId,
  studentIds,
  feeStructureId,
  termId,
}) => {
  if (!studentIds.length) return { removed: 0, blocked: 0 };
  const placeholders = studentIds.map(() => "?").join(",");
  const hasFS = await hasFeeStructureColumn();
  if (!hasFS) return { removed: 0, blocked: 0 };

  // Hard guard: never delete a student_fee that has ANY allocation rows
  // against it, even if amount_paid is somehow 0 (defensive).
  const blockedRows = await query(
    `SELECT sf.id, COUNT(pa.id) AS allocs
       FROM student_fees sf
       LEFT JOIN payment_allocations pa ON pa.student_fee_id = sf.id
      WHERE sf.school_id = ?
        AND sf.fee_structure_id = ?
        AND sf.term_id <=> ?
        AND sf.student_id IN (${placeholders})
      GROUP BY sf.id
      HAVING allocs > 0 OR (SELECT amount_paid FROM student_fees WHERE id = sf.id) > 0`,
    [schoolId, feeStructureId, termId || null, ...studentIds],
  );
  const blockedIds = new Set(blockedRows.map((r) => r.id));

  const result = await query(
    `DELETE FROM student_fees
       WHERE school_id = ? AND fee_structure_id = ? AND term_id <=> ?
         AND student_id IN (${placeholders})
         AND amount_paid = 0
         AND id NOT IN (
           SELECT student_fee_id FROM payment_allocations
            WHERE student_fee_id IS NOT NULL
         )`,
    [schoolId, feeStructureId, termId || null, ...studentIds],
  );
  return { removed: result.affectedRows || 0, blocked: blockedIds.size };
};

// ---- Term close → carry forward ----
// Promotes arrears (unpaid balances) of all students in `fromTermId` to the
// next term as new student_fees rows, and leaves advance credits on
// fee_carry_forwards (already linked to source_payment_id, applied lazily).
const closeTerm = async ({ schoolId, fromTermId, toTermId, performedBy }) => {
  if (!fromTermId) throw new Error("fromTermId is required");
  if (!toTermId) throw new Error("toTermId is required");

  const term = await queryOne(
    "SELECT id, academic_year_id, closed_at FROM terms WHERE id = ? AND school_id = ?",
    [fromTermId, schoolId],
  );
  if (!term) throw new Error("Source term not found");
  if (term.closed_at) throw new Error("Term is already closed");

  const toTerm = await queryOne(
    "SELECT id, academic_year_id FROM terms WHERE id = ? AND school_id = ?",
    [toTermId, schoolId],
  );
  if (!toTerm) throw new Error("Destination term not found");

  // Unpaid balances in the closing term
  const arrears = await query(
    `SELECT sf.student_id, sf.ledger_type,
            COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) AS arrears
       FROM student_fees sf
      WHERE sf.school_id = ? AND sf.term_id = ?
        AND sf.status NOT IN ('cancelled','waived')
      GROUP BY sf.student_id, sf.ledger_type
      HAVING arrears > 0`,
    [schoolId, fromTermId],
  );

  let promoted = 0;
  for (const r of arrears) {
    const id = uuidv4();
    await query(
      `INSERT INTO student_fees
        (id, school_id, student_id, term_id, academic_year_id, ledger_type,
         amount_due, status, assignment_mode, carried_forward)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'carry_forward', TRUE)`,
      [
        id,
        schoolId,
        r.student_id,
        toTermId,
        toTerm.academic_year_id,
        r.ledger_type,
        Number(r.arrears),
      ],
    );
    try {
      await query(
        `INSERT INTO fee_carry_forwards
          (id, school_id, student_id, from_term_id, to_term_id, ledger_type, amount, type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'arrears', 'applied')`,
        [
          uuidv4(),
          schoolId,
          r.student_id,
          fromTermId,
          toTermId,
          r.ledger_type,
          Number(r.arrears),
        ],
      );
    } catch {
      /* non-fatal */
    }
    promoted++;
  }

  await query(
    "UPDATE terms SET closed_at = NOW(), closed_by = ? WHERE id = ?",
    [performedBy || null, fromTermId],
  );

  try {
    await query(
      `INSERT INTO finance_audit_logs
        (id, school_id, action, entity_type, entity_id, performed_by, metadata)
       VALUES (?, ?, 'TERM_CLOSED', 'term', ?, ?, ?)`,
      [
        uuidv4(),
        schoolId,
        fromTermId,
        String(performedBy || "system"),
        JSON.stringify({ fromTermId, toTermId, promotedStudents: promoted }),
      ],
    );
  } catch {
    /* non-fatal */
  }

  return { promoted, fromTermId, toTermId };
};

// ---- Excess Credits (advance payments) ----
const findExcessCredits = async (
  schoolId,
  { studentId, status = "pending" } = {},
) => {
  const params = [schoolId];
  let sql = `SELECT cf.*, s.full_name AS student_name, s.admission_number, s.grade
             FROM fee_carry_forwards cf
             LEFT JOIN students s ON s.id = cf.student_id
             WHERE cf.school_id = ? AND cf.type = 'advance_credit'`;
  if (status && status !== "all") {
    sql += " AND cf.status = ?";
    params.push(status);
  }
  if (studentId) {
    sql += " AND cf.student_id = ?";
    params.push(studentId);
  }
  sql += " ORDER BY cf.created_at ASC";
  return query(sql, params);
};

const findStudentOutstandingFees = async (
  schoolId,
  studentId,
  { ledgerType = "fees" } = {},
) => {
  return query(
    `SELECT sf.id, sf.amount_due, sf.amount_paid, (sf.amount_due - sf.amount_paid) AS balance,
            sf.status, sf.ledger_type, sf.due_date, sf.term_id,
            COALESCE(fs.name, ft.name, 'Fee') AS fee_name
     FROM student_fees sf
     LEFT JOIN fee_structures fs ON fs.id = sf.fee_structure_id
     LEFT JOIN fee_templates ft ON ft.id = sf.fee_template_id
     WHERE sf.school_id = ? AND sf.student_id = ?
       AND sf.ledger_type = ?
       AND sf.status NOT IN ('cancelled','waived')
       AND (sf.amount_due - sf.amount_paid) > 0
     ORDER BY sf.due_date ASC, sf.created_at ASC`,
    [schoolId, studentId, ledgerType],
  );
};

// Apply pending excess credits (FIFO) for given students against their outstanding fees.
// Optionally restrict to a list of student_fee_ids (e.g. fees just assigned).
const applyExcessForStudents = async ({
  schoolId,
  studentIds,
  feeIds = null,
  performedBy = null,
}) => {
  if (!Array.isArray(studentIds) || studentIds.length === 0)
    return { applied_total: 0, applications: [] };
  const applications = [];
  let appliedTotal = 0;
  for (const studentId of studentIds) {
    const credits = await query(
      `SELECT * FROM fee_carry_forwards
       WHERE school_id = ? AND student_id = ? AND type = 'advance_credit' AND status = 'pending'
       ORDER BY created_at ASC`,
      [schoolId, studentId],
    );
    if (!credits.length) continue;
    let fees = await findStudentOutstandingFees(schoolId, studentId);
    if (Array.isArray(feeIds) && feeIds.length) {
      const set = new Set(feeIds);
      fees = fees.filter((f) => set.has(f.id));
    }
    if (!fees.length) continue;
    let creditIdx = 0;
    let creditRemaining = Number(credits[0].amount);
    for (const fee of fees) {
      let feeBal = Number(fee.balance);
      while (feeBal > 0 && creditIdx < credits.length) {
        const take = Math.min(feeBal, creditRemaining);
        if (take <= 0) break;
        // Update fee
        const newPaid = Number(fee.amount_paid) + take;
        const newStatus =
          newPaid >= Number(fee.amount_due) ? "paid" : "partial";
        await query(
          `UPDATE student_fees SET amount_paid = ?, status = ?, last_payment_at = NOW() WHERE id = ?`,
          [newPaid, newStatus, fee.id],
        );
        // Allocation row tied to the source payment if known
        const cred = credits[creditIdx];
        if (cred.source_payment_id) {
          try {
            await query(
              `INSERT INTO payment_allocations
                (id, payment_id, student_fee_id, amount, allocation_order, is_auto_allocated, allocated_by)
               VALUES (?, ?, ?, ?, 99, TRUE, ?)`,
              [
                uuidv4(),
                cred.source_payment_id,
                fee.id,
                take,
                performedBy || null,
              ],
            );
          } catch {
            /* non-fatal */
          }
        }
        feeBal -= take;
        creditRemaining -= take;
        appliedTotal += take;
        applications.push({
          student_id: studentId,
          fee_id: fee.id,
          credit_id: cred.id,
          amount: take,
        });
        if (creditRemaining <= 0) {
          await query(
            `UPDATE fee_carry_forwards SET status = 'applied', applied_at = NOW() WHERE id = ?`,
            [cred.id],
          );
          creditIdx += 1;
          if (creditIdx < credits.length)
            creditRemaining = Number(credits[creditIdx].amount);
        }
      }
      if (creditIdx >= credits.length) break;
    }
    // Persist remainder of partially-consumed credit
    if (
      creditIdx < credits.length &&
      creditRemaining > 0 &&
      creditRemaining !== Number(credits[creditIdx].amount)
    ) {
      await query(`UPDATE fee_carry_forwards SET amount = ? WHERE id = ?`, [
        creditRemaining,
        credits[creditIdx].id,
      ]);
    }
  }
  return { applied_total: appliedTotal, applications };
};

// Manually apply a single excess credit to specified fees (or auto-FIFO if none).
const applyExcessCredit = async ({
  schoolId,
  creditId,
  feeIds = [],
  performedBy = null,
}) => {
  const credit = await queryOne(
    `SELECT * FROM fee_carry_forwards WHERE id = ? AND school_id = ? AND type = 'advance_credit' AND status = 'pending'`,
    [creditId, schoolId],
  );
  if (!credit) throw new Error("Excess credit not found or already applied");
  let remaining = Number(credit.amount);
  let fees = await findStudentOutstandingFees(schoolId, credit.student_id);
  if (Array.isArray(feeIds) && feeIds.length) {
    const set = new Set(feeIds);
    fees = fees.filter((f) => set.has(f.id));
  }
  const applications = [];
  for (const fee of fees) {
    if (remaining <= 0) break;
    const take = Math.min(Number(fee.balance), remaining);
    if (take <= 0) continue;
    const newPaid = Number(fee.amount_paid) + take;
    const newStatus = newPaid >= Number(fee.amount_due) ? "paid" : "partial";
    await query(
      `UPDATE student_fees SET amount_paid = ?, status = ?, last_payment_at = NOW() WHERE id = ?`,
      [newPaid, newStatus, fee.id],
    );
    if (credit.source_payment_id) {
      try {
        await query(
          `INSERT INTO payment_allocations
            (id, payment_id, student_fee_id, amount, allocation_order, is_auto_allocated, allocated_by)
           VALUES (?, ?, ?, ?, 99, FALSE, ?)`,
          [
            uuidv4(),
            credit.source_payment_id,
            fee.id,
            take,
            performedBy || null,
          ],
        );
      } catch {
        /* non-fatal */
      }
    }
    applications.push({ fee_id: fee.id, amount: take });
    remaining -= take;
  }
  if (remaining <= 0) {
    await query(
      `UPDATE fee_carry_forwards SET status = 'applied', applied_at = NOW() WHERE id = ?`,
      [credit.id],
    );
  } else if (remaining !== Number(credit.amount)) {
    await query(`UPDATE fee_carry_forwards SET amount = ? WHERE id = ?`, [
      remaining,
      credit.id,
    ]);
  }
  return {
    applied: Number(credit.amount) - remaining,
    remaining,
    applications,
  };
};

const findStudentFeeById = async (id, schoolId) => {
  return queryOne("SELECT * FROM student_fees WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
};

const createStudentFee = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, status, due_date, assigned_by, assignment_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.student_id,
      data.fee_template_id,
      data.term_id,
      data.academic_year_id,
      data.ledger_type || "fees",
      data.amount_due,
      data.due_date,
      data.assigned_by,
      data.assignment_mode || "manual",
    ],
  );
  return queryOne("SELECT * FROM student_fees WHERE id = ?", [id]);
};

const updateStudentFee = async (id, schoolId, data) => {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return findStudentFeeById(id, schoolId);
  values.push(id, schoolId);
  await query(
    `UPDATE student_fees SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    values,
  );
  return queryOne("SELECT * FROM student_fees WHERE id = ?", [id]);
};

const getStudentBalance = async (studentId, schoolId) => {
  // Sum fees + payments separately, then merge by ledger_type so payments made
  // BEFORE any fee assignment still surface as paid / advance credit.
  const [feeRows, payRows] = await Promise.all([
    query(
      `SELECT ledger_type,
              COALESCE(SUM(amount_due), 0)  AS total_due,
              COALESCE(SUM(amount_paid), 0) AS allocated_paid
       FROM student_fees
       WHERE student_id = ? AND school_id = ?
         AND status NOT IN ('cancelled','waived')
       GROUP BY ledger_type`,
      [studentId, schoolId],
    ),
    query(
      `SELECT COALESCE(ledger_type,'fees') AS ledger_type,
              COALESCE(SUM(amount), 0) AS total_received
       FROM payments
       WHERE student_id = ? AND school_id = ?
         AND status IN ('completed','succeeded','success')
       GROUP BY COALESCE(ledger_type,'fees')`,
      [studentId, schoolId],
    ),
  ]);
  const map = new Map();
  for (const r of feeRows) {
    map.set(r.ledger_type, {
      ledger_type: r.ledger_type,
      total_due: Number(r.total_due) || 0,
      total_paid: Number(r.allocated_paid) || 0,
      total_received: 0,
    });
  }
  for (const r of payRows) {
    const e = map.get(r.ledger_type) || {
      ledger_type: r.ledger_type,
      total_due: 0,
      total_paid: 0,
      total_received: 0,
    };
    e.total_received = Number(r.total_received) || 0;
    // Effective paid = max(allocated, received) so unallocated payments still count
    e.total_paid = Math.max(e.total_paid, e.total_received);
    map.set(r.ledger_type, e);
  }
  return Array.from(map.values()).map((e) => ({
    ledger_type: e.ledger_type,
    total_due: e.total_due,
    total_paid: e.total_paid,
    total_received: e.total_received,
    balance: e.total_due - e.total_paid,
  }));
};

const getCarryForwards = async (schoolId) => {
  return query(
    `SELECT cf.*, s.full_name as student_name, t1.name as from_term_name, t2.name as to_term_name
     FROM fee_carry_forwards cf
     LEFT JOIN students s ON s.id = cf.student_id
     LEFT JOIN terms t1 ON t1.id = cf.from_term_id
     LEFT JOIN terms t2 ON t2.id = cf.to_term_id
     WHERE cf.school_id = ? ORDER BY cf.created_at DESC`,
    [schoolId],
  );
};

const getStudentFeesList = async (
  schoolId,
  { search, termId, academicYearId },
) => {
  let sql = `SELECT s.id, s.first_name, s.last_name, s.full_name, s.admission_number, s.grade, s.stream,
    s.parent_name, s.parent_phone,
    COALESCE(SUM(sf.amount_due), 0) as total_fee,
    COALESCE(SUM(sf.discount_amount), 0) as discount,
    COALESCE(SUM(sf.fine_amount), 0) as fine,
    COALESCE(SUM(sf.amount_paid), 0) as paid,
    COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) as balance,
    COALESCE(SUM(CASE WHEN (sf.amount_due - sf.amount_paid) > 0 THEN 1 ELSE 0 END), 0) as fee_count,
    COALESCE(SUM(CASE WHEN sf.due_date IS NOT NULL AND sf.due_date < CURRENT_DATE() AND (sf.amount_due - sf.amount_paid) > 0 THEN 1 ELSE 0 END), 0) as overdue_count
    FROM students s
    LEFT JOIN student_fees sf ON sf.student_id = s.id AND sf.school_id = s.school_id AND sf.status NOT IN ('cancelled','waived')`;

  const params = [];
  const joinFilters = [];
  if (termId) {
    joinFilters.push("sf.term_id = ?");
    params.push(termId);
  }
  if (academicYearId) {
    joinFilters.push(
      "(sf.academic_year_id = ? OR sf.academic_year_id IS NULL)",
    );
    params.push(academicYearId);
  }
  if (joinFilters.length) sql += ` AND ${joinFilters.join(" AND ")}`;

  sql += " WHERE s.school_id = ? AND s.status = ?";
  params.push(schoolId, "active");

  if (search) {
    sql += " AND (s.full_name LIKE ? OR s.admission_number LIKE ?)";
    const q = `%${search}%`;
    params.push(q, q);
  }

  sql += " GROUP BY s.id ORDER BY s.full_name LIMIT 200";
  return query(sql, params);
};

const findExpenses = async (schoolId) => {
  return query(
    `SELECT e.*, ec.name as category_name FROM expenses e LEFT JOIN expense_categories ec ON ec.id = e.category_id WHERE e.school_id = ? ORDER BY e.expense_date DESC`,
    [schoolId],
  );
};

const findExpenseCategories = async (schoolId) => {
  return query(
    "SELECT * FROM expense_categories WHERE school_id = ? ORDER BY name",
    [schoolId],
  );
};

const logBulkFeeAudit = async ({
  schoolId,
  action,
  feeStructureId,
  termId,
  studentIds,
  performedBy,
  extra,
}) => {
  try {
    await query(
      `INSERT INTO finance_audit_logs
        (id, school_id, action, entity_type, entity_id, performed_by, metadata)
       VALUES (?, ?, ?, 'fee_structure', ?, ?, ?)`,
      [
        uuidv4(),
        schoolId,
        action,
        feeStructureId,
        String(performedBy || "system"),
        JSON.stringify({ termId, studentIds, ...extra }),
      ],
    );
  } catch (e) {
    /* non-fatal */
  }
};

const getAuditLogs = async (
  schoolId,
  { limit = 100, action, studentId } = {},
) => {
  let sql = `SELECT fal.*, s.full_name AS student_name
             FROM finance_audit_logs fal
             LEFT JOIN students s ON s.id = fal.student_id
             WHERE fal.school_id = ?`;
  const params = [schoolId];
  if (action) {
    sql += " AND fal.action = ?";
    params.push(action);
  }
  if (studentId) {
    sql += " AND fal.student_id = ?";
    params.push(studentId);
  }
  sql += " ORDER BY fal.created_at DESC LIMIT ?";
  params.push(Number(limit));
  return query(sql, params);
};

// ---- Standalone discount application (independent of bulk fee assign) ----
const listAppliedDiscounts = async (
  schoolId,
  { studentId, discountId, termId } = {},
) => {
  const params = [schoolId];
  let sql = `SELECT sfd.*, d.name AS discount_name, d.type AS discount_type, d.value AS discount_value,
                    s.full_name AS student_name, s.admission_number,
                    fs.name AS fee_structure_name, t.name AS term_name
             FROM student_fee_discounts sfd
             LEFT JOIN fee_discounts d  ON d.id = sfd.discount_id
             LEFT JOIN students s       ON s.id = sfd.student_id
             LEFT JOIN fee_structures fs ON fs.id = sfd.fee_structure_id
             LEFT JOIN terms t           ON t.id = sfd.term_id
             WHERE sfd.school_id = ? AND sfd.status = 'active'`;
  if (studentId) {
    sql += " AND sfd.student_id = ?";
    params.push(studentId);
  }
  if (discountId) {
    sql += " AND sfd.discount_id = ?";
    params.push(discountId);
  }
  if (termId) {
    sql += " AND sfd.term_id = ?";
    params.push(termId);
  }
  sql += " ORDER BY sfd.created_at DESC LIMIT 500";
  return query(sql, params);
};

const applyDiscountToStudents = async ({
  schoolId,
  discountId,
  feeStructureId,
  termId,
  academicYearId,
  studentIds,
  performedBy,
}) => {
  if (!Array.isArray(studentIds) || studentIds.length === 0)
    return { applied: 0, skipped: 0 };
  const discount = await queryOne(
    "SELECT * FROM fee_discounts WHERE id = ? AND school_id = ?",
    [discountId, schoolId],
  );
  if (!discount) throw new Error("Discount not found");
  let baseAmount = 0;
  if (feeStructureId) {
    const fs = await queryOne(
      "SELECT amount FROM fee_structures WHERE id = ? AND school_id = ?",
      [feeStructureId, schoolId],
    );
    baseAmount = Number(fs?.amount || 0);
  }
  let applied = 0;
  let skipped = 0;
  for (const studentId of studentIds) {
    // Find the matching student_fee row if a structure+term were specified.
    let feeRow = null;
    if (feeStructureId) {
      feeRow = await queryOne(
        `SELECT id, amount_due, amount_paid, discount_amount FROM student_fees
         WHERE school_id = ? AND student_id = ? AND fee_structure_id = ? AND term_id <=> ?`,
        [schoolId, studentId, feeStructureId, termId || null],
      );
    }
    const base = feeRow
      ? Number(feeRow.amount_due || 0) + Number(feeRow.discount_amount || 0)
      : baseAmount;
    const amt =
      discount.type === "percentage"
        ? Math.round(base * (Number(discount.value) / 100) * 100) / 100
        : Math.min(Number(discount.value), base);
    try {
      await query(
        `INSERT INTO student_fee_discounts
           (id, school_id, student_id, discount_id, fee_structure_id, term_id, academic_year_id,
            amount, applied_to_fee_id, applied_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          schoolId,
          studentId,
          discountId,
          feeStructureId || null,
          termId || null,
          academicYearId || null,
          amt,
          feeRow?.id || null,
          performedBy || null,
        ],
      );
      if (feeRow) {
        const newDiscount = Number(feeRow.discount_amount || 0) + amt;
        const newDue = Math.max(0, base - newDiscount);
        await query(
          `UPDATE student_fees SET discount_amount = ?, amount_due = ? WHERE id = ?`,
          [newDiscount, newDue, feeRow.id],
        );
      }
      applied++;
    } catch (e) {
      if (e?.code === "ER_DUP_ENTRY") {
        skipped++;
        continue;
      }
      throw e;
    }
  }
  return { applied, skipped };
};

const revokeAppliedDiscount = async (schoolId, id) => {
  const row = await queryOne(
    "SELECT * FROM student_fee_discounts WHERE id = ? AND school_id = ?",
    [id, schoolId],
  );
  if (!row) throw new Error("Applied discount not found");
  if (row.applied_to_fee_id) {
    const fee = await queryOne(
      "SELECT amount_due, discount_amount FROM student_fees WHERE id = ?",
      [row.applied_to_fee_id],
    );
    if (fee) {
      const newDiscount = Math.max(
        0,
        Number(fee.discount_amount || 0) - Number(row.amount || 0),
      );
      const newDue = Number(fee.amount_due || 0) + Number(row.amount || 0);
      await query(
        "UPDATE student_fees SET discount_amount = ?, amount_due = ? WHERE id = ?",
        [newDiscount, newDue, row.applied_to_fee_id],
      );
    }
  }
  await query(
    "UPDATE student_fee_discounts SET status = 'revoked' WHERE id = ?",
    [id],
  );
  return { revoked: 1 };
};

// ---- Fee Adjustments with approval workflow ----
const getAutomationConfig = async (schoolId) => {
  return (
    (await queryOne(
      "SELECT * FROM finance_automation_config WHERE school_id = ?",
      [schoolId],
    )) || {}
  );
};

const applyAdjustmentEffect = async (studentFeeId, newAmountDue) => {
  await query(
    `UPDATE student_fees
       SET amount_due = ?, adjusted_at = NOW(),
           status = CASE
             WHEN amount_paid >= ? THEN 'paid'
             WHEN amount_paid > 0 THEN 'partial'
             WHEN ? = 0 THEN 'waived'
             ELSE 'pending' END
     WHERE id = ?`,
    [newAmountDue, newAmountDue, newAmountDue, studentFeeId],
  );
};

const createFeeAdjustment = async ({
  schoolId,
  studentFeeId,
  adjustmentType,
  amount,
  reason,
  createdBy,
}) => {
  if (!reason || String(reason).trim().length < 20) {
    throw new Error("Reason must be at least 20 characters");
  }
  const fee = await queryOne(
    "SELECT id, amount_due, amount_paid, student_id FROM student_fees WHERE id = ? AND school_id = ?",
    [studentFeeId, schoolId],
  );
  if (!fee) throw new Error("Student fee not found");
  const prev = Number(fee.amount_due || 0);
  let next = prev;
  const amt = Number(amount || 0);
  if (adjustmentType === "increase") next = prev + amt;
  else if (adjustmentType === "decrease") next = Math.max(prev - amt, 0);
  else if (adjustmentType === "waive") next = 0;
  else throw new Error("Invalid adjustment type");

  const delta = Math.abs(next - prev);
  const cfg = await getAutomationConfig(schoolId);
  const threshold = Number(cfg.max_adjustment_without_approval || 0);
  const requiresApproval =
    cfg.require_approval_for_adjustments !== 0 &&
    (threshold === 0 || delta > threshold);

  const id = uuidv4();
  const status = requiresApproval ? "pending" : "approved";
  await query(
    `INSERT INTO fee_adjustments
       (id, school_id, student_fee_id, adjustment_type, previous_amount, new_amount,
        reason, requires_approval, approval_status, created_by, approved_at, approved_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      schoolId,
      studentFeeId,
      adjustmentType,
      prev,
      next,
      reason,
      requiresApproval ? 1 : 0,
      status,
      createdBy || null,
      requiresApproval ? null : new Date(),
      requiresApproval ? null : createdBy || null,
    ],
  );
  if (!requiresApproval) await applyAdjustmentEffect(studentFeeId, next);

  try {
    await query(
      `INSERT INTO finance_audit_logs
         (id, school_id, action, entity_type, entity_id, student_id, amount_affected, performed_by, metadata)
       VALUES (?, ?, 'FEE_ADJUSTMENT_CREATED', 'fee_adjustment', ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        schoolId,
        id,
        fee.student_id,
        delta,
        String(createdBy || "system"),
        JSON.stringify({ adjustmentType, prev, next, status, reason }),
      ],
    );
  } catch (_) {
    /* non-fatal */
  }

  return {
    id,
    status,
    requires_approval: requiresApproval,
    previous: prev,
    new: next,
  };
};

const listFeeAdjustments = async (schoolId, { status, limit = 100 } = {}) => {
  let sql = `SELECT fa.*, s.full_name AS student_name, s.admission_number,
                    fs.name AS fee_name
               FROM fee_adjustments fa
               LEFT JOIN student_fees sf ON sf.id = fa.student_fee_id
               LEFT JOIN students s ON s.id = sf.student_id
               LEFT JOIN fee_structures fs ON fs.id = sf.fee_template_id
              WHERE fa.school_id = ?`;
  const params = [schoolId];
  if (status) {
    sql += " AND fa.approval_status = ?";
    params.push(status);
  }
  sql += " ORDER BY fa.created_at DESC LIMIT ?";
  params.push(Number(limit));
  return query(sql, params);
};

const decideFeeAdjustment = async ({
  schoolId,
  id,
  decision,
  approverId,
  rejectedReason,
}) => {
  const row = await queryOne(
    "SELECT * FROM fee_adjustments WHERE id = ? AND school_id = ?",
    [id, schoolId],
  );
  if (!row) throw new Error("Adjustment not found");
  if (row.approval_status !== "pending")
    throw new Error("Adjustment is not pending");

  if (decision === "approve") {
    await query(
      `UPDATE fee_adjustments SET approval_status='approved', approved_at=NOW(), approved_by=? WHERE id=?`,
      [approverId || null, id],
    );
    await applyAdjustmentEffect(row.student_fee_id, Number(row.new_amount));
  } else if (decision === "reject") {
    await query(
      `UPDATE fee_adjustments SET approval_status='rejected', approved_by=?, rejected_reason=? WHERE id=?`,
      [approverId || null, rejectedReason || null, id],
    );
  } else {
    throw new Error("Invalid decision");
  }

  try {
    await query(
      `INSERT INTO finance_audit_logs (id, school_id, action, entity_type, entity_id, performed_by, metadata)
       VALUES (?, ?, ?, 'fee_adjustment', ?, ?, ?)`,
      [
        uuidv4(),
        schoolId,
        decision === "approve"
          ? "FEE_ADJUSTMENT_APPROVED"
          : "FEE_ADJUSTMENT_REJECTED",
        id,
        String(approverId || "system"),
        JSON.stringify({ rejectedReason: rejectedReason || null }),
      ],
    );
  } catch (_) {
    /* non-fatal */
  }
  return { id, status: decision === "approve" ? "approved" : "rejected" };
};

// ---- Daily reconciliation: M-Pesa ↔ payments ↔ allocations ----
const getReconciliationReport = async (schoolId, { date } = {}) => {
  const day = date || new Date().toISOString().slice(0, 10);

  const mpesa = await query(
    `SELECT mt.id, mt.mpesa_receipt_number, mt.amount, mt.confirmed_amount,
            mt.phone_number, mt.status, mt.transaction_date, mt.account_reference,
            p.id AS payment_id, p.amount AS payment_amount, p.receipt_number,
            (SELECT COALESCE(SUM(pa.amount),0) FROM payment_allocations pa WHERE pa.payment_id = p.id) AS allocated
       FROM mpesa_transactions mt
       LEFT JOIN payments p
         ON p.school_id = mt.school_id
        AND (p.mpesa_receipt_number = mt.mpesa_receipt_number
             OR p.reference_number = mt.mpesa_receipt_number)
      WHERE mt.school_id = ?
        AND DATE(COALESCE(mt.transaction_date, mt.created_at)) = ?
      ORDER BY mt.transaction_date DESC`,
    [schoolId, day],
  );

  const manual = await query(
    `SELECT p.id, p.receipt_number, p.amount, p.payment_method, p.status,
            p.received_at, p.reference_number,
            COALESCE((SELECT SUM(pa.amount) FROM payment_allocations pa WHERE pa.payment_id = p.id),0) AS allocated,
            s.full_name AS student_name, s.admission_number
       FROM payments p
       LEFT JOIN students s ON s.id = p.student_id
      WHERE p.school_id = ?
        AND DATE(p.received_at) = ?
        AND p.payment_method NOT IN ('mpesa_stk','mpesa_c2b')
      ORDER BY p.received_at DESC`,
    [schoolId, day],
  );

  const totals = {
    mpesa_count: mpesa.length,
    mpesa_amount: mpesa.reduce(
      (s, r) => s + Number(r.confirmed_amount || r.amount || 0),
      0,
    ),
    mpesa_matched: mpesa.filter((r) => r.payment_id).length,
    mpesa_unmatched: mpesa.filter(
      (r) => !r.payment_id && r.status === "completed",
    ).length,
    manual_count: manual.length,
    manual_amount: manual.reduce((s, r) => s + Number(r.amount || 0), 0),
    fully_allocated: manual.filter(
      (r) => Number(r.allocated) >= Number(r.amount),
    ).length,
    partially_allocated: manual.filter(
      (r) => Number(r.allocated) > 0 && Number(r.allocated) < Number(r.amount),
    ).length,
    unallocated: manual.filter((r) => Number(r.allocated) === 0).length,
  };
  return { date: day, mpesa, manual, totals };
};

module.exports = {
  findFeeTemplates,
  findFeeCategories,
  createFeeCategory,
  findFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  findFeeDiscounts,
  createFeeDiscount,
  findStudentFees,
  findStudentFeeById,
  createStudentFee,
  updateStudentFee,
  getStudentBalance,
  getCarryForwards,
  getStudentFeesList,
  findExpenses,
  findExpenseCategories,
  findFeeAssignments,
  bulkAssignFee,
  bulkUnassignFee,
  logBulkFeeAudit,
  getAuditLogs,
  findExcessCredits,
  findStudentOutstandingFees,
  applyExcessForStudents,
  applyExcessCredit,
  listAppliedDiscounts,
  applyDiscountToStudents,
  revokeAppliedDiscount,
  closeTerm,
  createFeeAdjustment,
  listFeeAdjustments,
  decideFeeAdjustment,
  getReconciliationReport,
};
