const paymentsRepository = require("./payments.repository");
const { paginate } = require("../../utils/pagination");

const list = async (schoolId, queryParams, session) => {
  const { limit, offset, page } = paginate(queryParams);
  const { rows, total } = await paymentsRepository.findAll(schoolId, {
    limit,
    offset,
    status: queryParams.status,
    method: queryParams.method,
    studentId: queryParams.student_id,
    sortBy: queryParams.sort_by,
    sortDir: queryParams.sort_dir,
    session: session || {},
  });
  return { data: rows, total, page, limit };
};

const getById = async (id, schoolId) => {
  const payment = await paymentsRepository.findById(id, schoolId);
  if (!payment)
    throw Object.assign(new Error("Payment not found"), { statusCode: 404 });
  return payment;
};

const allocations = async (schoolId, queryParams) => {
  return paymentsRepository.findAllocations(schoolId, {
    paymentId: queryParams.payment_id,
    studentId: queryParams.student_id,
  });
};

const create = async (schoolId, data, userId) => {
  return paymentsRepository.create({
    ...data,
    school_id: schoolId,
    recorded_by: userId,
  });
};

const voidPayment = async (id, schoolId, reason, userId) => {
  return paymentsRepository.voidPayment(id, schoolId, reason, userId);
};

const record = async (schoolId, body, userId) => {
  // Either a student_id or an admission_number must be provided. If neither
  // resolves to a real student, the payment is stored as 'unallocated'.
  if (!body.student_id && !body.admission_number)
    throw Object.assign(
      new Error("student_id or admission_number is required"),
      { statusCode: 400 },
    );
  if (!body.amount || Number(body.amount) <= 0)
    throw Object.assign(new Error("amount must be > 0"), { statusCode: 400 });
  if (!body.payment_method)
    throw Object.assign(new Error("payment_method is required"), {
      statusCode: 400,
    });
  const methodMap = {
    mpesa: "mpesa_c2b",
    mpesa_c2b: "mpesa_c2b",
    mpesa_stk: "mpesa_stk",
    bank_transfer: "bank",
  };
  const paymentMethod = methodMap[body.payment_method] || body.payment_method;
  const result = await paymentsRepository.recordPaymentWithAllocation({
    schoolId,
    studentId: body.student_id || null,
    admissionNumber: body.admission_number || null,
    amount: Number(body.amount),
    paymentMethod,
    referenceNumber: body.reference_number || body.reference || null,
    ledgerType: body.ledger_type || "fees",
    recordedBy: userId || null,
    payerPhone: body.payer_phone || null,
    notes: body.notes || null,
    feeIds: Array.isArray(body.fee_ids) ? body.fee_ids : [],
    termId: body.term_id || null,
    academicYearId: body.academic_year_id || null,
    idempotencyKey: body.idempotency_key || null,
  });
  // Stamp the active session onto the payment row so reports + filters work.
  // Done post-insert to avoid touching every conditional INSERT branch.
  if (result?.payment?.id && (body.academic_year_id || body.term_id)) {
    try {
      const { query } = require("../../config/database");
      await query(
        "UPDATE payments SET academic_year_id = COALESCE(?, academic_year_id), term_id = COALESCE(?, term_id) WHERE id = ? AND school_id = ?",
        [
          body.academic_year_id || null,
          body.term_id || null,
          result.payment.id,
          schoolId,
        ],
      );
    } catch {
      /* non-fatal */
    }
  }
  return result;
};

const listUnallocated = (schoolId, queryParams) =>
  paymentsRepository.findUnallocated(schoolId, {
    limit: Number(queryParams?.limit) || 100,
  });

const reassign = (schoolId, paymentId, body, userId) =>
  paymentsRepository.reassignPayment({
    paymentId,
    schoolId,
    studentId: body.student_id,
    feeIds: Array.isArray(body.fee_ids) ? body.fee_ids : [],
    termId: body.term_id || null,
    performedBy: userId || null,
  });

module.exports = {
  list,
  getById,
  allocations,
  create,
  voidPayment,
  record,
  listUnallocated,
  reassign,
};
