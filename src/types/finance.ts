// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentMethod = 
  | 'mpesa_stk' 
  | 'mpesa_c2b' 
  | 'cash' 
  | 'bank' 
  | 'cheque' 
  | 'card';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'reversed' 
  | 'stale';

export type LedgerType = 'fees' | 'transport' | 'pos';

export interface Payment {
  id: string;
  school_id: string;
  student_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  ledger_type: LedgerType;
  status: PaymentStatus;
  received_at: string;
  recorded_by?: string;
  mpesa_transaction_id?: string;
  payer_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  student_fee_id: string;
  amount: number;
  allocated_at: string;
}

export interface AllocationResult {
  allocations: PaymentAllocation[];
  remaining_amount: number;
  fully_paid_fees: string[];
  partially_paid_fees: string[];
}

// ============================================
// M-PESA TYPES
// ============================================

export type MpesaTransactionType = 'stk_push' | 'c2b';

export interface MpesaTransaction {
  id: string;
  school_id: string;
  student_id?: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_type: MpesaTransactionType;
  status: PaymentStatus;
  ledger_type: LedgerType;
  fee_ids: string[];
  term_id?: string;
  
  // STK Push specific
  checkout_request_id?: string;
  merchant_request_id?: string;
  
  // Callback data
  mpesa_receipt_number?: string;
  transaction_date?: string;
  confirmed_amount?: number;
  confirmed_phone?: string;
  payer_name?: string;
  
  // Status tracking
  initiated_by?: string;
  initiated_at: string;
  expires_at?: string;
  callback_received_at?: string;
  failure_reason?: string;
  result_code?: number;
  raw_callback?: unknown;
  
  created_at: string;
  updated_at: string;
}

export interface STKPushRequest {
  student_id: string;
  phone_number: string;
  amount: number;
  fee_ids?: string[];
  ledger_type?: LedgerType;
}

export interface STKPushResponse {
  success: boolean;
  transaction_id: string;
  checkout_request_id: string;
  message: string;
}

export interface STKCallbackBody {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: Array<{ Name: string; Value: string | number }>;
  };
}

// ============================================
// STUDENT FEE TYPES
// ============================================

export type FeeStatus = 'pending' | 'partial' | 'paid' | 'waived' | 'cancelled';

export interface StudentFee {
  id: string;
  school_id: string;
  student_id: string;
  fee_template_id: string;
  term_id: string;
  academic_year_id: string;
  ledger_type: LedgerType;
  
  amount_due: number;
  amount_paid: number;
  brought_forward_amount: number;
  brought_forward_credit: number;
  balance: number; // Computed column
  
  status: FeeStatus;
  due_date?: string;
  assigned_at: string;
  assigned_by: string;
  assignment_mode: 'bulk_auto' | 'individual_auto' | 'manual' | 'retroactive';
  last_payment_at?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// CARRY FORWARD TYPES
// ============================================

export type CarryForwardType = 'arrears' | 'advance_credit';
export type CarryForwardStatus = 'pending' | 'applied' | 'refunded';

export interface FeeCarryForward {
  id: string;
  school_id: string;
  student_id: string;
  ledger_type: LedgerType;
  from_term_id: string;
  to_term_id?: string;
  amount: number;
  type: CarryForwardType;
  status: CarryForwardStatus;
  source_payment_id?: string;
  applied_at?: string;
  created_at: string;
}

// ============================================
// RECEIPT TYPES
// ============================================

export interface Receipt {
  id: string;
  school_id: string;
  payment_id: string;
  receipt_number: string;
  pdf_url?: string;
  generated_at?: string;
  created_at: string;
}

export interface ReceiptData {
  receipt_number: string;
  school_name: string;
  school_address?: string;
  school_logo?: string;
  student_name: string;
  admission_number: string;
  grade_name: string;
  amount: number;
  payment_method: PaymentMethod;
  received_at: string;
  allocations: Array<{
    fee_name: string;
    amount: number;
  }>;
}

// ============================================
// SMS TYPES
// ============================================

export type SmsStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'not_configured';
export type SmsReferenceType = 'payment' | 'fee_reminder' | 'receipt' | 'announcement';

export interface SmsLog {
  id: string;
  school_id: string;
  student_id?: string;
  phone_number: string;
  message: string;
  status: SmsStatus;
  provider: string;
  provider_message_id?: string;
  cost?: string;
  triggered_by: string;
  reference_type: SmsReferenceType;
  reference_id?: string;
  created_at: string;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export type AuditAction = 
  | 'FEE_ASSIGNED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_ALLOCATED'
  | 'MANUAL_PAYMENT_RECORDED'
  | 'ADVANCE_CREDIT_CREATED'
  | 'FEE_ADJUSTED'
  | 'PAYMENT_VOIDED'
  | 'TERM_CLOSED'
  | 'ARREARS_CARRIED_FORWARD';

export interface FinanceAuditLog {
  id: string;
  school_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  student_id?: string;
  amount_affected: number;
  performed_by: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================
// REPORT TYPES
// ============================================

export type ReportType = 
  | 'fee_collection' 
  | 'arrears' 
  | 'term_summary' 
  | 'student_balances'
  | 'statement';

export interface GeneratedReport {
  id: string;
  school_id: string;
  report_type: ReportType;
  student_id?: string;
  pdf_url?: string;
  filters?: Record<string, unknown>;
  generated_by: string;
  generated_at: string;
}

// ============================================
// ERROR TYPES
// ============================================

export class PaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class AllocationError extends Error {
  constructor(
    public code: string,
    message: string,
    public feeId?: string
  ) {
    super(message);
    this.name = 'AllocationError';
  }
}

export class ReconciliationError extends Error {
  constructor(
    public code: string,
    message: string,
    public transactionId?: string
  ) {
    super(message);
    this.name = 'ReconciliationError';
  }
}
