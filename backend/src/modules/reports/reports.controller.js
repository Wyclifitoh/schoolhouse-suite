const svc = require("./reports.service");
const repo = require("./reports.repository");
const { success, error } = require("../../utils/response");

const buildFilters = (req) => {
  const f = { ...req.query };
  const range = (req.query.range || "").toLowerCase();
  if (range !== "all") {
    if (!f.academic_year_id && req.session?.academicYearId)
      f.academic_year_id = req.session.academicYearId;
    if (!f.term_id && req.session?.termId) f.term_id = req.session.termId;
  }
  return f;
};

const wrap = (fn) => async (req, res) => {
  try {
    return success(res, await fn(req.schoolId, buildFilters(req)));
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  financeReport: wrap(svc.getFinanceReport),
  paymentsReport: wrap(svc.getPaymentsReport),
  studentReport: wrap(svc.getStudentReport),
  attendanceReport: wrap(svc.getAttendanceReport),
  examReport: wrap(svc.getExamReport),
  hrReport: wrap(svc.getHRReport),
  auditTrail: async (req, res) => {
    try {
      return success(res, await repo.getAuditTrail(req.schoolId, req.query));
    } catch (err) {
      return error(res, err.message, 500);
    }
  },
  userLogs: async (req, res) => {
    try {
      return success(res, await repo.getUserLogs(req.schoolId, req.query));
    } catch (err) {
      return error(res, err.message, 500);
    }
  },
};
