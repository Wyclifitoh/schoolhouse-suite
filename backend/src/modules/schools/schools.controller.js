const svc = require('./schools.service');
const { success, error } = require('../../utils/response');

const getMySchools = async (req, res) => {
  try { return success(res, await svc.getSchoolsByUser(req.user.id)); }
  catch (err) { return error(res, err.message, 500); }
};

const getSchool = async (req, res) => {
  try { return success(res, await svc.getSchool(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const updateSchool = async (req, res) => {
  try { return success(res, await svc.updateSchool(req.schoolId, req.body)); }
  catch (err) { return error(res, err.message, 500); }
};

const getTerms = async (req, res) => {
  try { return success(res, await svc.getTerms(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const createTerm = async (req, res) => {
  try { return success(res, await svc.createTerm(req.schoolId, req.body), 201); }
  catch (err) { return error(res, err.message, 500); }
};

const setCurrentTerm = async (req, res) => {
  try { return success(res, await svc.setCurrentTerm(req.schoolId, req.params.id)); }
  catch (err) { return error(res, err.message, 500); }
};

const deleteTerm = async (req, res) => {
  try { return success(res, await svc.deleteTerm(req.schoolId, req.params.id)); }
  catch (err) { return error(res, err.message, 500); }
};

const getAcademicYears = async (req, res) => {
  try { return success(res, await svc.getAcademicYears(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const createAcademicYear = async (req, res) => {
  try { return success(res, await svc.createAcademicYear(req.schoolId, req.body), 201); }
  catch (err) { return error(res, err.message, 500); }
};

const setCurrentAcademicYear = async (req, res) => {
  try { return success(res, await svc.setCurrentAcademicYear(req.schoolId, req.params.id)); }
  catch (err) { return error(res, err.message, 500); }
};

const getDashboardStats = async (req, res) => {
  try { return success(res, await svc.getDashboardStats(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const getUsers = async (req, res) => {
  try { return success(res, await svc.getUsers(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const getNotificationTemplates = async (req, res) => {
  try { return success(res, await svc.getNotificationTemplates(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const updateNotificationTemplate = async (req, res) => {
  try { return success(res, await svc.updateNotificationTemplate(req.params.id, req.body)); }
  catch (err) { return error(res, err.message, 500); }
};

module.exports = {
  getMySchools, getSchool, updateSchool, getTerms, createTerm, setCurrentTerm, deleteTerm,
  getAcademicYears, createAcademicYear, setCurrentAcademicYear,
  getDashboardStats, getUsers, getNotificationTemplates, updateNotificationTemplate,
};
