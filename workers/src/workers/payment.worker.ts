import { Worker, Job } from 'bullmq';
import { redisConnection, config } from '../config';
import { createJobLogger, logger } from '../config/logger';
import { JobNames, PaymentAllocationJob, PaymentAllocationJobSchema } from '../types/jobs';
import {
  query,
  withTransaction,
  tryAdvisoryLock,
  releaseAdvisoryLock,
  hashStringToInt,
} from '../services/database';
import { smsQueue, receiptPdfQueue } from '../queues';

interface StudentFee {
  id: string;
  balance: number;
  brought_forward_amount: number;
  due_date: string;
}

interface PaymentAllocation {
  payment_id: string;
  student_fee_id: string;
  amount: number;
}

const processPaymentAllocation = async (job: Job<PaymentAllocationJob>) => {
  const jobLogger = createJobLogger(job.name, job.id!);
  const data = PaymentAllocationJobSchema.parse(job.data);

  jobLogger.info({ transactionId: data.mpesa_transaction_id }, 'Processing payment allocation');

  // 1. Get transaction details
  const [transaction] = await query<{
    id: string;
    student_id: string;
    school_id: string;
    amount: number;
    confirmed_amount: number;
    phone_number: string;
    mpesa_receipt_number: string;
    transaction_type: string;
    ledger_type: string;
    term_id: string;
    status: string;
  }>(
    `SELECT * FROM mpesa_transactions WHERE id = $1 AND status = 'completed'`,
    [data.mpesa_transaction_id]
  );

  if (!transaction) {
    jobLogger.warn('Transaction not found or not completed');
    return { success: false, reason: 'transaction_not_found' };
  }

  // 2. Acquire advisory lock
  const lockKey = hashStringToInt(transaction.id);
  const lockAcquired = await tryAdvisoryLock(lockKey);

  if (!lockAcquired) {
    jobLogger.info('Could not acquire lock, job likely being processed concurrently');
    return { success: false, reason: 'lock_not_acquired' };
  }

  try {
    const amount = transaction.confirmed_amount || transaction.amount;

    // 3. Create payment record
    const [payment] = await query<{ id: string }>(
      `INSERT INTO payments (
        school_id, student_id, amount, payment_method, reference_number,
        ledger_type, status, received_at, mpesa_transaction_id, payer_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW(), $7, $8)
      RETURNING id`,
      [
        transaction.school_id,
        transaction.student_id,
        amount,
        transaction.transaction_type === 'stk_push' ? 'mpesa_stk' : 'mpesa_c2b',
        transaction.mpesa_receipt_number,
        transaction.ledger_type,
        transaction.id,
        transaction.phone_number,
      ]
    );

    jobLogger.info({ paymentId: payment.id }, 'Created payment record');

    // 4. Get outstanding fees (FIFO order)
    const outstandingFees = await query<StudentFee>(
      `SELECT id, balance, brought_forward_amount, due_date
       FROM student_fees
       WHERE student_id = $1 AND ledger_type = $2 AND balance > 0
       ORDER BY brought_forward_amount DESC, due_date ASC`,
      [transaction.student_id, transaction.ledger_type]
    );

    // 5. Allocate using FIFO
    const allocations: PaymentAllocation[] = [];
    let remainingAmount = amount;
    const fullyPaidFees: string[] = [];
    const partiallyPaidFees: string[] = [];

    for (const fee of outstandingFees) {
      if (remainingAmount <= 0) break;

      const allocatableAmount = Math.min(remainingAmount, fee.balance);

      allocations.push({
        payment_id: payment.id,
        student_fee_id: fee.id,
        amount: allocatableAmount,
      });

      remainingAmount -= allocatableAmount;

      if (allocatableAmount >= fee.balance) {
        fullyPaidFees.push(fee.id);
      } else {
        partiallyPaidFees.push(fee.id);
      }
    }

    // 6. Persist allocations
    await withTransaction(async (client) => {
      for (const alloc of allocations) {
        await client.query(
          `INSERT INTO payment_allocations (payment_id, student_fee_id, amount, allocated_at)
           VALUES ($1, $2, $3, NOW())`,
          [alloc.payment_id, alloc.student_fee_id, alloc.amount]
        );

        await client.query(
          `UPDATE student_fees 
           SET amount_paid = amount_paid + $1,
               status = CASE 
                 WHEN amount_paid + $1 >= amount_due + brought_forward_amount - brought_forward_credit 
                 THEN 'paid' ELSE 'partial' 
               END,
               last_payment_at = NOW()
           WHERE id = $2`,
          [alloc.amount, alloc.student_fee_id]
        );
      }

      // Handle overpayment
      if (remainingAmount > 0) {
        await client.query(
          `INSERT INTO fee_carry_forwards (
            student_id, school_id, ledger_type, from_term_id,
            amount, type, status, source_payment_id
          ) VALUES ($1, $2, $3, $4, $5, 'advance_credit', 'pending', $6)`,
          [
            transaction.student_id,
            transaction.school_id,
            transaction.ledger_type,
            transaction.term_id,
            remainingAmount,
            payment.id,
          ]
        );
      }
    });

    // 7. Generate receipt
    const [receipt] = await query<{ receipt_number: string }>(
      `SELECT generate_receipt($1, $2) as receipt_number`,
      [payment.id, transaction.school_id]
    );

    // 8. Queue receipt PDF generation
    await receiptPdfQueue.add(JobNames.GENERATE_RECEIPT_PDF, {
      payment_id: payment.id,
      receipt_number: receipt.receipt_number,
      school_id: transaction.school_id,
    });

    // 9. Queue SMS notification
    const [student] = await query<{ parent_phone: string; first_name: string; admission_number: string }>(
      `SELECT parent_phone, first_name, admission_number FROM students WHERE id = $1`,
      [transaction.student_id]
    );

    if (student?.parent_phone) {
      const [school] = await query<{ name: string }>(
        `SELECT name FROM schools WHERE id = $1`,
        [transaction.school_id]
      );

      const [balanceResult] = await query<{ balance: number }>(
        `SELECT COALESCE(SUM(balance), 0) as balance FROM student_fees 
         WHERE student_id = $1 AND ledger_type = $2`,
        [transaction.student_id, transaction.ledger_type]
      );

      await smsQueue.add(JobNames.SEND_SMS, {
        phone_number: student.parent_phone,
        message: `${school?.name}: Payment of KES ${amount.toLocaleString()} received for ${student.first_name} (${student.admission_number}). Receipt: ${receipt.receipt_number}. Balance: KES ${balanceResult.balance.toLocaleString()}.`,
        student_id: transaction.student_id,
        school_id: transaction.school_id,
        reference_type: 'payment',
        reference_id: payment.id,
      });
    }

    // 10. Audit log
    await query(
      `INSERT INTO finance_audit_logs (
        action, entity_type, entity_id, student_id, school_id,
        amount_affected, performed_by, metadata
      ) VALUES ('PAYMENT_ALLOCATED', 'payment', $1, $2, $3, $4, 'system', $5)`,
      [
        payment.id,
        transaction.student_id,
        transaction.school_id,
        amount,
        JSON.stringify({
          source: 'bullmq_worker',
          allocations,
          advance_credit: remainingAmount,
          fully_paid_fees: fullyPaidFees,
          partially_paid_fees: partiallyPaidFees,
        }),
      ]
    );

    jobLogger.info(
      { paymentId: payment.id, allocations: allocations.length, advanceCredit: remainingAmount },
      'Payment allocation completed'
    );

    return {
      success: true,
      payment_id: payment.id,
      allocations: allocations.length,
      advance_credit: remainingAmount,
    };

  } finally {
    await releaseAdvisoryLock(lockKey);
  }
};

// ============================================
// WORKER SETUP
// ============================================

export const paymentWorker = new Worker(
  JobNames.ALLOCATE_PAYMENT,
  processPaymentAllocation,
  {
    connection: redisConnection,
    concurrency: config.CONCURRENCY_PAYMENTS,
    limiter: {
      max: 100,
      duration: 1000, // 100 jobs per second max
    },
  }
);

paymentWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Payment job completed');
});

paymentWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Payment job failed');
});

paymentWorker.on('error', (err) => {
  logger.error({ error: err.message }, 'Payment worker error');
});

export const startPaymentWorker = () => {
  logger.info({ concurrency: config.CONCURRENCY_PAYMENTS }, 'Payment worker started');
  return paymentWorker;
};
