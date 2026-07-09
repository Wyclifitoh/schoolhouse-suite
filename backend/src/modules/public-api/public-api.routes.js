const router = require("express").Router();
const apiKeys = require("../api-keys/api-keys.repository");
const paymentsRepo = require("../payments/payments.repository");
const { queryOne } = require("../../config/database");
const { sendSms } = require("../../utils/notifier");

// ---------------------------------------------------------------------------
// BANK-COMPATIBLE PUBLIC ENDPOINT (mounted BEFORE X-API-Key middleware)
//
// POST /api/v1/public/v1/payments
//
// Accepts both the new and legacy PHP payloads seamlessly:
//   Transaction ID : PaymentReference | TransID
//   Reference No.  : ReferenceNumber  | BillRefNumber
//   Amount         : PaymentAmount    | TransAmount
//   Narration      : PaymentNarration | TransactionNarration
//
// The admission number is extracted from the narration using the format
// "TransactionCode/AdmissionNumber" — split on the FIRST "/" only.
//
// Business rule: money must never disappear. Every request that reaches the
// endpoint is persisted. If the admission number cannot be matched the
// payment is stored as "unallocated" and still returned as HTTP 201/200 to
// the bank so they do not retry.
// ---------------------------------------------------------------------------

const pick = (obj, keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      return obj[k];
    }
  }
  return null;
};

const extractAdmission = (narration) => {
  if (!narration || typeof narration !== "string") return null;
  const idx = narration.indexOf("/");
  if (idx === -1) return null;
  const admission = narration.slice(idx + 1).trim();
  return admission || null;
};

const resolveBankSchoolId = async (req) => {
  // 1. If bank happens to pass X-API-Key, use it (multi-tenant).
  const key = req.header("X-API-Key") || req.header("x-api-key");
  if (key) {
    const record = await apiKeys.findByKey(key);
    if (record) {
      apiKeys.touch(record.id);
      return { schoolId: record.school_id, apiKeyId: record.id };
    }
  }
  // 2. Fall back to configured default school for this deployment.
  const envSchool = process.env.BANK_PAYMENT_SCHOOL_ID;
  if (envSchool) return { schoolId: envSchool, apiKeyId: null };
  // 3. Single-tenant convenience: if only one school exists, use it.
  const row = await queryOne(
    "SELECT id FROM schools ORDER BY created_at ASC LIMIT 2",
  );
  if (row) return { schoolId: row.id, apiKeyId: null };
  return { schoolId: null, apiKeyId: null };
};

const findTemplate = async (schoolId) => {
  try {
    return await queryOne(
      `SELECT body FROM sms_templates
        WHERE school_id = ?
          AND is_active = 1
          AND (category = 'payment_notification' OR LOWER(name) LIKE '%payment%')
        ORDER BY category = 'payment_notification' DESC, updated_at DESC
        LIMIT 1`,
      [schoolId],
    );
  } catch {
    return null;
  }
};

const renderTemplate = (body, vars) =>
  body.replace(/\{\s*(\w+)\s*\}/g, (_, k) =>
    vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : "",
  );

const sendAllocationSms = async ({ schoolId, payment, allocations }) => {
  try {
    const student = await queryOne(
      `SELECT s.id, s.full_name, s.parent_phone,
              (SELECT p.phone FROM student_parents sp
                 JOIN parents p ON p.id = sp.parent_id
                WHERE sp.student_id = s.id
                ORDER BY sp.is_primary_contact DESC, sp.created_at ASC LIMIT 1) AS linked_phone
         FROM students s WHERE s.id = ?`,
      [payment.student_id],
    );
    const phone = student?.linked_phone || student?.parent_phone;
    if (!phone) return { ok: false, skipped: true, reason: "no_phone" };

    const school = await queryOne("SELECT name FROM schools WHERE id = ?", [
      schoolId,
    ]);
    const balanceRow = await queryOne(
      `SELECT COALESCE(SUM(GREATEST(amount_due + IFNULL(brought_forward_amount,0)
                - IFNULL(brought_forward_credit,0) - amount_paid, 0)), 0) AS balance
         FROM student_fees
        WHERE student_id = ? AND status NOT IN ('cancelled','waived')`,
      [payment.student_id],
    );
    const balance = Number(balanceRow?.balance || 0);
    const amount = Number(payment.amount || 0);

    const vars = {
      StudentName: student.full_name,
      Amount: amount.toLocaleString(),
      ReceiptNumber: payment.receipt_number || payment.reference_number || "-",
      Balance: balance.toLocaleString(),
      SchoolName: school?.name || "",
    };

    const tpl = await findTemplate(schoolId);
    const message = tpl?.body
      ? renderTemplate(tpl.body, vars)
      : `Dear Parent,\n\nWe have received KES ${vars.Amount} towards ${vars.StudentName}'s school fees.\n\nReceipt Number: ${vars.ReceiptNumber}\nCurrent Fee Balance: KES ${vars.Balance}\n\nThank you for your payment.\n\n${vars.SchoolName || "The Eagles Way School"}`;

    return await sendSms({ to: phone, message });
  } catch (e) {
    console.error("[bank-payment] sms failed:", e.message);
    return { ok: false, error: e.message };
  }
};

router.post("/v1/payments", async (req, res) => {
  const start = Date.now();
  const body = req.body || {};
  console.log("[bank-payment] incoming", JSON.stringify(body));

  const transactionId = pick(body, [
    "PaymentReference",
    "TransID",
    "payment_reference",
    "trans_id",
  ]);
  const bankRef = pick(body, [
    "ReferenceNumber",
    "BillRefNumber",
    "reference_number",
    "bill_ref_number",
  ]);
  const amountRaw = pick(body, [
    "PaymentAmount",
    "TransAmount",
    "payment_amount",
    "trans_amount",
    "amount",
  ]);
  const narration = pick(body, [
    "PaymentNarration",
    "TransactionNarration",
    "payment_narration",
    "narration",
  ]);
  const payerPhone = pick(body, [
    "PayerPhone",
    "MSISDN",
    "payer_phone",
    "phone",
  ]);

  const amount = Number(amountRaw);
  const admissionNumber = extractAdmission(narration);

  const parsed = {
    transactionId,
    bankRef,
    amount,
    narration,
    admissionNumber,
    payerPhone,
  };
  console.log("[bank-payment] parsed", parsed);

  // Only reject if we truly cannot record the payment.
  if (!transactionId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "missing_transaction_id",
        message: "PaymentReference or TransID is required",
      },
    });
  }
  if (!amount || amount <= 0 || Number.isNaN(amount)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "invalid_amount",
        message: "PaymentAmount or TransAmount must be a positive number",
      },
    });
  }

  const { schoolId, apiKeyId } = await resolveBankSchoolId(req);
  if (!schoolId) {
    return res.status(500).json({
      success: false,
      error: {
        code: "school_not_configured",
        message:
          "No school is configured for bank payments. Set BANK_PAYMENT_SCHOOL_ID.",
      },
    });
  }

  let responseStatus = 500;
  let responseBody = null;
  try {
    const result = await paymentsRepo.recordPaymentWithAllocation({
      schoolId,
      studentId: null,
      admissionNumber, // may be null / invalid — repo will mark unallocated
      amount,
      paymentMethod: "bank", // always
      referenceNumber: bankRef || transactionId,
      ledgerType: "fees",
      payerPhone,
      notes: [
        `TxnId: ${transactionId}`,
        narration && `Narration: ${narration}`,
        bankRef && `BankRef: ${bankRef}`,
        admissionNumber && `ExtractedAdmission: ${admissionNumber}`,
      ]
        .filter(Boolean)
        .join(" | "),
      idempotencyKey: String(transactionId),
    });

    // Fire-and-forget SMS on successful allocation (never blocks response)
    if (result.status === "completed" && result.payment?.student_id) {
      sendAllocationSms({
        schoolId,
        payment: result.payment,
        allocations: result.allocations,
      })
        .then((r) => console.log("[bank-payment] sms result", r))
        .catch((e) => console.error("[bank-payment] sms error", e.message));
    }

    responseStatus = result.idempotent_replay ? 200 : 201;
    responseBody = {
      success: true,
      data: {
        payment_id: result.payment?.id,
        receipt_number: result.payment?.receipt_number || null,
        status: result.status, // "completed" | "unallocated"
        allocated: result.status === "completed",
        admission_number_used: admissionNumber,
        allocations: result.allocations,
        excess: result.excess,
        idempotent_replay: !!result.idempotent_replay,
        reason: result.reason || null,
      },
    };
  } catch (e) {
    console.error("[bank-payment] failed", e);
    responseStatus = 500;
    responseBody = {
      success: false,
      error: {
        code: e.code || "internal_error",
        message: e.message || "Failed to record payment",
      },
    };
  }

  // Log for troubleshooting (best-effort).
  try {
    apiKeys.logRequest({
      apiKeyId,
      schoolId,
      method: "POST",
      path: req.originalUrl,
      idempotencyKey: String(transactionId),
      requestBody: body,
      responseStatus,
      responseBody,
      ipAddress: req.ip,
      durationMs: Date.now() - start,
    });
  } catch {
    /* non-fatal */
  }

  return res.status(responseStatus).json(responseBody);
});

// ---------------------------------------------------------------------------
// Everything below here still requires X-API-Key.
// ---------------------------------------------------------------------------

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
