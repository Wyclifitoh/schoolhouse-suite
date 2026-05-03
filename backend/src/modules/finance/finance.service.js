const financeRepository = require('./finance.repository');
const { paginate } = require('../../utils/pagination');

const getFeeTemplates = async (schoolId, queryParams) => {
  const { limit, offset } = paginate(queryParams);
  return financeRepository.findFeeTemplates(schoolId, { limit, offset });
};
const getFeeCategories = async (schoolId) => financeRepository.findFeeCategories(schoolId);
const createFeeCategory = async (schoolId, data) => financeRepository.createFeeCategory(schoolId, data);
const getFeeStructures = async (schoolId) => financeRepository.findFeeStructures(schoolId);
const createFeeStructure = async (schoolId, data) => financeRepository.createFeeStructure(schoolId, data);
const updateFeeStructure = async (id, schoolId, data) => financeRepository.updateFeeStructure(id, schoolId, data);
const deleteFeeStructure = async (id, schoolId) => financeRepository.deleteFeeStructure(id, schoolId);
const getFeeDiscounts = async (schoolId) => financeRepository.findFeeDiscounts(schoolId);
const createFeeDiscount = async (schoolId, data) => financeRepository.createFeeDiscount(schoolId, data);
const getStudentFees = async (studentId, schoolId) => financeRepository.findStudentFees(studentId, schoolId);
const getStudentBalance = async (studentId, schoolId) => financeRepository.getStudentBalance(studentId, schoolId);
const getCarryForwards = async (schoolId) => financeRepository.getCarryForwards(schoolId);
const getStudentFeesList = async (schoolId, params) => financeRepository.getStudentFeesList(schoolId, params);
const createStudentFee = async (data) => financeRepository.createStudentFee(data);
const updateStudentFee = async (id, schoolId, data) => financeRepository.updateStudentFee(id, schoolId, data);
const getFeeAssignments = async (schoolId, params) => financeRepository.findFeeAssignments(schoolId, params);
const bulkAssignFee = async (schoolId, body, userId) => {
  const { fee_structure_id, term_id, academic_year_id, student_ids, discount_amount } = body;
  if (!fee_structure_id) throw new Error('fee_structure_id is required');
  if (!Array.isArray(student_ids) || student_ids.length === 0) throw new Error('student_ids required');
  const fs = await financeRepository.findFeeStructures(schoolId);
  const feeStructure = fs.find((f) => f.id === fee_structure_id);
  if (!feeStructure) throw new Error('Fee structure not found');
  return financeRepository.bulkAssignFee({
    schoolId, studentIds: student_ids, feeStructure,
    termId: term_id || null, academicYearId: academic_year_id || null,
    discountAmount: discount_amount || 0, assignedBy: userId || null,
  });
};
const bulkUnassignFee = async (schoolId, body) => {
  const { fee_structure_id, term_id, student_ids } = body;
  if (!fee_structure_id) throw new Error('fee_structure_id is required');
  return financeRepository.bulkUnassignFee({
    schoolId, studentIds: student_ids || [], feeStructureId: fee_structure_id, termId: term_id || null,
  });
};
const getExpenses = async (schoolId) => financeRepository.findExpenses(schoolId);
const getExpenseCategories = async (schoolId) => financeRepository.findExpenseCategories(schoolId);

module.exports = {
  getFeeTemplates, getFeeCategories, createFeeCategory,
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getFeeDiscounts, createFeeDiscount,
  getStudentFees, getStudentBalance, getCarryForwards, getStudentFeesList,
  createStudentFee, updateStudentFee, getExpenses, getExpenseCategories,
  getFeeAssignments, bulkAssignFee, bulkUnassignFee,
};
