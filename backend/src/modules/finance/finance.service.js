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
const getExpenses = async (schoolId) => financeRepository.findExpenses(schoolId);
const getExpenseCategories = async (schoolId) => financeRepository.findExpenseCategories(schoolId);

module.exports = {
  getFeeTemplates, getFeeCategories, createFeeCategory,
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getFeeDiscounts, createFeeDiscount,
  getStudentFees, getStudentBalance, getCarryForwards, getStudentFeesList,
  createStudentFee, updateStudentFee, getExpenses, getExpenseCategories,
};
