# CHUO Workers (BullMQ)

Node.js-based background job workers for heavy processing tasks.

## Why BullMQ?

- **Production-grade reliability**: Built-in retry mechanisms, delayed jobs, rate limiting
- **Redis-backed persistence**: Jobs survive restarts
- **Concurrency control**: Fine-grained control over parallel processing
- **Monitoring**: Built-in job status tracking and events

## Architecture

```
workers/
├── src/
│   ├── config/           # Configuration and environment
│   │   ├── index.ts      # Config validation with Zod
│   │   └── logger.ts     # Pino logger setup
│   ├── queues/           # Queue definitions
│   │   └── index.ts      # All queue configurations
│   ├── workers/          # Job processors
│   │   ├── payment.worker.ts       # Payment allocation FIFO
│   │   ├── notification.worker.ts  # SMS, fee reminders
│   │   └── report.worker.ts        # PDF generation (Puppeteer)
│   ├── scheduler/        # Cron-based scheduled jobs
│   │   └── index.ts      # Scheduled task definitions
│   ├── services/         # Shared services
│   │   └── database.ts   # PostgreSQL client + utilities
│   ├── types/            # TypeScript types
│   │   └── jobs.ts       # Job payload schemas (Zod)
│   └── index.ts          # Main entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Job Types

### Payment Jobs
- `allocate-payment`: FIFO allocation after M-Pesa confirmation
- `reconcile-payment`: Match unidentified payments to students
- `cleanup-stale-transactions`: Mark expired pending transactions

### Notification Jobs
- `send-sms`: Individual SMS via Africa's Talking
- `send-bulk-sms`: Batch SMS with templating
- `fee-reminder`: Targeted reminders (overdue, upcoming, arrears)

### Report Jobs
- `generate-receipt-pdf`: Receipt PDF via Puppeteer
- `generate-statement`: Student statement PDF
- `generate-bulk-report`: Collection/arrears reports

### Scheduled Jobs
- Stale transaction cleanup (every 15 min)
- Daily fee reminders (8 AM)
- Weekly arrears reminders (Monday 9 AM)
- Due date reminders (daily 10 AM)
- Daily summary generation (11 PM)
- Archive old logs (weekly)

## Deployment

### Prerequisites
- Node.js 18+
- Redis 7+
- PostgreSQL 15+

### Installation

```bash
cd workers
npm install
```

### Development

```bash
# Run all workers
npm run dev

# Run individual workers
npm run worker:payments
npm run worker:notifications
npm run worker:reports

# Run scheduler only
npm run scheduler
```

### Production

```bash
npm run build
npm start
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## Integration with Edge Functions

Edge Functions handle lightweight, latency-sensitive tasks:
- M-Pesa callback webhooks
- STK Push initiation
- Manual payment recording

Workers handle heavy processing:
- PDF generation (Puppeteer)
- Bulk SMS sending
- Report generation
- Scheduled maintenance tasks

### Triggering Workers from Edge Functions

```typescript
// In Edge Function
const { Queue } = await import('bullmq');

const paymentQueue = new Queue('allocate-payment', {
  connection: { host: 'redis-host', port: 6379 }
});

await paymentQueue.add('allocate-payment', {
  mpesa_transaction_id: transaction.id
});
```

## Monitoring

Use BullMQ Dashboard or custom monitoring:

```typescript
import { Queue } from 'bullmq';

const queue = new Queue('allocate-payment');
const counts = await queue.getJobCounts();
console.log(counts); // { waiting: 5, active: 2, completed: 100, failed: 1 }
```
