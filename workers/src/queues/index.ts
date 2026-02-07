import { Queue, QueueEvents } from 'bullmq';
import { redisConnection } from '../config';
import { JobNames } from '../types/jobs';
import { logger } from '../config/logger';

// ============================================
// QUEUE DEFINITIONS
// ============================================

export const paymentQueue = new Queue(JobNames.ALLOCATE_PAYMENT, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const reconciliationQueue = new Queue(JobNames.RECONCILE_PAYMENT, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});

export const smsQueue = new Queue(JobNames.SEND_SMS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 5000 },
    removeOnFail: { count: 2000 },
  },
});

export const bulkSmsQueue = new Queue(JobNames.SEND_BULK_SMS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

export const feeReminderQueue = new Queue(JobNames.FEE_REMINDER, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 60000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

export const receiptPdfQueue = new Queue(JobNames.GENERATE_RECEIPT_PDF, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 2000 },
    removeOnFail: { count: 500 },
  },
});

export const reportQueue = new Queue(JobNames.GENERATE_BULK_REPORT, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

export const termOperationsQueue = new Queue(JobNames.TERM_TRANSITION, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1, // Critical operations - no auto retry
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 50 },
  },
});

// ============================================
// QUEUE EVENTS FOR MONITORING
// ============================================

const setupQueueEvents = (queue: Queue, queueName: string) => {
  const events = new QueueEvents(queueName, { connection: redisConnection });

  events.on('completed', ({ jobId }) => {
    logger.debug({ jobId, queue: queueName }, 'Job completed');
  });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, queue: queueName, error: failedReason }, 'Job failed');
  });

  events.on('stalled', ({ jobId }) => {
    logger.warn({ jobId, queue: queueName }, 'Job stalled');
  });

  return events;
};

export const paymentQueueEvents = setupQueueEvents(paymentQueue, JobNames.ALLOCATE_PAYMENT);
export const smsQueueEvents = setupQueueEvents(smsQueue, JobNames.SEND_SMS);
export const reportQueueEvents = setupQueueEvents(reportQueue, JobNames.GENERATE_BULK_REPORT);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

export const closeAllQueues = async () => {
  logger.info('Closing all queues...');
  await Promise.all([
    paymentQueue.close(),
    reconciliationQueue.close(),
    smsQueue.close(),
    bulkSmsQueue.close(),
    feeReminderQueue.close(),
    receiptPdfQueue.close(),
    reportQueue.close(),
    termOperationsQueue.close(),
  ]);
  logger.info('All queues closed');
};
