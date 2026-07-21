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
const bulkAssignFee = async (schoolId, body, actor = {}, session = {}) => {
  const {
    fee_structure_id,
    term_id,
    academic_year_id,
    student_ids,
    discount_amount,
    auto_apply_excess = true,
    scope, // { grade_ids?: string[], stream_ids?: string[] }
  } = body;
  if (!fee_structure_id) throw new Error("fee_structure_id is required");
  if (!Array.isArray(student_ids) || student_ids.length === 0)
    throw new Error("student_ids required");

  // --- Active session guard --------------------------------------------------
  // Writes are pinned to the active term/year. If the request specifies a
  // different term, reject unless it's the active one. This prevents stale
  // tabs (or crafted requests) from mutating a prior term's assignments.
  const effectiveTermId = term_id || session?.termId || null;
  const effectiveYearId = academic_year_id || session?.academicYearId || null;
  if (
    session?.termId &&
    term_id &&
    term_id !== session.termId &&
    actor?.role !== "super_admin"
  ) {
    throw new Error(
      "Fee assignments must target the active term. Switch term and retry.",
    );
  }

  // --- Scope guard ----------------------------------------------------------
  // When the client declares a filter scope (class/stream the admin was
  // looking at), verify every submitted student belongs to it. This blocks
  // requests that try to act on students outside the visible/filtered list.
  if (scope && (scope.grade_ids?.length || scope.stream_ids?.length)) {
    const outOfScope = await financeRepository.findStudentsOutOfScope({
      schoolId,
      studentIds: student_ids,
      gradeIds: scope.grade_ids,
      streamIds: scope.stream_ids,
    });
    if (outOfScope.length) {
      const err = new Error(
        `${outOfScope.length} student(s) are outside the selected class/stream scope and were rejected.`,
      );
      err.outOfScope = outOfScope;
      throw err;
    }
  }

  const fs = await financeRepository.findFeeStructures(schoolId);
  const feeStructure = fs.find((f) => f.id === fee_structure_id);
  if (!feeStructure) throw new Error("Fee structure not found");
  const result = await financeRepository.bulkAssignFee({
    schoolId,
    studentIds: student_ids,
    feeStructure,
    termId: effectiveTermId,
    academicYearId: effectiveYearId,
    discountAmount: discount_amount || 0,
    assignedBy: actor?.id || null,
  });
  let excessApplied = { applied_total: 0, applications: [] };
  if (auto_apply_excess && result.fee_ids?.length) {
    try {
      excessApplied = await financeRepository.applyExcessForStudents({
        schoolId,
        studentIds: student_ids,
        feeIds: result.fee_ids,
        performedBy: actor?.id || null,
      });
    } catch (e) {
      /* non-fatal */
    }
  }
  // Per-student audit rows (admin + term/year)
  for (let i = 0; i < (result.fee_ids || []).length; i++) {
    const feeId = result.fee_ids[i];
    const studentId = student_ids[i] || null;
    await financeRepository.logFeeAssignmentChange({
      schoolId,
      action: "FEE_ASSIGNED",
      studentFeeId: feeId,
      studentId,
      feeStructureId: fee_structure_id,
      termId: effectiveTermId,
      academicYearId: effectiveYearId,
      amount: Math.max(
        0,
        Number(feeStructure.amount || 0) - Number(discount_amount || 0),
      ),
      performedBy: actor?.id || "system",
      performedByRole: actor?.role || null,
      scope: scope || null,
    });
  }
  await financeRepository.logBulkFeeAudit({
    schoolId,
    action: "FEES_BULK_ASSIGNED",
    feeStructureId: fee_structure_id,
    termId: effectiveTermId,
    studentIds: student_ids,
    performedBy: actor?.id || "system",
    extra: {
      created: result.created,
      academic_year_id: effectiveYearId,
      performed_by_role: actor?.role || null,
      scope: scope || null,
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
const bulkUnassignFee = async (schoolId, body, actor = {}, session = {}) => {
  const { fee_structure_id, term_id, student_ids, scope } = body;
  if (!fee_structure_id) throw new Error("fee_structure_id is required");
  if (!Array.isArray(student_ids) || student_ids.length === 0)
    throw new Error("student_ids required");

  // Active session guard — unassigns must target the active term.
  const effectiveTermId = term_id || session?.termId || null;
  if (
    session?.termId &&
    term_id &&
    term_id !== session.termId &&
    actor?.role !== "super_admin"
  ) {
    throw new Error(
      "Fee removals must target the active term. Switch term and retry.",
    );
  }

  // Scope guard — every student we are about to unassign MUST live inside
  // the filtered class/stream scope the admin was viewing. This is the
  // critical defence against a stale tab or crafted payload removing
  // assignments from students outside the visible filter.
  if (scope && (scope.grade_ids?.length || scope.stream_ids?.length)) {
    const outOfScope = await financeRepository.findStudentsOutOfScope({
      schoolId,
      studentIds: student_ids,
      gradeIds: scope.grade_ids,
      streamIds: scope.stream_ids,
    });
    if (outOfScope.length) {
      const err = new Error(
        `Refused to unassign ${outOfScope.length} student(s) outside the selected scope.`,
      );
      err.outOfScope = outOfScope;
      throw err;
    }
  }

  const result = await financeRepository.bulkUnassignFee({
    schoolId,
    studentIds: student_ids,
    feeStructureId: fee_structure_id,
    termId: effectiveTermId,
  });
  // Per-student audit for each removed row.
  for (const row of result.removed_rows || []) {
    await financeRepository.logFeeAssignmentChange({
      schoolId,
      action: "FEE_UNASSIGNED",
      studentFeeId: row.id,
      studentId: row.student_id,
      feeStructureId: fee_structure_id,
      termId: effectiveTermId,
      academicYearId: session?.academicYearId || null,
      amount: row.amount_due,
      performedBy: actor?.id || "system",
      performedByRole: actor?.role || null,
      scope: scope || null,
    });
  }
  await financeRepository.logBulkFeeAudit({
    schoolId,
    action: "FEES_BULK_UNASSIGNED",
    feeStructureId: fee_structure_id,
    termId: effectiveTermId,
    studentIds: student_ids,
    performedBy: actor?.id || "system",
    extra: {
      removed: result.removed,
      blocked: result.blocked,
      academic_year_id: session?.academicYearId || null,
      performed_by_role: actor?.role || null,
      scope: scope || null,
    },
  });
  return { removed: result.removed, blocked: result.blocked };
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

const bulkRevokeDiscounts = async (schoolId, body) =>
  financeRepository.bulkRevokeAppliedDiscounts({
    schoolId,
    discountId: body?.discount_id,
    feeStructureId: body?.fee_structure_id || null,
    termId: body?.term_id || null,
    studentIds: Array.isArray(body?.student_ids) ? body.student_ids : [],
  });

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

const rebalanceStudent = async (schoolId, studentId, userId) =>
  financeRepository.rebalanceStudent({
    schoolId,
    studentId,
    performedBy: userId || null,
  });

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
  bulkRevokeDiscounts,
  closeTerm,
  createFeeAdjustment,
  listFeeAdjustments,
  decideFeeAdjustment,
  getReconciliationReport,
  rebalanceStudent,
};
