const paymentsRepository = require('./payments.repository');
const { paginate } = require('../../utils/pagination');

const list = async (schoolId, queryParams) => {
  const { limit, offset, page } = paginate(queryParams);
  const { rows, total } = await paymentsRepository.findAll(schoolId, {
    limit, offset, status: queryParams.status, method: queryParams.method,
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

module.exports = { list, getById, create, voidPayment };
