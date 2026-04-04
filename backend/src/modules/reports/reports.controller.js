const svc = require('./reports.service');
const { success, error } = require('../../utils/response');

const financeReport = async (req, res) => {
  try {
    const data = await svc.getFinanceReport(req.schoolId, req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, 500); }
};

const paymentsReport = async (req, res) => {
  try {
    const data = await svc.getPaymentsReport(req.schoolId, req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, 500); }
};

const studentReport = async (req, res) => {
  try {
    const data = await svc.getStudentReport(req.schoolId, req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, 500); }
};

const attendanceReport = async (req, res) => {
  try {
    const data = await svc.getAttendanceReport(req.schoolId, req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, 500); }
};

const examReport = async (req, res) => {
  try {
    const data = await svc.getExamReport(req.schoolId, req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, 500); }
};

module.exports = { financeReport, paymentsReport, studentReport, attendanceReport, examReport };
