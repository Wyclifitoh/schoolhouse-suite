const financeRepository = require('./finance.repository');
const AppError = require('../../utils/AppError');

// PLACEHOLDER - Fee calculation logic will be implemented in Phase 2
const assignFeeToStudent = async (data) => {
  // TODO: Validate fee template exists and belongs to school
  // TODO: Check for duplicate assignments
  // TODO: Apply carry-forward credits if available
  return financeRepository.createStudentFee(data);
};

// PLACEHOLDER - Full FIFO allocation will be implemented in Phase 2
const recordPayment = async (paymentData) => {
  // TODO: Implement FIFO allocation across outstanding fees
  // TODO: Handle overpayments -> fee_carry_forwards
  // TODO: Create payment_allocations records
  // TODO: Update student_fees.amount_paid
  // TODO: Create finance_audit_log entry
  throw new AppError('Payment recording not yet implemented', 501, 'NOT_IMPLEMENTED');
};

// PLACEHOLDER - Real-time balance calculation
const calculateStudentBalance = async (studentId, schoolId) => {
  // TODO: Include carry-forward amounts
  // TODO: Include pending M-Pesa transactions
  const balances = await financeRepository.getStudentBalance(studentId, schoolId);
  const carryForwards = await financeRepository.getCarryForwards(studentId, schoolId);

  return {
    balances,
    carry_forwards: carryForwards,
    // TODO: Add net_balance computed field
  };
};

// PLACEHOLDER - Term transition logic
const processCarryForward = async (studentId, schoolId, fromTermId, toTermId) => {
  // TODO: Calculate outstanding balance at term close
  // TODO: Create fee_carry_forwards record (arrears or advance_credit)
  // TODO: Apply to new term's student_fees
  // TODO: Create audit log entry
  throw new AppError('Carry-forward processing not yet implemented', 501, 'NOT_IMPLEMENTED');
};

const listFeeTemplates = async (schoolId, pagination) => {
  return financeRepository.findFeeTemplates(schoolId, pagination);
};

const getStudentFees = async (studentId, schoolId) => {
  return financeRepository.findStudentFees(studentId, schoolId);
};

module.exports = {
  assignFeeToStudent,
  recordPayment,
  calculateStudentBalance,
  processCarryForward,
  listFeeTemplates,
  getStudentFees,
};
