const svc = require("./communication.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const previewRecipients = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const { type, relationship, custom } = req.body || {};
    const recipients = await svc.resolveRecipients(schoolId, {
      type,
      relationship,
      custom,
    });
    return success(res, { count: recipients.length, recipients });
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const sendSms = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const { audience, message } = req.body || {};
    if (!audience) return error(res, "audience is required", 400);
    const result = await svc.sendSmsBatch(
      schoolId,
      { audience, message },
      req.user?.id,
    );
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const sendEmail = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const { audience, subject, body } = req.body || {};
    if (!audience) return error(res, "audience is required", 400);
    const result = await svc.sendEmailBatch(
      schoolId,
      { audience, subject, body },
      req.user?.id,
    );
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const listSms = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const pagination = parsePagination(req.query);
    const { rows, total } = await svc.listSms(schoolId, {
      ...pagination,
      status: req.query.status,
      search: req.query.search,
    });
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const listEmail = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const pagination = parsePagination(req.query);
    const { rows, total } = await svc.listEmail(schoolId, {
      ...pagination,
      status: req.query.status,
      search: req.query.search,
    });
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  previewRecipients,
  sendSms,
  sendEmail,
  listSms,
  listEmail,
};
