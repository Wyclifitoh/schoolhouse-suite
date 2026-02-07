import { redisConnection } from '../config';
import { logger } from '../config/logger';
import { JobNames } from '../types/jobs';
import { feeReminderQueue, termOperationsQueue } from '../queues';
import { query } from '../services/database';

// ============================================
// SCHEDULED JOBS CONFIGURATION
// ============================================

interface ScheduledJob {
  name: string;
  cron: string;
  handler: () => Promise<void>;
  description: string;
}

const scheduledJobs: ScheduledJob[] = [
  {
    name: 'cleanup-stale-transactions',
    cron: '*/15 * * * *', // Every 15 minutes
    description: 'Mark stale M-Pesa transactions that never received callbacks',
    handler: async () => {
      const result = await query(
        `UPDATE mpesa_transactions 
         SET status = 'stale', 
             failure_reason = 'No callback received within timeout period'
         WHERE status = 'processing' 
           AND initiated_at < NOW() - INTERVAL '30 minutes'
         RETURNING id`
      );
      logger.info({ count: result.length }, 'Marked stale transactions');
    },
  },
  {
    name: 'daily-fee-reminders',
    cron: '0 8 * * *', // Every day at 8 AM
    description: 'Send daily fee reminders for overdue balances',
    handler: async () => {
      // Get all schools with auto-reminders enabled
      const schools = await query<{ id: string; current_term_id: string }>(
        `SELECT id, current_term_id FROM schools 
         WHERE settings->>'auto_reminders_enabled' = 'true'`
      );

      for (const school of schools) {
        await feeReminderQueue.add(
          JobNames.FEE_REMINDER,
          {
            school_id: school.id,
            term_id: school.current_term_id,
            reminder_type: 'overdue',
            days_threshold: 7,
          },
          { jobId: `fee-reminder-${school.id}-${Date.now()}` }
        );
      }

      logger.info({ schoolCount: schools.length }, 'Queued daily fee reminders');
    },
  },
  {
    name: 'weekly-arrears-reminders',
    cron: '0 9 * * 1', // Every Monday at 9 AM
    description: 'Send weekly arrears reminders',
    handler: async () => {
      const schools = await query<{ id: string; current_term_id: string }>(
        `SELECT id, current_term_id FROM schools 
         WHERE settings->>'auto_reminders_enabled' = 'true'`
      );

      for (const school of schools) {
        await feeReminderQueue.add(
          JobNames.FEE_REMINDER,
          {
            school_id: school.id,
            term_id: school.current_term_id,
            reminder_type: 'arrears',
            days_threshold: 0,
          },
          { jobId: `arrears-reminder-${school.id}-${Date.now()}` }
        );
      }

      logger.info({ schoolCount: schools.length }, 'Queued weekly arrears reminders');
    },
  },
  {
    name: 'due-date-reminders',
    cron: '0 10 * * *', // Every day at 10 AM
    description: 'Send reminders for fees due within 3 days',
    handler: async () => {
      const schools = await query<{ id: string; current_term_id: string }>(
        `SELECT id, current_term_id FROM schools 
         WHERE settings->>'auto_reminders_enabled' = 'true'`
      );

      for (const school of schools) {
        await feeReminderQueue.add(
          JobNames.FEE_REMINDER,
          {
            school_id: school.id,
            term_id: school.current_term_id,
            reminder_type: 'upcoming_due',
            days_threshold: 3,
          },
          { jobId: `due-reminder-${school.id}-${Date.now()}` }
        );
      }

      logger.info({ schoolCount: schools.length }, 'Queued due date reminders');
    },
  },
  {
    name: 'cleanup-old-logs',
    cron: '0 2 * * 0', // Every Sunday at 2 AM
    description: 'Archive old audit logs and SMS logs',
    handler: async () => {
      // Move logs older than 90 days to archive table
      await query(
        `WITH archived AS (
          DELETE FROM sms_logs 
          WHERE created_at < NOW() - INTERVAL '90 days'
          RETURNING *
        )
        INSERT INTO sms_logs_archive SELECT * FROM archived`
      );

      logger.info('Archived old SMS logs');
    },
  },
  {
    name: 'generate-daily-summary',
    cron: '0 23 * * *', // Every day at 11 PM
    description: 'Generate daily collection summary for each school',
    handler: async () => {
      const schools = await query<{ id: string }>(
        `SELECT id FROM schools WHERE is_active = true`
      );

      for (const school of schools) {
        // Calculate daily totals
        const [summary] = await query<{
          total_collected: number;
          payment_count: number;
          mpesa_amount: number;
          cash_amount: number;
          bank_amount: number;
        }>(
          `SELECT 
            COALESCE(SUM(amount), 0) as total_collected,
            COUNT(*) as payment_count,
            COALESCE(SUM(CASE WHEN payment_method LIKE 'mpesa%' THEN amount ELSE 0 END), 0) as mpesa_amount,
            COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash_amount,
            COALESCE(SUM(CASE WHEN payment_method = 'bank' THEN amount ELSE 0 END), 0) as bank_amount
          FROM payments 
          WHERE school_id = $1 
            AND received_at::date = CURRENT_DATE
            AND status = 'completed'`,
          [school.id]
        );

        // Store daily summary
        await query(
          `INSERT INTO daily_summaries (
            school_id, summary_date, total_collected, payment_count,
            mpesa_amount, cash_amount, bank_amount
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
          ON CONFLICT (school_id, summary_date) 
          DO UPDATE SET 
            total_collected = $2,
            payment_count = $3,
            mpesa_amount = $4,
            cash_amount = $5,
            bank_amount = $6`,
          [
            school.id,
            summary.total_collected,
            summary.payment_count,
            summary.mpesa_amount,
            summary.cash_amount,
            summary.bank_amount,
          ]
        );
      }

      logger.info({ schoolCount: schools.length }, 'Generated daily summaries');
    },
  },
];

// ============================================
// SCHEDULER USING BULLMQ REPEATABLE JOBS
// ============================================

export const initializeScheduler = async (): Promise<void> => {
  logger.info('Initializing scheduler...');

  // Use a dedicated scheduler queue
  const { Queue } = await import('bullmq');

  for (const job of scheduledJobs) {
    const schedulerQueue = new Queue(`scheduler-${job.name}`, {
      connection: redisConnection,
    });

    // Remove existing repeatable jobs first
    const existingJobs = await schedulerQueue.getRepeatableJobs();
    for (const existing of existingJobs) {
      await schedulerQueue.removeRepeatableByKey(existing.key);
    }

    // Add repeatable job
    await schedulerQueue.add(
      job.name,
      {},
      {
        repeat: { pattern: job.cron },
        jobId: job.name,
      }
    );

    // Create worker for this scheduled job
    const { Worker: BullWorker } = await import('bullmq');
    const worker = new BullWorker(
      `scheduler-${job.name}`,
      async () => {
        logger.info({ job: job.name }, 'Executing scheduled job');
        try {
          await job.handler();
          logger.info({ job: job.name }, 'Scheduled job completed');
        } catch (error) {
          logger.error({ job: job.name, error: (error as Error).message }, 'Scheduled job failed');
          throw error;
        }
      },
      { connection: redisConnection, concurrency: 1 }
    );

    worker.on('error', (err) => {
      logger.error({ job: job.name, error: err.message }, 'Scheduler worker error');
    });

    logger.info({ job: job.name, cron: job.cron }, 'Registered scheduled job');
  }

  logger.info({ count: scheduledJobs.length }, 'Scheduler initialized');
};

export const getScheduledJobs = () => scheduledJobs.map((j) => ({
  name: j.name,
  cron: j.cron,
  description: j.description,
}));
