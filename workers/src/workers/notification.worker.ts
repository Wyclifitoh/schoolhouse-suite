import { Worker, Job } from 'bullmq';
import { redisConnection, config } from '../config';
import { createJobLogger, logger } from '../config/logger';
import {
  JobNames,
  SendSmsJob,
  SendSmsJobSchema,
  FeeReminderJob,
  FeeReminderJobSchema,
  SendBulkSmsJob,
  SendBulkSmsJobSchema,
} from '../types/jobs';
import { query } from '../services/database';
import { smsQueue } from '../queues';

// ============================================
// SMS PROVIDER INTEGRATION
// ============================================

interface SmsResult {
  success: boolean;
  messageId?: string;
  cost?: string;
  error?: string;
}

const sendSmsViaAfricasTalking = async (
  phone: string,
  message: string,
  senderId?: string
): Promise<SmsResult> => {
  const apiKey = config.AFRICASTALKING_API_KEY;
  const username = config.AFRICASTALKING_USERNAME;

  if (!apiKey || !username) {
    logger.warn('Africa\'s Talking not configured, SMS not sent');
    return { success: false, error: 'SMS provider not configured' };
  }

  try {
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
      },
      body: new URLSearchParams({
        username,
        to: phone,
        message,
        ...(senderId && { from: senderId }),
      }),
    });

    const result = await response.json();
    const recipient = result.SMSMessageData?.Recipients?.[0];

    return {
      success: recipient?.status === 'Success',
      messageId: recipient?.messageId,
      cost: recipient?.cost,
      error: recipient?.status !== 'Success' ? recipient?.status : undefined,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

// ============================================
// SEND SMS JOB PROCESSOR
// ============================================

const processSendSms = async (job: Job<SendSmsJob>) => {
  const jobLogger = createJobLogger(job.name, job.id!);
  const data = SendSmsJobSchema.parse(job.data);

  jobLogger.info({ phone: data.phone_number }, 'Sending SMS');

  // Get school sender ID
  const [school] = await query<{ sms_sender_id: string }>(
    'SELECT sms_sender_id FROM schools WHERE id = $1',
    [data.school_id]
  );

  const result = await sendSmsViaAfricasTalking(
    data.phone_number,
    data.message,
    school?.sms_sender_id
  );

  // Log to database
  await query(
    `INSERT INTO sms_logs (
      student_id, school_id, phone_number, message, status,
      provider, provider_message_id, cost, triggered_by, reference_type, reference_id
    ) VALUES ($1, $2, $3, $4, $5, 'africastalking', $6, $7, $8, $9, $10)`,
    [
      data.student_id,
      data.school_id,
      data.phone_number,
      data.message,
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.cost,
      'system',
      data.reference_type,
      data.reference_id,
    ]
  );

  if (!result.success) {
    throw new Error(`SMS failed: ${result.error}`);
  }

  jobLogger.info({ messageId: result.messageId }, 'SMS sent successfully');
  return result;
};

// ============================================
// FEE REMINDER JOB PROCESSOR
// ============================================

const processFeeReminder = async (job: Job<FeeReminderJob>) => {
  const jobLogger = createJobLogger(job.name, job.id!);
  const data = FeeReminderJobSchema.parse(job.data);

  jobLogger.info({ school: data.school_id, type: data.reminder_type }, 'Processing fee reminders');

  // Get school details
  const [school] = await query<{ name: string; sms_sender_id: string }>(
    'SELECT name, sms_sender_id FROM schools WHERE id = $1',
    [data.school_id]
  );

  // Build query based on reminder type
  let whereClause = '';
  let params: unknown[] = [data.school_id, data.term_id];

  switch (data.reminder_type) {
    case 'upcoming_due':
      whereClause = `sf.due_date BETWEEN NOW() AND NOW() + INTERVAL '${data.days_threshold} days'`;
      break;
    case 'overdue':
      whereClause = `sf.due_date < NOW() - INTERVAL '${data.days_threshold} days'`;
      break;
    case 'arrears':
      whereClause = `sf.brought_forward_amount > 0`;
      break;
  }

  // Get students with outstanding balances
  const students = await query<{
    student_id: string;
    first_name: string;
    admission_number: string;
    parent_phone: string;
    total_balance: number;
  }>(
    `SELECT 
      s.id as student_id,
      s.first_name,
      s.admission_number,
      s.parent_phone,
      SUM(sf.balance) as total_balance
    FROM student_fees sf
    JOIN students s ON s.id = sf.student_id
    WHERE sf.school_id = $1 
      AND sf.term_id = $2
      AND sf.balance > 0
      AND ${whereClause}
      AND s.parent_phone IS NOT NULL
    GROUP BY s.id, s.first_name, s.admission_number, s.parent_phone
    HAVING SUM(sf.balance) > 0`,
    params
  );

  jobLogger.info({ studentCount: students.length }, 'Found students for reminders');

  // Queue individual SMS jobs
  let queued = 0;
  for (const student of students) {
    const message = buildReminderMessage(
      data.reminder_type,
      school.name,
      student.first_name,
      student.admission_number,
      student.total_balance
    );

    await smsQueue.add(
      JobNames.SEND_SMS,
      {
        phone_number: student.parent_phone,
        message,
        student_id: student.student_id,
        school_id: data.school_id,
        reference_type: 'fee_reminder',
      },
      {
        delay: queued * 100, // Stagger SMS to avoid rate limits
      }
    );

    queued++;
  }

  // Log reminder batch
  await query(
    `INSERT INTO fee_reminder_logs (
      school_id, term_id, reminder_type, students_count, sent_at
    ) VALUES ($1, $2, $3, $4, NOW())`,
    [data.school_id, data.term_id, data.reminder_type, queued]
  );

  jobLogger.info({ queued }, 'Fee reminder SMS jobs queued');
  return { success: true, reminders_queued: queued };
};

const buildReminderMessage = (
  type: string,
  schoolName: string,
  studentName: string,
  admissionNo: string,
  balance: number
): string => {
  const formattedBalance = `KES ${balance.toLocaleString()}`;

  switch (type) {
    case 'upcoming_due':
      return `${schoolName}: Dear Parent, fee balance of ${formattedBalance} for ${studentName} (${admissionNo}) is due soon. Please pay to avoid late fees.`;
    case 'overdue':
      return `${schoolName}: Dear Parent, fee balance of ${formattedBalance} for ${studentName} (${admissionNo}) is overdue. Please make payment immediately.`;
    case 'arrears':
      return `${schoolName}: Dear Parent, ${studentName} (${admissionNo}) has an outstanding arrears balance of ${formattedBalance}. Please clear to avoid service interruption.`;
    default:
      return `${schoolName}: Fee reminder for ${studentName} (${admissionNo}). Balance: ${formattedBalance}.`;
  }
};

// ============================================
// BULK SMS PROCESSOR
// ============================================

const processBulkSms = async (job: Job<SendBulkSmsJob>) => {
  const jobLogger = createJobLogger(job.name, job.id!);
  const data = SendBulkSmsJobSchema.parse(job.data);

  jobLogger.info({ school: data.school_id }, 'Processing bulk SMS');

  // Build filter conditions
  let whereClause = 'WHERE s.school_id = $1 AND s.parent_phone IS NOT NULL';
  const params: unknown[] = [data.school_id];
  let paramIndex = 2;

  if (data.filters?.grade_id) {
    whereClause += ` AND s.grade_id = $${paramIndex++}`;
    params.push(data.filters.grade_id);
  }

  if (data.filters?.has_balance) {
    whereClause += ` AND EXISTS (
      SELECT 1 FROM student_fees sf 
      WHERE sf.student_id = s.id AND sf.balance > 0
    )`;
  }

  if (data.filters?.min_balance) {
    whereClause += ` AND (
      SELECT COALESCE(SUM(sf.balance), 0) FROM student_fees sf 
      WHERE sf.student_id = s.id
    ) >= $${paramIndex++}`;
    params.push(data.filters.min_balance);
  }

  const students = await query<{
    id: string;
    first_name: string;
    admission_number: string;
    parent_phone: string;
    balance: number;
  }>(
    `SELECT 
      s.id,
      s.first_name,
      s.admission_number,
      s.parent_phone,
      COALESCE((SELECT SUM(sf.balance) FROM student_fees sf WHERE sf.student_id = s.id), 0) as balance
    FROM students s
    ${whereClause}`,
    params
  );

  let queued = 0;
  for (const student of students) {
    // Replace template placeholders
    const message = data.template
      .replace('{student_name}', student.first_name)
      .replace('{admission_number}', student.admission_number)
      .replace('{balance}', `KES ${student.balance.toLocaleString()}`);

    await smsQueue.add(
      JobNames.SEND_SMS,
      {
        phone_number: student.parent_phone,
        message,
        student_id: student.id,
        school_id: data.school_id,
        reference_type: 'announcement',
      },
      { delay: queued * 100 }
    );

    queued++;
  }

  jobLogger.info({ queued }, 'Bulk SMS jobs queued');
  return { success: true, sms_queued: queued };
};

// ============================================
// WORKERS SETUP
// ============================================

export const smsWorker = new Worker(JobNames.SEND_SMS, processSendSms, {
  connection: redisConnection,
  concurrency: config.CONCURRENCY_NOTIFICATIONS,
  limiter: {
    max: 50,
    duration: 1000, // 50 SMS per second max
  },
});

export const feeReminderWorker = new Worker(JobNames.FEE_REMINDER, processFeeReminder, {
  connection: redisConnection,
  concurrency: 2,
});

export const bulkSmsWorker = new Worker(JobNames.SEND_BULK_SMS, processBulkSms, {
  connection: redisConnection,
  concurrency: 1,
});

// Error handlers
[smsWorker, feeReminderWorker, bulkSmsWorker].forEach((worker) => {
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, worker: worker.name, error: err.message }, 'Notification job failed');
  });

  worker.on('error', (err) => {
    logger.error({ worker: worker.name, error: err.message }, 'Notification worker error');
  });
});

export const startNotificationWorkers = () => {
  logger.info({ concurrency: config.CONCURRENCY_NOTIFICATIONS }, 'Notification workers started');
  return { smsWorker, feeReminderWorker, bulkSmsWorker };
};
