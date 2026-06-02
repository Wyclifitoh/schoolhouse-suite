const svc = require("./reports.service");
const { success, error } = require("../../utils/response");

/**
 * Build the report filter from req.query, defaulting to the active session
 * unless the caller explicitly opts out with `?range=all`.
 */
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

const financeReport = async (req, res) => {
  try {
    return success(
      res,
      await svc.getFinanceReport(req.schoolId, buildFilters(req)),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const paymentsReport = async (req, res) => {
  try {
    return success(
      res,
      await svc.getPaymentsReport(req.schoolId, buildFilters(req)),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const studentReport = async (req, res) => {
  try {
    return success(
      res,
      await svc.getStudentReport(req.schoolId, buildFilters(req)),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const attendanceReport = async (req, res) => {
  try {
    return success(
      res,
      await svc.getAttendanceReport(req.schoolId, buildFilters(req)),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const examReport = async (req, res) => {
  try {
    return success(
      res,
      await svc.getExamReport(req.schoolId, buildFilters(req)),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const hrReport = async (req, res) => {
  try {
    return success(res, await svc.getHRReport(req.schoolId, buildFilters(req)));
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  financeReport,
  paymentsReport,
  studentReport,
  attendanceReport,
  examReport,
  hrReport,
};
