import { z } from 'zod';

// ============================================
// PAYMENT JOBS
// ============================================

export const PaymentAllocationJobSchema = z.object({
  mpesa_transaction_id: z.string().uuid(),
  retry_count: z.number().default(0),
});
export type PaymentAllocationJob = z.infer<typeof PaymentAllocationJobSchema>;

export const ReconcilePaymentJobSchema = z.object({
  unmatched_payment_id: z.string().uuid(),
  suggested_student_id: z.string().uuid().optional(),
});
export type ReconcilePaymentJob = z.infer<typeof ReconcilePaymentJobSchema>;

export const StaleTransactionCleanupJobSchema = z.object({
  older_than_minutes: z.number().default(30),
});
export type StaleTransactionCleanupJob = z.infer<typeof StaleTransactionCleanupJobSchema>;

// ============================================
// NOTIFICATION JOBS
// ============================================

export const SendSmsJobSchema = z.object({
  phone_number: z.string(),
  message: z.string(),
  student_id: z.string().uuid().optional(),
  school_id: z.string().uuid(),
  reference_type: z.enum(['payment', 'fee_reminder', 'receipt', 'announcement']),
  reference_id: z.string().uuid().optional(),
});
export type SendSmsJob = z.infer<typeof SendSmsJobSchema>;

export const SendBulkSmsJobSchema = z.object({
  school_id: z.string().uuid(),
  template: z.string(),
  filters: z.object({
    grade_id: z.string().uuid().optional(),
    has_balance: z.boolean().optional(),
    min_balance: z.number().optional(),
  }).optional(),
});
export type SendBulkSmsJob = z.infer<typeof SendBulkSmsJobSchema>;

export const FeeReminderJobSchema = z.object({
  school_id: z.string().uuid(),
  term_id: z.string().uuid(),
  reminder_type: z.enum(['upcoming_due', 'overdue', 'arrears']),
  days_threshold: z.number(),
});
export type FeeReminderJob = z.infer<typeof FeeReminderJobSchema>;

// ============================================
// REPORT JOBS
// ============================================

export const GenerateReceiptPdfJobSchema = z.object({
  payment_id: z.string().uuid(),
  receipt_number: z.string(),
  school_id: z.string().uuid(),
});
export type GenerateReceiptPdfJob = z.infer<typeof GenerateReceiptPdfJobSchema>;

export const GenerateStatementJobSchema = z.object({
  student_id: z.string().uuid(),
  school_id: z.string().uuid(),
  from_date: z.string(),
  to_date: z.string(),
  requested_by: z.string().uuid(),
});
export type GenerateStatementJob = z.infer<typeof GenerateStatementJobSchema>;

export const GenerateBulkReportJobSchema = z.object({
  school_id: z.string().uuid(),
  report_type: z.enum(['fee_collection', 'arrears', 'term_summary', 'student_balances']),
  term_id: z.string().uuid().optional(),
  filters: z.record(z.unknown()).optional(),
  requested_by: z.string().uuid(),
});
export type GenerateBulkReportJob = z.infer<typeof GenerateBulkReportJobSchema>;

// ============================================
// TERM OPERATIONS JOBS
// ============================================

export const TermTransitionJobSchema = z.object({
  school_id: z.string().uuid(),
  from_term_id: z.string().uuid(),
  to_term_id: z.string().uuid(),
  initiated_by: z.string().uuid(),
});
export type TermTransitionJob = z.infer<typeof TermTransitionJobSchema>;

export const CarryForwardArrearsJobSchema = z.object({
  school_id: z.string().uuid(),
  from_term_id: z.string().uuid(),
  to_term_id: z.string().uuid(),
});
export type CarryForwardArrearsJob = z.infer<typeof CarryForwardArrearsJobSchema>;

export const BulkFeeAssignmentJobSchema = z.object({
  school_id: z.string().uuid(),
  term_id: z.string().uuid(),
  grade_ids: z.array(z.string().uuid()),
  fee_template_ids: z.array(z.string().uuid()),
  initiated_by: z.string().uuid(),
});
export type BulkFeeAssignmentJob = z.infer<typeof BulkFeeAssignmentJobSchema>;

// ============================================
// JOB NAMES
// ============================================

export const JobNames = {
  // Payments
  ALLOCATE_PAYMENT: 'allocate-payment',
  RECONCILE_PAYMENT: 'reconcile-payment',
  CLEANUP_STALE_TRANSACTIONS: 'cleanup-stale-transactions',

  // Notifications
  SEND_SMS: 'send-sms',
  SEND_BULK_SMS: 'send-bulk-sms',
  FEE_REMINDER: 'fee-reminder',

  // Reports
  GENERATE_RECEIPT_PDF: 'generate-receipt-pdf',
  GENERATE_STATEMENT: 'generate-statement',
  GENERATE_BULK_REPORT: 'generate-bulk-report',

  // Term Operations
  TERM_TRANSITION: 'term-transition',
  CARRY_FORWARD_ARREARS: 'carry-forward-arrears',
  BULK_FEE_ASSIGNMENT: 'bulk-fee-assignment',
} as const;

export type JobName = typeof JobNames[keyof typeof JobNames];
