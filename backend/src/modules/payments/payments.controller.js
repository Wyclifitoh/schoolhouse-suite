const paymentsService = require('./payments.service');
const { success, error, paginated } = require('../../utils/response');
const { parsePagination } = require('../../utils/pagination');

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await paymentsService.listPayments(req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const payment = await paymentsService.getPayment(req.params.id, req.schoolId);
    if (!payment) return error(res, 'Payment not found', 404);
    return success(res, payment);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const payment = await paymentsService.createPayment({
      ...req.body,
      school_id: req.schoolId,
      recorded_by: req.user.id,
    });
    return success(res, payment, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// M-Pesa webhook - no auth required
const mpesaCallback = async (req, res) => {
  try {
    console.log('[mpesa-callback] Received:', JSON.stringify(req.body));
    await paymentsService.processMpesaCallback(req.body);
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('[mpesa-callback] Error:', err);
    // Always return success to M-Pesa to prevent retries
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

module.exports = { list, getById, create, mpesaCallback };
