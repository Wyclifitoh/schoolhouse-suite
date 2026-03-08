// ============================================
// FINANCE ERROR HANDLING
// Per docs/frontend-architecture.md
// ============================================

export type FinanceErrorCode =
  | "INSUFFICIENT_BALANCE"
  | "DUPLICATE_PAYMENT"
  | "ALLOCATION_FAILED"
  | "TERM_CLOSED"
  | "STUDENT_INACTIVE"
  | "PERMISSION_DENIED";

export class FinanceError extends Error {
  public code: FinanceErrorCode;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    code: FinanceErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "FinanceError";
    this.code = code;
    this.details = details;
  }
}

export const FINANCE_ERROR_MESSAGES: Record<FinanceErrorCode, string> = {
  INSUFFICIENT_BALANCE: "Payment exceeds outstanding balance",
  DUPLICATE_PAYMENT: "This payment has already been recorded",
  ALLOCATION_FAILED: "Could not allocate payment to fees",
  TERM_CLOSED: "Cannot modify closed term records",
  STUDENT_INACTIVE: "Student account is inactive",
  PERMISSION_DENIED: "You do not have permission for this action",
};

/**
 * Parse an edge function error response into a FinanceError
 */
export function parseFinanceError(error: unknown): FinanceError {
  if (error instanceof FinanceError) return error;

  const msg = error instanceof Error ? error.message : String(error);

  // Try to match known error codes
  for (const [code, message] of Object.entries(FINANCE_ERROR_MESSAGES)) {
    if (msg.toLowerCase().includes(code.toLowerCase())) {
      return new FinanceError(message, code as FinanceErrorCode);
    }
  }

  return new FinanceError(msg, "ALLOCATION_FAILED");
}
