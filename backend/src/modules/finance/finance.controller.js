const financeService = require("./finance.service");
const { success, error } = require("../../utils/response");

const getFeeTemplates = async (req, res) => {
  try {
    return success(
      res,
      await financeService.getFeeTemplates(req.schoolId, req.query),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const getFeeCategories = async (req, res) => {
  try {
    return success(res, await financeService.getFeeCategories(req.schoolId));
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const createFeeCategory = async (req, res) => {
  try {
    return success(
      res,
      await financeService.createFeeCategory(req.schoolId, req.body),
      201,
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const updateFeeCategory = async (req, res) => {
  try {
    return success(
      res,
      await financeService.updateFeeCategory(
        req.params.id,
        req.schoolId,
        req.body,
      ),
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
const deleteFeeCategory = async (req, res) => {
  try {
    return success(
      res,
      await financeService.deleteFeeCategory(req.params.id, req.schoolId),
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};
const getFeeStructures = async (req, res) => {
  try {
    return success(res, await financeService.getFeeStructures(req.schoolId));
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const createFeeStructure = async (req, res) => {
  try {
    return success(
      res,
      await financeService.createFeeStructure(req.schoolId, req.body),
      201,
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const updateFeeStructure = async (req, res) => {
  try {
    return success(
      res,
      await financeService.updateFeeStructure(
        req.params.id,
        req.schoolId,
        req.body,
      ),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const deleteFeeStructure = async (req, res) => {
  try {
    return success(
      res,
      await financeService.deleteFeeStructure(req.params.id, req.schoolId),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const getFeeDiscounts = async (req, res) => {
  try {
    return success(res, await financeService.getFeeDiscounts(req.schoolId));
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const createFeeDiscount = async (req, res) => {
  try {
    return success(
      res,
      await financeService.createFeeDiscount(req.schoolId, req.body),
      201,
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const getStudentFees = async (req, res) => {
  try {
    return success(
      res,
      await financeService.getStudentFees(req.params.studentId, req.schoolId, {
        termId: req.query.term_id || null,
        academicYearId: req.query.academic_year_id || null,
        includeZero: req.query.include_zero === "true",
      }),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const getStudentBalance = async (req, res) => {
  try {
    return success(
      res,
      await financeService.getStudentBalance(
        req.params.studentId,
        req.schoolId,
      ),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const getCarryForwards = async (req, res) => {
  try {
    return success(res, await financeService.getCarryForwards(req.schoolId));
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const getStudentFeesList = async (req, res) => {
  try {
    return success(
      res,
      await financeService.getStudentFeesList(req.schoolId, {
        search: req.query.search,
        termId: req.query.term_id || req.session?.termId || null,
        academicYearId:
          req.query.academic_year_id || req.session?.academicYearId || null,
      }),
    );
  } catch (err) {
    console.error("Error in getStudentFeesList:", err);
    return error(res, err.message, 500);
  }
};
const createStudentFee = async (req, res) => {
  try {
    return success(
      res,
      await financeService.createStudentFee({
        ...req.body,
        school_id: req.schoolId,
      }),
      201,
    );
  } catch (err) {
    console.error("Error in createStudentFee:", err);
    return error(res, err.message, 500);
  }
};
const getFeeAssignments = async (req, res) => {
  try {
    return success(
      res,
      await financeService.getFeeAssignments(req.schoolId, {
        feeStructureId: req.query.fee_structure_id,
        termId: req.query.term_id,
      }),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const bulkAssignFee = async (req, res) => {
  try {
    return success(
      res,
      await financeService.bulkAssignFee(req.schoolId, req.body, req.user?.id),
      201,
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const bulkUnassignFee = async (req, res) => {
  try {
    return success(
      res,
      await financeService.bulkUnassignFee(req.schoolId, req.body),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const getExpenses = async (req, res) => {
  try {
    return success(res, await financeService.getExpenses(req.schoolId));
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const getExpenseCategories = async (req, res) => {
  try {
    return success(
      res,
      await financeService.getExpenseCategories(req.schoolId),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getAuditLogs = async (req, res) => {
  try {
    return success(
      res,
      await financeService.getAuditLogs(req.schoolId, {
        limit: parseInt(req.query.limit, 10) || 100,
        action: req.query.action,
        studentId: req.query.student_id,
      }),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getExcessCredits = async (req, res) => {
  try {
    return success(
      res,
      await financeService.listExcessCredits(req.schoolId, {
        studentId: req.query.student_id,
        status: req.query.status,
      }),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const getStudentOutstandingFees = async (req, res) => {
  try {
    return success(
      res,
      await financeService.getStudentOutstandingFees(
        req.schoolId,
        req.params.studentId,
      ),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const applyExcessCredit = async (req, res) => {
  try {
    return success(
      res,
      await financeService.applyExcessCredit(
        req.schoolId,
        req.params.id,
        req.body,
        req.user?.id,
      ),
    );
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const listAppliedDiscounts = async (req, res) => {
  try {
    return success(
      res,
      await financeService.listAppliedDiscounts(req.schoolId, {
        studentId: req.query.student_id,
        discountId: req.query.discount_id,
        termId: req.query.term_id,
      }),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const applyDiscount = async (req, res) => {
  try {
    return success(
      res,
      await financeService.applyDiscount(req.schoolId, req.body, req.user?.id),
      201,
    );
  } catch (err) {
    return error(res, err.message, 400);
  }
};
const revokeDiscount = async (req, res) => {
  try {
    return success(
      res,
      await financeService.revokeDiscount(req.schoolId, req.params.id),
    );
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const closeTerm = async (req, res) => {
  try {
    return success(
      res,
      await financeService.closeTerm(req.schoolId, req.body, req.user?.id),
      201,
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 400);
  }
};

const createFeeAdjustment = async (req, res) => {
  try {
    return success(
      res,
      await financeService.createFeeAdjustment(
        req.schoolId,
        req.body,
        req.user?.id,
      ),
      201,
    );
  } catch (err) {
    return error(res, err.message, 400);
  }
};
const listFeeAdjustments = async (req, res) => {
  try {
    return success(
      res,
      await financeService.listFeeAdjustments(req.schoolId, req.query),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};
const decideFeeAdjustment = async (req, res) => {
  try {
    return success(
      res,
      await financeService.decideFeeAdjustment(
        req.schoolId,
        req.params.id,
        req.body,
        req.user?.id,
      ),
    );
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const getReconciliationReport = async (req, res) => {
  try {
    return success(
      res,
      await financeService.getReconciliationReport(req.schoolId, req.query),
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  getFeeTemplates,
  getFeeCategories,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getFeeDiscounts,
  createFeeDiscount,
  getStudentFees,
  getStudentBalance,
  getCarryForwards,
  getStudentFeesList,
  createStudentFee,
  getExpenses,
  getExpenseCategories,
  getFeeAssignments,
  bulkAssignFee,
  bulkUnassignFee,
  getAuditLogs,
  getExcessCredits,
  getStudentOutstandingFees,
  applyExcessCredit,
  listAppliedDiscounts,
  applyDiscount,
  revokeDiscount,
  closeTerm,
  createFeeAdjustment,
  listFeeAdjustments,
  decideFeeAdjustment,
  getReconciliationReport,
};
