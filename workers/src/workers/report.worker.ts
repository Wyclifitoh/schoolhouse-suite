import { Worker, Job } from 'bullmq';
import puppeteer from 'puppeteer';
import { redisConnection, config } from '../config';
import { createJobLogger, logger } from '../config/logger';
import {
  JobNames,
  GenerateReceiptPdfJob,
  GenerateReceiptPdfJobSchema,
  GenerateStatementJob,
  GenerateStatementJobSchema,
  GenerateBulkReportJob,
  GenerateBulkReportJobSchema,
} from '../types/jobs';
import { query } from '../services/database';

// ============================================
// PDF GENERATION UTILITIES
// ============================================

interface PdfGenerationResult {
  success: boolean;
  url?: string;
  error?: string;
}

const generatePdfFromHtml = async (html: string, filename: string): Promise<PdfGenerationResult> => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    // Upload to S3 (if configured)
    if (config.AWS_ACCESS_KEY_ID && config.AWS_S3_BUCKET) {
      const url = await uploadToS3(pdfBuffer, filename);
      return { success: true, url };
    }

    // Fallback: store locally or in database
    return { success: true, url: `local://${filename}` };

  } catch (error) {
    return { success: false, error: (error as Error).message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const uploadToS3 = async (buffer: Buffer, filename: string): Promise<string> => {
  // Note: In production, use AWS SDK v3
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    region: config.AWS_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID!,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const key = `reports/${new Date().toISOString().slice(0, 10)}/${filename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    })
  );

  return `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
};

// ============================================
// RECEIPT PDF GENERATOR
// ============================================

const processReceiptPdf = async (job: Job<GenerateReceiptPdfJob>) => {
  const jobLogger = createJobLogger(job.name, job.id!);
  const data = GenerateReceiptPdfJobSchema.parse(job.data);

  jobLogger.info({ receiptNumber: data.receipt_number }, 'Generating receipt PDF');

  // Get receipt data
  const [receiptData] = await query<{
    receipt_number: string;
    amount: number;
    payment_method: string;
    received_at: string;
    student_name: string;
    admission_number: string;
    grade_name: string;
    school_name: string;
    school_address: string;
    school_logo: string;
    allocations: string;
  }>(
    `SELECT 
      r.receipt_number,
      p.amount,
      p.payment_method,
      p.received_at,
      CONCAT(s.first_name, ' ', s.last_name) as student_name,
      s.admission_number,
      g.name as grade_name,
      sch.name as school_name,
      sch.address as school_address,
      sch.logo_url as school_logo,
      (
        SELECT json_agg(json_build_object(
          'fee_name', ft.name,
          'amount', pa.amount
        ))
        FROM payment_allocations pa
        JOIN student_fees sf ON sf.id = pa.student_fee_id
        JOIN fee_templates ft ON ft.id = sf.fee_template_id
        WHERE pa.payment_id = p.id
      ) as allocations
    FROM receipts r
    JOIN payments p ON p.id = r.payment_id
    JOIN students s ON s.id = p.student_id
    JOIN grades g ON g.id = s.grade_id
    JOIN schools sch ON sch.id = p.school_id
    WHERE r.receipt_number = $1 AND r.school_id = $2`,
    [data.receipt_number, data.school_id]
  );

  if (!receiptData) {
    throw new Error(`Receipt not found: ${data.receipt_number}`);
  }

  // Generate HTML
  const html = generateReceiptHtml(receiptData);
  const filename = `receipt_${data.receipt_number}.pdf`;

  const result = await generatePdfFromHtml(html, filename);

  if (!result.success) {
    throw new Error(`PDF generation failed: ${result.error}`);
  }

  // Update receipt with PDF URL
  await query(
    `UPDATE receipts SET pdf_url = $1, generated_at = NOW() WHERE receipt_number = $2`,
    [result.url, data.receipt_number]
  );

  jobLogger.info({ url: result.url }, 'Receipt PDF generated');
  return result;
};

const generateReceiptHtml = (data: Record<string, unknown>): string => {
  const allocations = JSON.parse(data.allocations as string || '[]');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 100px; margin-bottom: 10px; }
        .school-name { font-size: 24px; font-weight: bold; }
        .receipt-title { font-size: 18px; color: #666; margin-top: 10px; }
        .receipt-number { font-size: 14px; color: #999; }
        .details { margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; }
        .value { font-weight: 500; }
        .allocations { margin: 20px 0; }
        .allocation-item { padding: 8px 0; border-bottom: 1px solid #eee; }
        .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${data.school_logo ? `<img src="${data.school_logo}" class="logo" />` : ''}
        <div class="school-name">${data.school_name}</div>
        <div>${data.school_address || ''}</div>
        <div class="receipt-title">PAYMENT RECEIPT</div>
        <div class="receipt-number">${data.receipt_number}</div>
      </div>

      <div class="details">
        <div class="row">
          <span class="label">Student Name:</span>
          <span class="value">${data.student_name}</span>
        </div>
        <div class="row">
          <span class="label">Admission No:</span>
          <span class="value">${data.admission_number}</span>
        </div>
        <div class="row">
          <span class="label">Grade/Class:</span>
          <span class="value">${data.grade_name}</span>
        </div>
        <div class="row">
          <span class="label">Payment Method:</span>
          <span class="value">${data.payment_method}</span>
        </div>
        <div class="row">
          <span class="label">Date:</span>
          <span class="value">${new Date(data.received_at as string).toLocaleDateString()}</span>
        </div>
      </div>

      <div class="allocations">
        <h4>Fee Allocations:</h4>
        ${allocations.map((a: { fee_name: string; amount: number }) => `
          <div class="allocation-item">
            <span>${a.fee_name}</span>
            <span style="float: right">KES ${a.amount.toLocaleString()}</span>
          </div>
        `).join('')}
      </div>

      <div class="total">
        Total: KES ${(data.amount as number).toLocaleString()}
      </div>

      <div class="footer">
        <p>Thank you for your payment.</p>
        <p>This is a computer-generated receipt.</p>
      </div>
    </body>
    </html>
  `;
};

// ============================================
// STATEMENT GENERATOR
// ============================================

const processStatement = async (job: Job<GenerateStatementJob>) => {
  const jobLogger = createJobLogger(job.name, job.id!);
  const data = GenerateStatementJobSchema.parse(job.data);

  jobLogger.info({ studentId: data.student_id }, 'Generating statement');

  // Get transactions
  const transactions = await query<{
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }>(
    `SELECT * FROM get_student_statement($1, $2, $3)`,
    [data.student_id, data.from_date, data.to_date]
  );

  // Get student info
  const [student] = await query<{
    first_name: string;
    last_name: string;
    admission_number: string;
    grade_name: string;
    school_name: string;
  }>(
    `SELECT 
      s.first_name, s.last_name, s.admission_number,
      g.name as grade_name, sch.name as school_name
    FROM students s
    JOIN grades g ON g.id = s.grade_id
    JOIN schools sch ON sch.id = s.school_id
    WHERE s.id = $1`,
    [data.student_id]
  );

  const html = generateStatementHtml(student, transactions, data.from_date, data.to_date);
  const filename = `statement_${student.admission_number}_${data.from_date}_${data.to_date}.pdf`;

  const result = await generatePdfFromHtml(html, filename);

  if (!result.success) {
    throw new Error(`Statement generation failed: ${result.error}`);
  }

  // Store statement record
  await query(
    `INSERT INTO generated_reports (
      school_id, report_type, student_id, pdf_url, generated_by, generated_at
    ) VALUES ($1, 'statement', $2, $3, $4, NOW())`,
    [data.school_id, data.student_id, result.url, data.requested_by]
  );

  jobLogger.info({ url: result.url }, 'Statement generated');
  return result;
};

const generateStatementHtml = (
  student: Record<string, string>,
  transactions: Array<Record<string, unknown>>,
  fromDate: string,
  toDate: string
): string => {
  let runningBalance = 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
        .header { margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; }
        .student-info { margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .debit { color: #c00; }
        .credit { color: #0a0; }
        .balance { font-weight: bold; }
        .footer { margin-top: 30px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${student.school_name} - Fee Statement</div>
        <div>Period: ${fromDate} to ${toDate}</div>
      </div>

      <div class="student-info">
        <div><strong>Student:</strong> ${student.first_name} ${student.last_name}</div>
        <div><strong>Admission No:</strong> ${student.admission_number}</div>
        <div><strong>Grade:</strong> ${student.grade_name}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Debit (KES)</th>
            <th>Credit (KES)</th>
            <th>Balance (KES)</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map((t) => {
            runningBalance = t.balance as number;
            return `
              <tr>
                <td>${new Date(t.date as string).toLocaleDateString()}</td>
                <td>${t.description}</td>
                <td class="debit">${(t.debit as number) > 0 ? (t.debit as number).toLocaleString() : ''}</td>
                <td class="credit">${(t.credit as number) > 0 ? (t.credit as number).toLocaleString() : ''}</td>
                <td class="balance">${(t.balance as number).toLocaleString()}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div style="margin-top: 20px; font-size: 14px;">
        <strong>Current Balance: KES ${runningBalance.toLocaleString()}</strong>
      </div>

      <div class="footer">
        Generated on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;
};

// ============================================
// BULK REPORT GENERATOR
// ============================================

const processBulkReport = async (job: Job<GenerateBulkReportJob>) => {
  const jobLogger = createJobLogger(job.name, job.id!);
  const data = GenerateBulkReportJobSchema.parse(job.data);

  jobLogger.info({ reportType: data.report_type }, 'Generating bulk report');

  let reportData: unknown[];
  let html: string;
  const filename = `${data.report_type}_${new Date().toISOString().slice(0, 10)}.pdf`;

  switch (data.report_type) {
    case 'fee_collection':
      reportData = await query(
        `SELECT * FROM generate_fee_collection_report($1, $2)`,
        [data.school_id, data.term_id]
      );
      html = generateFeeCollectionHtml(reportData);
      break;

    case 'arrears':
      reportData = await query(
        `SELECT * FROM generate_arrears_report($1, $2)`,
        [data.school_id, data.term_id]
      );
      html = generateArrearsHtml(reportData);
      break;

    case 'student_balances':
      reportData = await query(
        `SELECT 
          s.admission_number, 
          CONCAT(s.first_name, ' ', s.last_name) as name,
          g.name as grade,
          COALESCE(SUM(sf.balance), 0) as balance
        FROM students s
        JOIN grades g ON g.id = s.grade_id
        LEFT JOIN student_fees sf ON sf.student_id = s.id
        WHERE s.school_id = $1
        GROUP BY s.id, s.admission_number, s.first_name, s.last_name, g.name
        ORDER BY balance DESC`,
        [data.school_id]
      );
      html = generateBalancesHtml(reportData);
      break;

    default:
      throw new Error(`Unknown report type: ${data.report_type}`);
  }

  const result = await generatePdfFromHtml(html, filename);

  if (!result.success) {
    throw new Error(`Report generation failed: ${result.error}`);
  }

  // Store report record
  await query(
    `INSERT INTO generated_reports (
      school_id, report_type, pdf_url, filters, generated_by, generated_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())`,
    [data.school_id, data.report_type, result.url, JSON.stringify(data.filters || {}), data.requested_by]
  );

  jobLogger.info({ url: result.url }, 'Bulk report generated');
  return result;
};

const generateFeeCollectionHtml = (data: unknown[]): string => {
  return `<html><body><h1>Fee Collection Report</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
};

const generateArrearsHtml = (data: unknown[]): string => {
  return `<html><body><h1>Arrears Report</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
};

const generateBalancesHtml = (data: unknown[]): string => {
  return `<html><body><h1>Student Balances Report</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
};

// ============================================
// WORKERS SETUP
// ============================================

export const receiptPdfWorker = new Worker(JobNames.GENERATE_RECEIPT_PDF, processReceiptPdf, {
  connection: redisConnection,
  concurrency: config.CONCURRENCY_REPORTS,
});

export const statementWorker = new Worker(JobNames.GENERATE_STATEMENT, processStatement, {
  connection: redisConnection,
  concurrency: config.CONCURRENCY_REPORTS,
});

export const bulkReportWorker = new Worker(JobNames.GENERATE_BULK_REPORT, processBulkReport, {
  connection: redisConnection,
  concurrency: 1, // Only one bulk report at a time
});

[receiptPdfWorker, statementWorker, bulkReportWorker].forEach((worker) => {
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, worker: worker.name, error: err.message }, 'Report job failed');
  });

  worker.on('error', (err) => {
    logger.error({ worker: worker.name, error: err.message }, 'Report worker error');
  });
});

export const startReportWorkers = () => {
  logger.info({ concurrency: config.CONCURRENCY_REPORTS }, 'Report workers started');
  return { receiptPdfWorker, statementWorker, bulkReportWorker };
};
