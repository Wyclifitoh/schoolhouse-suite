const { query, queryOne, getClient } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const { writeAudit } = require("../../utils/audit");
const paymentsRepo = require("../payments/payments.repository");

const list = async (schoolId, { kind, status, studentId } = {}) => {
  let sql = `SELECT ik.*, s.full_name AS student_name, s.admission_number,
                    sup.name AS supplier_name
               FROM in_kind_payments ik
               LEFT JOIN students s
                 ON s.id COLLATE utf8mb4_unicode_ci = ik.student_id COLLATE utf8mb4_unicode_ci
               LEFT JOIN inventory_suppliers sup
                 ON sup.id COLLATE utf8mb4_unicode_ci = ik.supplier_id COLLATE utf8mb4_unicode_ci
              WHERE ik.school_id = ?`;
  const params = [schoolId];
  if (kind) {
    sql += " AND ik.kind = ?";
    params.push(kind);
  }
  if (status) {
    sql += " AND ik.approval_status = ?";
    params.push(status);
  }
  if (studentId) {
    sql += " AND ik.student_id = ?";
    params.push(studentId);
  }
  sql += " ORDER BY ik.created_at DESC LIMIT 500";
  return query(sql, params);
};

const getById = (id, schoolId) =>
  queryOne(`SELECT * FROM in_kind_payments WHERE id = ? AND school_id = ?`, [
    id,
    schoolId,
  ]);

const create = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO in_kind_payments
      (id, school_id, kind, supplier_id, student_id, goods_description,
       quantity, unit, assessed_value, approval_status, reference, notes, recorded_by)
     VALUES (?,?,?,?,?,?,?,?,?, 'pending', ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.kind,
      data.supplier_id || null,
      data.student_id || null,
      data.goods_description,
      data.quantity || 1,
      data.unit || null,
      data.assessed_value,
      data.reference || null,
      data.notes || null,
      data.recorded_by || null,
    ],
  );
  await writeAudit({
    schoolId: data.school_id,
    userId: data.recorded_by,
    action: "IN_KIND_CREATED",
    entityType: "in_kind_payment",
    entityId: id,
    newValues: data,
  });
  return getById(id, data.school_id);
};

const approve = async (id, schoolId, userId) => {
  const rec = await getById(id, schoolId);
  if (!rec) throw Object.assign(new Error("Not found"), { statusCode: 404 });
  if (rec.approval_status === "approved") return rec;

  let linkedExpenseId = null;
  let linkedPaymentId = null;

  // Supplier-offset: create an approved expense first (best-effort; tolerates
  // schema drift on expenses table).
  if (rec.kind === "supplier_offset") {
    linkedExpenseId = uuidv4();
    try {
      await query(
        `INSERT INTO expenses
          (id, school_id, title, amount, expense_date, payment_method,
           reference, notes, status, recorded_by)
         VALUES (?, ?, ?, ?, CURDATE(), 'in_kind', ?, ?, 'approved', ?)`,
        [
          linkedExpenseId,
          schoolId,
          `In-kind supplier offset: ${rec.goods_description}`,
          rec.assessed_value,
          rec.reference || null,
          `Supplier: ${rec.supplier_id}; offset for student ${rec.student_id}`,
          userId || null,
        ],
      );
    } catch {
      linkedExpenseId = null;
    }
  }

  // Delegate to the canonical payment recorder so FIFO allocation, receipt
  // numbering, excess credit + audit are all handled identically to a normal
  // payment. Any unallocated remainder lands on the Excess Payments ledger.
  if (rec.student_id && Number(rec.assessed_value) > 0) {
    const result = await paymentsRepo.recordPaymentWithAllocation({
      schoolId,
      studentId: rec.student_id,
      amount: Number(rec.assessed_value),
      paymentMethod: "in_kind",
      referenceNumber: rec.reference || `IK-${id.slice(0, 8)}`,
      ledgerType: "fees",
      recordedBy: userId || null,
      payerPhone: null,
      notes: `In-kind payment (${rec.kind}): ${rec.goods_description}`,
      feeIds: [],
      idempotencyKey: `inkind:${id}`,
    });
    linkedPaymentId = result?.payment?.id || null;
  }

  await query(
    `UPDATE in_kind_payments
       SET approval_status='approved', approved_by=?, approved_at=NOW(),
           linked_expense_id=?, linked_payment_id=?
     WHERE id=? AND school_id=?`,
    [userId || null, linkedExpenseId, linkedPaymentId, id, schoolId],
  );

  await writeAudit({
    schoolId,
    userId,
    action: "IN_KIND_APPROVED",
    entityType: "in_kind_payment",
    entityId: id,
  });
  return getById(id, schoolId);
};

const reject = async (id, schoolId, userId, reason) => {
  await query(
    `UPDATE in_kind_payments SET approval_status='rejected', approved_by=?, approved_at=NOW(), notes=CONCAT(COALESCE(notes,''), '\nRejected: ', ?)
     WHERE id=? AND school_id=?`,
    [userId || null, reason || "", id, schoolId],
  );
  await writeAudit({
    schoolId,
    userId,
    action: "IN_KIND_REJECTED",
    entityType: "in_kind_payment",
    entityId: id,
  });
  return getById(id, schoolId);
};

const remove = async (id, schoolId) => {
  const rec = await getById(id, schoolId);
  if (rec && rec.approval_status === "approved")
    throw Object.assign(new Error("Cannot delete approved record"), {
      statusCode: 400,
    });
  await query(`DELETE FROM in_kind_payments WHERE id=? AND school_id=?`, [
    id,
    schoolId,
  ]);
  return { id };
};

module.exports = { list, getById, create, approve, reject, remove };
