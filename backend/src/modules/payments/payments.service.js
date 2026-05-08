const paymentsRepository = require('./payments.repository');
const { paginate } = require('../../utils/pagination');

const list = async (schoolId, queryParams) => {
  const { limit, offset, page } = paginate(queryParams);
  const { rows, total } = await paymentsRepository.findAll(schoolId, {
    limit, offset, status: queryParams.status, method: queryParams.method,
    studentId: queryParams.student_id,
    sortBy: queryParams.sort_by, sortDir: queryParams.sort_dir,
  });
  return { data: rows, total, page, limit };
};

const getById = async (id, schoolId) => {
  const payment = await paymentsRepository.findById(id, schoolId);
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  return payment;
};

const create = async (schoolId, data, userId) => {
  return paymentsRepository.create({ ...data, school_id: schoolId, recorded_by: userId });
};

const voidPayment = async (id, schoolId, reason) => {
  return paymentsRepository.voidPayment(id, schoolId, reason);
};

const record = async (schoolId, body, userId) => {
  if (!body.student_id) throw Object.assign(new Error('student_id is required'), { statusCode: 400 });
  if (!body.amount || Number(body.amount) <= 0) throw Object.assign(new Error('amount must be > 0'), { statusCode: 400 });
  if (!body.payment_method) throw Object.assign(new Error('payment_method is required'), { statusCode: 400 });
  return paymentsRepository.recordPaymentWithAllocation({
    schoolId,
    studentId: body.student_id,
    amount: Number(body.amount),
    paymentMethod: body.payment_method,
    referenceNumber: body.reference_number || body.reference || null,
    ledgerType: body.ledger_type || 'fees',
    recordedBy: userId || null,
    payerPhone: body.payer_phone || null,
    notes: body.notes || null,
    feeIds: Array.isArray(body.fee_ids) ? body.fee_ids : [],
    termId: body.term_id || null,
    idempotencyKey: body.idempotency_key || null,
  });
};

module.exports = { list, getById, create, voidPayment, record };
