const paymentsService = require('./payments.service');
const { success, error } = require('../../utils/response');

const list = async (req, res) => {
  try { return success(res, await paymentsService.list(req.schoolId, req.query)); }
  catch (err) { return error(res, err.message, err.statusCode || 500); }
};

const getById = async (req, res) => {
  try { return success(res, await paymentsService.getById(req.params.id, req.schoolId)); }
  catch (err) { return error(res, err.message, err.statusCode || 500); }
};

const create = async (req, res) => {
  try { return success(res, await paymentsService.create(req.schoolId, req.body, req.user.id), 201); }
  catch (err) { return error(res, err.message, err.statusCode || 500); }
};

const voidPayment = async (req, res) => {
  try { return success(res, await paymentsService.voidPayment(req.params.id, req.schoolId, req.body.reason)); }
  catch (err) { return error(res, err.message, err.statusCode || 500); }
};

const mpesaCallback = async (req, res) => {
  console.log('[mpesa-callback] Received:', JSON.stringify(req.body));
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
};

module.exports = { list, getById, create, voidPayment, mpesaCallback };
