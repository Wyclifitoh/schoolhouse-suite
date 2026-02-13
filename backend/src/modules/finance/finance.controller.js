const financeService = require('./finance.service');
const { success, error, paginated } = require('../../utils/response');
const { parsePagination } = require('../../utils/pagination');

const listFeeTemplates = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await financeService.listFeeTemplates(req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getStudentFees = async (req, res) => {
  try {
    const fees = await financeService.getStudentFees(req.params.studentId, req.schoolId);
    return success(res, fees);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const assignFee = async (req, res) => {
  try {
    const fee = await financeService.assignFeeToStudent({
      ...req.body,
      school_id: req.schoolId,
      assigned_by: req.user.id,
    });
    return success(res, fee, 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getStudentBalance = async (req, res) => {
  try {
    const balance = await financeService.calculateStudentBalance(req.params.studentId, req.schoolId);
    return success(res, balance);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const recordPayment = async (req, res) => {
  try {
    const result = await financeService.recordPayment({
      ...req.body,
      school_id: req.schoolId,
      recorded_by: req.user.id,
    });
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const processCarryForward = async (req, res) => {
  try {
    const { student_id, from_term_id, to_term_id } = req.body;
    const result = await financeService.processCarryForward(student_id, req.schoolId, from_term_id, to_term_id);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = { listFeeTemplates, getStudentFees, assignFee, getStudentBalance, recordPayment, processCarryForward };
