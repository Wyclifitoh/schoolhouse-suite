const financeService = require('./finance.service');
const { success, error } = require('../../utils/response');

const getFeeTemplates = async (req, res) => {
  try { return success(res, await financeService.getFeeTemplates(req.schoolId, req.query)); }
  catch (err) { return error(res, err.message, 500); }
};
const getFeeCategories = async (req, res) => {
  try { return success(res, await financeService.getFeeCategories(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};
const createFeeCategory = async (req, res) => {
  try { return success(res, await financeService.createFeeCategory(req.schoolId, req.body), 201); }
  catch (err) { return error(res, err.message, 500); }
};
const getFeeStructures = async (req, res) => {
  try { return success(res, await financeService.getFeeStructures(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};
const createFeeStructure = async (req, res) => {
  try { return success(res, await financeService.createFeeStructure(req.schoolId, req.body), 201); }
  catch (err) { return error(res, err.message, 500); }
};
const updateFeeStructure = async (req, res) => {
  try { return success(res, await financeService.updateFeeStructure(req.params.id, req.schoolId, req.body)); }
  catch (err) { return error(res, err.message, 500); }
};
const deleteFeeStructure = async (req, res) => {
  try { return success(res, await financeService.deleteFeeStructure(req.params.id, req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};
const getFeeDiscounts = async (req, res) => {
  try { return success(res, await financeService.getFeeDiscounts(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};
const createFeeDiscount = async (req, res) => {
  try { return success(res, await financeService.createFeeDiscount(req.schoolId, req.body), 201); }
  catch (err) { return error(res, err.message, 500); }
};
const getStudentFees = async (req, res) => {
  try { return success(res, await financeService.getStudentFees(req.params.studentId, req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};
const getStudentBalance = async (req, res) => {
  try { return success(res, await financeService.getStudentBalance(req.params.studentId, req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};
const getCarryForwards = async (req, res) => {
  try { return success(res, await financeService.getCarryForwards(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};
const getStudentFeesList = async (req, res) => {
  try { return success(res, await financeService.getStudentFeesList(req.schoolId, { search: req.query.search, termId: req.query.term_id })); }
  catch (err) { return error(res, err.message, 500); }
};
const createStudentFee = async (req, res) => {
  try { return success(res, await financeService.createStudentFee({ ...req.body, school_id: req.schoolId }), 201); }
  catch (err) { return error(res, err.message, 500); }
};
const getExpenses = async (req, res) => {
  try { return success(res, await financeService.getExpenses(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};
const getExpenseCategories = async (req, res) => {
  try { return success(res, await financeService.getExpenseCategories(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

module.exports = {
  getFeeTemplates, getFeeCategories, createFeeCategory,
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getFeeDiscounts, createFeeDiscount,
  getStudentFees, getStudentBalance, getCarryForwards, getStudentFeesList,
  createStudentFee, getExpenses, getExpenseCategories,
};
