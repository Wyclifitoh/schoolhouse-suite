// ============================================================
// Canonical staff role set — HR module redesign (2026-05-31)
// Use ONLY these 7 roles for new staff. Legacy values still
// exist in the user_roles enum for backward compatibility but
// must not be assigned to newly created staff.
// ============================================================
const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  ACCOUNTANT: "accountant",
  LIBRARIAN: "librarian",
  TEACHER: "teacher",
  RECEPTIONIST: "receptionist",
};

const STAFF_ROLES = Object.values(ROLES);

// Legacy roles retained only for migration / backward compatibility.
const LEGACY_ROLES = [
  "school_admin",
  "deputy_admin",
  "finance_officer",
  "front_office",
  "transport_officer",
  "store_manager",
  "pos_attendant",
  "auditor",
];

const LEDGER_TYPES = {
  FEES: "fees",
  TRANSPORT: "transport",
  POS: "pos",
};

const PAYMENT_METHODS = {
  MPESA_STK: "mpesa_stk",
  MPESA_C2B: "mpesa_c2b",
  CASH: "cash",
  BANK: "bank",
  CHEQUE: "cheque",
  CARD: "card",
};

const PAYMENT_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REVERSED: "reversed",
  STALE: "stale",
};

const FEE_STATUSES = {
  PENDING: "pending",
  PARTIAL: "partial",
  PAID: "paid",
  WAIVED: "waived",
  CANCELLED: "cancelled",
};

module.exports = {
  ROLES,
  STAFF_ROLES,
  LEGACY_ROLES,
  LEDGER_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  FEE_STATUSES,
};
