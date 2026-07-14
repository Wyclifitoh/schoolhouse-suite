const { query, queryOne, getClient } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
// lint:session-scope-ok — payment INSERTs now write term_id +
// academic_year_id explicitly; allocation/void writes are scoped via
// the parent payment row's session.

const findAll = async (
  schoolId,
  {
    limit,
    offset,
    status,
    method,
    studentId,
    search,
    sortBy,
    sortDir,
    session = {},
  },
) => {
  const limitNum = parseInt(limit, 10) || 20;
  const offsetNum = parseInt(offset, 10) || 0;

  let where = " WHERE p.school_id = ?";
  const params = [schoolId];

  if (status && status !== "all") {
    where += " AND p.status = ?";
    params.push(status);
  }
  if (method && method !== "all") {
    where += " AND p.payment_method = ?";
    params.push(method);
  }
  if (studentId) {
    where += " AND p.student_id = ?";
    params.push(studentId);
  }
  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    where +=
      " AND (s.full_name LIKE ? OR s.admission_number LIKE ? OR p.reference_number LIKE ? OR p.mpesa_receipt LIKE ? OR p.payer_phone LIKE ?)";
    params.push(term, term, term, term, term);
  }

  if (session.academicYearId) {
    where += " AND (p.academic_year_id = ? OR p.academic_year_id IS NULL)";
    params.push(session.academicYearId);
  }
  if (session.termId) {
    where += " AND (p.term_id = ? OR p.term_id IS NULL)";
    params.push(session.termId);
  }

  const fromJoin =
    " FROM payments p LEFT JOIN students s ON s.id = p.student_id";

  const sortable = {
    received_at: "p.received_at",
    amount: "p.amount",
    status: "p.status",
    payment_method: "p.payment_method",
    student_name: "s.full_name",
  };
  const col = sortable[sortBy] || "p.received_at";
  const dir = String(sortDir).toLowerCase() === "asc" ? "ASC" : "DESC";

  const dataSql = `SELECT p.*, s.full_name as student_name, s.admission_number${fromJoin}${where} ORDER BY ${col} ${dir} LIMIT ${limitNum} OFFSET ${offsetNum}`;
  const countSql = `SELECT COUNT(*) as count${fromJoin}${where}`;

  const [rows, countRows] = await Promise.all([
    query(dataSql, params),
    query(countSql, params),
  ]);

  return { rows, total: countRows[0]?.count || 0 };
};

const stats = async (
  schoolId,
  { search, status, method, session = {} } = {},
) => {
  let where = " WHERE p.school_id = ?";
  const params = [schoolId];
  if (status && status !== "all") {
    where += " AND p.status = ?";
    params.push(status);
  }
  if (method && method !== "all") {
    where += " AND p.payment_method = ?";
    params.push(method);
  }
  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    where +=
      " AND (s.full_name LIKE ? OR s.admission_number LIKE ? OR p.reference_number LIKE ? OR p.mpesa_receipt LIKE ? OR p.payer_phone LIKE ?)";
    params.push(term, term, term, term, term);
  }
  if (session.academicYearId) {
    where += " AND (p.academic_year_id = ? OR p.academic_year_id IS NULL)";
    params.push(session.academicYearId);
  }
  if (session.termId) {
    where += " AND (p.term_id = ? OR p.term_id IS NULL)";
    params.push(session.termId);
  }

  const sql = `SELECT
      COUNT(*) AS total_count,
      COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS total_collected,
      COALESCE(SUM(CASE WHEN p.payment_method LIKE 'mpesa%' AND p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS mpesa_total
    FROM payments p LEFT JOIN students s ON s.id = p.student_id${where}`;
  const rows = await query(sql, params);
  const r = rows[0] || {};
  return {
    total_count: Number(r.total_count || 0),
    total_collected: Number(r.total_collected || 0),
    mpesa_total: Number(r.mpesa_total || 0),
  };
};

const findById = async (id, schoolId) => {
  return queryOne(
    "SELECT p.*, s.full_name as student_name FROM payments p LEFT JOIN students s ON s.id = p.student_id WHERE p.id = ? AND p.school_id = ?",
    [id, schoolId],
  );
};

const findUnallocated = async (schoolId, { limit = 100 } = {}) => {
  return query(
    `SELECT p.* FROM payments p
      WHERE p.school_id = ?
        AND (p.status = 'unallocated' OR p.student_id IS NULL)
      ORDER BY p.received_at DESC
      LIMIT ?`,
    [schoolId, parseInt(limit, 10)],
  );
};

const findAllocations = async (schoolId, { paymentId, studentId }) => {
  const params = [schoolId];
  let sql = `SELECT pa.*, p.reference_number, p.payment_method, p.received_at, p.amount AS payment_amount,
                    s.full_name AS student_name, s.admission_number,
                    sf.student_id, sf.term_id, sf.amount_due, sf.amount_paid,
                    COALESCE(fs.name, ft.name) AS fee_name,
                    t.name AS term_name
             FROM payment_allocations pa
             JOIN payments p ON p.id = pa.payment_id
             JOIN student_fees sf ON sf.id = pa.student_fee_id
             LEFT JOIN students s ON s.id = sf.student_id
             LEFT JOIN fee_structures fs ON fs.id = sf.fee_structure_id
             LEFT JOIN fee_templates ft ON ft.id = sf.fee_template_id
             LEFT JOIN terms t ON t.id = sf.term_id
             WHERE p.school_id = ?`;
  if (paymentId) {
    sql += " AND pa.payment_id = ?";
    params.push(paymentId);
  }
  if (studentId) {
    sql += " AND sf.student_id = ?";
    params.push(studentId);
  }
  sql +=
    " ORDER BY p.received_at DESC, pa.allocation_order ASC, pa.allocated_at DESC LIMIT 300";
  return query(sql, params);
};

const create = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO payments (id, school_id, student_id, amount, payment_method, reference_number, ledger_type, status, received_at, recorded_by, payer_phone, notes, term_id, academic_year_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.student_id,
      data.amount,
      data.payment_method,
      data.reference_number || null,
      data.ledger_type || "fees",
      data.status || "pending",
      data.received_at || new Date(),
      data.recorded_by || null,
      data.payer_phone || null,
      data.notes || null,
      data.term_id || null,
      data.academic_year_id || null,
    ],
  );
  return queryOne("SELECT * FROM payments WHERE id = ?", [id]);
};

const normaliseFeeStatus = (amountPaid, amountDue) => {
  const paid = Number(amountPaid || 0);
  const due = Number(amountDue || 0);
  if (paid <= 0) return "pending";
  return paid >= due ? "paid" : "partial";
};

const reversePaymentEffectsInTxn = async (conn, paymentId) => {
  const [allocs] = await conn.execute(
    "SELECT * FROM payment_allocations WHERE payment_id = ? ORDER BY allocated_at DESC FOR UPDATE",
    [paymentId],
  );
  let reversedAllocated = 0;
  for (const a of allocs) {
    const [fRows] = await conn.execute(
      "SELECT amount_due, amount_paid FROM student_fees WHERE id = ? FOR UPDATE",
      [a.student_fee_id],
    );
    const fee = fRows[0];
    if (!fee) continue;
    const newPaid = Math.max(0, Number(fee.amount_paid) - Number(a.amount));
    await conn.execute(
      "UPDATE student_fees SET amount_paid = ?, status = ? WHERE id = ?",
      [newPaid, normaliseFeeStatus(newPaid, fee.amount_due), a.student_fee_id],
    );
    reversedAllocated += Number(a.amount || 0);
  }
  await conn.execute("DELETE FROM payment_allocations WHERE payment_id = ?", [
    paymentId,
  ]);

  let credits = [];
  try {
    const [rows] = await conn.execute(
      "SELECT id, amount, status FROM fee_carry_forwards WHERE source_payment_id = ? FOR UPDATE",
      [paymentId],
    );
    credits = rows || [];
    await conn.execute(
      "UPDATE fee_carry_forwards SET status = 'cancelled' WHERE source_payment_id = ? AND status <> 'cancelled'",
      [paymentId],
    );
  } catch {
    credits = [];
  }

  return {
    reversedAllocations: allocs.length,
    reversedAllocated,
    cancelledCredits: credits.length,
    cancelledPendingCredit: credits
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0),
  };
};

const markPaymentReversedInTxn = async (
  conn,
  paymentId,
  reason,
  performedBy,
) => {
  try {
    await conn.execute(
      `UPDATE payments
          SET status = 'reversed', void_reason = ?, voided_at = NOW(), voided_by = ?
        WHERE id = ?`,
      [reason, performedBy || null, paymentId],
    );
  } catch (err) {
    if (err && err.code !== "ER_BAD_FIELD_ERROR") throw err;
    await conn.execute(
      `UPDATE payments
          SET status = 'reversed', notes = CONCAT(COALESCE(notes, ''), ?)
        WHERE id = ?`,
      [`\n[voided:${new Date().toISOString()}] ${reason}`, paymentId],
    );
  }
};

/**
 * Void a payment AND reverse every fee/excess-credit it touched, in a single
 * transaction. The payment row is retained as status='reversed' for audit.
 */
const voidPayment = async (id, schoolId, reason, performedBy) => {
  const cleanReason = String(reason || "").trim();
  if (cleanReason.length < 20) {
    const e = new Error("Void reason must be at least 20 characters");
    e.statusCode = 400;
    throw e;
  }
  const conn = await getClient();
  try {
    await conn.beginTransaction();

    const [pRows] = await conn.execute(
      "SELECT * FROM payments WHERE id = ? AND school_id = ? FOR UPDATE",
      [id, schoolId],
    );
    const payment = pRows[0];
    if (!payment) throw new Error("Payment not found");
    if (payment.status === "reversed")
      throw new Error("Payment already voided");

    const reversal = await reversePaymentEffectsInTxn(conn, id);
    await markPaymentReversedInTxn(conn, id, cleanReason, performedBy);

    try {
      await conn.execute(
        `INSERT INTO finance_audit_logs
          (id, school_id, action, entity_type, entity_id, student_id,
           amount_affected, performed_by, metadata)
         VALUES (?, ?, 'PAYMENT_VOIDED', 'payment', ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          schoolId,
          id,
          payment.student_id,
          payment.amount,
          String(performedBy || "system"),
          JSON.stringify({ reason: cleanReason, ...reversal }),
        ],
      );
    } catch {
      /* non-fatal */
    }

    await conn.commit();
    return queryOne("SELECT * FROM payments WHERE id = ?", [id]);
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* noop */
    }
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Revert a payment WITHOUT deleting it. Removes all allocations and either
 * (a) parks the freed amount as an advance_credit (Excess Payments) or
 * (b) immediately re-applies it to the student's outstanding fees FIFO.
 * Payment row is preserved with status='reversed' for audit history.
 */
const revertPayment = async (id, schoolId, mode, reason, performedBy) => {
  const modeFinal = mode === "auto_apply" ? "auto_apply" : "excess";
  const conn = await getClient();
  try {
    await conn.beginTransaction();

    const [pRows] = await conn.execute(
      "SELECT * FROM payments WHERE id = ? AND school_id = ? FOR UPDATE",
      [id, schoolId],
    );
    const payment = pRows[0];
    if (!payment) throw new Error("Payment not found");
    if (payment.status === "reversed")
      throw new Error("Payment already reverted");
    if (!payment.student_id)
      throw new Error("Cannot revert an unallocated payment");

    const reversal = await reversePaymentEffectsInTxn(conn, id);

    // Total to redistribute = original payment amount (covers allocations
    // we just removed PLUS any prior unallocated excess from this payment).
    const redistribute = Number(payment.amount);

    // Mark payment reverted (preserved, never deleted).
    await markPaymentReversedInTxn(
      conn,
      id,
      reason || "Payment reverted",
      performedBy,
    );

    let appliedToFees = [];
    let excessRemaining = redistribute;

    if (modeFinal === "auto_apply" && redistribute > 0) {
      // Apply to outstanding fees FIFO (oldest due_date first).
      const [feeRows] = await conn.execute(
        `SELECT id, amount_due, amount_paid
           FROM student_fees
          WHERE school_id = ? AND student_id = ?
            AND (amount_due - amount_paid) > 0
            AND status NOT IN ('cancelled','waived')
          ORDER BY COALESCE(due_date, '9999-12-31') ASC, created_at ASC`,
        [schoolId, payment.student_id],
      );
      for (const fee of feeRows) {
        if (excessRemaining <= 0) break;
        const owing = Number(fee.amount_due) - Number(fee.amount_paid);
        if (owing <= 0) continue;
        const take = Math.min(owing, excessRemaining);
        const newPaid = Number(fee.amount_paid) + take;
        const newStatus =
          newPaid >= Number(fee.amount_due) ? "paid" : "partial";
        await conn.execute(
          "UPDATE student_fees SET amount_paid = ?, status = ?, last_payment_at = NOW() WHERE id = ?",
          [newPaid, newStatus, fee.id],
        );
        await conn.execute(
          `INSERT INTO payment_allocations
             (id, payment_id, student_fee_id, amount, allocated_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [uuidv4(), id, fee.id, take],
        );
        appliedToFees.push({ student_fee_id: fee.id, amount: take });
        excessRemaining -= take;
      }
    }

    // Anything not auto-applied goes to excess.
    if (excessRemaining > 0) {
      try {
        await conn.execute(
          `INSERT INTO fee_carry_forwards
             (id, school_id, student_id, ledger_type, from_term_id, amount,
              type, status, source_payment_id)
           VALUES (?, ?, ?, 'fees', ?, ?, 'advance_credit', 'pending', ?)`,
          [
            uuidv4(),
            schoolId,
            payment.student_id,
            payment.term_id || null,
            excessRemaining,
            id,
          ],
        );
      } catch {
        /* table may not exist on legacy DBs */
      }
    }

    try {
      await conn.execute(
        `INSERT INTO finance_audit_logs
          (id, school_id, action, entity_type, entity_id, student_id,
           amount_affected, performed_by, metadata)
         VALUES (?, ?, 'PAYMENT_REVERTED', 'payment', ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          schoolId,
          id,
          payment.student_id,
          payment.amount,
          String(performedBy || "system"),
          JSON.stringify({
            mode: modeFinal,
            reason: reason || null,
            ...reversal,
            redistributedAmount: redistribute,
            appliedToFees,
            excessRemaining,
          }),
        ],
      );
    } catch {
      /* non-fatal */
    }

    await conn.commit();
    return {
      ok: true,
      mode: modeFinal,
      reversed_allocations: reversal.reversedAllocations,
      auto_applied: appliedToFees,
      excess_remaining: excessRemaining,
    };
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* noop */
    }
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Atomically allocate the next receipt number for a school inside an
 * existing transaction. Format: <PREFIX>-<YEAR>-<6-digit zero padded>
 */
const allocateReceiptNumber = async (conn, schoolId) => {
  const year = new Date().getFullYear();
  // Ensure row exists (idempotent insert ignored on duplicate)
  await conn.execute(
    `INSERT INTO receipt_sequences (school_id, prefix, current_number, fiscal_year)
     VALUES (?, 'RCT', 0, ?)
     ON DUPLICATE KEY UPDATE school_id = school_id`,
    [schoolId, year],
  );
  // Lock the row, reset on fiscal year rollover, then bump
  const [rows] = await conn.execute(
    "SELECT prefix, current_number, fiscal_year FROM receipt_sequences WHERE school_id = ? FOR UPDATE",
    [schoolId],
  );
  const row = rows[0];
  const prefix = row.prefix || "RCT";
  const sameYear = Number(row.fiscal_year) === year;
  const next = (sameYear ? Number(row.current_number) : 0) + 1;
  await conn.execute(
    "UPDATE receipt_sequences SET current_number = ?, fiscal_year = ? WHERE school_id = ?",
    [next, year, schoolId],
  );
  return `${prefix}-${year}-${String(next).padStart(6, "0")}`;
};

/**
 * Read the school's configured allocation strategy. Returns a fragment safe
 * to splice into ORDER BY. Defaults to FIFO by due date.
 */
const allocationOrderClause = async (conn, schoolId, termId) => {
  let strategy = "fifo_by_due_date";
  try {
    const [rows] = await conn.execute(
      "SELECT default_allocation_strategy FROM finance_automation_config WHERE school_id = ?",
      [schoolId],
    );
    if (rows[0]?.default_allocation_strategy)
      strategy = String(rows[0].default_allocation_strategy);
  } catch {
    /* table may not exist on legacy DBs */
  }

  switch (strategy) {
    case "oldest_first":
      return `ORDER BY sf.created_at ASC`;
    case "current_term_first":
      return `ORDER BY (sf.term_id <=> ?) DESC, sf.due_date ASC, sf.created_at ASC`;
    case "highest_balance_first":
      return `ORDER BY (sf.amount_due - sf.amount_paid) DESC, sf.due_date ASC`;
    case "fifo_by_due_date":
    default:
      return `ORDER BY (sf.term_id <=> ?) DESC, (sf.due_date IS NULL) ASC, sf.due_date ASC, sf.created_at ASC`;
  }
};

const findMpesaByCheckoutId = async (checkoutRequestId) => {
  return queryOne(
    "SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?",
    [checkoutRequestId],
  );
};

/**
 * Resolve a student by id or admission_number. Returns the student row or null.
 */
const resolveStudent = async (
  conn,
  schoolId,
  { studentId, admissionNumber },
) => {
  if (studentId) {
    const [rows] = await conn.execute(
      "SELECT id, admission_number FROM students WHERE id = ? AND school_id = ?",
      [studentId, schoolId],
    );
    if (rows[0]) return rows[0];
  }
  if (admissionNumber) {
    const [rows] = await conn.execute(
      "SELECT id, admission_number FROM students WHERE admission_number = ? AND school_id = ?",
      [String(admissionNumber).trim(), schoolId],
    );
    if (rows[0]) return rows[0];
  }
  return null;
};

/**
 * Allocate a payment to a student's outstanding fees within an existing
 * transaction connection. Caps every allocation by the fee's remaining
 * balance so we never produce a negative balance.
 *
 * Strategy:
 *   - If feeIds provided => allocate strictly in that order (manual override).
 *   - Otherwise FIFO: current term first, then oldest due_date / created_at.
 *
 * Returns: { allocations:[{fee_id, fee_name, amount}], excess }
 */
const allocateWithinTxn = async (
  conn,
  { schoolId, studentId, paymentId, amount, feeIds, termId, recordedBy },
) => {
  let targetFees;
  if (Array.isArray(feeIds) && feeIds.length > 0) {
    const ph = feeIds.map(() => "?").join(",");
    [targetFees] = await conn.execute(
      `SELECT sf.id, sf.amount_due, sf.amount_paid,
              (sf.amount_due - sf.amount_paid) AS balance,
              COALESCE(fs.name, ft.name) AS fee_name
       FROM student_fees sf
       LEFT JOIN fee_structures fs ON fs.id = sf.fee_structure_id
       LEFT JOIN fee_templates  ft ON ft.id = sf.fee_template_id
       WHERE sf.school_id = ? AND sf.student_id = ?
         AND sf.id IN (${ph})
         AND sf.status NOT IN ('cancelled','waived')
         AND (sf.amount_due - sf.amount_paid) > 0
       ORDER BY FIELD(sf.id, ${ph})`,
      [schoolId, studentId, ...feeIds, ...feeIds],
    );
  } else {
    // Strategy-driven automatic allocation. Most strategies use term_id as
    // first sort key; a couple don't. allocationOrderClause already returns
    // the ORDER BY fragment, and tells us via the placeholder count whether
    // we need to bind termId.
    const orderClause = await allocationOrderClause(conn, schoolId, termId);
    const needsTermBind = orderClause.includes("sf.term_id <=>");
    const params = needsTermBind
      ? [schoolId, studentId, termId]
      : [schoolId, studentId];
    [targetFees] = await conn.execute(
      `SELECT sf.id, sf.amount_due, sf.amount_paid,
              (sf.amount_due - sf.amount_paid) AS balance,
              COALESCE(fs.name, ft.name) AS fee_name
       FROM student_fees sf
       LEFT JOIN fee_structures fs ON fs.id = sf.fee_structure_id
       LEFT JOIN fee_templates  ft ON ft.id = sf.fee_template_id
       WHERE sf.school_id = ? AND sf.student_id = ?
         AND sf.status NOT IN ('cancelled','waived')
         AND (sf.amount_due - sf.amount_paid) > 0
       ${orderClause}`,
      params,
    );
  }

  const allocations = [];
  let remaining = Number(amount);
  let order = 1;
  for (const fee of targetFees) {
    if (remaining <= 0) break;
    const bal = Number(fee.balance);
    if (bal <= 0) continue;
    const alloc = Math.min(bal, remaining);
    await conn.execute(
      `INSERT INTO payment_allocations
        (id, payment_id, student_fee_id, amount, allocation_order, is_auto_allocated, allocated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        paymentId,
        fee.id,
        alloc,
        order++,
        !(feeIds && feeIds.length),
        recordedBy || null,
      ],
    );
    const newPaid = Number(fee.amount_paid) + alloc;
    // Hard guard: never let amount_paid exceed amount_due.
    const cappedPaid = Math.min(newPaid, Number(fee.amount_due));
    const newStatus = cappedPaid >= Number(fee.amount_due) ? "paid" : "partial";
    await conn.execute(
      `UPDATE student_fees
          SET amount_paid = ?, status = ?, last_payment_at = NOW()
        WHERE id = ?`,
      [cappedPaid, newStatus, fee.id],
    );
    allocations.push({
      fee_id: fee.id,
      fee_name: fee.fee_name || "Fee",
      amount: alloc,
    });
    remaining -= alloc;
  }

  return { allocations, excess: Math.max(0, remaining) };
};

/**
 * Record a payment with automatic FIFO allocation and excess credit handling,
 * inside a single DB transaction.
 *
 * Resolution order:
 *   1. studentId or admissionNumber → student
 *   2. If no student → insert payment with student_id=NULL, status='unallocated'
 *      so it can be reviewed manually. No allocation, no excess credit yet.
 *
 * Rules enforced:
 *   - allocation amount <= fee remaining balance (no negative balances)
 *   - any leftover after fully paying outstanding fees goes to
 *     fee_carry_forwards as advance_credit (the project's "excess payments")
 */
const recordPaymentWithAllocation = async ({
  schoolId,
  studentId,
  admissionNumber,
  amount,
  paymentMethod,
  referenceNumber,
  ledgerType = "fees",
  recordedBy,
  payerPhone,
  notes,
  feeIds = [],
  termId = null,
  academicYearId = null,
  idempotencyKey = null,
}) => {
  // Idempotency check (outside txn — read-only)
  if (idempotencyKey) {
    const existing = await queryOne(
      `SELECT * FROM payments
        WHERE school_id = ? AND notes LIKE ?
        ORDER BY created_at DESC LIMIT 1`,
      [schoolId, `%[idem:${idempotencyKey}]%`],
    );
    if (existing) {
      const allocs = await query(
        `SELECT pa.*, COALESCE(fs.name, ft.name) AS fee_name
         FROM payment_allocations pa
         JOIN student_fees sf ON sf.id = pa.student_fee_id
         LEFT JOIN fee_structures fs ON fs.id = sf.fee_structure_id
         LEFT JOIN fee_templates  ft ON ft.id = sf.fee_template_id
         WHERE pa.payment_id = ?`,
        [existing.id],
      );
      return {
        payment: existing,
        allocations: allocs.map((a) => ({
          fee_id: a.student_fee_id,
          fee_name: a.fee_name || "Fee",
          amount: Number(a.amount),
        })),
        excess: 0,
        status: existing.status,
        idempotent_replay: true,
      };
    }
  }

  const conn = await getClient();
  try {
    await conn.beginTransaction();

    const student = await resolveStudent(conn, schoolId, {
      studentId,
      admissionNumber,
    });

    const paymentId = uuidv4();
    const notesWithIdem = idempotencyKey
      ? `${notes || ""}\n[idem:${idempotencyKey}]`.trim()
      : notes || null;
    const admissionUsed =
      admissionNumber || (student ? student.admission_number : null) || null;

    // Branch A: payment without an identifiable student → store as unallocated.
    if (!student) {
      await conn.execute(
        `INSERT INTO payments
          (id, school_id, student_id, amount, payment_method, reference_number,
           admission_number_used, ledger_type, status, received_at, recorded_by,
           payer_phone, notes, term_id, academic_year_id)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'unallocated', NOW(), ?, ?, ?, ?, ?)`,
        [
          paymentId,
          schoolId,
          amount,
          paymentMethod,
          referenceNumber || null,
          admissionUsed,
          ledgerType,
          recordedBy || null,
          payerPhone || null,
          notesWithIdem,
          termId || null,
          academicYearId || null,
        ],
      );

      try {
        await conn.execute(
          `INSERT INTO finance_audit_logs
            (id, school_id, action, entity_type, entity_id, amount_affected,
             performed_by, metadata)
           VALUES (?, ?, 'PAYMENT_UNALLOCATED', 'payment', ?, ?, ?, ?)`,
          [
            uuidv4(),
            schoolId,
            paymentId,
            amount,
            String(recordedBy || "system"),
            JSON.stringify({
              paymentMethod,
              referenceNumber,
              admissionNumber: admissionUsed,
              reason: "no_matching_student",
            }),
          ],
        );
      } catch {
        /* non-fatal */
      }

      await conn.commit();
      const payment = await queryOne("SELECT * FROM payments WHERE id = ?", [
        paymentId,
      ]);
      return {
        payment,
        allocations: [],
        excess: 0,
        status: "unallocated",
        reason: "no_matching_student",
      };
    }

    // Branch B: payment with a real student → insert + auto-allocate.
    // Allocate the receipt number inside the same txn so it's always atomic
    // with the payment row, and write it to the receipts table for audit.
    const receiptNumber = await allocateReceiptNumber(conn, schoolId);
    await conn.execute(
      `INSERT INTO payments
        (id, school_id, student_id, amount, payment_method, reference_number,
         admission_number_used, ledger_type, status, received_at, recorded_by,
         payer_phone, notes, receipt_number, term_id, academic_year_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW(), ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        schoolId,
        student.id,
        amount,
        paymentMethod,
        referenceNumber || null,
        admissionUsed,
        ledgerType,
        recordedBy || null,
        payerPhone || null,
        notesWithIdem,
        receiptNumber,
        termId || null,
        academicYearId || null,
      ],
    );
    try {
      await conn.execute(
        `INSERT INTO receipts (id, school_id, payment_id, receipt_number)
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), schoolId, paymentId, receiptNumber],
      );
    } catch {
      /* receipts table optional on legacy DBs */
    }

    const { allocations, excess } = await allocateWithinTxn(conn, {
      schoolId,
      studentId: student.id,
      paymentId,
      amount,
      feeIds,
      termId,
      recordedBy,
    });

    // Excess → fee_carry_forwards as advance_credit (the project's
    // "excess payments" ledger, surfaced on /excess-payments).
    if (excess > 0) {
      try {
        await conn.execute(
          `INSERT INTO fee_carry_forwards
            (id, school_id, student_id, ledger_type, from_term_id, amount,
             type, status, source_payment_id)
           VALUES (?, ?, ?, ?, ?, ?, 'advance_credit', 'pending', ?)`,
          [
            uuidv4(),
            schoolId,
            student.id,
            ledgerType,
            termId,
            excess,
            paymentId,
          ],
        );
      } catch {
        /* table may not exist on legacy DBs */
      }
    }

    try {
      await conn.execute(
        `INSERT INTO finance_audit_logs
          (id, school_id, action, entity_type, entity_id, student_id,
           amount_affected, performed_by, metadata)
         VALUES (?, ?, 'PAYMENT_RECORDED', 'payment', ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          schoolId,
          paymentId,
          student.id,
          amount,
          String(recordedBy || "system"),
          JSON.stringify({
            paymentMethod,
            referenceNumber,
            termId,
            manualFeeIds: feeIds || [],
            allocations,
            excess,
          }),
        ],
      );
    } catch {
      /* non-fatal */
    }

    await conn.commit();
    const payment = await queryOne("SELECT * FROM payments WHERE id = ?", [
      paymentId,
    ]);
    return {
      payment,
      allocations,
      excess,
      status: "completed",
    };
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* noop */
    }
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Reassign an unallocated payment to a specific student and auto-allocate it.
 */
const reassignPayment = async ({
  paymentId,
  schoolId,
  studentId,
  feeIds = [],
  termId = null,
  performedBy = null,
}) => {
  const conn = await getClient();
  try {
    await conn.beginTransaction();
    const [pRows] = await conn.execute(
      `SELECT * FROM payments WHERE id = ? AND school_id = ? FOR UPDATE`,
      [paymentId, schoolId],
    );
    const payment = pRows[0];
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== "unallocated" || payment.student_id) {
      throw new Error("Only unallocated payments can be reassigned");
    }

    const [sRows] = await conn.execute(
      "SELECT id FROM students WHERE id = ? AND school_id = ?",
      [studentId, schoolId],
    );
    if (!sRows[0]) throw new Error("Student not found");

    await conn.execute(
      `UPDATE payments SET student_id = ?, status = 'completed' WHERE id = ?`,
      [studentId, paymentId],
    );

    const { allocations, excess } = await allocateWithinTxn(conn, {
      schoolId,
      studentId,
      paymentId,
      amount: Number(payment.amount),
      feeIds,
      termId,
      recordedBy: performedBy,
    });

    if (excess > 0) {
      try {
        await conn.execute(
          `INSERT INTO fee_carry_forwards
            (id, school_id, student_id, ledger_type, from_term_id, amount,
             type, status, source_payment_id)
           VALUES (?, ?, ?, ?, ?, ?, 'advance_credit', 'pending', ?)`,
          [
            uuidv4(),
            schoolId,
            studentId,
            payment.ledger_type || "fees",
            termId,
            excess,
            paymentId,
          ],
        );
      } catch {
        /* non-fatal */
      }
    }

    try {
      await conn.execute(
        `INSERT INTO finance_audit_logs
          (id, school_id, action, entity_type, entity_id, student_id,
           amount_affected, performed_by, metadata)
         VALUES (?, ?, 'PAYMENT_REASSIGNED', 'payment', ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          schoolId,
          paymentId,
          studentId,
          payment.amount,
          String(performedBy || "system"),
          JSON.stringify({ allocations, excess }),
        ],
      );
    } catch {
      /* non-fatal */
    }

    await conn.commit();
    return {
      payment_id: paymentId,
      student_id: studentId,
      allocations,
      excess,
    };
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* noop */
    }
    throw err;
  } finally {
    conn.release();
  }
};

const bulkVoidPayments = async ({
  paymentIds,
  schoolId,
  reason,
  performedBy,
}) => {
  const ids = Array.from(new Set(Array.isArray(paymentIds) ? paymentIds : []))
    .map((id) => String(id || "").trim())
    .filter(Boolean);
  if (!ids.length) throw new Error("Select at least one payment to void");
  const results = [];
  for (const paymentId of ids) {
    try {
      const payment = await voidPayment(
        paymentId,
        schoolId,
        reason,
        performedBy,
      );
      results.push({
        payment_id: paymentId,
        ok: true,
        status: payment?.status,
      });
    } catch (err) {
      results.push({ payment_id: paymentId, ok: false, error: err.message });
    }
  }
  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;
  return { total: results.length, succeeded, failed, results };
};

const transferPayment = async ({
  paymentId,
  schoolId,
  toStudentId,
  feeIds = [],
  reason,
  performedBy,
}) => {
  const cleanReason = String(reason || "").trim();
  if (cleanReason.length < 20) {
    const e = new Error("Transfer reason must be at least 20 characters");
    e.statusCode = 400;
    throw e;
  }
  if (!toStudentId) throw new Error("Target student is required");

  const conn = await getClient();
  try {
    await conn.beginTransaction();

    const [pRows] = await conn.execute(
      `SELECT * FROM payments WHERE id = ? AND school_id = ? FOR UPDATE`,
      [paymentId, schoolId],
    );
    const payment = pRows[0];
    if (!payment) throw new Error("Payment not found");
    if (payment.status === "reversed")
      throw new Error("Payment is already reversed");
    if (!payment.student_id)
      throw new Error("Use reassign for unallocated payments");
    if (payment.student_id === toStudentId)
      throw new Error("Target student must be different from current student");

    const [sRows] = await conn.execute(
      "SELECT id, admission_number FROM students WHERE id = ? AND school_id = ? AND status <> 'deleted'",
      [toStudentId, schoolId],
    );
    const target = sRows[0];
    if (!target) throw new Error("Target student not found");

    const fromStudentId = payment.student_id;
    const reversal = await reversePaymentEffectsInTxn(conn, paymentId);

    await conn.execute(
      `UPDATE payments
          SET student_id = ?, admission_number_used = ?, status = 'completed', notes = CONCAT(COALESCE(notes, ''), ?)
        WHERE id = ?`,
      [
        toStudentId,
        target.admission_number || payment.admission_number_used || null,
        `\n[transferred:${new Date().toISOString()}] ${cleanReason}`,
        paymentId,
      ],
    );

    const { allocations, excess } = await allocateWithinTxn(conn, {
      schoolId,
      studentId: toStudentId,
      paymentId,
      amount: Number(payment.amount),
      feeIds,
      termId: payment.term_id || null,
      recordedBy: performedBy,
    });

    if (excess > 0) {
      try {
        await conn.execute(
          `INSERT INTO fee_carry_forwards
            (id, school_id, student_id, ledger_type, from_term_id, amount,
             type, status, source_payment_id)
           VALUES (?, ?, ?, ?, ?, ?, 'advance_credit', 'pending', ?)`,
          [
            uuidv4(),
            schoolId,
            toStudentId,
            payment.ledger_type || "fees",
            payment.term_id || null,
            excess,
            paymentId,
          ],
        );
      } catch {
        /* non-fatal */
      }
    }

    try {
      await conn.execute(
        `INSERT INTO finance_audit_logs
          (id, school_id, action, entity_type, entity_id, student_id,
           amount_affected, performed_by, metadata)
         VALUES (?, ?, 'PAYMENT_TRANSFERRED', 'payment', ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          schoolId,
          paymentId,
          toStudentId,
          payment.amount,
          String(performedBy || "system"),
          JSON.stringify({
            reason: cleanReason,
            fromStudentId,
            toStudentId,
            reversal,
            newAllocations: allocations,
            newExcess: excess,
          }),
        ],
      );
    } catch {
      /* non-fatal */
    }

    await conn.commit();
    return {
      payment_id: paymentId,
      from_student_id: fromStudentId,
      to_student_id: toStudentId,
      allocations,
      excess,
    };
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* noop */
    }
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  findAll,
  stats,
  findById,
  findUnallocated,
  findAllocations,
  create,
  voidPayment,
  revertPayment,
  findMpesaByCheckoutId,
  recordPaymentWithAllocation,

  reassignPayment,
  bulkVoidPayments,
  transferPayment,
};
