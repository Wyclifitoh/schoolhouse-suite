const financeRepository = require("./finance.repository");
const { paginate } = require("../../utils/pagination");

const getFeeTemplates = async (schoolId, queryParams) => {
  const { limit, offset } = paginate(queryParams);
  return financeRepository.findFeeTemplates(schoolId, { limit, offset });
};
const getFeeCategories = async (schoolId) =>
  financeRepository.findFeeCategories(schoolId);
const createFeeCategory = async (schoolId, data) =>
  financeRepository.createFeeCategory(schoolId, data);
const updateFeeCategory = async (id, schoolId, data) =>
  financeRepository.updateFeeCategory(id, schoolId, data);
const deleteFeeCategory = async (id, schoolId) =>
  financeRepository.deleteFeeCategory(id, schoolId);
const getFeeStructures = async (schoolId) =>
  financeRepository.findFeeStructures(schoolId);
const createFeeStructure = async (schoolId, data) =>
  financeRepository.createFeeStructure(schoolId, data);
const updateFeeStructure = async (id, schoolId, data) =>
  financeRepository.updateFeeStructure(id, schoolId, data);
const deleteFeeStructure = async (id, schoolId) =>
  financeRepository.deleteFeeStructure(id, schoolId);
const getFeeDiscounts = async (schoolId) =>
  financeRepository.findFeeDiscounts(schoolId);
const createFeeDiscount = async (schoolId, data) =>
  financeRepository.createFeeDiscount(schoolId, data);
const getStudentFees = async (studentId, schoolId, opts = {}) =>
  financeRepository.findStudentFees(studentId, schoolId, opts);
const getStudentBalance = async (studentId, schoolId) =>
  financeRepository.getStudentBalance(studentId, schoolId);
const getCarryForwards = async (schoolId) =>
  financeRepository.getCarryForwards(schoolId);
const getStudentFeesList = async (schoolId, params) =>
  financeRepository.getStudentFeesList(schoolId, params);
const createStudentFee = async (data) =>
  financeRepository.createStudentFee(data);
const updateStudentFee = async (id, schoolId, data) =>
  financeRepository.updateStudentFee(id, schoolId, data);
const getFeeAssignments = async (schoolId, params) =>
  financeRepository.findFeeAssignments(schoolId, params);
const bulkAssignFee = async (schoolId, body, userId) => {
  const {
    fee_structure_id,
    term_id,
    academic_year_id,
    student_ids,
    discount_amount,
    auto_apply_excess = true,
  } = body;
  if (!fee_structure_id) throw new Error("fee_structure_id is required");
  if (!Array.isArray(student_ids) || student_ids.length === 0)
    throw new Error("student_ids required");
  const fs = await financeRepository.findFeeStructures(schoolId);
  const feeStructure = fs.find((f) => f.id === fee_structure_id);
  if (!feeStructure) throw new Error("Fee structure not found");
  const result = await financeRepository.bulkAssignFee({
    schoolId,
    studentIds: student_ids,
    feeStructure,
    termId: term_id || null,
    academicYearId: academic_year_id || null,
    discountAmount: discount_amount || 0,
    assignedBy: userId || null,
  });
  let excessApplied = { applied_total: 0, applications: [] };
  if (auto_apply_excess && result.fee_ids?.length) {
    try {
      excessApplied = await financeRepository.applyExcessForStudents({
        schoolId,
        studentIds: student_ids,
        feeIds: result.fee_ids,
        performedBy: userId || null,
      });
    } catch (e) {
      /* non-fatal */
    }
  }
  await financeRepository.logBulkFeeAudit({
    schoolId,
    action: "FEES_BULK_ASSIGNED",
    feeStructureId: fee_structure_id,
    termId: term_id || null,
    studentIds: student_ids,
    performedBy: userId || "system",
    extra: {
      created: result.created,
      discountAmount: discount_amount || 0,
      excessApplied: excessApplied.applied_total,
    },
  });
  return {
    ...result,
    excess_applied: excessApplied.applied_total,
    excess_applications: excessApplied.applications,
  };
};

const listExcessCredits = (schoolId, params) =>
  financeRepository.findExcessCredits(schoolId, params);
const getStudentOutstandingFees = (schoolId, studentId) =>
  financeRepository.findStudentOutstandingFees(schoolId, studentId);
const applyExcessCredit = (schoolId, creditId, body, userId) =>
  financeRepository.applyExcessCredit({
    schoolId,
    creditId,
    feeIds: Array.isArray(body?.fee_ids) ? body.fee_ids : [],
    performedBy: userId || null,
  });
const bulkUnassignFee = async (schoolId, body) => {
  const { fee_structure_id, term_id, student_ids } = body;
  if (!fee_structure_id) throw new Error("fee_structure_id is required");
  const result = await financeRepository.bulkUnassignFee({
    schoolId,
    studentIds: student_ids || [],
    feeStructureId: fee_structure_id,
    termId: term_id || null,
  });
  await financeRepository.logBulkFeeAudit({
    schoolId,
    action: "FEES_BULK_UNASSIGNED",
    feeStructureId: fee_structure_id,
    termId: term_id || null,
    studentIds: student_ids || [],
    performedBy: "system",
    extra: { removed: result.removed },
  });
  return result;
};
const getExpenses = async (schoolId) =>
  financeRepository.findExpenses(schoolId);
const getExpenseCategories = async (schoolId) =>
  financeRepository.findExpenseCategories(schoolId);

const getAuditLogs = async (schoolId, params) =>
  financeRepository.getAuditLogs(schoolId, params);

const listAppliedDiscounts = async (schoolId, params) =>
  financeRepository.listAppliedDiscounts(schoolId, params);
const applyDiscount = async (schoolId, body, userId) => {
  const {
    discount_id,
    fee_structure_id,
    term_id,
    academic_year_id,
    student_ids,
  } = body || {};
  if (!discount_id) throw new Error("discount_id is required");
  if (!Array.isArray(student_ids) || student_ids.length === 0)
    throw new Error("student_ids required");
  return financeRepository.applyDiscountToStudents({
    schoolId,
    discountId: discount_id,
    feeStructureId: fee_structure_id || null,
    termId: term_id || null,
    academicYearId: academic_year_id || null,
    studentIds: student_ids,
    performedBy: userId || null,
  });
};
const revokeDiscount = async (schoolId, id) =>
  financeRepository.revokeAppliedDiscount(schoolId, id);

const closeTerm = async (schoolId, body, userId) =>
  financeRepository.closeTerm({
    schoolId,
    fromTermId: body?.from_term_id,
    toTermId: body?.to_term_id,
    performedBy: userId || null,
  });

const createFeeAdjustment = async (schoolId, body, userId) =>
  financeRepository.createFeeAdjustment({
    schoolId,
    studentFeeId: body?.student_fee_id,
    adjustmentType: body?.adjustment_type,
    amount: Number(body?.amount || 0),
    reason: body?.reason,
    createdBy: userId || null,
  });

const listFeeAdjustments = async (schoolId, params) =>
  financeRepository.listFeeAdjustments(schoolId, {
    status: params?.status,
    limit: parseInt(params?.limit, 10) || 100,
  });

const decideFeeAdjustment = async (schoolId, id, body, userId) =>
  financeRepository.decideFeeAdjustment({
    schoolId,
    id,
    decision: body?.decision,
    approverId: userId || null,
    rejectedReason: body?.rejected_reason,
  });

const getReconciliationReport = async (schoolId, params) =>
  financeRepository.getReconciliationReport(schoolId, { date: params?.date });

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
  updateStudentFee,
  getExpenses,
  getExpenseCategories,
  getFeeAssignments,
  bulkAssignFee,
  bulkUnassignFee,
  getAuditLogs,
  listExcessCredits,
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
