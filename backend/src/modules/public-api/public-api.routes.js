const router = require("express").Router();
const apiKeys = require("../api-keys/api-keys.repository");
const paymentsRepo = require("../payments/payments.repository");
const { queryOne } = require("../../config/database");

// Authenticate every request via X-API-Key header.
router.use(async (req, res, next) => {
  const key = req.header("X-API-Key") || req.header("x-api-key");
  if (!key) {
    return res.status(401).json({
      success: false,
      error: { code: "missing_api_key", message: "X-API-Key header required" },
    });
  }
  const record = await apiKeys.findByKey(key);
  if (!record) {
    return res.status(401).json({
      success: false,
      error: { code: "invalid_api_key", message: "Invalid or revoked API key" },
    });
  }
  req.apiKey = record;
  req.schoolId = record.school_id;
  apiKeys.touch(record.id);
  next();
});

const logged = (handler) => async (req, res) => {
  const start = Date.now();
  let payload = null;
  let status = 500;
  try {
    const result = await handler(req);
    status = result.status || 200;
    payload = result.body;
    res.status(status).json(payload);
  } catch (e) {
    status = e.statusCode || 500;
    payload = {
      success: false,
      error: { code: e.code || "error", message: e.message },
    };
    res.status(status).json(payload);
  } finally {
    apiKeys.logRequest({
      apiKeyId: req.apiKey?.id,
      schoolId: req.schoolId,
      method: req.method,
      path: req.originalUrl,
      idempotencyKey: req.header("Idempotency-Key") || req.body?.txn_id || null,
      requestBody: req.body,
      responseStatus: status,
      responseBody: payload,
      ipAddress: req.ip,
      durationMs: Date.now() - start,
    });
  }
};

const validatePayment = (body) => {
  const errors = [];
  if (!body || typeof body !== "object") return ["body required"];
  if (!body.amount || Number(body.amount) <= 0)
    errors.push("amount must be > 0");
  if (!body.txn_id) errors.push("txn_id required for idempotency");
  if (!body.admission_number && !body.student_id)
    errors.push("admission_number or student_id required");
  if (!body.payment_method) errors.push("payment_method required");
  return errors;
};

router.post(
  "/payments",
  logged(async (req) => {
    const errs = validatePayment(req.body);
    if (errs.length)
      return {
        status: 400,
        body: {
          success: false,
          error: { code: "validation_error", message: errs.join("; ") },
        },
      };
    const b = req.body;

    const methodMap = {
      mpesa: "mpesa_c2b",
      mpesa_c2b: "mpesa_c2b",
      mpesa_stk: "mpesa_stk",
      bank_transfer: "bank",
      bank: "bank",
      cash: "cash",
      cheque: "cheque",
      card: "card",
    };

    const result = await paymentsRepo.recordPaymentWithAllocation({
      schoolId: req.schoolId,
      studentId: b.student_id || null,
      admissionNumber: b.admission_number || null,
      amount: Number(b.amount),
      paymentMethod: methodMap[b.payment_method] || b.payment_method,
      referenceNumber: b.reference || b.txn_id,
      ledgerType: "fees",
      payerPhone: b.payer_phone || null,
      notes: [
        b.payer_name && `Payer: ${b.payer_name}`,
        b.bank && `Bank: ${b.bank}`,
        b.currency && `Currency: ${b.currency}`,
        b.metadata && `Meta: ${JSON.stringify(b.metadata).slice(0, 200)}`,
      ]
        .filter(Boolean)
        .join(" | "),
      feeIds: [],
      idempotencyKey: `${b.txn_id}`,
    });

    return {
      status: result.idempotent_replay ? 200 : 201,
      body: {
        success: true,
        data: {
          payment_id: result.payment?.id,
          receipt_number: result.payment?.receipt_number || null,
          status: result.status,
          allocations: result.allocations,
          excess: result.excess,
          idempotent_replay: !!result.idempotent_replay,
        },
      },
    };
  }),
);

router.get(
  "/payments/:reference",
  logged(async (req) => {
    const ref = req.params.reference;
    const payment = await queryOne(
      `SELECT id, school_id, student_id, amount, payment_method, reference_number,
            receipt_number, status, received_at, payer_phone, notes
       FROM payments
      WHERE school_id = ?
        AND (reference_number = ? OR id = ? OR receipt_number = ?)
      ORDER BY received_at DESC LIMIT 1`,
      [req.schoolId, ref, ref, ref],
    );
    if (!payment)
      return {
        status: 404,
        body: {
          success: false,
          error: { code: "not_found", message: "Payment not found" },
        },
      };
    return { status: 200, body: { success: true, data: payment } };
  }),
);

module.exports = router;
