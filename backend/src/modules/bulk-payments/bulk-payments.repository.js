const { query, queryOne, getClient } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const { writeAudit } = require("../../utils/audit");
const paymentsRepo = require("../payments/payments.repository");

const list = async (schoolId, { status } = {}) => {
  let sql = `SELECT bp.*,
                    (SELECT COUNT(*) FROM bulk_payment_allocations a WHERE a.bulk_payment_id = bp.id) AS allocation_count
               FROM bulk_payments bp
              WHERE bp.school_id = ?`;
  const params = [schoolId];
  if (status) {
    sql += " AND bp.status = ?";
    params.push(status);
  }
  sql += " ORDER BY bp.created_at DESC LIMIT 200";
  return query(sql, params);
};

const getById = async (id, schoolId) => {
  const bulk = await queryOne(
    `SELECT * FROM bulk_payments WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  );
  if (!bulk) return null;
  const allocations = await query(
    `SELECT a.*, s.full_name AS student_name, s.admission_number
       FROM bulk_payment_allocations a
       LEFT JOIN students s ON s.id = a.student_id
      WHERE a.bulk_payment_id = ?
      ORDER BY s.full_name`,
    [id],
  );
  return { ...bulk, allocations };
};

const createDraft = async (data) => {
  const id = uuidv4();
  const allocations = Array.isArray(data.allocations) ? data.allocations : [];
  const total = allocations.reduce((s, a) => s + Number(a.amount || 0), 0);

  const conn = await getClient();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `INSERT INTO bulk_payments
        (id, school_id, sponsor_name, sponsor_contact, total_amount, reference,
         payment_method, payment_date, notes, status, recorded_by, term_id, academic_year_id)
       VALUES (?,?,?,?,?,?,?,?,?, 'draft', ?, ?, ?)`,
      [
        id,
        data.school_id,
        data.sponsor_name,
        data.sponsor_contact || null,
        data.total_amount || total,
        data.reference || null,
        data.payment_method || "bank",
        data.payment_date,
        data.notes || null,
        data.recorded_by || null,
        data.term_id || null,
        data.academic_year_id || null,
      ],
    );
    for (const a of allocations) {
      await conn.execute(
        `INSERT INTO bulk_payment_allocations (id, school_id, bulk_payment_id, student_id, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), data.school_id, id, a.student_id, Number(a.amount)],
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  await writeAudit({
    schoolId: data.school_id,
    userId: data.recorded_by,
    action: "BULK_PAYMENT_DRAFT",
    entityType: "bulk_payment",
    entityId: id,
  });
  return getById(id, data.school_id);
};

const updateDraft = async (id, schoolId, data) => {
  const existing = await queryOne(
    `SELECT status FROM bulk_payments WHERE id=? AND school_id=?`,
    [id, schoolId],
  );
  if (!existing)
    throw Object.assign(new Error("Not found"), { statusCode: 404 });
  if (existing.status !== "draft")
    throw Object.assign(new Error("Only drafts can be edited"), {
      statusCode: 400,
    });

  const allocations = Array.isArray(data.allocations) ? data.allocations : null;
  const conn = await getClient();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE bulk_payments SET sponsor_name=COALESCE(?,sponsor_name),
         sponsor_contact=COALESCE(?,sponsor_contact),
         total_amount=COALESCE(?,total_amount), reference=COALESCE(?,reference),
         payment_method=COALESCE(?,payment_method), payment_date=COALESCE(?,payment_date),
         notes=COALESCE(?,notes)
       WHERE id=? AND school_id=?`,
      [
        data.sponsor_name || null,
        data.sponsor_contact || null,
        data.total_amount || null,
        data.reference || null,
        data.payment_method || null,
        data.payment_date || null,
        data.notes || null,
        id,
        schoolId,
      ],
    );
    if (allocations) {
      await conn.execute(
        `DELETE FROM bulk_payment_allocations WHERE bulk_payment_id=?`,
        [id],
      );
      for (const a of allocations) {
        await conn.execute(
          `INSERT INTO bulk_payment_allocations (id, school_id, bulk_payment_id, student_id, amount)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), schoolId, id, a.student_id, Number(a.amount)],
        );
      }
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  return getById(id, schoolId);
};

const commit = async (id, schoolId, userId) => {
  const bulk = await getById(id, schoolId);
  if (!bulk) throw Object.assign(new Error("Not found"), { statusCode: 404 });
  if (bulk.status !== "draft")
    throw Object.assign(new Error(`Cannot commit (status=${bulk.status})`), {
      statusCode: 400,
    });
  if (!bulk.allocations.length)
    throw Object.assign(new Error("No allocations to commit"), {
      statusCode: 400,
    });

  // Delegate each allocation to the canonical payment recorder so FIFO
  // allocation, receipt numbering and excess credits behave exactly like a
  // normal payment. Idempotency key per (bulk_id, allocation_id) means safe
  // retries if commit is interrupted mid-loop.
  for (const a of bulk.allocations) {
    if (a.payment_id) continue; // already committed previously
    const result = await paymentsRepo.recordPaymentWithAllocation({
      schoolId,
      studentId: a.student_id,
      amount: Number(a.amount),
      paymentMethod: bulk.payment_method || "bank",
      referenceNumber: bulk.reference || `BULK-${id.slice(0, 8)}`,
      ledgerType: "fees",
      recordedBy: userId || null,
      notes: `Bulk sponsorship: ${bulk.sponsor_name}`,
      feeIds: [],
      termId: bulk.term_id || null,
      academicYearId: bulk.academic_year_id || null,
      idempotencyKey: `bulk:${id}:${a.id}`,
    });
    const paymentId = result?.payment?.id;
    if (paymentId) {
      await query(
        `UPDATE bulk_payment_allocations SET payment_id=? WHERE id=?`,
        [paymentId, a.id],
      );
    }
  }
  await query(
    `UPDATE bulk_payments SET status='committed', committed_at=NOW(), committed_by=?
     WHERE id=? AND school_id=?`,
    [userId || null, id, schoolId],
  );

  await writeAudit({
    schoolId,
    userId,
    action: "BULK_PAYMENT_COMMITTED",
    entityType: "bulk_payment",
    entityId: id,
  });
  return getById(id, schoolId);
};

const remove = async (id, schoolId) => {
  const existing = await queryOne(
    `SELECT status FROM bulk_payments WHERE id=? AND school_id=?`,
    [id, schoolId],
  );
  if (existing && existing.status === "committed")
    throw Object.assign(new Error("Cannot delete committed bulk payment"), {
      statusCode: 400,
    });
  await query(`DELETE FROM bulk_payment_allocations WHERE bulk_payment_id=?`, [
    id,
  ]);
  await query(`DELETE FROM bulk_payments WHERE id=? AND school_id=?`, [
    id,
    schoolId,
  ]);
  return { id };
};

module.exports = { list, getById, createDraft, updateDraft, commit, remove };
