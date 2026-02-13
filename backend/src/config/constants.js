const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  ACCOUNTANT: 'accountant',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STAFF: 'staff',
};

const LEDGER_TYPES = {
  FEES: 'fees',
  TRANSPORT: 'transport',
  POS: 'pos',
};

const PAYMENT_METHODS = {
  MPESA_STK: 'mpesa_stk',
  MPESA_C2B: 'mpesa_c2b',
  CASH: 'cash',
  BANK: 'bank',
  CHEQUE: 'cheque',
  CARD: 'card',
};

const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REVERSED: 'reversed',
  STALE: 'stale',
};

const FEE_STATUSES = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  WAIVED: 'waived',
  CANCELLED: 'cancelled',
};

module.exports = { ROLES, LEDGER_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES, FEE_STATUSES };
