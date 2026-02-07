// ============================================
// JOB PAYLOAD TYPES (for Edge Function → Worker communication)
// ============================================

export interface PaymentAllocationJobPayload {
  mpesa_transaction_id: string;
  retry_count?: number;
}

export interface ReconcilePaymentJobPayload {
  unmatched_payment_id: string;
  suggested_student_id?: string;
}

export interface SendSmsJobPayload {
  phone_number: string;
  message: string;
  student_id?: string;
  school_id: string;
  reference_type: 'payment' | 'fee_reminder' | 'receipt' | 'announcement';
  reference_id?: string;
}

export interface FeeReminderJobPayload {
  school_id: string;
  term_id: string;
  reminder_type: 'upcoming_due' | 'overdue' | 'arrears';
  days_threshold: number;
}

export interface GenerateReceiptPdfJobPayload {
  payment_id: string;
  receipt_number: string;
  school_id: string;
}

export interface GenerateStatementJobPayload {
  student_id: string;
  school_id: string;
  from_date: string;
  to_date: string;
  requested_by: string;
}

export interface GenerateBulkReportJobPayload {
  school_id: string;
  report_type: 'fee_collection' | 'arrears' | 'term_summary' | 'student_balances';
  term_id?: string;
  filters?: Record<string, unknown>;
  requested_by: string;
}

export interface TermTransitionJobPayload {
  school_id: string;
  from_term_id: string;
  to_term_id: string;
  initiated_by: string;
}

export interface BulkFeeAssignmentJobPayload {
  school_id: string;
  term_id: string;
  grade_ids: string[];
  fee_template_ids: string[];
  initiated_by: string;
}

// ============================================
// JOB RESULT TYPES
// ============================================

export interface PaymentAllocationResult {
  success: boolean;
  payment_id?: string;
  allocations?: number;
  advance_credit?: number;
  error?: string;
}

export interface SmsResult {
  success: boolean;
  message_id?: string;
  cost?: string;
  error?: string;
}

export interface PdfGenerationResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ManualPaymentRequest {
  student_id: string;
  amount: number;
  payment_method: 'cash' | 'bank' | 'cheque';
  reference_number?: string;
  ledger_type?: 'fees' | 'transport' | 'pos';
  fee_allocations?: Array<{ fee_id: string; amount: number }>;
  notes?: string;
  received_at?: string;
}

export interface ManualPaymentResponse {
  success: boolean;
  payment_id: string;
  receipt_number?: string;
  allocations: Array<{ payment_id: string; student_fee_id: string; amount: number }>;
  advance_credit: number;
  fully_paid_fees: string[];
  partially_paid_fees: string[];
}

export interface STKPushRequestPayload {
  student_id: string;
  phone_number: string;
  amount: number;
  fee_ids?: string[];
  ledger_type?: 'fees' | 'transport' | 'pos';
}

export interface STKPushResponsePayload {
  success: boolean;
  transaction_id?: string;
  checkout_request_id?: string;
  message: string;
  error?: string;
}

// ============================================
// STUDENT BALANCE TYPES
// ============================================

export interface StudentBalance {
  student_id: string;
  fees_balance: number;
  transport_balance: number;
  pos_balance: number;
  total_balance: number;
  last_payment_date?: string;
  outstanding_fees: number;
  pending_credits: number;
}

export interface BalanceBreakdown {
  current_term_due: number;
  brought_forward_arrears: number;
  brought_forward_credits: number;
  total_paid: number;
  outstanding_balance: number;
}
