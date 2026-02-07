import { logger } from './config/logger';
import { closeAllQueues } from './queues';
import { closePool } from './services/database';
import { startPaymentWorker } from './workers/payment.worker';
import { startNotificationWorkers } from './workers/notification.worker';
import { startReportWorkers } from './workers/report.worker';
import { initializeScheduler, getScheduledJobs } from './scheduler';

// ============================================
// MAIN ENTRY POINT
// ============================================

async function main() {
  logger.info('Starting CHUO Workers...');

  try {
    // Start all workers
    const paymentWorker = startPaymentWorker();
    const notificationWorkers = startNotificationWorkers();
    const reportWorkers = startReportWorkers();

    logger.info({
      workers: {
        payment: paymentWorker.name,
        sms: notificationWorkers.smsWorker.name,
        feeReminder: notificationWorkers.feeReminderWorker.name,
        bulkSms: notificationWorkers.bulkSmsWorker.name,
        receiptPdf: reportWorkers.receiptPdfWorker.name,
        statement: reportWorkers.statementWorker.name,
        bulkReport: reportWorkers.bulkReportWorker.name,
      },
    }, 'All workers started');

    // Initialize scheduler
    await initializeScheduler();
    const scheduledJobs = getScheduledJobs();
    logger.info({ scheduledJobs }, 'Scheduled jobs registered');

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');

      try {
        // Close workers
        await Promise.all([
          paymentWorker.close(),
          notificationWorkers.smsWorker.close(),
          notificationWorkers.feeReminderWorker.close(),
          notificationWorkers.bulkSmsWorker.close(),
          reportWorkers.receiptPdfWorker.close(),
          reportWorkers.statementWorker.close(),
          reportWorkers.bulkReportWorker.close(),
        ]);
        logger.info('All workers closed');

        // Close queues
        await closeAllQueues();

        // Close database pool
        await closePool();

        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Keep process alive
    logger.info('Workers running. Press Ctrl+C to stop.');

  } catch (error) {
    logger.error({ error }, 'Failed to start workers');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error({ error }, 'Unhandled error');
  process.exit(1);
});
