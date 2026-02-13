const paymentsRepository = require('./payments.repository');
const AppError = require('../../utils/AppError');

const listPayments = async (schoolId, pagination) => {
  return paymentsRepository.findAll(schoolId, pagination);
};

const getPayment = async (id, schoolId) => {
  return paymentsRepository.findById(id, schoolId);
};

const createPayment = async (data) => {
  return paymentsRepository.create(data);
};

// PLACEHOLDER - M-Pesa callback processing
const processMpesaCallback = async (callbackData) => {
  // TODO: Idempotency check - verify transaction not already processed
  // TODO: Update mpesa_transactions status
  // TODO: Create payment record
  // TODO: Trigger FIFO allocation
  // TODO: Send SMS confirmation
  throw new AppError('M-Pesa callback processing not yet implemented', 501, 'NOT_IMPLEMENTED');
};

module.exports = { listPayments, getPayment, createPayment, processMpesaCallback };
