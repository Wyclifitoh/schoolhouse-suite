const financeRepository = require('./finance.repository');
const { paginate } = require('../../utils/pagination');

const getFeeTemplates = async (schoolId, queryParams) => {
  const { limit, offset } = paginate(queryParams);
  return financeRepository.findFeeTemplates(schoolId, { limit, offset });
};
const getFeeCategories = async (schoolId) => financeRepository.findFeeCategories(schoolId);
const getFeeStructures = async (schoolId) => financeRepository.findFeeStructures(schoolId);
const getFeeDiscounts = async (schoolId) => financeRepository.findFeeDiscounts(schoolId);
const getStudentFees = async (studentId, schoolId) => financeRepository.findStudentFees(studentId, schoolId);
const getStudentBalance = async (studentId, schoolId) => financeRepository.getStudentBalance(studentId, schoolId);
const getCarryForwards = async (schoolId) => financeRepository.getCarryForwards(schoolId);
const getStudentFeesList = async (schoolId, params) => financeRepository.getStudentFeesList(schoolId, params);
const createStudentFee = async (data) => financeRepository.createStudentFee(data);
const updateStudentFee = async (id, schoolId, data) => financeRepository.updateStudentFee(id, schoolId, data);
const getExpenses = async (schoolId) => financeRepository.findExpenses(schoolId);
const getExpenseCategories = async (schoolId) => financeRepository.findExpenseCategories(schoolId);

module.exports = {
  getFeeTemplates, getFeeCategories, getFeeStructures, getFeeDiscounts,
  getStudentFees, getStudentBalance, getCarryForwards, getStudentFeesList,
  createStudentFee, updateStudentFee, getExpenses, getExpenseCategories,
};
