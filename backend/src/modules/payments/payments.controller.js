const paymentsService = require("./payments.service");
const { success, error } = require("../../utils/response");

const list = async (req, res) => {
  try {
    return success(
      res,
      await paymentsService.list(req.schoolId, req.query, req.session),
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getById = async (req, res) => {
  try {
    return success(
      res,
      await paymentsService.getById(req.params.id, req.schoolId),
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const allocations = async (req, res) => {
  try {
    return success(
      res,
      await paymentsService.allocations(req.schoolId, req.query),
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const create = async (req, res) => {
  try {
    return success(
      res,
      await paymentsService.create(req.schoolId, req.body, req.user.id),
      201,
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const record = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.idempotency_key) {
      body.idempotency_key =
        req.header("Idempotency-Key") ||
        req.header("X-Idempotency-Key") ||
        null;
    }
    // Default term_id from active session if caller didn't specify one.
    if (!body.term_id && req.session?.termId) body.term_id = req.session.termId;
    if (!body.academic_year_id && req.session?.academicYearId)
      body.academic_year_id = req.session.academicYearId;
    return success(
      res,
      await paymentsService.record(req.schoolId, body, req.user?.id),
      201,
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const voidPayment = async (req, res) => {
  try {
    return success(
      res,
      await paymentsService.voidPayment(
        req.params.id,
        req.schoolId,
        req.body.reason,
        req.user?.id,
      ),
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const mpesaCallback = async (req, res) => {
  console.log("[mpesa-callback] Received:", JSON.stringify(req.body));
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
};

const listUnallocated = async (req, res) => {
  try {
    return success(
      res,
      await paymentsService.listUnallocated(req.schoolId, req.query),
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const reassign = async (req, res) => {
  try {
    return success(
      res,
      await paymentsService.reassign(
        req.schoolId,
        req.params.id,
        req.body,
        req.user?.id,
      ),
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 400);
  }
};

module.exports = {
  list,
  getById,
  allocations,
  create,
  record,
  voidPayment,
  mpesaCallback,
  listUnallocated,
  reassign,
};
